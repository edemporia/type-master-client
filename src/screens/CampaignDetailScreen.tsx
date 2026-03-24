import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useDatabase } from '../hooks/useDatabase';
import { getStages, isStageCompleted, getStageCompletionStats } from '../db/repository';
import type { Stage, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface StageWithStatus extends Stage {
  unlocked: boolean;
  completed: number;
  avgStars: number;
}

export default function CampaignDetailScreen() {
  const { db, user } = useDatabase();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'CampaignDetail'>>();
  const [stages, setStages] = useState<StageWithStatus[]>([]);

  useFocusEffect(useCallback(() => {
    loadData();
  }, []));

  async function loadData() {
    const stageData = await getStages(db, route.params.campaignId);
    if (!user) {
      setStages(stageData.map(s => ({ ...s, unlocked: false, completed: 0, avgStars: 0 })));
      return;
    }

    const enriched: StageWithStatus[] = [];
    for (let i = 0; i < stageData.length; i++) {
      const stage = stageData[i];
      const stats = await getStageCompletionStats(db, user.id, stage.id);

      // Stage 0 is always unlocked. Others require the previous stage to be fully completed.
      let unlocked = i === 0;
      if (i > 0) {
        unlocked = await isStageCompleted(db, user.id, stageData[i - 1].id);
      }

      enriched.push({
        ...stage,
        unlocked,
        completed: stats.completed,
        avgStars: stats.avgStars,
      });
    }
    setStages(enriched);
  }

  function renderStars(avg: number): string {
    if (avg === 0) return '';
    const full = Math.floor(avg);
    return '★'.repeat(full) + (avg % 1 >= 0.5 ? '½' : '') + ' ' + avg.toFixed(1);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={stages}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.card, !item.unlocked && styles.locked]}
            onPress={() => item.unlocked && navigation.navigate('StageDetail', { stageId: item.id })}
            disabled={!item.unlocked}
          >
            <View style={[styles.stageNumber, !item.unlocked && styles.stageNumberLocked]}>
              <Text style={styles.stageNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, !item.unlocked && styles.lockedText]}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>
                  {item.completed}/{item.totalLessons} lessons
                </Text>
                {item.avgStars > 0 && (
                  <Text style={styles.starsText}>{renderStars(item.avgStars)}</Text>
                )}
              </View>
            </View>
            {!item.unlocked ? (
              <Text style={styles.lockIcon}>🔒</Text>
            ) : item.completed === item.totalLessons && item.totalLessons > 0 ? (
              <Text style={styles.checkIcon}>✅</Text>
            ) : null}
          </TouchableOpacity>
        )}
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
  locked: { opacity: 0.45 },
  stageNumber: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#4A90D9',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  stageNumberLocked: { backgroundColor: '#CBD5E0' },
  stageNumberText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#2D3748' },
  lockedText: { color: '#A0AEC0' },
  cardDesc: { fontSize: 13, color: '#718096', marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 12 },
  cardMeta: { fontSize: 12, color: '#A0AEC0' },
  starsText: { fontSize: 12, color: '#ECC94B' },
  lockIcon: { fontSize: 20 },
  checkIcon: { fontSize: 18 },
});
