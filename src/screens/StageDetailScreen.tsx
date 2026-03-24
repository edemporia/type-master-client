import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useDatabase } from '../hooks/useDatabase';
import { getLessons, getProgress } from '../db/repository';
import { MIN_STARS_TO_UNLOCK } from '../utils/scoring';
import type { Lesson, Progress, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function StageDetailScreen() {
  const { db, user } = useDatabase();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'StageDetail'>>();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, Progress>>({});

  const loadData = useCallback(async () => {
    const lessonData = await getLessons(db, route.params.stageId);
    setLessons(lessonData);
    if (user) {
      const map: Record<number, Progress> = {};
      for (const lesson of lessonData) {
        const p = await getProgress(db, user.id, lesson.id);
        if (p) map[lesson.id] = p;
      }
      setProgressMap(map);
    }
  }, [db, user, route.params.stageId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  function isLessonUnlocked(index: number): boolean {
    if (index === 0) return true;
    const prevLesson = lessons[index - 1];
    const prevProgress = progressMap[prevLesson.id];
    return prevProgress?.completed === true && prevProgress.stars >= MIN_STARS_TO_UNLOCK;
  }

  function navigateToLesson(lesson: Lesson) {
    switch (lesson.type) {
      case 'typing': navigation.navigate('TypingLesson', { lessonId: lesson.id }); break;
      case 'video': navigation.navigate('VideoLesson', { lessonId: lesson.id }); break;
      case 'prompt': navigation.navigate('PromptLesson', { lessonId: lesson.id }); break;
    }
  }

  function renderStars(count: number) {
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={lessons}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const unlocked = isLessonUnlocked(index);
          const progress = progressMap[item.id];
          const typeIcon = item.type === 'video' ? '🎬' : item.type === 'prompt' ? '💡' : '⌨️';

          return (
            <TouchableOpacity
              style={[styles.card, !unlocked && styles.locked]}
              onPress={() => unlocked && navigateToLesson(item)}
              disabled={!unlocked}
            >
              <Text style={styles.icon}>{unlocked ? typeIcon : '🔒'}</Text>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, !unlocked && styles.lockedText]}>{item.title}</Text>
                {progress && (
                  <Text style={styles.stars}>{renderStars(progress.stars)}</Text>
                )}
              </View>
              {progress?.completed && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 24 },
  list: { gap: 10 },
  card: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  locked: { opacity: 0.45 },
  icon: { fontSize: 24, marginRight: 14 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#2D3748' },
  lockedText: { color: '#A0AEC0' },
  stars: { fontSize: 14, color: '#ECC94B', marginTop: 4, letterSpacing: 2 },
  check: { fontSize: 20, color: '#48BB78', fontWeight: '700' },
});
