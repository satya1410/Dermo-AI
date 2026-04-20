import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:3000'; // Local IP for Expo Go

export default function SignupScreen() {
  const navigation = useNavigation();
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    sex: '',
    height: '',
    weight: '',
    // Doctor fields
    specialization: '',
    hospital: '',
    experience: '',
    phone: '',
  });

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (role === 'doctor' && (!form.specialization || !form.hospital)) {
      Alert.alert('Error', 'Please fill in specialization and hospital for doctors');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...form, role }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        if (role === 'doctor') {
          navigation.navigate('DoctorDashboard');
        } else {
          navigation.navigate('Dashboard');
        }
      } else {
        Alert.alert('Signup Failed', data.error || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-8 bg-[#fafafa]">
        {/* Aesthetic Badge */}
        <View className="items-center mb-4">
          <View className="bg-blue-100 rounded-full px-4 py-2">
            <Text className="text-blue-700 font-semibold text-xs tracking-wide">
              ✨ Join DermoAI Today
            </Text>
          </View>
        </View>

        {/* Logo */}
        <View className="items-center mb-8">
          <Text className="text-5xl mb-2">🔬</Text>
          <Text className="text-3xl font-extrabold text-blue-600 tracking-tight">DermoAI</Text>
        </View>

        {/* Role Toggle */}
        <View className="flex-row bg-gray-100 rounded-lg p-1 mb-6">
          <TouchableOpacity
            className={`flex-1 py-3 rounded-md items-center ${
              role === 'patient' ? 'bg-blue-600' : 'bg-transparent'
            }`}
            onPress={() => setRole('patient')}
          >
            <Text className={role === 'patient' ? 'text-white font-bold' : 'text-gray-600'}>
              👤 Patient
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 rounded-md items-center ${
              role === 'doctor' ? 'bg-blue-600' : 'bg-transparent'
            }`}
            onPress={() => setRole('doctor')}
          >
            <Text className={role === 'doctor' ? 'text-white font-bold' : 'text-gray-600'}>
              🩺 Doctor
            </Text>
          </TouchableOpacity>
        </View>

        {/* Signup Form */}
        <View className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-500/10 border border-gray-100">
          <Text className="text-2xl font-bold text-center mb-6 text-gray-800">Create Account</Text>

          {/* Basic Info */}
          <View className="mb-4">
            <Text className="text-gray-700 mb-2 font-medium">Full Name *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="Enter your full name"
              value={form.name}
              onChangeText={(value) => updateForm('name', value)}
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2 font-medium">Email *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="you@example.com"
              value={form.email}
              onChangeText={(value) => updateForm('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-gray-700 mb-2 font-medium">Password *</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="Min. 6 chars"
                value={form.password}
                onChangeText={(value) => updateForm('password', value)}
                secureTextEntry
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-700 mb-2 font-medium">Confirm *</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChangeText={(value) => updateForm('confirmPassword', value)}
                secureTextEntry
              />
            </View>
          </View>

          {/* Personal Info */}
          <Text className="text-lg font-semibold mb-3 text-gray-800">Personal Information</Text>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-gray-700 mb-2">Age</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="25"
                value={form.age}
                onChangeText={(value) => updateForm('age', value)}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-700 mb-2">Sex</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="Male/Female"
                value={form.sex}
                onChangeText={(value) => updateForm('sex', value)}
              />
            </View>
          </View>

          <View className="flex-row gap-3 mb-6">
            <View className="flex-1">
              <Text className="text-gray-700 mb-2">Height (cm)</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="170"
                value={form.height}
                onChangeText={(value) => updateForm('height', value)}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-700 mb-2">Weight (kg)</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="65"
                value={form.weight}
                onChangeText={(value) => updateForm('weight', value)}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Doctor Fields */}
          {role === 'doctor' && (
            <>
              <Text className="text-lg font-semibold mb-3 text-gray-800">Professional Information</Text>

              <View className="mb-4">
                <Text className="text-gray-700 mb-2 font-medium">Specialization *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="e.g., Dermatology"
                  value={form.specialization}
                  onChangeText={(value) => updateForm('specialization', value)}
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 mb-2 font-medium">Hospital/Clinic *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                  placeholder="e.g., City General Hospital"
                  value={form.hospital}
                  onChangeText={(value) => updateForm('hospital', value)}
                />
              </View>

              <View className="flex-row gap-3 mb-6">
                <View className="flex-1">
                  <Text className="text-gray-700 mb-2">Experience (years)</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    placeholder="10"
                    value={form.experience}
                    onChangeText={(value) => updateForm('experience', value)}
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700 mb-2">Phone</Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                    placeholder="+91-9876543210"
                    value={form.phone}
                    onChangeText={(value) => updateForm('phone', value)}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </>
          )}

          <TouchableOpacity
            className="bg-blue-600 rounded-lg py-4 items-center mb-4"
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                Create {role === 'doctor' ? 'Doctor' : 'Patient'} Account
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center"
            onPress={() => navigation.navigate('Login')}
          >
            <Text className="text-blue-600">
              Already have an account? <Text className="font-bold">Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}