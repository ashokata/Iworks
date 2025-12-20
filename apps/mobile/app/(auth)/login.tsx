import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../stores/authStore';

// Form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      // Navigation will be handled by the auth check in the root layout
      router.replace('/(tabs)/');
    } catch (error) {
      // Error is already handled in the store
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-8">
          {/* Logo/Title */}
          <View className="items-center mb-12">
            <Text className="text-4xl font-bold text-primary-600 mb-2">
              FieldSmartPro
            </Text>
            <Text className="text-gray-600 dark:text-gray-400">
              Field Service Management
            </Text>
          </View>

          {/* Login Form */}
          <View className="space-y-4">
            {/* Email Input */}
            <View>
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`border rounded-lg px-4 py-3 text-gray-900 dark:text-white ${
                      errors.email
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="technician@fieldsmartpro.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    editable={!isLoading}
                  />
                )}
              />
              {errors.email && (
                <Text className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View>
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </Text>
              <View className="relative">
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`border rounded-lg px-4 py-3 text-gray-900 dark:text-white pr-12 ${
                        errors.password
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      editable={!isLoading}
                    />
                  )}
                />
                <TouchableOpacity
                  className="absolute right-3 top-3"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text className="text-primary-600 font-medium">
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Error Message */}
            {error && (
              <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <Text className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              className={`bg-primary-600 rounded-lg py-4 items-center ${
                isLoading ? 'opacity-70' : ''
              }`}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-lg">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity className="items-center py-2">
              <Text className="text-primary-600 dark:text-primary-400">
                Forgot your password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Demo Credentials */}
          <View className="mt-12 items-center">
            <Text className="text-gray-500 dark:text-gray-400 text-sm mb-2">
              Demo Credentials:
            </Text>
            <Text className="text-gray-600 dark:text-gray-300 text-sm text-center">
              Email: mike@fieldsmartpro.local{'\n'}
              Password: demo-hash
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-xs mt-2 text-center">
              Or: admin@fieldsmartpro.local{'\n'}
              Or: sarah@fieldsmartpro.local
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}