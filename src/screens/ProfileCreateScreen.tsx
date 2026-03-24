import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useDatabase } from '../hooks/useDatabase';
import { createUser, getUser } from '../db/repository';
import { SvgXml } from 'react-native-svg';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

const AVATAR_SEEDS = ['Felix', 'Luna', 'Max', 'Bella', 'Leo', 'Coco', 'Milo', 'Zara', 'Rocky', 'Daisy', 'Buddy', 'Nala'];

function generateAvatar(seed: string, size: number): string {
  return createAvatar(adventurer, { seed, size }).toString();
}

export default function ProfileCreateScreen() {
  const { db, setUser } = useDatabase();
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [school, setSchool] = useState('');
  const [selectedSeed, setSelectedSeed] = useState(AVATAR_SEEDS[0]);

  // Pre-generate all avatar SVGs once — not on every render
  const avatarSvgs = useMemo(() => {
    const map: Record<string, string> = {};
    for (const seed of AVATAR_SEEDS) {
      map[seed] = generateAvatar(seed, 80);
    }
    return map;
  }, []);

  const selectedAvatarLarge = useMemo(() => generateAvatar(selectedSeed, 120), [selectedSeed]);

  async function handleCreate() {
    if (!fullName.trim() || !nickname.trim() || !age.trim()) return;
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 3 || ageNum > 18) return;

    const id = await createUser(db, {
      fullName: fullName.trim(),
      nickname: nickname.trim(),
      avatarConfig: JSON.stringify({ style: 'adventurer', seed: selectedSeed }),
      age: ageNum,
      school: school.trim() || null,
    });

    const newUser = await getUser(db, id);
    if (newUser) setUser(newUser);
  }

  const isValid = fullName.trim() && nickname.trim() && age.trim() && !isNaN(parseInt(age, 10));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Your Profile</Text>
      <Text style={styles.subtitle}>Tell us about yourself to get started!</Text>

      {/* Selected avatar preview */}
      <View style={styles.selectedAvatar}>
        <SvgXml xml={selectedAvatarLarge} width={100} height={100} />
      </View>

      {/* Avatar selection row */}
      <Text style={styles.label}>Choose Your Avatar</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarRow}>
        {AVATAR_SEEDS.map(seed => (
          <TouchableOpacity
            key={seed}
            style={[styles.avatarOption, selectedSeed === seed && styles.avatarSelected]}
            onPress={() => setSelectedSeed(seed)}
          >
            <SvgXml xml={avatarSvgs[seed]} width={56} height={56} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Enter your full name" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Nickname *</Text>
            <TextInput style={styles.input} value={nickname} onChangeText={setNickname} placeholder="What should we call you?" />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Age *</Text>
            <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="How old are you?" keyboardType="number-pad" maxLength={2} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>School (optional)</Text>
            <TextInput style={styles.input} value={school} onChangeText={setSchool} placeholder="Your school name" />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, !isValid && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={!isValid}
      >
        <Text style={styles.buttonText}>Start Typing!</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F0F4F8', padding: 32, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: '#2D3748', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#718096', marginBottom: 16 },
  selectedAvatar: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 4 },
  avatarRow: { marginVertical: 8, maxHeight: 80 },
  avatarOption: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFF',
    marginHorizontal: 5, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'transparent',
  },
  avatarSelected: { borderColor: '#4A90D9' },
  form: { width: '100%', maxWidth: 600, marginTop: 16 },
  row: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  field: { flex: 1 },
  input: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 14,
    fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0',
  },
  button: {
    backgroundColor: '#4A90D9', borderRadius: 12, paddingVertical: 16,
    paddingHorizontal: 48, marginTop: 20,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
});
