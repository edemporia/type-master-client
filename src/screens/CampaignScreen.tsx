import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDatabase } from '../hooks/useDatabase';
import { getCampaigns } from '../db/repository';
import type { Campaign, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CampaignScreen() {
  const { db } = useDatabase();
  const navigation = useNavigation<Nav>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    getCampaigns(db).then(setCampaigns);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Campaigns</Text>
      <FlatList
        data={campaigns}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('CampaignDetail', { campaignId: item.id })}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
              <Text style={styles.cardMeta}>{item.totalStages} stages</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#2D3748', marginBottom: 16 },
  list: { gap: 12 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: '#2D3748' },
  cardDesc: { fontSize: 14, color: '#718096', marginTop: 4 },
  cardMeta: { fontSize: 12, color: '#A0AEC0', marginTop: 8 },
  arrow: { fontSize: 28, color: '#CBD5E0', fontWeight: '300' },
});
