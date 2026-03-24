import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import KeyboardView from '../components/keyboard/KeyboardView';
import LetterBox from '../components/LetterBox';
import StarRating from '../components/StarRating';
import { useDatabase } from '../hooks/useDatabase';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { calculateStars, calculateWPM, calculateAccuracy } from '../utils/scoring';

const TEST_PROMPTS = [
  { text: 'the quick fox', difficulty: 'Easy' },
  { text: 'she sells sea shells', difficulty: 'Medium' },
  { text: 'a quick brown fox jumps over the lazy dog', difficulty: 'Hard' },
];

export default function TypingTestScreen() {
  const { db, user } = useDatabase();
  const navigation = useNavigation();
  const [selectedTest, setSelectedTest] = useState<number | null>(null);
  const [result, setResult] = useState<{ stars: number; wpm: number; accuracy: number } | null>(null);

  const testPrompt = selectedTest !== null ? TEST_PROMPTS[selectedTest].text : '';

  const engine = useTypingEngine({
    prompt: testPrompt,
    sessionId: `test-${Date.now()}`,
    userId: user?.id || 0,
    lessonId: 0,
  });

  useEffect(() => {
    if (engine.isComplete && testPrompt) {
      const r = engine.getResult();
      setResult({ stars: r.stars, wpm: r.wpm, accuracy: r.accuracy });
    }
  }, [engine.isComplete]);

  if (result) {
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Test Complete!</Text>
        <StarRating stars={result.stars} size={40} />
        <View style={styles.resultStats}>
          <Text style={styles.resultStat}>{result.accuracy}% Accuracy</Text>
          <Text style={styles.resultStat}>{result.wpm} WPM</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => { setSelectedTest(null); setResult(null); engine.reset(); }}>
          <Text style={styles.buttonText}>Try Another</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (selectedTest === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Typing Test</Text>
        <Text style={styles.subtitle}>Choose a difficulty level</Text>
        {TEST_PROMPTS.map((test, i) => (
          <TouchableOpacity key={i} style={styles.testCard} onPress={() => setSelectedTest(i)}>
            <Text style={styles.testDifficulty}>{test.difficulty}</Text>
            <Text style={styles.testPreview}>{test.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.typingContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.letterRow}>
        {testPrompt.split('').map((char, i) => (
          <LetterBox
            key={i}
            char={char}
            state={i < engine.currentIndex ? 'correct' : i === engine.currentIndex ? 'active' : 'pending'}
          />
        ))}
      </ScrollView>
      <KeyboardView activeKey={testPrompt[engine.currentIndex] || ''} onKeyPress={engine.handleKeyPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#2D3748' },
  subtitle: { fontSize: 16, color: '#718096', marginTop: 4, marginBottom: 24 },
  testCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 20, width: '80%', maxWidth: 500, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  testDifficulty: { fontSize: 16, fontWeight: '700', color: '#4A90D9' },
  testPreview: { fontSize: 14, color: '#718096', marginTop: 4 },
  typingContainer: { flex: 1, backgroundColor: '#F0F4F8', paddingHorizontal: 24, justifyContent: 'space-between', paddingTop: 24 },
  letterRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 20 },
  resultContainer: { flex: 1, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center' },
  resultTitle: { fontSize: 32, fontWeight: '700', color: '#2D3748', marginBottom: 16 },
  resultStats: { flexDirection: 'row', gap: 24, marginTop: 20 },
  resultStat: { fontSize: 20, fontWeight: '600', color: '#4A5568' },
  button: { backgroundColor: '#4A90D9', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 24 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
