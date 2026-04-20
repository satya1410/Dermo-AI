import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Image, Alert, ScrollView,
  ActivityIndicator, StyleSheet, Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:3000';

const safe = (val: any): string => {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  return JSON.stringify(val);
};

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
    } catch (e) {}
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please grant gallery permissions.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!res.canceled) { setImage(res.assets[0].uri); setResult(null); }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please grant camera permissions.'); return; }
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!res.canceled) { setImage(res.assets[0].uri); setResult(null); }
  };

  const analyzeImage = async () => {
    if (!image) { Alert.alert('No Image', 'Please select or take a photo first.'); return; }
    setAnalyzing(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) { navigation.navigate('Login'); return; }

      const response = await fetch(image);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const analyzeResponse = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await analyzeResponse.json();
      if (analyzeResponse.ok) {
        const analysis = data.analysis || data;
        // Extract the rich report — it might be nested under report or at root level
        const report = analysis.report || analysis;
        setResult({ ...analysis, ...report });
      } else {
        Alert.alert('Analysis Failed', data.error || 'Failed to analyze image');
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Cannot reach the server. Make sure Next.js is running.');
    } finally {
      setAnalyzing(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    navigation.navigate('Login');
  };

  const getSeverityColor = (s: string) =>
    s === 'Low' ? '#10b981' : s === 'Moderate' ? '#f59e0b' : s === 'High' ? '#f97316' : '#ef4444';

  const getLikelihoodColor = (l: string) =>
    l === 'High' ? '#ef4444' : l === 'Moderate' ? '#f59e0b' : '#10b981';

  const getEffColor = (e: string) =>
    e === 'High' ? '#10b981' : e === 'Moderate' ? '#f59e0b' : '#94a3b8';

  const ReportSection = ({ icon, title, color = '#60a5fa', children }: any) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.gradient}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>🔬 DermoAI</Text>
            <Text style={styles.welcomeText}>Welcome, {user?.name?.split(' ')[0] || 'User'} 👋</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Camera Card */}
          <LinearGradient colors={['rgba(59,130,246,0.15)', 'rgba(99,102,241,0.1)']} style={styles.cameraCard}>
            <Text style={styles.heroTitle}>AI Skin Analysis</Text>
            <Text style={styles.heroSubtitle}>Upload or capture a skin image for instant AI-powered diagnosis with GradCAM insights</Text>

            {!image ? (
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.halfBtn} onPress={takePhoto}>
                  <LinearGradient colors={['#3b82f6', '#6366f1']} style={styles.halfBtnGrad}>
                    <Text style={styles.btnText}>📸 Camera</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.halfBtn} onPress={pickImage}>
                  <View style={styles.halfBtnOutline}>
                    <Text style={styles.btnOutlineText}>🖼️ Gallery</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.imageContainer}>
                  <Image source={{ uri: image }} style={styles.imagePreview} resizeMode="cover" />
                  {analyzing && (
                    <View style={styles.scanOverlay}>
                      <ActivityIndicator color="#3b82f6" size="large" />
                      <Text style={styles.scanText}>🧠 AI Analyzing...</Text>
                    </View>
                  )}
                </View>
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.halfBtn} onPress={() => { setImage(null); setResult(null); }}>
                    <View style={styles.halfBtnOutline}><Text style={styles.btnOutlineText}>✕ Remove</Text></View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.halfBtn} onPress={analyzeImage} disabled={analyzing}>
                    <LinearGradient colors={['#10b981', '#059669']} style={styles.halfBtnGrad}>
                      {analyzing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>🧠 Analyze</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </LinearGradient>

          {/* Rich Report */}
          {result && (
            <View style={styles.reportCard}>
              {/* Classification Banner */}
              <LinearGradient
                colors={result.classification === 'benign' ? ['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.05)'] : ['rgba(239,68,68,0.2)', 'rgba(239,68,68,0.05)']}
                style={styles.classificationBanner}
              >
                <Text style={styles.classificationEmoji}>{result.classification === 'benign' ? '✅' : '⚠️'}</Text>
                <View style={styles.classificationInfo}>
                  <Text style={[styles.classificationText, { color: result.classification === 'benign' ? '#10b981' : '#ef4444' }]}>
                    {safe(result.classification)?.toUpperCase()}
                  </Text>
                  <Text style={styles.conditionName}>{safe(result.condition_name)}</Text>
                </View>
                <View style={styles.confidenceCircle}>
                  <Text style={styles.confidencePct}>
                    {typeof result.confidence === 'number' ? `${(result.confidence * 100).toFixed(0)}%` : safe(result.confidence)}
                  </Text>
                  <Text style={styles.confidenceLabel}>confidence</Text>
                </View>
              </LinearGradient>

              {/* Severity + Area */}
              <View style={styles.badgeRow}>
                {result.severity && (
                  <View style={[styles.metaBadge, { backgroundColor: getSeverityColor(safe(result.severity)) + '22' }]}>
                    <Text style={[styles.metaBadgeText, { color: getSeverityColor(safe(result.severity)) }]}>
                      🔥 {safe(result.severity)} Severity
                    </Text>
                  </View>
                )}
                {result.affected_area && (
                  <View style={[styles.metaBadge, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
                    <Text style={[styles.metaBadgeText, { color: '#a78bfa' }]}>📍 {safe(result.affected_area)}</Text>
                  </View>
                )}
              </View>

              {/* Summary */}
              {result.summary && (
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryText}>{safe(result.summary)}</Text>
                </View>
              )}

              {/* GradCAM Region */}
              {result.gradcam_region && (
                <ReportSection icon="🔍" title="AI Visual Analysis (GradCAM)" color="#a78bfa">
                  <View style={styles.gradcamBox}>
                    {image && <Image source={{ uri: image }} style={styles.gradcamThumb} resizeMode="cover" />}
                    <View style={styles.gradcamText}>
                      <Text style={styles.gradcamLabel}>Region of Concern:</Text>
                      <Text style={styles.gradcamDesc}>{safe(result.gradcam_region)}</Text>
                    </View>
                  </View>
                </ReportSection>
              )}

              {/* Likelihood of Occurrence */}
              {result.likelihood_of_occurrence && typeof result.likelihood_of_occurrence === 'object' && (
                <ReportSection icon="📊" title="Likelihood of Occurrence" color="#f59e0b">
                  <View style={styles.likelihoodGrid}>
                    {[
                      ['👥 General Population', result.likelihood_of_occurrence.general_population],
                      ['🎂 Your Age Group', result.likelihood_of_occurrence.your_age_group],
                      ['🚻 Your Sex', result.likelihood_of_occurrence.your_sex],
                    ].map(([label, val]) => val ? (
                      <View key={label as string} style={styles.likelihoodItem}>
                        <Text style={styles.likelihoodLabel}>{label as string}</Text>
                        <Text style={styles.likelihoodVal}>{safe(val)}</Text>
                      </View>
                    ) : null)}
                  </View>
                  {result.likelihood_of_occurrence.overall_risk_level && (
                    <View style={[styles.riskLevel, { backgroundColor: getLikelihoodColor(safe(result.likelihood_of_occurrence.overall_risk_level)) + '22' }]}>
                      <Text style={[styles.riskLevelText, { color: getLikelihoodColor(safe(result.likelihood_of_occurrence.overall_risk_level)) }]}>
                        Overall Risk: {safe(result.likelihood_of_occurrence.overall_risk_level)}
                      </Text>
                    </View>
                  )}
                </ReportSection>
              )}

              {/* Clinical Description */}
              {result.description && (
                <ReportSection icon="🏥" title="Clinical Description">
                  <Text style={styles.bodyText}>{safe(result.description)}</Text>
                </ReportSection>
              )}

              {/* Differential Diagnosis */}
              {Array.isArray(result.differential_diagnosis) && result.differential_diagnosis.length > 0 && (
                <ReportSection icon="🧬" title="Differential Diagnosis" color="#c084fc">
                  {result.differential_diagnosis.map((d: any, i: number) => (
                    <View key={i} style={styles.diffItem}>
                      <View style={styles.diffHeader}>
                        <Text style={styles.diffCondition}>{safe(d.condition)}</Text>
                        <View style={[styles.diffBadge, { backgroundColor: getLikelihoodColor(safe(d.likelihood)) + '22' }]}>
                          <Text style={[styles.diffBadgeText, { color: getLikelihoodColor(safe(d.likelihood)) }]}>{safe(d.likelihood)}</Text>
                        </View>
                      </View>
                      {d.distinguishing_factor && <Text style={styles.diffFactor}>↳ {safe(d.distinguishing_factor)}</Text>}
                    </View>
                  ))}
                </ReportSection>
              )}

              {/* Home Remedies */}
              {Array.isArray(result.home_remedies) && result.home_remedies.length > 0 && (
                <ReportSection icon="🌿" title="Home Remedies" color="#10b981">
                  {result.home_remedies.map((r: any, i: number) => (
                    <View key={i} style={styles.remedyCard}>
                      <View style={styles.remedyHeader}>
                        <Text style={styles.remedyName}>{safe(typeof r === 'object' ? r.remedy : r)}</Text>
                        {r.effectiveness && (
                          <View style={[styles.effBadge, { backgroundColor: getEffColor(safe(r.effectiveness)) + '22' }]}>
                            <Text style={[styles.effText, { color: getEffColor(safe(r.effectiveness)) }]}>
                              {safe(r.effectiveness)} Effect
                            </Text>
                          </View>
                        )}
                      </View>
                      {r.instructions && <Text style={styles.remedyInstructions}>{safe(r.instructions)}</Text>}
                      {r.frequency && <Text style={styles.remedyMeta}>🕐 {safe(r.frequency)}</Text>}
                      {r.caution && (
                        <View style={styles.cautionBox}>
                          <Text style={styles.cautionText}>⚠️ {safe(r.caution)}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </ReportSection>
              )}

              {/* Treatments Available */}
              {Array.isArray(result.treatments_available) && result.treatments_available.length > 0 && (
                <ReportSection icon="💊" title="Medical Treatments Available" color="#60a5fa">
                  {result.treatments_available.map((t: any, i: number) => (
                    <View key={i} style={styles.treatmentItem}>
                      <View style={styles.treatmentHeader}>
                        <Text style={styles.treatmentName}>{safe(typeof t === 'object' ? t.treatment : t)}</Text>
                        {t.type && <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>{safe(t.type)}</Text></View>}
                      </View>
                      {t.description && <Text style={styles.treatmentDesc}>{safe(t.description)}</Text>}
                    </View>
                  ))}
                </ReportSection>
              )}

              {/* Prognosis */}
              {result.prognosis && (
                <ReportSection icon="📈" title="Prognosis" color="#34d399">
                  <Text style={styles.bodyText}>{safe(result.prognosis)}</Text>
                </ReportSection>
              )}

              {/* Possible Causes */}
              {Array.isArray(result.possible_causes) && result.possible_causes.length > 0 && (
                <ReportSection icon="🔬" title="Possible Causes">
                  {result.possible_causes.map((c: any, i: number) => (
                    <Text key={i} style={styles.listItem}>• {safe(c)}</Text>
                  ))}
                </ReportSection>
              )}

              {/* Symptoms to Watch */}
              {Array.isArray(result.symptoms_to_watch) && result.symptoms_to_watch.length > 0 && (
                <ReportSection icon="👁️" title="Symptoms to Watch" color="#f87171">
                  {result.symptoms_to_watch.map((s: any, i: number) => (
                    <Text key={i} style={styles.listItem}>• {safe(s)}</Text>
                  ))}
                </ReportSection>
              )}

              {/* When to See Doctor / Emergency */}
              {(result.when_to_seek_emergency || result.when_to_see_doctor) && (
                <ReportSection icon="🚨" title="Medical Urgency" color="#ef4444">
                  {result.when_to_seek_emergency && (
                    <View style={styles.urgentBox}>
                      <Text style={styles.urgentLabel}>🚑 Emergency Signs:</Text>
                      <Text style={styles.urgentText}>{safe(result.when_to_seek_emergency)}</Text>
                    </View>
                  )}
                  {result.when_to_see_doctor && (
                    <Text style={styles.bodyText}>{safe(result.when_to_see_doctor)}</Text>
                  )}
                </ReportSection>
              )}

              {/* Prevention + Lifestyle */}
              {(Array.isArray(result.prevention_tips) || result.lifestyle_advice) && (
                <ReportSection icon="🛡️" title="Prevention & Lifestyle" color="#22d3ee">
                  {result.lifestyle_advice && <Text style={[styles.bodyText, { marginBottom: 10 }]}>{safe(result.lifestyle_advice)}</Text>}
                  {Array.isArray(result.prevention_tips) && result.prevention_tips.map((p: any, i: number) => (
                    <Text key={i} style={styles.listItem}>• {safe(p)}</Text>
                  ))}
                </ReportSection>
              )}

              {/* Dietary Recommendations */}
              {Array.isArray(result.dietary_recommendations) && result.dietary_recommendations.length > 0 && (
                <ReportSection icon="🥗" title="Dietary Recommendations" color="#86efac">
                  {result.dietary_recommendations.map((d: any, i: number) => (
                    <Text key={i} style={styles.listItem}>• {safe(d)}</Text>
                  ))}
                </ReportSection>
              )}

              {/* Disclaimer */}
              <View style={styles.disclaimer}>
                <Text style={styles.disclaimerText}>
                  ⚠️ This AI analysis is for informational purposes only. Always consult a qualified dermatologist for medical advice and treatment.
                </Text>
              </View>
            </View>
          )}

          {/* Nav Grid */}
          <View style={styles.navGrid}>
            {[
              { icon: '📊', label: 'History', screen: 'History' },
              { icon: '👨‍⚕️', label: 'Doctors', screen: 'Doctors' },
              { icon: '🔔', label: 'Alerts', screen: 'Notifications' },
              { icon: '👤', label: 'Profile', screen: 'Profile' },
            ].map(({ icon, label, screen }) => (
              <TouchableOpacity key={screen} style={styles.navCard} onPress={() => navigation.navigate(screen)}>
                <Text style={styles.navIcon}>{icon}</Text>
                <Text style={styles.navLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  logoText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  welcomeText: { color: '#64748b', fontSize: 13, marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  logoutText: { color: '#f87171', fontSize: 13, fontWeight: '600' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  cameraCard: { borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
  heroTitle: { color: '#f1f5f9', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  heroSubtitle: { color: '#94a3b8', fontSize: 13, lineHeight: 19, marginBottom: 18 },
  btnRow: { flexDirection: 'row', gap: 10 },
  halfBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  halfBtnGrad: { paddingVertical: 13, alignItems: 'center' },
  halfBtnOutline: { paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnOutlineText: { color: '#94a3b8', fontWeight: '600', fontSize: 14 },
  imageContainer: { position: 'relative', marginBottom: 12 },
  imagePreview: { width: '100%', height: width * 0.55, borderRadius: 16 },
  scanOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.7)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 12 },
  scanText: { color: '#60a5fa', fontWeight: '700', fontSize: 15 },
  reportCard: { backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 16 },
  classificationBanner: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 14 },
  classificationEmoji: { fontSize: 32 },
  classificationInfo: { flex: 1 },
  classificationText: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  conditionName: { color: '#f1f5f9', fontSize: 17, fontWeight: '700', marginTop: 2 },
  confidenceCircle: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10 },
  confidencePct: { color: '#60a5fa', fontSize: 18, fontWeight: '800' },
  confidenceLabel: { color: '#64748b', fontSize: 10 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingBottom: 16 },
  metaBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  metaBadgeText: { fontSize: 12, fontWeight: '600' },
  summaryBox: { marginHorizontal: 20, marginBottom: 8, backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: '#6366f1' },
  summaryText: { color: '#c7d2fe', fontSize: 14, lineHeight: 21 },
  section: { paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  bodyText: { color: '#94a3b8', fontSize: 14, lineHeight: 22 },
  listItem: { color: '#94a3b8', fontSize: 14, lineHeight: 24, paddingLeft: 4 },
  gradcamBox: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  gradcamThumb: { width: 80, height: 80, borderRadius: 10 },
  gradcamText: { flex: 1 },
  gradcamLabel: { color: '#a78bfa', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  gradcamDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 20 },
  likelihoodGrid: { gap: 8, marginBottom: 10 },
  likelihoodItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  likelihoodLabel: { color: '#64748b', fontSize: 13 },
  likelihoodVal: { color: '#f1f5f9', fontWeight: '600', fontSize: 13 },
  riskLevel: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  riskLevelText: { fontWeight: '700', fontSize: 14 },
  diffItem: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginBottom: 8 },
  diffHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  diffCondition: { color: '#e2e8f0', fontWeight: '600', fontSize: 14, flex: 1, marginRight: 8 },
  diffBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  diffBadgeText: { fontSize: 11, fontWeight: '700' },
  diffFactor: { color: '#64748b', fontSize: 12, lineHeight: 18 },
  remedyCard: { backgroundColor: 'rgba(16,185,129,0.05)', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)' },
  remedyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  remedyName: { color: '#34d399', fontWeight: '700', fontSize: 15, flex: 1, marginRight: 8 },
  effBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  effText: { fontSize: 11, fontWeight: '700' },
  remedyInstructions: { color: '#94a3b8', fontSize: 13, lineHeight: 20, marginBottom: 6 },
  remedyMeta: { color: '#64748b', fontSize: 12, marginBottom: 4 },
  cautionBox: { backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 8, padding: 8, marginTop: 4 },
  cautionText: { color: '#fbbf24', fontSize: 12 },
  treatmentItem: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginBottom: 8 },
  treatmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  treatmentName: { color: '#e2e8f0', fontWeight: '600', fontSize: 14, flex: 1 },
  typeBadge: { backgroundColor: 'rgba(99,102,241,0.2)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  typeBadgeText: { color: '#a78bfa', fontSize: 11, fontWeight: '600' },
  treatmentDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
  urgentBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10, padding: 12, marginBottom: 10 },
  urgentLabel: { color: '#f87171', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  urgentText: { color: '#fca5a5', fontSize: 13, lineHeight: 19 },
  disclaimer: { margin: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14 },
  disclaimerText: { color: '#475569', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  navCard: { width: (width - 42) / 2, backgroundColor: 'rgba(30,41,59,0.6)', borderRadius: 20, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  navIcon: { fontSize: 26, marginBottom: 6 },
  navLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
});