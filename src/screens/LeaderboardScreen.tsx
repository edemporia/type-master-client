import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';
import { useDatabase } from '../hooks/useDatabase';
import { getLeaderboard } from '../db/repository';

interface Entry {
  nickname: string;
  avatarConfig: string;
  score: number;
  testId: string;
}

export default function LeaderboardScreen() {
  const { db } = useDatabase();
  const [entries, setEntries] = useState<Entry[]>([]);

  useFocusEffect(useCallback(() => {
    getLeaderboard(db).then(setEntries);
  }, []));

  function getAvatarSvg(configStr: string): string {
    try {
      const config = JSON.parse(configStr);
      return createAvatar(adventurer, { seed: config.seed || 'default', size: 40 }).toString();
    } catch {
      return createAvatar(adventurer, { seed: 'default', size: 40 }).toString();
    }
  }

  function getMedal(index: number): string {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  }

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🏆</Text>
        <Text style={styles.emptyTitle}>No Scores Yet</Text>
        <Text style={styles.emptyDesc}>Complete typing tests to appear on the leaderboard!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>
      <FlatList
        data={entries}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <View style={[styles.row, index < 3 && styles.topRow]}>
            <Text style={styles.rank}>{getMedal(index)}</Text>
            <SvgXml xml={getAvatarSvg(item.avatarConfig)} width={36} height={36} />
            <View style={styles.info}>
              <Text style={styles.nickname}>{item.nickname}</Text>
              <Text style={styles.testId}>{item.testId}</Text>
            </View>
            <Text style={styles.score}>{item.score}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#2D3748', marginBottom: 16 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 14, padding: 14, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  topRow: { borderWidth: 1, borderColor: '#ECC94B' },
  rank: { fontSize: 20, width: 36, textAlign: 'center' },
  info: { flex: 1 },
  nickname: { fontSize: 16, fontWeight: '600', color: '#2D3748' },
  testId: { fontSize: 12, color: '#A0AEC0' },
  score: { fontSize: 22, fontWeight: '700', color: '#4A90D9' },
  empty: { flex: 1, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: '#2D3748', marginTop: 16 },
  emptyDesc: { fontSize: 15, color: '#718096', marginTop: 8, textAlign: 'center', maxWidth: 300 },
});
