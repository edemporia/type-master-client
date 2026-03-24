import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import KeyboardView from '../../components/keyboard/KeyboardView';
import { useDatabase } from '../../hooks/useDatabase';
import { saveGameScore } from '../../db/repository';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const GAME_HEIGHT = SCREEN_H * 0.42;
const LETTERS = 'asdfghjkl'; // Start with home row keys for practice

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
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [saved, setSaved] = useState(false);

  // Use refs for mutable state accessed inside intervals/animations
  const gameOverRef = useRef(false);
  const meteorsRef = useRef<Meteor[]>([]);
  const nextId = useRef(0);
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(Date.now());
  const speed = useRef(3500);
  const statsRef = useRef({ hits: 0, attempts: 0 });

  function spawnMeteor() {
    if (gameOverRef.current) return;

    const id = nextId.current++;
    const char = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const x = 40 + Math.random() * (SCREEN_W - 140);
    const animY = new Animated.Value(-60);
    const meteor: Meteor = { id, char, x, animY, alive: true };

    meteorsRef.current = [...meteorsRef.current.filter(m => m.alive), meteor];
    setMeteors([...meteorsRef.current]);

    Animated.timing(animY, {
      toValue: GAME_HEIGHT,
      duration: speed.current,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && meteor.alive) {
        meteor.alive = false;
        meteorsRef.current = meteorsRef.current.filter(m => m.id !== meteor.id);
        setMeteors([...meteorsRef.current]);
        setLives(prev => {
          const next = prev - 1;
          if (next <= 0) {
            gameOverRef.current = true;
            setGameOver(true);
          }
          return next;
        });
      }
    });
  }

  useEffect(() => {
    startTime.current = Date.now();
    gameOverRef.current = false;

    spawnTimer.current = setInterval(() => {
      spawnMeteor();
      speed.current = Math.max(1500, speed.current - 40);
    }, 1800);

    return () => {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
      // Stop all animations
      meteorsRef.current.forEach(m => m.animY.stopAnimation());
    };
  }, []);

  // Save score when game ends
  useEffect(() => {
    if (gameOver && !saved) {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
      meteorsRef.current.forEach(m => {
        m.alive = false;
        m.animY.stopAnimation();
      });

      if (user) {
        const duration = Date.now() - startTime.current;
        const { hits, attempts } = statsRef.current;
        const accuracy = attempts > 0 ? Math.round((hits / attempts) * 100) : 0;
        const wpm = duration > 0 ? Math.round((hits / 5) / (duration / 60000)) : 0;
        saveGameScore(db, { userId: user.id, gameType: 'meteor', score, accuracy, wpm });
        setSaved(true);
      }
    }
  }, [gameOver]);

  function handleKeyPress(key: string) {
    if (gameOverRef.current) return;
    statsRef.current.attempts++;

    const target = meteorsRef.current.find(m => m.alive && m.char === key.toLowerCase());
    if (target) {
      target.alive = false;
      target.animY.stopAnimation();
      statsRef.current.hits++;
      setScore(prev => prev + 10);
      meteorsRef.current = meteorsRef.current.filter(m => m.id !== target.id);
      setMeteors([...meteorsRef.current]);
    }
  }

  const activeMeteors = meteors.filter(m => m.alive);
  const activeChar = activeMeteors.length > 0 ? activeMeteors[0].char : '';

  return (
    <View style={styles.container}>
      <View style={styles.gameArea}>
        <View style={styles.header}>
          <Text style={styles.score}>Score: {score}</Text>
          <Text style={styles.livesText}>
            {'❤️'.repeat(Math.max(0, lives))}{'🖤'.repeat(Math.max(0, 3 - lives))}
          </Text>
        </View>

        {activeMeteors.map(meteor => (
          <Animated.View
            key={meteor.id}
            style={[styles.meteor, { left: meteor.x, transform: [{ translateY: meteor.animY }] }]}
          >
            <Text style={styles.meteorText}>{meteor.char.toUpperCase()}</Text>
          </Animated.View>
        ))}

        <View style={styles.ground} />

        {gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.gameOverTitle}>Game Over!</Text>
            <Text style={styles.finalScore}>Score: {score}</Text>
            <Text style={styles.finalStats}>
              {statsRef.current.hits} hits / {statsRef.current.attempts} attempts
            </Text>
            <View style={styles.gameOverButtons}>
              <TouchableOpacity style={styles.gameOverBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.gameOverBtnText}>Back to Games</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <KeyboardView activeKey={activeChar} onKeyPress={handleKeyPress} showFingerGuide={false} disabled={gameOver} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  gameArea: { flex: 1, position: 'relative', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, zIndex: 10 },
  score: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  livesText: { fontSize: 18 },
  meteor: {
    position: 'absolute', width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#E86C5F', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#E86C5F', shadowOpacity: 0.6, shadowRadius: 10, elevation: 5,
  },
  meteorText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  ground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#E86C5F' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 20,
  },
  gameOverTitle: { color: '#FFF', fontSize: 40, fontWeight: '700' },
  finalScore: { color: '#ECC94B', fontSize: 28, fontWeight: '700', marginTop: 12 },
  finalStats: { color: '#A0AEC0', fontSize: 16, marginTop: 8 },
  gameOverButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  gameOverBtn: { backgroundColor: '#4A90D9', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28 },
  gameOverBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
