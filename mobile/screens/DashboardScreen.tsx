import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const API_BASE_URL = 'https://your-vercel-deployment-url.vercel.app'; // Replace with your Vercel URL

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);

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
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to select images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!image) {
      Alert.alert('No Image', 'Please select or take a photo first.');
      return;
    }

    setAnalyzing(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again.');
        navigation.navigate('Login');
        return;
      }

      // Convert image to base64
      const response = await fetch(image);
      const blob = await response.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      const analyzeResponse = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: base64,
        }),
      });

      const data = await analyzeResponse.json();

      if (analyzeResponse.ok) {
        setResult(data);
        Alert.alert('Analysis Complete', 'Your skin analysis report is ready!');
      } else {
        Alert.alert('Analysis Failed', data.error || 'Failed to analyze image');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setResult(null);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.navigate('Login');
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 shadow-sm">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-blue-600">DermoAI</Text>
            <Text className="text-gray-600">Welcome back, {user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity
            className="bg-red-500 px-4 py-2 rounded-lg"
            onPress={logout}
          >
            <Text className="text-white font-medium">Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View className="px-6 py-6">
        {/* Analysis Section */}
        <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <Text className="text-xl font-bold mb-4 text-center">Skin Analysis</Text>
          <Text className="text-gray-600 text-center mb-6">
            Upload or take a photo of your skin condition for AI-powered analysis
          </Text>

          {/* Image Selection */}
          {!image ? (
            <View className="gap-4">
              <TouchableOpacity
                className="bg-blue-600 rounded-lg py-4 items-center"
                onPress={takePhoto}
              >
                <Text className="text-white font-bold text-lg">📸 Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-gray-600 rounded-lg py-4 items-center"
                onPress={pickImage}
              >
                <Text className="text-white font-bold text-lg">🖼️ Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Image Preview */}
              <View className="relative mb-4">
                <Image
                  source={{ uri: image }}
                  style={{
                    width: width - 48,
                    height: (width - 48) * 0.75,
                    borderRadius: 12,
                  }}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  className="absolute top-2 right-2 bg-red-500 rounded-full w-8 h-8 items-center justify-center"
                  onPress={clearImage}
                >
                  <Text className="text-white font-bold">×</Text>
                </TouchableOpacity>
              </View>

              {/* Analyze Button */}
              <TouchableOpacity
                className="bg-green-600 rounded-lg py-4 items-center"
                onPress={analyzeImage}
                disabled={analyzing}
              >
                {analyzing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">🧠 Analyze Skin Condition</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Results */}
        {result && (
          <View className="bg-white rounded-xl p-6 shadow-sm">
            <Text className="text-xl font-bold mb-4 text-center">Analysis Results</Text>

            <View className="mb-4">
              <Text className="font-semibold text-lg mb-2">Classification:</Text>
              <View className={`px-3 py-2 rounded-lg ${
                result.classification === 'benign' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Text className={`font-bold text-center ${
                  result.classification === 'benign' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.classification === 'benign' ? '✅ Benign' : '⚠️ Malignant'}
                </Text>
              </View>
            </View>

            <View className="mb-4">
              <Text className="font-semibold text-lg mb-2">Confidence:</Text>
              <Text className="text-gray-700">{(result.confidence * 100).toFixed(1)}%</Text>
            </View>

            {result.severity && (
              <View className="mb-4">
                <Text className="font-semibold text-lg mb-2">Severity:</Text>
                <View className={`px-3 py-2 rounded-lg ${
                  result.severity === 'Low' ? 'bg-green-100' :
                  result.severity === 'Moderate' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <Text className={`font-bold text-center ${
                    result.severity === 'Low' ? 'text-green-800' :
                    result.severity === 'Moderate' ? 'text-yellow-800' : 'text-red-800'
                  }`}>
                    {result.severity}
                  </Text>
                </View>
              </View>
            )}

            {result.report && (
              <View>
                <Text className="font-semibold text-lg mb-2">AI Report:</Text>
                <Text className="text-gray-700 leading-6">{result.report}</Text>
              </View>
            )}
          </View>
        )}

        {/* Navigation */}
        <View className="flex-row gap-3 mt-6">
          <TouchableOpacity
            className="flex-1 bg-white rounded-lg py-4 items-center shadow-sm"
            onPress={() => navigation.navigate('History')}
          >
            <Text className="text-lg mb-1">📊</Text>
            <Text className="font-medium">History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-white rounded-lg py-4 items-center shadow-sm"
            onPress={() => navigation.navigate('Doctors')}
          >
            <Text className="text-lg mb-1">👨‍⚕️</Text>
            <Text className="font-medium">Doctors</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-white rounded-lg py-4 items-center shadow-sm"
            onPress={() => navigation.navigate('Profile')}
          >
            <Text className="text-lg mb-1">👤</Text>
            <Text className="font-medium">Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}