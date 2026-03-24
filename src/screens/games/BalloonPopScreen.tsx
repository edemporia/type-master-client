import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import KeyboardView from '../../components/keyboard/KeyboardView';
import { useDatabase } from '../../hooks/useDatabase';
import { saveGameScore } from '../../db/repository';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const GAME_HEIGHT = SCREEN_H * 0.42;
const LETTERS = 'asdfghjklqwertyuiop';
const COLORS = ['#FF6B6B', '#4A90D9', '#9B59B6', '#48BB78', '#ECC94B', '#FFA94D'];

interface Balloon {
  id: number;
  char: string;
  x: number;
  color: string;
  animY: Animated.Value;
  alive: boolean;
}

export default function BalloonPopScreen() {
  const { db, user } = useDatabase();
  const navigation = useNavigation();
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [saved, setSaved] = useState(false);

  const gameOverRef = useRef(false);
  const balloonsRef = useRef<Balloon[]>([]);
  const nextId = useRef(0);
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(Date.now());
  const speed = useRef(4000);
  const statsRef = useRef({ hits: 0, attempts: 0 });

  function spawnBalloon() {
    if (gameOverRef.current) return;

    const id = nextId.current++;
    const char = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const x = 40 + Math.random() * (SCREEN_W - 140);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const animY = new Animated.Value(GAME_HEIGHT);
    const balloon: Balloon = { id, char, x, color, animY, alive: true };

    balloonsRef.current = [...balloonsRef.current.filter(b => b.alive), balloon];
    setBalloons([...balloonsRef.current]);

    Animated.timing(animY, {
      toValue: -80,
      duration: speed.current,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && balloon.alive) {
        balloon.alive = false;
        balloonsRef.current = balloonsRef.current.filter(b => b.id !== balloon.id);
        setBalloons([...balloonsRef.current]);
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
      spawnBalloon();
      speed.current = Math.max(1500, speed.current - 35);
    }, 2000);
    return () => {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
      balloonsRef.current.forEach(b => b.animY.stopAnimation());
    };
  }, []);

  useEffect(() => {
    if (gameOver && !saved) {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
      balloonsRef.current.forEach(b => { b.alive = false; b.animY.stopAnimation(); });
      if (user) {
        const duration = Date.now() - startTime.current;
        const { hits, attempts } = statsRef.current;
        const accuracy = attempts > 0 ? Math.round((hits / attempts) * 100) : 0;
        const wpm = duration > 0 ? Math.round((hits / 5) / (duration / 60000)) : 0;
        saveGameScore(db, { userId: user.id, gameType: 'balloon', score, accuracy, wpm });
        setSaved(true);
      }
    }
  }, [gameOver]);

  function handleKeyPress(key: string) {
    if (gameOverRef.current) return;
    statsRef.current.attempts++;
    const target = balloonsRef.current.find(b => b.alive && b.char === key.toLowerCase());
    if (target) {
      target.alive = false;
      target.animY.stopAnimation();
      statsRef.current.hits++;
      setScore(prev => prev + 10);
      balloonsRef.current = balloonsRef.current.filter(b => b.id !== target.id);
      setBalloons([...balloonsRef.current]);
    }
  }

  const activeBalloons = balloons.filter(b => b.alive);
  const activeChar = activeBalloons.length > 0 ? activeBalloons[0].char : '';

  return (
    <View style={styles.container}>
      <View style={styles.gameArea}>
        <View style={styles.header}>
          <Text style={styles.score}>Score: {score}</Text>
          <Text style={styles.livesText}>
            {'🎈'.repeat(Math.max(0, lives))}{'⚫'.repeat(Math.max(0, 5 - lives))}
          </Text>
        </View>

        {activeBalloons.map(balloon => (
          <Animated.View
            key={balloon.id}
            style={[styles.balloon, {
              left: balloon.x, backgroundColor: balloon.color,
              transform: [{ translateY: balloon.animY }],
            }]}
          >
            <Text style={styles.balloonText}>{balloon.char.toUpperCase()}</Text>
            <View style={[styles.balloonString, { borderColor: balloon.color }]} />
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
  container: { flex: 1, backgroundColor: '#E8F5FD' },
  gameArea: { flex: 1, position: 'relative', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, zIndex: 10 },
  score: { color: '#2D3748', fontSize: 20, fontWeight: '700' },
  livesText: { fontSize: 18 },
  balloon: {
    position: 'absolute', width: 52, height: 62, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  balloonText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  balloonString: { position: 'absolute', bottom: -14, width: 0, height: 14, borderLeftWidth: 1.5 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 20,
  },
  gameOverTitle: { color: '#FFF', fontSize: 40, fontWeight: '700' },
  finalScore: { color: '#ECC94B', fontSize: 28, fontWeight: '700', marginTop: 12 },
  finalStats: { color: '#A0AEC0', fontSize: 16, marginTop: 8 },
  gameOverBtn: { backgroundColor: '#9B59B6', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, marginTop: 24 },
  gameOverBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
