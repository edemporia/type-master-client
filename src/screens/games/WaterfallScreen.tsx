import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import KeyboardView from '../../components/keyboard/KeyboardView';
import { useDatabase } from '../../hooks/useDatabase';
import { saveGameScore } from '../../db/repository';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const STREAMS = 4;

interface Drop {
  id: number;
  char: string;
  stream: number;
  animY: Animated.Value;
  alive: boolean;
}

export default function WaterfallScreen() {
  const { db, user } = useDatabase();
  const navigation = useNavigation();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctHits, setCorrectHits] = useState(0);
  const nextId = useRef(0);
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(Date.now());
  const speedRef = useRef(3500);

  const streamWidth = (SCREEN_W - 120) / STREAMS;

  const spawnDrop = useCallback(() => {
    if (gameOver) return;
    const id = nextId.current++;
    const char = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const stream = Math.floor(Math.random() * STREAMS);
    const animY = new Animated.Value(-50);

    const drop: Drop = { id, char, stream, animY, alive: true };
    setDrops(prev => [...prev.filter(d => d.alive), drop]);

    Animated.timing(animY, {
      toValue: SCREEN_H * 0.45,
      duration: speedRef.current,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && drop.alive) {
        drop.alive = false;
        setMisses(prev => {
          const next = prev + 1;
          if (next >= 5) setGameOver(true);
          return next;
        });
      }
    });
  }, [gameOver]);

  useEffect(() => {
    startTime.current = Date.now();
    spawnTimer.current = setInterval(() => {
      spawnDrop();
      speedRef.current = Math.max(1200, speedRef.current - 25);
    }, 1800);
    return () => { if (spawnTimer.current) clearInterval(spawnTimer.current); };
  }, [spawnDrop]);

  useEffect(() => {
    if (gameOver) {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
      if (user) {
        const duration = Date.now() - startTime.current;
        const accuracy = totalAttempts > 0 ? Math.round((correctHits / totalAttempts) * 100) : 0;
        const wpm = duration > 0 ? Math.round((correctHits / 5) / (duration / 60000)) : 0;
        saveGameScore(db, { userId: user.id, gameType: 'waterfall', score, accuracy, wpm });
      }
    }
  }, [gameOver]);

  function handleKeyPress(key: string) {
    if (gameOver) return;
    setTotalAttempts(prev => prev + 1);
    const target = drops.find(d => d.alive && d.char === key.toLowerCase());
    if (target) {
      target.alive = false;
      target.animY.stopAnimation();
      setScore(prev => prev + 10);
      setCorrectHits(prev => prev + 1);
      setDrops(prev => prev.filter(d => d.id !== target.id));
    }
  }

  const activeDrops = drops.filter(d => d.alive);
  const activeChar = activeDrops.length > 0 ? activeDrops[0].char : '';

  return (
    <View style={styles.container}>
      <View style={styles.gameArea}>
        <View style={styles.header}>
          <Text style={styles.score}>Score: {score}</Text>
          <Text style={styles.lives}>{'💧'.repeat(Math.max(0, 5 - misses))}</Text>
        </View>

        {/* Stream lanes */}
        {Array.from({ length: STREAMS }, (_, i) => (
          <View key={i} style={[styles.streamLane, { left: 60 + i * streamWidth, width: streamWidth }]} />
        ))}

        {drops.filter(d => d.alive).map(drop => (
          <Animated.View
            key={drop.id}
            style={[styles.drop, { left: 60 + drop.stream * streamWidth + streamWidth / 2 - 22, transform: [{ translateY: drop.animY }] }]}
          >
            <Text style={styles.dropText}>{drop.char.toUpperCase()}</Text>
          </Animated.View>
        ))}

        {gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.gameOverTitle}>Game Over!</Text>
            <Text style={styles.finalScore}>Score: {score}</Text>
            <Text style={styles.tapRestart} onPress={() => navigation.goBack()}>Tap to go back</Text>
          </View>
        )}
      </View>

      <KeyboardView activeKey={activeChar} onKeyPress={handleKeyPress} showFingerGuide={false} disabled={gameOver} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B2A' },
  gameArea: { flex: 1, position: 'relative' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, zIndex: 10 },
  score: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  lives: { fontSize: 18 },
  streamLane: { position: 'absolute', top: 0, bottom: 0, borderLeftWidth: 1, borderColor: 'rgba(74,144,217,0.15)' },
  drop: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: '#4A90D9', alignItems: 'center', justifyContent: 'center' },
  dropText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  gameOverTitle: { color: '#FFF', fontSize: 40, fontWeight: '700' },
  finalScore: { color: '#ECC94B', fontSize: 24, marginTop: 12 },
  tapRestart: { color: '#A0AEC0', fontSize: 16, marginTop: 20 },
});
