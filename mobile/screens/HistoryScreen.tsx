import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://your-vercel-deployment-url.vercel.app'; // Replace with your Vercel URL

export default function HistoryScreen() {
  const navigation = useNavigation();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setAnalyses(data.analyses || []);
      } else {
        Alert.alert('Error', 'Failed to load history');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      Low: 'bg-green-100 text-green-800',
      Moderate: 'bg-yellow-100 text-yellow-800',
      High: 'bg-orange-100 text-orange-800',
      Critical: 'bg-red-100 text-red-800',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getClassBadge = (classification) => {
    return classification === 'benign'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading history...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity
            className="mr-4"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold">Analysis History</Text>
        </View>
      </View>

      {/* Content */}
      <View className="px-6 py-6">
        {analyses.length === 0 ? (
          <View className="bg-white rounded-xl p-8 items-center shadow-sm">
            <Text className="text-6xl mb-4">📊</Text>
            <Text className="text-xl font-bold text-gray-800 mb-2">No Analyses Yet</Text>
            <Text className="text-gray-600 text-center">
              Start by uploading a skin image on the Analysis page to get your first report.
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {analyses.map((analysis) => (
              <View key={analysis.id} className="bg-white rounded-xl p-4 shadow-sm">
                <View className="flex-row">
                  {/* Thumbnail */}
                  <View className="w-16 h-16 bg-gray-200 rounded-lg mr-4 items-center justify-center">
                    {analysis.image_url ? (
                      <Image
                        source={{ uri: analysis.image_url }}
                        className="w-16 h-16 rounded-lg"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="text-2xl">
                        {analysis.classification === 'benign' ? '✅' : '⚠️'}
                      </Text>
                    )}
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className={`px-2 py-1 rounded-full ${getClassBadge(analysis.classification)}`}>
                        <Text className="text-xs font-bold">
                          {analysis.classification === 'benign' ? 'Benign' : 'Malignant'}
                        </Text>
                      </View>
                      {analysis.severity && (
                        <View className={`px-2 py-1 rounded-full ${getSeverityBadge(analysis.severity)}`}>
                          <Text className="text-xs font-bold">{analysis.severity}</Text>
                        </View>
                      )}
                    </View>

                    <Text className="text-sm text-gray-600 mb-1">
                      {formatDate(analysis.created_at)}
                    </Text>

                    {analysis.confidence && (
                      <Text className="text-sm text-gray-600">
                        Confidence: {(analysis.confidence * 100).toFixed(1)}%
                      </Text>
                    )}
                  </View>
                </View>

                {analysis.report && (
                  <View className="mt-3 pt-3 border-t border-gray-200">
                    <Text className="text-sm text-gray-700 leading-5">
                      {analysis.report.length > 150
                        ? `${analysis.report.substring(0, 150)}...`
                        : analysis.report
                      }
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}