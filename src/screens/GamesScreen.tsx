import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const GAMES = [
  { key: 'MeteorFall' as const, title: 'Meteor Fall', desc: 'Type before meteors crash!', icon: '☄️', color: '#E86C5F' },
  { key: 'Waterfall' as const, title: 'Waterfall', desc: 'Catch falling letters', icon: '💧', color: '#4A90D9' },
  { key: 'BalloonPop' as const, title: 'Balloon Pop', desc: 'Pop balloons by typing', icon: '🎈', color: '#9B59B6' },
];

export default function GamesScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mini-Games</Text>
      <View style={styles.grid}>
        {GAMES.map(game => (
          <TouchableOpacity
            key={game.key}
            style={[styles.card, { backgroundColor: game.color }]}
            onPress={() => navigation.navigate(game.key)}
          >
            <Text style={styles.icon}>{game.icon}</Text>
            <Text style={styles.cardTitle}>{game.title}</Text>
            <Text style={styles.cardDesc}>{game.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#2D3748', marginBottom: 20 },
  grid: { flexDirection: 'row', gap: 16 },
  card: {
    flex: 1, borderRadius: 16, padding: 24, minHeight: 160,
    justifyContent: 'center', alignItems: 'center',
  },
  icon: { fontSize: 48, marginBottom: 12 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  cardDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' },
});
