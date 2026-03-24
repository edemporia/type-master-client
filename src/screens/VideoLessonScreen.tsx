import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useDatabase } from '../hooks/useDatabase';
import { getLesson, saveProgress } from '../db/repository';
import type { Lesson, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function VideoLessonScreen() {
  const { db, user } = useDatabase();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'VideoLesson'>>();
  const [lesson, setLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    getLesson(db, route.params.lessonId).then(setLesson);
  }, []);

  async function handleComplete() {
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

  return (
    <View style={styles.container}>
      <View style={styles.videoPlaceholder}>
        {/* TODO: Replace with expo-av Video player when video assets are bundled */}
        <Text style={styles.placeholderIcon}>🎬</Text>
        <Text style={styles.placeholderText}>{lesson?.title || 'Loading...'}</Text>
        <Text style={styles.placeholderNote}>Video content will be bundled with the app</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleComplete}>
        <Text style={styles.buttonText}>Mark as Watched</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A202C', justifyContent: 'center', alignItems: 'center', padding: 24 },
  videoPlaceholder: {
    width: '80%', aspectRatio: 16 / 9, backgroundColor: '#2D3748',
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  placeholderIcon: { fontSize: 64 },
  placeholderText: { fontSize: 20, color: '#FFF', fontWeight: '600', marginTop: 12 },
  placeholderNote: { fontSize: 13, color: '#A0AEC0', marginTop: 8 },
  button: { backgroundColor: '#4A90D9', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, marginTop: 32 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
