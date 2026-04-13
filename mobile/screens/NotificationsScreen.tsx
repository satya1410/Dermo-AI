import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function NotificationsScreen() {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 py-4 shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity
            className="mr-4"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold">Notifications</Text>
        </View>
      </View>

      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-6xl mb-4">🔔</Text>
        <Text className="text-2xl font-bold text-center mb-2">Notifications</Text>
        <Text className="text-gray-600 text-center">
          No new notifications
        </Text>
      </View>
    </View>
  );
}