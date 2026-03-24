import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';
import { useDatabase } from '../hooks/useDatabase';

export default function ProfileScreen() {
  const { user } = useDatabase();

  if (!user) return null;

  const config = JSON.parse(user.avatarConfig);
  const avatarSvg = createAvatar(adventurer, { seed: config.seed || 'Felix', size: 120 }).toString();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <SvgXml xml={avatarSvg} width={120} height={120} />
        <Text style={styles.nickname}>{user.nickname}</Text>
        <Text style={styles.fullName}>{user.fullName}</Text>
        <View style={styles.info}>
          <View style={styles.infoPill}>
            <Text style={styles.infoLabel}>Age</Text>
            <Text style={styles.infoValue}>{user.age}</Text>
          </View>
          {user.school && (
            <View style={styles.infoPill}>
              <Text style={styles.infoLabel}>School</Text>
              <Text style={styles.infoValue}>{user.school}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 24, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 32, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4, minWidth: 320,
  },
  nickname: { fontSize: 28, fontWeight: '700', color: '#2D3748', marginTop: 16 },
  fullName: { fontSize: 16, color: '#718096', marginTop: 4 },
  info: { flexDirection: 'row', gap: 12, marginTop: 20 },
  infoPill: { backgroundColor: '#EDF2F7', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' },
  infoLabel: { fontSize: 11, color: '#A0AEC0', fontWeight: '600' },
  infoValue: { fontSize: 16, color: '#2D3748', fontWeight: '600', marginTop: 2 },
});
