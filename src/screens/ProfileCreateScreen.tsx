import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useDatabase } from '../hooks/useDatabase';
import { createUser, getUser } from '../db/repository';
import { SvgXml } from 'react-native-svg';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

const AVATAR_SEEDS = ['Felix', 'Luna', 'Max', 'Bella', 'Leo', 'Coco', 'Milo', 'Zara', 'Rocky', 'Daisy', 'Buddy', 'Nala'];

export default function ProfileCreateScreen() {
  const { db, setUser } = useDatabase();
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [school, setSchool] = useState('');
  const [selectedSeed, setSelectedSeed] = useState(AVATAR_SEEDS[0]);

  function generateAvatar(seed: string): string {
    const avatar = createAvatar(adventurer, { seed, size: 80 });
    return avatar.toString();
  }

  async function handleCreate() {
    if (!fullName.trim() || !nickname.trim() || !age.trim()) return;

    const id = await createUser(db, {
      fullName: fullName.trim(),
      nickname: nickname.trim(),
      avatarConfig: JSON.stringify({ style: 'adventurer', seed: selectedSeed }),
      age: parseInt(age, 10),
      school: school.trim() || null,
    });

    const newUser = await getUser(db, id);
    if (newUser) setUser(newUser);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Your Profile</Text>
      <Text style={styles.subtitle}>Tell us about yourself to get started!</Text>

      {/* Avatar Selection */}
      <Text style={styles.label}>Choose Your Avatar</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarRow}>
        {AVATAR_SEEDS.map(seed => (
          <TouchableOpacity
            key={seed}
            style={[styles.avatarOption, selectedSeed === seed && styles.avatarSelected]}
            onPress={() => setSelectedSeed(seed)}
          >
            <SvgXml xml={generateAvatar(seed)} width={64} height={64} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Form Fields */}
      <Text style={styles.label}>Full Name *</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Enter your full name" />

      <Text style={styles.label}>Nickname *</Text>
      <TextInput style={styles.input} value={nickname} onChangeText={setNickname} placeholder="What should we call you?" />

      <Text style={styles.label}>Age *</Text>
      <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="How old are you?" keyboardType="number-pad" />

      <Text style={styles.label}>School (optional)</Text>
      <TextInput style={styles.input} value={school} onChangeText={setSchool} placeholder="Your school name" />

      <TouchableOpacity
        style={[styles.button, (!fullName.trim() || !nickname.trim() || !age.trim()) && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={!fullName.trim() || !nickname.trim() || !age.trim()}
      >
        <Text style={styles.buttonText}>Start Typing!</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F0F4F8', padding: 32, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: '#2D3748', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#718096', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#4A5568', alignSelf: 'flex-start', marginTop: 12, marginBottom: 4 },
  input: {
    width: '100%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 12,
    padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0',
  },
  avatarRow: { marginVertical: 12 },
  avatarOption: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF',
    marginHorizontal: 6, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'transparent',
  },
  avatarSelected: { borderColor: '#4A90D9' },
  button: {
    backgroundColor: '#4A90D9', borderRadius: 12, paddingVertical: 16,
    paddingHorizontal: 48, marginTop: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
});
