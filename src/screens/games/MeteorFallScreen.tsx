import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import KeyboardView from '../../components/keyboard/KeyboardView';
import { useDatabase } from '../../hooks/useDatabase';
import { saveGameScore } from '../../db/repository';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

interface Meteor {
  id: number;
  char: string;
  x: number;
  animY: Animated.Value;
  alive: boolean;
}

export default function MeteorFallScreen() {
  const { db, user } = useDatabase();
  const navigation = useNavigation();
  const [meteors, setMeteors] = useState<Meteor[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctHits, setCorrectHits] = useState(0);
  const nextId = useRef(0);
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(Date.now());
  const speedRef = useRef(4000); // ms to fall — decreases over time

  const spawnMeteor = useCallback(() => {
    if (gameOver) return;
    const id = nextId.current++;
    const char = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const x = 60 + Math.random() * (SCREEN_W - 180);
    const animY = new Animated.Value(-60);

    const meteor: Meteor = { id, char, x, animY, alive: true };
    setMeteors(prev => [...prev.filter(m => m.alive), meteor]);

    Animated.timing(animY, {
      toValue: SCREEN_H * 0.45,
      duration: speedRef.current,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && meteor.alive) {
        meteor.alive = false;
        setMisses(prev => {
          const next = prev + 1;
          if (next >= 3) setGameOver(true);
          return next;
        });
      }
    });
  }, [gameOver]);

  useEffect(() => {
    startTime.current = Date.now();
    spawnTimer.current = setInterval(() => {
      spawnMeteor();
      // Gradually increase speed
      speedRef.current = Math.max(1500, speedRef.current - 30);
    }, 2000);
    return () => { if (spawnTimer.current) clearInterval(spawnTimer.current); };
  }, [spawnMeteor]);

  useEffect(() => {
    if (gameOver) {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
      if (user) {
        const duration = Date.now() - startTime.current;
        const accuracy = totalAttempts > 0 ? Math.round((correctHits / totalAttempts) * 100) : 0;
        const wpm = duration > 0 ? Math.round((correctHits / 5) / (duration / 60000)) : 0;
        saveGameScore(db, { userId: user.id, gameType: 'meteor', score, accuracy, wpm });
      }
    }
  }, [gameOver]);

  function handleKeyPress(key: string) {
    if (gameOver) return;
    setTotalAttempts(prev => prev + 1);

    const target = meteors.find(m => m.alive && m.char === key.toLowerCase());
    if (target) {
      target.alive = false;
      target.animY.stopAnimation();
      setScore(prev => prev + 10);
      setCorrectHits(prev => prev + 1);
      setMeteors(prev => prev.filter(m => m.id !== target.id));
    }
  }

  const activeMeteors = meteors.filter(m => m.alive);
  const activeChar = activeMeteors.length > 0 ? activeMeteors[0].char : '';

  return (
    <View style={styles.container}>
      {/* Game area */}
      <View style={styles.gameArea}>
        <View style={styles.header}>
          <Text style={styles.score}>Score: {score}</Text>
          <Text style={styles.lives}>{'❤️'.repeat(Math.max(0, 3 - misses))}</Text>
        </View>

        {meteors.filter(m => m.alive).map(meteor => (
          <Animated.View
            key={meteor.id}
            style={[styles.meteor, { left: meteor.x, transform: [{ translateY: meteor.animY }] }]}
          >
            <Text style={styles.meteorText}>{meteor.char.toUpperCase()}</Text>
          </Animated.View>
        ))}

        {/* Ground line */}
        <View style={styles.ground} />

        {gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.gameOverTitle}>Game Over!</Text>
            <Text style={styles.finalScore}>Score: {score}</Text>
            <Text style={styles.tapRestart} onPress={() => navigation.goBack()}>Tap to go back</Text>
          </View>
        )}
      </View>

      {/* Keyboard */}
      <KeyboardView activeKey={activeChar} onKeyPress={handleKeyPress} showFingerGuide={false} disabled={gameOver} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  gameArea: { flex: 1, position: 'relative' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  score: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  lives: { fontSize: 20 },
  meteor: { position: 'absolute', width: 50, height: 50, borderRadius: 25, backgroundColor: '#E86C5F', alignItems: 'center', justifyContent: 'center' },
  meteorText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  ground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#E86C5F' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  gameOverTitle: { color: '#FFF', fontSize: 40, fontWeight: '700' },
  finalScore: { color: '#ECC94B', fontSize: 24, marginTop: 12 },
  tapRestart: { color: '#A0AEC0', fontSize: 16, marginTop: 20 },
});
