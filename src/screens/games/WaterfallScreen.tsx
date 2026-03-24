import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import KeyboardView from '../../components/keyboard/KeyboardView';
import { useDatabase } from '../../hooks/useDatabase';
import { saveGameScore } from '../../db/repository';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const GAME_HEIGHT = SCREEN_H * 0.42;
const LETTERS = 'asdfghjklqwertyuiop';
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
  const [lives, setLives] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [saved, setSaved] = useState(false);

  const gameOverRef = useRef(false);
  const dropsRef = useRef<Drop[]>([]);
  const nextId = useRef(0);
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(Date.now());
  const speed = useRef(3200);
  const statsRef = useRef({ hits: 0, attempts: 0 });

  const streamWidth = (SCREEN_W - 120) / STREAMS;

  function spawnDrop() {
    if (gameOverRef.current) return;

    const id = nextId.current++;
    const char = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const stream = Math.floor(Math.random() * STREAMS);
    const animY = new Animated.Value(-50);
    const drop: Drop = { id, char, stream, animY, alive: true };

    dropsRef.current = [...dropsRef.current.filter(d => d.alive), drop];
    setDrops([...dropsRef.current]);

    Animated.timing(animY, {
      toValue: GAME_HEIGHT,
      duration: speed.current,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && drop.alive) {
        drop.alive = false;
        dropsRef.current = dropsRef.current.filter(d => d.id !== drop.id);
        setDrops([...dropsRef.current]);
        setLives(prev => {
          const next = prev - 1;
          if (next <= 0) { gameOverRef.current = true; setGameOver(true); }
          return next;
        });
      }
    });
  }

  useEffect(() => {
    startTime.current = Date.now();
    gameOverRef.current = false;
    spawnTimer.current = setInterval(() => {
      spawnDrop();
      speed.current = Math.max(1200, speed.current - 30);
    }, 1600);
    return () => {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
      dropsRef.current.forEach(d => d.animY.stopAnimation());
    };
  }, []);

  useEffect(() => {
    if (gameOver && !saved) {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
      dropsRef.current.forEach(d => { d.alive = false; d.animY.stopAnimation(); });
      if (user) {
        const duration = Date.now() - startTime.current;
        const { hits, attempts } = statsRef.current;
        const accuracy = attempts > 0 ? Math.round((hits / attempts) * 100) : 0;
        const wpm = duration > 0 ? Math.round((hits / 5) / (duration / 60000)) : 0;
        saveGameScore(db, { userId: user.id, gameType: 'waterfall', score, accuracy, wpm });
        setSaved(true);
      }
    }
  }, [gameOver]);

  function handleKeyPress(key: string) {
    if (gameOverRef.current) return;
    statsRef.current.attempts++;
    const target = dropsRef.current.find(d => d.alive && d.char === key.toLowerCase());
    if (target) {
      target.alive = false;
      target.animY.stopAnimation();
      statsRef.current.hits++;
      setScore(prev => prev + 10);
      dropsRef.current = dropsRef.current.filter(d => d.id !== target.id);
      setDrops([...dropsRef.current]);
    }
  }

  const activeDrops = drops.filter(d => d.alive);
  const activeChar = activeDrops.length > 0 ? activeDrops[0].char : '';

  return (
    <View style={styles.container}>
      <View style={styles.gameArea}>
        <View style={styles.header}>
          <Text style={styles.score}>Score: {score}</Text>
          <Text style={styles.livesText}>
            {'💧'.repeat(Math.max(0, lives))}{'⚫'.repeat(Math.max(0, 5 - lives))}
          </Text>
        </View>

        {Array.from({ length: STREAMS }, (_, i) => (
          <View key={i} style={[styles.streamLane, { left: 60 + i * streamWidth, width: streamWidth }]} />
        ))}

        {activeDrops.map(drop => (
          <Animated.View
            key={drop.id}
            style={[styles.drop, {
              left: 60 + drop.stream * streamWidth + streamWidth / 2 - 22,
              transform: [{ translateY: drop.animY }],
            }]}
          >
            <Text style={styles.dropText}>{drop.char.toUpperCase()}</Text>
          </Animated.View>
        ))}

        {gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.gameOverTitle}>Game Over!</Text>
            <Text style={styles.finalScore}>Score: {score}</Text>
            <Text style={styles.finalStats}>
              {statsRef.current.hits} hits / {statsRef.current.attempts} attempts
            </Text>
            <TouchableOpacity style={styles.gameOverBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.gameOverBtnText}>Back to Games</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <KeyboardView activeKey={activeChar} onKeyPress={handleKeyPress} showFingerGuide={false} disabled={gameOver} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B2A' },
  gameArea: { flex: 1, position: 'relative', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, zIndex: 10 },
  score: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  livesText: { fontSize: 18 },
  streamLane: { position: 'absolute', top: 0, bottom: 0, borderLeftWidth: 1, borderColor: 'rgba(74,144,217,0.15)' },
  drop: {
    position: 'absolute', width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#4A90D9', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4A90D9', shadowOpacity: 0.5, shadowRadius: 8, elevation: 4,
  },
  dropText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 20,
  },
  gameOverTitle: { color: '#FFF', fontSize: 40, fontWeight: '700' },
  finalScore: { color: '#ECC94B', fontSize: 28, fontWeight: '700', marginTop: 12 },
  finalStats: { color: '#A0AEC0', fontSize: 16, marginTop: 8 },
  gameOverBtn: { backgroundColor: '#4A90D9', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, marginTop: 24 },
  gameOverBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
