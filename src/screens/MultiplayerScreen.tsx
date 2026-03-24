import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDatabase } from '../hooks/useDatabase';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { bluetoothService, MultiplayerResult } from '../utils/bluetooth';
import KeyboardView from '../components/keyboard/KeyboardView';
import LetterBox from '../components/LetterBox';
import { calculateAccuracy, calculateWPM, calculateStars } from '../utils/scoring';

type Phase = 'menu' | 'scanning' | 'waiting' | 'playing' | 'results';

const MULTIPLAYER_PROMPTS = [
  'the quick red fox',
  'she sells sea shells',
  'a glad lad shall ask dad',
  'try to write every letter',
  'kids like to type fast',
];

interface FoundDevice {
  id: string;
  name: string;
}

export default function MultiplayerScreen() {
  const { user } = useDatabase();
  const navigation = useNavigation();
  const [phase, setPhase] = useState<Phase>('menu');
  const [devices, setDevices] = useState<FoundDevice[]>([]);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [opponentResult, setOpponentResult] = useState<MultiplayerResult | null>(null);
  const [myResult, setMyResult] = useState<MultiplayerResult | null>(null);
  const [prompt] = useState(() => MULTIPLAYER_PROMPTS[Math.floor(Math.random() * MULTIPLAYER_PROMPTS.length)]);

  const engine = useTypingEngine({
    prompt,
    sessionId: `mp-${Date.now()}`,
    userId: user?.id || 0,
    lessonId: 0,
  });

  const startTime = useRef(Date.now());

  // Listen for opponent updates
  useEffect(() => {
    bluetoothService.setOnProgressUpdate(setOpponentProgress);
    bluetoothService.setOnGameResult(setOpponentResult);
    return () => {
      bluetoothService.disconnect();
    };
  }, []);

  // Send my progress to opponent
  useEffect(() => {
    if (phase === 'playing' && prompt.length > 0) {
      const progress = engine.currentIndex / prompt.length;
      bluetoothService.sendProgress(progress);
    }
  }, [engine.currentIndex, phase]);

  // Handle completion
  useEffect(() => {
    if (engine.isComplete && phase === 'playing') {
      const duration = Date.now() - startTime.current;
      const accuracy = calculateAccuracy(engine.correctCount, engine.totalAttempts);
      const wpm = calculateWPM(prompt.length, duration);
      const result: MultiplayerResult = {
        nickname: user?.nickname || 'Player',
        accuracy,
        wpm,
        completedAt: Date.now(),
      };
      setMyResult(result);
      bluetoothService.sendResult(result);
      setPhase('results');
    }
  }, [engine.isComplete]);

  async function handleScan() {
    setPhase('scanning');
    setDevices([]);
    try {
      await bluetoothService.scanForDevices((device) => {
        setDevices(prev => [...prev, device]);
      }, 15000);
    } catch {
      // Permission denied or BT off
    }
    if (devices.length === 0) {
      // No devices found, stay on scanning to show message
    }
  }

  async function handleConnect(deviceId: string) {
    setPhase('waiting');
    const connected = await bluetoothService.connectToDevice(deviceId);
    if (connected) {
      startTime.current = Date.now();
      setPhase('playing');
    } else {
      setPhase('menu');
    }
  }

  // ─── MENU ─────────────────────────────────────
  if (phase === 'menu') {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>👥</Text>
        <Text style={styles.title}>Bluetooth Multiplayer</Text>
        <Text style={styles.desc}>
          Challenge a friend to a head-to-head typing race!{'\n'}
          Both players need TypeKids on their tablets.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleScan}>
          <Text style={styles.primaryBtnText}>Find Opponents</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => {
          // Start a solo practice game with the same UI
          startTime.current = Date.now();
          setPhase('playing');
        }}>
          <Text style={styles.secondaryBtnText}>Practice Solo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── SCANNING ─────────────────────────────────
  if (phase === 'scanning') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90D9" />
        <Text style={styles.scanTitle}>Searching for opponents...</Text>
        <Text style={styles.scanHint}>Make sure Bluetooth is on for both devices</Text>
        <FlatList
          data={devices}
          keyExtractor={item => item.id}
          style={styles.deviceList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.deviceCard} onPress={() => handleConnect(item.id)}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <Text style={styles.deviceAction}>Connect</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No devices found yet...</Text>
          }
        />
        <TouchableOpacity style={styles.cancelBtn} onPress={() => { bluetoothService.stopScan(); setPhase('menu'); }}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── WAITING ──────────────────────────────────
  if (phase === 'waiting') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90D9" />
        <Text style={styles.scanTitle}>Connecting...</Text>
      </View>
    );
  }

  // ─── RESULTS ──────────────────────────────────
  if (phase === 'results' && myResult) {
    const iWon = !opponentResult || myResult.completedAt < opponentResult.completedAt;
    return (
      <View style={styles.container}>
        <Text style={styles.resultEmoji}>{iWon ? '🏆' : '💪'}</Text>
        <Text style={styles.resultTitle}>{iWon ? 'You Win!' : 'Good Try!'}</Text>

        <View style={styles.comparison}>
          <View style={styles.playerCard}>
            <Text style={styles.playerLabel}>You</Text>
            <Text style={styles.playerStat}>{myResult.accuracy}% accuracy</Text>
            <Text style={styles.playerStat}>{myResult.wpm} WPM</Text>
          </View>
          {opponentResult && (
            <>
              <Text style={styles.vs}>VS</Text>
              <View style={styles.playerCard}>
                <Text style={styles.playerLabel}>{opponentResult.nickname}</Text>
                <Text style={styles.playerStat}>{opponentResult.accuracy}% accuracy</Text>
                <Text style={styles.playerStat}>{opponentResult.wpm} WPM</Text>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => {
          engine.reset();
          setMyResult(null);
          setOpponentResult(null);
          setOpponentProgress(0);
          setPhase('menu');
        }}>
          <Text style={styles.primaryBtnText}>Play Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── PLAYING ──────────────────────────────────
  const myProgress = prompt.length > 0 ? engine.currentIndex / prompt.length : 0;

  return (
    <View style={styles.playContainer}>
      {/* Progress bars */}
      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>You</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${myProgress * 100}%`, backgroundColor: '#4A90D9' }]} />
          </View>
          <Text style={styles.progressPct}>{Math.round(myProgress * 100)}%</Text>
        </View>
        {opponentProgress > 0 && (
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Opponent</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${opponentProgress * 100}%`, backgroundColor: '#E86C5F' }]} />
            </View>
            <Text style={styles.progressPct}>{Math.round(opponentProgress * 100)}%</Text>
          </View>
        )}
      </View>

      {/* Letter boxes */}
      <View style={styles.promptArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.letterRow}>
          {prompt.split('').map((char, i) => (
            <LetterBox
              key={i}
              char={char}
              state={i < engine.currentIndex ? 'correct' : i === engine.currentIndex ? 'active' : 'pending'}
            />
          ))}
        </ScrollView>
      </View>

      {/* Keyboard */}
      <KeyboardView
        activeKey={prompt[engine.currentIndex] || ''}
        onKeyPress={engine.handleKeyPress}
        showFingerGuide={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center', padding: 32 },
  icon: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#2D3748' },
  desc: { fontSize: 15, color: '#718096', textAlign: 'center', marginTop: 12, lineHeight: 22, maxWidth: 400 },
  primaryBtn: { backgroundColor: '#4A90D9', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 40, marginTop: 24 },
  primaryBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  secondaryBtn: { borderWidth: 2, borderColor: '#4A90D9', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 36, marginTop: 12 },
  secondaryBtnText: { color: '#4A90D9', fontSize: 16, fontWeight: '600' },
  scanTitle: { fontSize: 20, fontWeight: '600', color: '#2D3748', marginTop: 16 },
  scanHint: { fontSize: 14, color: '#A0AEC0', marginTop: 4 },
  deviceList: { width: '100%', maxWidth: 400, marginTop: 16 },
  deviceCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  deviceName: { fontSize: 16, fontWeight: '600', color: '#2D3748' },
  deviceAction: { fontSize: 14, fontWeight: '600', color: '#4A90D9' },
  emptyText: { color: '#A0AEC0', textAlign: 'center', marginTop: 20 },
  cancelBtn: { marginTop: 20 },
  cancelBtnText: { color: '#E86C5F', fontSize: 16, fontWeight: '600' },
  // Results
  resultEmoji: { fontSize: 64 },
  resultTitle: { fontSize: 36, fontWeight: '700', color: '#2D3748', marginTop: 12 },
  comparison: { flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 20 },
  playerCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, alignItems: 'center', minWidth: 160,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  playerLabel: { fontSize: 16, fontWeight: '700', color: '#4A90D9', marginBottom: 8 },
  playerStat: { fontSize: 15, color: '#4A5568', marginTop: 2 },
  vs: { fontSize: 20, fontWeight: '700', color: '#A0AEC0' },
  // Playing
  playContainer: {
    flex: 1, backgroundColor: '#F0F4F8', paddingHorizontal: 24,
    justifyContent: 'space-between', paddingTop: 8, paddingBottom: 8,
  },
  progressSection: { gap: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressLabel: { fontSize: 13, fontWeight: '600', color: '#4A5568', width: 70 },
  progressBarBg: { flex: 1, height: 10, backgroundColor: '#E2E8F0', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },
  progressPct: { fontSize: 12, color: '#A0AEC0', width: 36, textAlign: 'right' },
  promptArea: { flex: 1, justifyContent: 'center' },
  letterRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8 },
});
