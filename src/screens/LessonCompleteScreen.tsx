import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import StarRating from '../components/StarRating';
import { MIN_STARS_TO_UNLOCK } from '../utils/scoring';
import type { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LessonCompleteScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'LessonComplete'>>();
  const { stars, accuracy, wpm } = route.params;
  const canContinue = stars >= MIN_STARS_TO_UNLOCK;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{canContinue ? 'Great Job!' : 'Keep Practicing!'}</Text>

        <StarRating stars={stars} size={44} />

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{wpm}</Text>
            <Text style={styles.statLabel}>WPM</Text>
          </View>
        </View>

        {!canContinue && (
          <Text style={styles.hint}>You need {MIN_STARS_TO_UNLOCK} stars to unlock the next lesson. Try again!</Text>
        )}

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          {canContinue && (
            <TouchableOpacity style={styles.continueButton} onPress={() => navigation.popToTop()}>
              <Text style={styles.continueText}>Continue</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 40, alignItems: 'center',
    minWidth: 400, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 6,
  },
  title: { fontSize: 32, fontWeight: '700', color: '#2D3748', marginBottom: 20 },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: 28, gap: 24 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 36, fontWeight: '700', color: '#2D3748' },
  statLabel: { fontSize: 14, color: '#A0AEC0', marginTop: 4 },
  divider: { width: 1, height: 40, backgroundColor: '#E2E8F0' },
  hint: { fontSize: 14, color: '#E86C5F', textAlign: 'center', marginTop: 20, maxWidth: 300 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 28 },
  retryButton: { borderWidth: 2, borderColor: '#4A90D9', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  retryText: { color: '#4A90D9', fontSize: 16, fontWeight: '600' },
  continueButton: { backgroundColor: '#4A90D9', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  continueText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
