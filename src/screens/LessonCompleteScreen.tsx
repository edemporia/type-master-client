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
  const { stars, accuracy, wpm, troubleSpots } = route.params;
  const canContinue = stars >= MIN_STARS_TO_UNLOCK;

  function getMessage(): string {
    if (stars === 5) return 'Perfect!';
    if (stars >= 4) return 'Great Job!';
    if (stars >= 3) return 'Good Work!';
    return 'Keep Practicing!';
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{getMessage()}</Text>
        <StarRating stars={stars} size={48} />

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
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stars}/5</Text>
            <Text style={styles.statLabel}>Stars</Text>
          </View>
        </View>

        {troubleSpots && troubleSpots.length > 0 && (
          <View style={styles.troubleSection}>
            <Text style={styles.troubleTitle}>Trouble Spots</Text>
            <View style={styles.troubleRow}>
              {troubleSpots.map((char, i) => (
                <View key={i} style={styles.troubleChip}>
                  <Text style={styles.troubleChar}>
                    {char === ' ' ? 'SPACE' : char.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.troubleHint}>These letters need more practice</Text>
          </View>
        )}

        {!canContinue && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              You need at least {MIN_STARS_TO_UNLOCK} stars to unlock the next lesson.
            </Text>
          </View>
        )}

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Try Again</Text>
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
    backgroundColor: '#FFF', borderRadius: 24, padding: 36, alignItems: 'center',
    minWidth: 420, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 6,
  },
  title: { fontSize: 32, fontWeight: '700', color: '#2D3748', marginBottom: 16 },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 20 },
  stat: { alignItems: 'center', minWidth: 70 },
  statValue: { fontSize: 32, fontWeight: '700', color: '#2D3748' },
  statLabel: { fontSize: 13, color: '#A0AEC0', marginTop: 4 },
  divider: { width: 1, height: 40, backgroundColor: '#E2E8F0' },
  troubleSection: { marginTop: 24, alignItems: 'center', width: '100%' },
  troubleTitle: { fontSize: 14, fontWeight: '600', color: '#E86C5F', marginBottom: 8 },
  troubleRow: { flexDirection: 'row', gap: 8 },
  troubleChip: { backgroundColor: '#FED7D7', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 },
  troubleChar: { fontSize: 16, fontWeight: '700', color: '#C53030' },
  troubleHint: { fontSize: 12, color: '#A0AEC0', marginTop: 6 },
  warningBox: {
    backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12, marginTop: 20,
    borderWidth: 1, borderColor: '#F6E05E',
  },
  warningText: { fontSize: 14, color: '#975A16', textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  retryButton: { borderWidth: 2, borderColor: '#4A90D9', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  retryText: { color: '#4A90D9', fontSize: 16, fontWeight: '600' },
  continueButton: { backgroundColor: '#48BB78', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  continueText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
