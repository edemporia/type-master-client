import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useDatabase } from '../hooks/useDatabase';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { getLesson, saveProgress, saveKeystrokeBatch } from '../db/repository';
import { calculateStars, calculateWPM, calculateAccuracy } from '../utils/scoring';
import KeyboardView from '../components/keyboard/KeyboardView';
import LetterBox from '../components/LetterBox';
import type { KeystrokeLog, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Tracks cumulative stats across all prompts in a lesson
interface CumulativeStats {
  totalCorrect: number;
  totalAttempts: number;
  totalChars: number;
  allKeystrokes: Omit<KeystrokeLog, 'id'>[];
  lessonStartTime: number;
  errorMap: Record<string, number>;
}

export default function TypingLessonScreen() {
  const { db, user } = useDatabase();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'TypingLesson'>>();
  const [prompts, setPrompts] = useState<string[]>([]);
  const [promptIndex, setPromptIndex] = useState(0);
  const [sessionId] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const [wrongFlash, setWrongFlash] = useState(false);

  // Cumulative stats across ALL prompts
  const cumulativeRef = useRef<CumulativeStats>({
    totalCorrect: 0,
    totalAttempts: 0,
    totalChars: 0,
    allKeystrokes: [],
    lessonStartTime: 0,
    errorMap: {},
  });

  const currentPrompt = prompts[promptIndex] || '';

  const engine = useTypingEngine({
    prompt: currentPrompt,
    sessionId,
    userId: user?.id || 0,
    lessonId: route.params.lessonId,
  });

  useEffect(() => {
    (async () => {
      const lesson = await getLesson(db, route.params.lessonId);
      if (lesson) {
        const content = JSON.parse(lesson.contentRef);
        setPrompts(content.prompts || []);
        cumulativeRef.current.lessonStartTime = Date.now();
      }
    })();
  }, []);

  useEffect(() => {
    if (engine.isComplete && prompts.length > 0) {
      handlePromptComplete();
    }
  }, [engine.isComplete]);

  // Flash red border on wrong key
  const prevAttempts = useRef(0);
  useEffect(() => {
    if (engine.totalAttempts > prevAttempts.current && engine.totalAttempts > engine.correctCount + (engine.totalAttempts - prevAttempts.current === 1 ? 0 : 0)) {
      // Check if the latest attempt was wrong (totalAttempts grew but correctCount didn't grow proportionally)
    }
    prevAttempts.current = engine.totalAttempts;
  }, [engine.totalAttempts]);

  async function handlePromptComplete() {
    const result = engine.getResult();
    const cum = cumulativeRef.current;

    // Accumulate stats
    cum.totalCorrect += engine.correctCount;
    cum.totalAttempts += engine.totalAttempts;
    cum.totalChars += currentPrompt.length;
    cum.allKeystrokes.push(...result.keystrokes);

    // Merge error maps
    for (const [char, count] of Object.entries(result.troubleSpots.reduce((acc, char) => {
      acc[char] = (acc[char] || 0) + 1;
      return acc;
    }, {} as Record<string, number>))) {
      cum.errorMap[char] = (cum.errorMap[char] || 0) + count;
    }

    // Save keystrokes for this prompt
    if (result.keystrokes.length > 0) {
      await saveKeystrokeBatch(db, result.keystrokes);
    }

    if (promptIndex < prompts.length - 1) {
      // Next prompt
      setPromptIndex(prev => prev + 1);
      engine.reset();
    } else {
      // LESSON COMPLETE — calculate aggregate stats
      const totalDurationMs = Date.now() - cum.lessonStartTime;
      const accuracy = calculateAccuracy(cum.totalCorrect, cum.totalAttempts);
      const wpm = calculateWPM(cum.totalChars, totalDurationMs);
      const stars = calculateStars(accuracy);

      // Get top trouble spots from cumulative error map
      const troubleSpots = Object.entries(cum.errorMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([char]) => char);

      await saveProgress(db, {
        userId: user!.id,
        lessonId: route.params.lessonId,
        completed: true,
        stars,
        accuracy,
        wpm,
      });

      navigation.replace('LessonComplete', {
        lessonId: route.params.lessonId,
        stars,
        accuracy,
        wpm,
        troubleSpots,
      });
    }
  }

  // Handle wrong key press visual feedback
  function onKeyPress(key: string) {
    const expected = currentPrompt[engine.currentIndex];
    if (expected && key.toLowerCase() !== expected.toLowerCase()) {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 200);
    }
    engine.handleKeyPress(key);
  }

  if (!currentPrompt) {
    return <View style={styles.container}><Text style={styles.loading}>Loading lesson...</Text></View>;
  }

  return (
    <View style={styles.container}>
      {/* Progress bar across full lesson */}
      <View style={styles.topBar}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {
            width: `${((promptIndex + (engine.currentIndex / Math.max(currentPrompt.length, 1))) / prompts.length) * 100}%`
          }]} />
        </View>
        <Text style={styles.progressText}>
          {promptIndex + 1} of {prompts.length}
        </Text>
      </View>

      {/* Letter boxes */}
      <View style={styles.promptArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.letterRow}>
          {currentPrompt.split('').map((char, i) => (
            <LetterBox
              key={`${promptIndex}-${i}`}
              char={char}
              state={
                i < engine.currentIndex ? 'correct' :
                i === engine.currentIndex ? (wrongFlash ? 'incorrect' : 'active') :
                'pending'
              }
            />
          ))}
        </ScrollView>

        {/* Show which finger to use */}
        {engine.currentIndex < currentPrompt.length && (
          <Text style={styles.hint}>
            Type: {currentPrompt[engine.currentIndex] === ' ' ? 'SPACE' : currentPrompt[engine.currentIndex].toUpperCase()}
          </Text>
        )}
      </View>

      {/* Keyboard */}
      <KeyboardView
        activeKey={currentPrompt[engine.currentIndex] || ''}
        onKeyPress={onKeyPress}
        disabled={engine.isComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#F0F4F8',
    paddingHorizontal: 24, justifyContent: 'space-between', paddingTop: 12, paddingBottom: 8,
  },
  loading: { fontSize: 18, color: '#718096', textAlign: 'center', marginTop: 40 },
  topBar: { marginBottom: 4 },
  progressBar: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#48BB78', borderRadius: 4 },
  progressText: { fontSize: 13, color: '#A0AEC0', textAlign: 'center', marginTop: 4 },
  promptArea: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  letterRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 12 },
  hint: { fontSize: 16, color: '#4A90D9', fontWeight: '600', marginTop: 8 },
});
