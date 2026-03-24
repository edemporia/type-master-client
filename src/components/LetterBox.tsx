import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  char: string;
  state: 'pending' | 'active' | 'correct' | 'incorrect';
}

export default function LetterBox({ char, state }: Props) {
  return (
    <View style={[styles.box, stateStyles[state]]}>
      <Text style={[styles.char, state === 'correct' && styles.correctChar, state === 'active' && styles.activeChar]}>
        {char === ' ' ? '␣' : char.toUpperCase()}
      </Text>
    </View>
  );
}

const stateStyles = StyleSheet.create({
  pending: { backgroundColor: '#EDF2F7', borderColor: '#E2E8F0' },
  active: { backgroundColor: '#FFF', borderColor: '#4A90D9', borderWidth: 3 },
  correct: { backgroundColor: '#C6F6D5', borderColor: '#48BB78' },
  incorrect: { backgroundColor: '#FED7D7', borderColor: '#FC8181' },
});

const styles = StyleSheet.create({
  box: {
    width: 48, height: 56, borderRadius: 10, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 3,
  },
  char: { fontSize: 24, fontWeight: '700', color: '#A0AEC0' },
  activeChar: { color: '#2D3748' },
  correctChar: { color: '#276749' },
});
