import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import KeyboardView from '../components/keyboard/KeyboardView';
import LetterBox from '../components/LetterBox';
import StarRating from '../components/StarRating';
import { useDatabase } from '../hooks/useDatabase';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { saveKeystrokeBatch, saveLeaderboardEntry } from '../db/repository';

const TEST_PROMPTS = [
  { id: 'easy-1', text: 'add a sad lad', difficulty: 'Easy', color: '#48BB78' },
  { id: 'easy-2', text: 'the quick red fox', difficulty: 'Easy', color: '#48BB78' },
  { id: 'med-1', text: 'she sells sea shells by the shore', difficulty: 'Medium', color: '#ECC94B' },
  { id: 'med-2', text: 'the five boxing wizards jump quickly', difficulty: 'Medium', color: '#ECC94B' },
  { id: 'hard-1', text: 'a quick brown fox jumps over the lazy dog', difficulty: 'Hard', color: '#E86C5F' },
  { id: 'hard-2', text: 'pack my box with five dozen liquor jugs', difficulty: 'Hard', color: '#E86C5F' },
];

export default function TypingTestScreen() {
  const { db, user } = useDatabase();
  const [selectedTest, setSelectedTest] = useState<number | null>(null);
  const [result, setResult] = useState<{ stars: number; wpm: number; accuracy: number } | null>(null);
  const [saved, setSaved] = useState(false);
  const sessionId = useRef(`test-${Date.now()}`);

  const testPrompt = selectedTest !== null ? TEST_PROMPTS[selectedTest].text : '';

  const engine = useTypingEngine({
    prompt: testPrompt,
    sessionId: sessionId.current,
    userId: user?.id || 0,
    lessonId: 0,
  });

  useEffect(() => {
    if (engine.isComplete && testPrompt && !saved) {
      const r = engine.getResult();
      setResult({ stars: r.stars, wpm: r.wpm, accuracy: r.accuracy });

      // Save keystrokes and leaderboard entry
      if (user && r.keystrokes.length > 0) {
        saveKeystrokeBatch(db, r.keystrokes);
        // Score = WPM * accuracy bonus
        const score = Math.round(r.wpm * (r.accuracy / 100) * 10);
        saveLeaderboardEntry(db, {
          userId: user.id,
          testId: TEST_PROMPTS[selectedTest!].id,
          score,
        });
      }
      setSaved(true);
    }
  }, [engine.isComplete]);

  function selectTest(index: number) {
    setSelectedTest(index);
    setResult(null);
    setSaved(false);
    sessionId.current = `test-${Date.now()}`;
    engine.reset();
  }

  // Result screen
  if (result) {
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Test Complete!</Text>
        <StarRating stars={result.stars} size={44} />
        <View style={styles.resultStats}>
          <View style={styles.resultStatBox}>
            <Text style={styles.resultStatValue}>{result.accuracy}%</Text>
            <Text style={styles.resultStatLabel}>Accuracy</Text>
          </View>
          <View style={styles.resultStatBox}>
            <Text style={styles.resultStatValue}>{result.wpm}</Text>
            <Text style={styles.resultStatLabel}>WPM</Text>
          </View>
        </View>
        <View style={styles.resultButtons}>
          <TouchableOpacity style={styles.retryBtn} onPress={() => selectTest(selectedTest!)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => { setSelectedTest(null); setResult(null); setSaved(false); }}>
            <Text style={styles.buttonText}>Choose Another</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Test selection
  if (selectedTest === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Typing Test</Text>
        <Text style={styles.subtitle}>Choose a prompt and test your speed!</Text>
        <View style={styles.testGrid}>
          {TEST_PROMPTS.map((test, i) => (
            <TouchableOpacity key={test.id} style={styles.testCard} onPress={() => selectTest(i)}>
              <View style={[styles.diffBadge, { backgroundColor: test.color }]}>
                <Text style={styles.diffText}>{test.difficulty}</Text>
              </View>
              <Text style={styles.testPreview}>{test.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // Active typing test
  return (
    <View style={styles.typingContainer}>
      <View style={styles.testHeader}>
        <Text style={styles.testHeaderDiff}>{TEST_PROMPTS[selectedTest].difficulty}</Text>
        <Text style={styles.testHeaderChars}>
          {engine.currentIndex}/{testPrompt.length} characters
        </Text>
      </View>
      <View style={styles.promptArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.letterRow}>
          {testPrompt.split('').map((char, i) => (
            <LetterBox
              key={i}
              char={char}
              state={i < engine.currentIndex ? 'correct' : i === engine.currentIndex ? 'active' : 'pending'}
            />
          ))}
        </ScrollView>
      </View>
      <KeyboardView activeKey={testPrompt[engine.currentIndex] || ''} onKeyPress={engine.handleKeyPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#2D3748' },
  subtitle: { fontSize: 16, color: '#718096', marginTop: 4, marginBottom: 20 },
  testGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 700 },
  testCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16, width: '45%', minWidth: 200,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  diffBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 },
  diffText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  testPreview: { fontSize: 14, color: '#718096', lineHeight: 20 },
  typingContainer: {
    flex: 1, backgroundColor: '#F0F4F8', paddingHorizontal: 24,
    justifyContent: 'space-between', paddingTop: 12, paddingBottom: 8,
  },
  testHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  testHeaderDiff: { fontSize: 16, fontWeight: '700', color: '#4A90D9' },
  testHeaderChars: { fontSize: 14, color: '#A0AEC0' },
  promptArea: { flex: 1, justifyContent: 'center' },
  letterRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 12 },
  resultContainer: { flex: 1, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center' },
  resultTitle: { fontSize: 32, fontWeight: '700', color: '#2D3748', marginBottom: 16 },
  resultStats: { flexDirection: 'row', gap: 32, marginTop: 20 },
  resultStatBox: { alignItems: 'center' },
  resultStatValue: { fontSize: 36, fontWeight: '700', color: '#2D3748' },
  resultStatLabel: { fontSize: 14, color: '#A0AEC0', marginTop: 4 },
  resultButtons: { flexDirection: 'row', gap: 12, marginTop: 28 },
  retryBtn: { borderWidth: 2, borderColor: '#4A90D9', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28 },
  retryBtnText: { color: '#4A90D9', fontSize: 16, fontWeight: '600' },
  button: { backgroundColor: '#4A90D9', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
