import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://your-vercel-deployment-url.vercel.app'; // Replace with your Vercel URL

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.navigate('Login');
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
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
          <Text className="text-xl font-bold">Profile</Text>
        </View>
      </View>

      {/* Content */}
      <View className="px-6 py-6">
        <View className="bg-white rounded-xl p-6 shadow-sm">
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
              <Text className="text-4xl">👤</Text>
            </View>
            <Text className="text-xl font-bold">{user?.name}</Text>
            <Text className="text-gray-600">{user?.email}</Text>
            <View className="mt-2">
              <Text className={`px-3 py-1 rounded-full text-sm font-bold ${
                user?.role === 'doctor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {user?.role === 'doctor' ? '🩺 Doctor' : '👤 Patient'}
              </Text>
            </View>
          </View>

          {user?.role === 'doctor' && (
            <View className="mb-6">
              <Text className="text-lg font-semibold mb-3">Professional Info</Text>
              <View className="gap-3">
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Specialization:</Text>
                  <Text className="font-medium">{user?.specialization || 'Not specified'}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Hospital:</Text>
                  <Text className="font-medium">{user?.hospital || 'Not specified'}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Experience:</Text>
                  <Text className="font-medium">{user?.experience ? `${user.experience} years` : 'Not specified'}</Text>
                </View>
              </View>
            </View>
          )}

          <View className="mb-6">
            <Text className="text-lg font-semibold mb-3">Personal Info</Text>
            <View className="gap-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Age:</Text>
                <Text className="font-medium">{user?.age || 'Not specified'}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Sex:</Text>
                <Text className="font-medium">{user?.sex || 'Not specified'}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Height:</Text>
                <Text className="font-medium">{user?.height ? `${user.height} cm` : 'Not specified'}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Weight:</Text>
                <Text className="font-medium">{user?.weight ? `${user.weight} kg` : 'Not specified'}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            className="bg-red-500 rounded-lg py-4 items-center"
            onPress={logout}
          >
            <Text className="text-white font-bold text-lg">Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}