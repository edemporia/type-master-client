import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import KeyboardView from '../../components/keyboard/KeyboardView';
import { useDatabase } from '../../hooks/useDatabase';
import { saveGameScore } from '../../db/repository';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const BALLOON_COLORS = ['#FF6B6B', '#4A90D9', '#9B59B6', '#48BB78', '#ECC94B', '#FFA94D'];

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
  const [misses, setMisses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctHits, setCorrectHits] = useState(0);
  const nextId = useRef(0);
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(Date.now());
  const speedRef = useRef(4500);

  const spawnBalloon = useCallback(() => {
    if (gameOver) return;
    const id = nextId.current++;
    const char = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const x = 60 + Math.random() * (SCREEN_W - 180);
    const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    const animY = new Animated.Value(SCREEN_H * 0.4);

    const balloon: Balloon = { id, char, x, color, animY, alive: true };
    setBalloons(prev => [...prev.filter(b => b.alive), balloon]);

    Animated.timing(animY, {
      toValue: -80,
      duration: speedRef.current,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && balloon.alive) {
        balloon.alive = false;
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
      spawnBalloon();
      speedRef.current = Math.max(1500, speedRef.current - 30);
    }, 2200);
    return () => { if (spawnTimer.current) clearInterval(spawnTimer.current); };
  }, [spawnBalloon]);

  useEffect(() => {
    if (gameOver) {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
      if (user) {
        const duration = Date.now() - startTime.current;
        const accuracy = totalAttempts > 0 ? Math.round((correctHits / totalAttempts) * 100) : 0;
        const wpm = duration > 0 ? Math.round((correctHits / 5) / (duration / 60000)) : 0;
        saveGameScore(db, { userId: user.id, gameType: 'balloon', score, accuracy, wpm });
      }
    }
  }, [gameOver]);

  function handleKeyPress(key: string) {
    if (gameOver) return;
    setTotalAttempts(prev => prev + 1);
    const target = balloons.find(b => b.alive && b.char === key.toLowerCase());
    if (target) {
      target.alive = false;
      target.animY.stopAnimation();
      setScore(prev => prev + 10);
      setCorrectHits(prev => prev + 1);
      setBalloons(prev => prev.filter(b => b.id !== target.id));
    }
  }

  const activeBalloons = balloons.filter(b => b.alive);
  const activeChar = activeBalloons.length > 0 ? activeBalloons[0].char : '';

  return (
    <View style={styles.container}>
      <View style={styles.gameArea}>
        <View style={styles.header}>
          <Text style={styles.score}>Score: {score}</Text>
          <Text style={styles.lives}>{'🎈'.repeat(Math.max(0, 5 - misses))}</Text>
        </View>

        {balloons.filter(b => b.alive).map(balloon => (
          <Animated.View
            key={balloon.id}
            style={[styles.balloon, { left: balloon.x, backgroundColor: balloon.color, transform: [{ translateY: balloon.animY }] }]}
          >
            <Text style={styles.balloonText}>{balloon.char.toUpperCase()}</Text>
            <View style={[styles.balloonString, { borderColor: balloon.color }]} />
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
  container: { flex: 1, backgroundColor: '#E8F5FD' },
  gameArea: { flex: 1, position: 'relative' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, zIndex: 10 },
  score: { color: '#2D3748', fontSize: 20, fontWeight: '700' },
  lives: { fontSize: 18 },
  balloon: { position: 'absolute', width: 52, height: 60, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  balloonText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  balloonString: { position: 'absolute', bottom: -14, width: 0, height: 14, borderLeftWidth: 1.5 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  gameOverTitle: { color: '#FFF', fontSize: 40, fontWeight: '700' },
  finalScore: { color: '#ECC94B', fontSize: 24, marginTop: 12 },
  tapRestart: { color: '#A0AEC0', fontSize: 16, marginTop: 20 },
});
