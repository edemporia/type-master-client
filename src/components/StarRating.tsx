import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  stars: number;
  max?: number;
  size?: number;
}

export default function StarRating({ stars, max = 5, size = 28 }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: max }, (_, i) => (
        <Text key={i} style={[styles.star, { fontSize: size }]}>
          {i < stars ? '★' : '☆'}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 4 },
  star: { color: '#ECC94B' },
});
