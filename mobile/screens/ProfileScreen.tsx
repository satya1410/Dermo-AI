import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:3000';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({ age: '', sex: '', height: '', weight: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.profile) {
        setProfile({
          age: data.profile.age?.toString() || '',
          sex: data.profile.sex || '',
          height: data.profile.height?.toString() || '',
          weight: data.profile.weight?.toString() || '',
        });
      }
    } catch (e) {} finally { setLoading(false); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          age: profile.age ? parseInt(profile.age) : null,
          sex: profile.sex,
          height: profile.height ? parseFloat(profile.height) : null,
          weight: profile.weight ? parseFloat(profile.weight) : null,
        }),
      });
      if (response.ok) {
        Alert.alert('Saved', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error');
    } finally { setSaving(false); }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    navigation.navigate('Login');
  };

  const bmi = profile.height && profile.weight
    ? (parseFloat(profile.weight) / Math.pow(parseFloat(profile.height) / 100, 2)).toFixed(1)
    : null;

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.gradient}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator color="#3b82f6" size="large" style={{ marginTop: 60 }} />
            ) : (
              <>
                {/* Avatar */}
                <View style={styles.avatarSection}>
                  <LinearGradient colors={['#3b82f6', '#6366f1']} style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
                  </LinearGradient>
                  <Text style={styles.userName}>{user?.name || 'User'}</Text>
                  <Text style={styles.userEmail}>{user?.email}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: user?.role === 'doctor' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)' }]}>
                    <Text style={[styles.roleText, { color: user?.role === 'doctor' ? '#a78bfa' : '#60a5fa' }]}>
                      {user?.role === 'doctor' ? '🩺 Doctor' : '👤 Patient'}
                    </Text>
                  </View>
                </View>

                {/* BMI Card */}
                {bmi && (
                  <LinearGradient colors={['rgba(59,130,246,0.15)', 'rgba(99,102,241,0.1)']} style={styles.bmiCard}>
                    <Text style={styles.bmiLabel}>Your BMI</Text>
                    <Text style={styles.bmiValue}>{bmi}</Text>
                    <Text style={styles.bmiCategory}>
                      {parseFloat(bmi) < 18.5 ? 'Underweight' : parseFloat(bmi) < 25 ? 'Normal weight ✅' : parseFloat(bmi) < 30 ? 'Overweight' : 'Obese'}
                    </Text>
                  </LinearGradient>
                )}

                {/* Health Info */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Health Information</Text>

                  <View style={styles.rowFields}>
                    <View style={styles.halfField}>
                      <Text style={styles.label}>Age</Text>
                      <TextInput style={styles.input} value={profile.age} onChangeText={(v) => setProfile(p => ({ ...p, age: v }))} keyboardType="numeric" placeholder="25" placeholderTextColor="#475569" />
                    </View>
                    <View style={styles.halfField}>
                      <Text style={styles.label}>Sex</Text>
                      <View style={styles.sexRow}>
                        {['Male', 'Female'].map(s => (
                          <TouchableOpacity key={s} style={[styles.sexBtn, profile.sex === s && styles.sexBtnActive]} onPress={() => setProfile(p => ({ ...p, sex: s }))}>
                            <Text style={[styles.sexBtnText, profile.sex === s && styles.sexBtnTextActive]}>{s}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={styles.rowFields}>
                    <View style={styles.halfField}>
                      <Text style={styles.label}>Height (cm)</Text>
                      <TextInput style={styles.input} value={profile.height} onChangeText={(v) => setProfile(p => ({ ...p, height: v }))} keyboardType="numeric" placeholder="170" placeholderTextColor="#475569" />
                    </View>
                    <View style={styles.halfField}>
                      <Text style={styles.label}>Weight (kg)</Text>
                      <TextInput style={styles.input} value={profile.weight} onChangeText={(v) => setProfile(p => ({ ...p, weight: v }))} keyboardType="numeric" placeholder="65" placeholderTextColor="#475569" />
                    </View>
                  </View>

                  <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
                    <LinearGradient colors={['#3b82f6', '#6366f1']} style={styles.saveBtnGrad}>
                      {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                  <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  userName: { color: '#f1f5f9', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  userEmail: { color: '#64748b', fontSize: 14, marginBottom: 10 },
  roleBadge: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 },
  roleText: { fontWeight: '700', fontSize: 13 },
  bmiCard: { borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  bmiLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  bmiValue: { color: '#60a5fa', fontSize: 40, fontWeight: '800' },
  bmiCategory: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  card: { backgroundColor: 'rgba(30,41,59,0.8)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
  cardTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: '700', marginBottom: 20 },
  rowFields: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  halfField: { flex: 1 },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: 'rgba(15,23,42,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#f1f5f9', fontSize: 15 },
  sexRow: { flexDirection: 'row', gap: 8 },
  sexBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(15,23,42,0.6)' },
  sexBtnActive: { backgroundColor: 'rgba(59,130,246,0.2)', borderColor: '#3b82f6' },
  sexBtnText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  sexBtnTextActive: { color: '#60a5fa' },
  saveBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  saveBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  logoutBtn: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  logoutText: { color: '#f87171', fontWeight: '700', fontSize: 15 },
});