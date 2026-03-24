import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useDatabase } from '../hooks/useDatabase';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { getLesson, saveProgress, saveKeystrokeBatch } from '../db/repository';
import KeyboardView from '../components/keyboard/KeyboardView';
import LetterBox from '../components/LetterBox';
import type { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TypingLessonScreen() {
  const { db, user } = useDatabase();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'TypingLesson'>>();
  const [prompts, setPrompts] = useState<string[]>([]);
  const [promptIndex, setPromptIndex] = useState(0);
  const [sessionId] = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

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
      }
    })();
  }, []);

  useEffect(() => {
    if (engine.isComplete && prompts.length > 0) {
      handlePromptComplete();
    }
  }, [engine.isComplete]);

  async function handlePromptComplete() {
    const result = engine.getResult();

    // Save keystrokes
    await saveKeystrokeBatch(db, result.keystrokes);

    if (promptIndex < prompts.length - 1) {
      // Move to next prompt in the lesson
      setPromptIndex(prev => prev + 1);
      engine.reset();
    } else {
      // Lesson complete — save progress and navigate to completion
      await saveProgress(db, {
        userId: user!.id,
        lessonId: route.params.lessonId,
        completed: true,
        stars: result.stars,
        accuracy: result.accuracy,
        wpm: result.wpm,
      });

      navigation.replace('LessonComplete', {
        lessonId: route.params.lessonId,
        stars: result.stars,
        accuracy: result.accuracy,
        wpm: result.wpm,
      });
    }
  }

  if (!currentPrompt) {
    return <View style={styles.container}><Text style={styles.loading}>Loading...</Text></View>;
  }

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((promptIndex) / prompts.length) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>{promptIndex + 1} / {prompts.length}</Text>

      {/* Letter boxes */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.letterRow}>
        {currentPrompt.split('').map((char, i) => (
          <LetterBox
            key={i}
            char={char}
            state={
              i < engine.currentIndex ? 'correct' :
              i === engine.currentIndex ? 'active' : 'pending'
            }
          />
        ))}
      </ScrollView>

      {/* Keyboard */}
      <KeyboardView
        activeKey={currentPrompt[engine.currentIndex] || ''}
        onKeyPress={engine.handleKeyPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', paddingHorizontal: 24, justifyContent: 'space-between', paddingTop: 16 },
  loading: { fontSize: 18, color: '#718096', textAlign: 'center', marginTop: 40 },
  progressBar: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4A90D9', borderRadius: 3 },
  progressText: { fontSize: 13, color: '#A0AEC0', textAlign: 'center', marginTop: 4 },
  letterRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 20 },
});
