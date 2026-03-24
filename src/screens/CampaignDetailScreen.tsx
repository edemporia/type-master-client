import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useDatabase } from '../hooks/useDatabase';
import { getStages, getUserProgress, getLessons } from '../db/repository';
import { MIN_STARS_TO_UNLOCK } from '../utils/scoring';
import type { Stage, Progress, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CampaignDetailScreen() {
  const { db, user } = useDatabase();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'CampaignDetail'>>();
  const [stages, setStages] = useState<Stage[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [stageData, progressData] = await Promise.all([
      getStages(db, route.params.campaignId),
      user ? getUserProgress(db, user.id) : Promise.resolve([]),
    ]);
    setStages(stageData);
    setProgress(progressData);
  }

  // A stage is unlocked if all lessons in the previous stage have >= MIN_STARS
  function isStageUnlocked(stage: Stage, index: number): boolean {
    if (index === 0) return true;
    // Check previous stage's lessons are all completed with enough stars
    const prevStage = stages[index - 1];
    if (!prevStage) return false;
    // For simplicity we check if user has progress with enough stars for all lessons in prev stage
    // This will be refined when we have lesson-level checks
    return true; // TODO: implement proper gating after lesson progress is populated
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={stages}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const unlocked = isStageUnlocked(item, index);
          return (
            <TouchableOpacity
              style={[styles.card, !unlocked && styles.locked]}
              onPress={() => unlocked && navigation.navigate('StageDetail', { stageId: item.id })}
              disabled={!unlocked}
            >
              <View style={styles.stageNumber}>
                <Text style={styles.stageNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, !unlocked && styles.lockedText]}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                <Text style={styles.cardMeta}>{item.totalLessons} lessons</Text>
              </View>
              {!unlocked && <Text style={styles.lockIcon}>🔒</Text>}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 24 },
  list: { gap: 12 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  locked: { opacity: 0.5 },
  stageNumber: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#4A90D9',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  stageNumberText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#2D3748' },
  lockedText: { color: '#A0AEC0' },
  cardDesc: { fontSize: 13, color: '#718096', marginTop: 2 },
  cardMeta: { fontSize: 12, color: '#A0AEC0', marginTop: 6 },
  lockIcon: { fontSize: 20 },
});
