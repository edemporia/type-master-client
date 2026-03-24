import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MultiplayerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>👥</Text>
      <Text style={styles.title}>Bluetooth Multiplayer</Text>
      <Text style={styles.subtitle}>Coming soon!</Text>
      <Text style={styles.description}>
        Challenge your friends to a head-to-head typing battle via Bluetooth.
        Both players will need TypeKids installed on their tablets.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center', padding: 32 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#2D3748' },
  subtitle: { fontSize: 18, color: '#4A90D9', fontWeight: '600', marginTop: 8 },
  description: { fontSize: 15, color: '#718096', textAlign: 'center', marginTop: 16, maxWidth: 400, lineHeight: 22 },
});
