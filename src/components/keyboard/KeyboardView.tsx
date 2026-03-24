import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { KEYBOARD_ROWS, SPACE_KEY, getFingerForKey, FINGER_COLORS } from '../../data/fingerMap';
import type { Finger } from '../../types';

interface Props {
  activeKey: string;      // The key the student should press next
  onKeyPress: (key: string) => void;
  showFingerGuide?: boolean;
  disabled?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const KEY_SIZE = Math.min((SCREEN_WIDTH - 80) / 12, 56);
const KEY_GAP = 4;

export default function KeyboardView({ activeKey, onKeyPress, showFingerGuide = true, disabled = false }: Props) {
  const activeKeyLower = activeKey.toLowerCase();

  function renderKey(key: string) {
    const finger = getFingerForKey(key);
    const isActive = key === activeKeyLower;
    const fingerColor = FINGER_COLORS[finger];

    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.key,
          { width: KEY_SIZE, height: KEY_SIZE },
          showFingerGuide && { backgroundColor: fingerColor + '30' },
          isActive && styles.activeKey,
          isActive && { backgroundColor: fingerColor, shadowColor: fingerColor },
        ]}
        onPress={() => !disabled && onKeyPress(key)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.keyLabel,
          isActive && styles.activeKeyLabel,
        ]}>
          {key.toUpperCase()}
        </Text>
        {isActive && showFingerGuide && (
          <Text style={styles.fingerHint}>{fingerLabel(finger)}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.row, { marginLeft: rowIndex * (KEY_SIZE * 0.3) }]}>
          {row.map(key => renderKey(key))}
        </View>
      ))}
      {/* Space bar */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.key,
            styles.spaceBar,
            activeKeyLower === ' ' && styles.activeKey,
            activeKeyLower === ' ' && { backgroundColor: FINGER_COLORS.thumb },
          ]}
          onPress={() => !disabled && onKeyPress(' ')}
        >
          <Text style={[styles.keyLabel, activeKeyLower === ' ' && styles.activeKeyLabel]}>SPACE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function fingerLabel(finger: Finger): string {
  const labels: Record<Finger, string> = {
    leftPinky: 'L Pinky',
    leftRing: 'L Ring',
    leftMiddle: 'L Mid',
    leftIndex: 'L Index',
    rightIndex: 'R Index',
    rightMiddle: 'R Mid',
    rightRing: 'R Ring',
    rightPinky: 'R Pinky',
    thumb: 'Thumb',
  };
  return labels[finger];
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 8 },
  row: { flexDirection: 'row', gap: KEY_GAP, marginBottom: KEY_GAP },
  key: {
    borderRadius: 8,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeKey: {
    transform: [{ scale: 1.08 }],
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderColor: 'transparent',
  },
  keyLabel: { fontSize: KEY_SIZE * 0.35, fontWeight: '600', color: '#4A5568' },
  activeKeyLabel: { color: '#FFF', fontWeight: '700' },
  fingerHint: { fontSize: 8, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  spaceBar: {
    width: KEY_SIZE * 5,
    height: KEY_SIZE * 0.7,
    backgroundColor: '#E2E8F0',
  },
});
