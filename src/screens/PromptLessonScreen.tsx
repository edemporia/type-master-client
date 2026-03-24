import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useDatabase } from '../hooks/useDatabase';
import { getLesson, saveProgress } from '../db/repository';
import type { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PromptLessonScreen() {
  const { db, user } = useDatabase();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'PromptLesson'>>();
  const [content, setContent] = useState<{ text: string; buttonText: string } | null>(null);

  useEffect(() => {
    (async () => {
      const lesson = await getLesson(db, route.params.lessonId);
      if (lesson) setContent(JSON.parse(lesson.contentRef));
    })();
  }, []);

  async function handleContinue() {
    if (!user) return;
    await saveProgress(db, {
      userId: user.id,
      lessonId: route.params.lessonId,
      completed: true,
      stars: 5,
      accuracy: 100,
      wpm: 0,
    });
    navigation.goBack();
  }

  if (!content) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>💡</Text>
        <Text style={styles.text}>{content.text}</Text>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>{content.buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  card: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 40, alignItems: 'center',
    maxWidth: 500, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  text: { fontSize: 18, color: '#2D3748', textAlign: 'center', lineHeight: 28 },
  button: { backgroundColor: '#4A90D9', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, marginTop: 28 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
