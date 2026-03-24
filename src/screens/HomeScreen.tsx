import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDatabase } from '../hooks/useDatabase';
import type { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const { user } = useDatabase();
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hey, {user?.nickname || 'Typist'}!</Text>
      <Text style={styles.subtitle}>What do you want to do today?</Text>

      <View style={styles.grid}>
        <TouchableOpacity style={[styles.card, { backgroundColor: '#4A90D9' }]} onPress={() => navigation.navigate('Tabs', { screen: 'Campaign' } as any)}>
          <Text style={styles.cardIcon}>📚</Text>
          <Text style={styles.cardTitle}>Campaign</Text>
          <Text style={styles.cardDesc}>Continue learning</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: '#E86C5F' }]} onPress={() => navigation.navigate('Tabs', { screen: 'Games' } as any)}>
          <Text style={styles.cardIcon}>🎮</Text>
          <Text style={styles.cardTitle}>Mini-Games</Text>
          <Text style={styles.cardDesc}>Practice typing skills</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: '#5CB85C' }]} onPress={() => navigation.navigate('TypingTest')}>
          <Text style={styles.cardIcon}>⏱️</Text>
          <Text style={styles.cardTitle}>Typing Test</Text>
          <Text style={styles.cardDesc}>Test your speed</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: '#9B59B6' }]} onPress={() => navigation.navigate('Multiplayer')}>
          <Text style={styles.cardIcon}>👥</Text>
          <Text style={styles.cardTitle}>Multiplayer</Text>
          <Text style={styles.cardDesc}>Challenge a friend</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 24 },
  greeting: { fontSize: 32, fontWeight: '700', color: '#2D3748' },
  subtitle: { fontSize: 18, color: '#718096', marginTop: 4, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    width: '48%', borderRadius: 16, padding: 20, minHeight: 140,
    justifyContent: 'center',
  },
  cardIcon: { fontSize: 36, marginBottom: 8 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  cardDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
});
