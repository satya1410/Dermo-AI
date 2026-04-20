import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:3000';

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/analyses`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setAnalyses(data.analyses || []);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (s: string) => s === 'Low' ? '#10b981' : s === 'Moderate' ? '#f59e0b' : '#ef4444';

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.gradient}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis History</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator color="#3b82f6" size="large" style={{ marginTop: 60 }} />
          ) : analyses.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>No analyses yet</Text>
              <Text style={styles.emptyText}>Your past skin analyses will appear here</Text>
              <TouchableOpacity style={styles.ctaBtn} onPress={() => navigation.navigate('Dashboard')}>
                <LinearGradient colors={['#3b82f6', '#6366f1']} style={styles.ctaBtnGrad}>
                  <Text style={styles.ctaBtnText}>Start Analysis</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            analyses.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: item.classification === 'benign' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
                    <Text style={[styles.badgeText, { color: item.classification === 'benign' ? '#10b981' : '#ef4444' }]}>
                      {item.classification === 'benign' ? '✅ Benign' : '⚠️ Malignant'}
                    </Text>
                  </View>
                  {item.severity && (
                    <Text style={[styles.severity, { color: getSeverityColor(item.severity) }]}>
                      {item.severity}
                    </Text>
                  )}
                </View>

                {item.condition_name && (
                  <Text style={styles.conditionName}>{item.condition_name}</Text>
                )}

                <View style={styles.metaRow}>
                  {item.confidence && (
                    <Text style={styles.meta}>🎯 {(item.confidence * 100).toFixed(1)}% confidence</Text>
                  )}
                  <Text style={styles.meta}>
                    📅 {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  backBtn: { padding: 8 },
  backText: { color: '#60a5fa', fontSize: 15, fontWeight: '600' },
  headerTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { color: '#f1f5f9', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: '#64748b', fontSize: 14, marginBottom: 24 },
  ctaBtn: { borderRadius: 14, overflow: 'hidden' },
  ctaBtnGrad: { paddingHorizontal: 32, paddingVertical: 14 },
  ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  card: { backgroundColor: 'rgba(30,41,59,0.8)', borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' },
  badge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontWeight: '700', fontSize: 13 },
  severity: { fontSize: 13, fontWeight: '600' },
  conditionName: { color: '#f1f5f9', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  meta: { color: '#64748b', fontSize: 12 },
});