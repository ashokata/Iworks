import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { useAuthStore } from '../../stores/authStore';

const { width } = Dimensions.get('window');

// Form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  const shakeAnimation = useSharedValue(0);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Check for biometric availability
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (compatible && enrolled) {
        setBiometricAvailable(true);
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Touch ID');
        } else {
          setBiometricType('Biometric');
        }
      }
    })();
  }, []);

  // Shake animation on error
  useEffect(() => {
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeAnimation.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [error]);

  const animatedShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }],
  }));

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to FieldSmartPro',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // In production, retrieve stored credentials securely
        // For now, use demo credentials
        setValue('email', 'mike@fieldsmartpro.local');
        setValue('password', 'demo-hash');
        handleSubmit(onSubmit)();
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await login(data.email, data.password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Navigation will be handled by the auth check in the root layout
      router.replace('/(tabs)/');
    } catch (error) {
      // Error is already handled in the store with shake animation
    }
  };

  const fillDemoCredentials = (email: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setValue('email', email);
    setValue('password', 'demo-hash');
  };

  const styles = createStyles(isDark);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#0f172a', '#1e293b'] : ['#f8fafc', '#ffffff']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Logo & Title */}
              <Animated.View
                entering={FadeInDown.delay(100).springify()}
                style={styles.header}
              >
                <View style={styles.logoContainer}>
                  <LinearGradient
                    colors={['#3b82f6', '#60a5fa']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.logoGradient}
                  >
                    <Ionicons name="construct" size={40} color="white" />
                  </LinearGradient>
                </View>
                <Text style={styles.title}>FieldSmartPro</Text>
                <Text style={styles.subtitle}>Welcome back! Sign in to continue</Text>
              </Animated.View>

              {/* Login Form */}
              <Animated.View
                entering={FadeInUp.delay(200).springify()}
                style={styles.formContainer}
              >
                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={[
                        styles.inputWrapper,
                        { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                        errors.email && styles.inputError
                      ]}>
                        <Ionicons
                          name="mail-outline"
                          size={20}
                          color={errors.email ? '#ef4444' : '#64748b'}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, { color: isDark ? '#f1f5f9' : '#1e293b' }]}
                          placeholder="your.email@company.com"
                          placeholderTextColor="#94a3b8"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          autoCorrect={false}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          value={value}
                          editable={!isLoading}
                        />
                      </View>
                    )}
                  />
                  {errors.email && (
                    <Animated.View entering={SlideInRight.springify()}>
                      <Text style={styles.errorText}>
                        <Ionicons name="alert-circle" size={12} /> {errors.email.message}
                      </Text>
                    </Animated.View>
                  )}
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={[
                        styles.inputWrapper,
                        { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                        errors.password && styles.inputError
                      ]}>
                        <Ionicons
                          name="lock-closed-outline"
                          size={20}
                          color={errors.password ? '#ef4444' : '#64748b'}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, { color: isDark ? '#f1f5f9' : '#1e293b' }]}
                          placeholder="Enter your password"
                          placeholderTextColor="#94a3b8"
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoComplete="password"
                          autoCorrect={false}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          value={value}
                          editable={!isLoading}
                        />
                        <TouchableOpacity
                          style={styles.eyeIcon}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setShowPassword(!showPassword);
                          }}
                          disabled={isLoading}
                        >
                          <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color="#64748b"
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                  {errors.password && (
                    <Animated.View entering={SlideInRight.springify()}>
                      <Text style={styles.errorText}>
                        <Ionicons name="alert-circle" size={12} /> {errors.password.message}
                      </Text>
                    </Animated.View>
                  )}
                </View>

                {/* Remember Me & Forgot Password */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.rememberMe}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setRememberMe(!rememberMe);
                    }}
                    disabled={isLoading}
                  >
                    <View style={[
                      styles.checkbox,
                      { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                      rememberMe && styles.checkboxChecked
                    ]}>
                      {rememberMe && <Ionicons name="checkmark" size={16} color="white" />}
                    </View>
                    <Text style={styles.rememberMeText}>Remember me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    disabled={isLoading}
                  >
                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Error Message */}
                {error && (
                  <Animated.View
                    entering={FadeIn.springify()}
                    style={[styles.errorContainer, animatedShakeStyle]}
                  >
                    <Ionicons name="alert-circle" size={20} color="#ef4444" />
                    <Text style={styles.errorMessage}>{error}</Text>
                  </Animated.View>
                )}

                {/* Sign In Button */}
                <TouchableOpacity
                  style={styles.signInButton}
                  onPress={handleSubmit(onSubmit)}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isLoading ? ['#94a3b8', '#94a3b8'] : ['#3b82f6', '#60a5fa']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.signInGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Text style={styles.signInText}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={20} color="white" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Biometric Sign In */}
                {biometricAvailable && (
                  <TouchableOpacity
                    style={[styles.biometricButton, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                    onPress={handleBiometricAuth}
                    disabled={isLoading}
                  >
                    <Ionicons
                      name={biometricType === 'Face ID' ? 'scan' : 'finger-print'}
                      size={24}
                      color="#3b82f6"
                    />
                    <Text style={styles.biometricText}>
                      Sign in with {biometricType}
                    </Text>
                  </TouchableOpacity>
                )}
              </Animated.View>

              {/* Divider */}
              <Animated.View
                entering={FadeIn.delay(400)}
                style={styles.divider}
              >
                <View style={[styles.dividerLine, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
                <Text style={styles.dividerText}>Demo Accounts</Text>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
              </Animated.View>

              {/* Demo Credentials */}
              <Animated.View
                entering={FadeInUp.delay(500).springify()}
                style={styles.demoSection}
              >
                {[
                  { email: 'mike@fieldsmartpro.local', role: 'Technician', icon: 'construct' },
                  { email: 'sarah@fieldsmartpro.local', role: 'Dispatcher', icon: 'headset' },
                  { email: 'admin@fieldsmartpro.local', role: 'Admin', icon: 'shield-checkmark' },
                ].map((demo, index) => (
                  <TouchableOpacity
                    key={demo.email}
                    style={[styles.demoCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}
                    onPress={() => fillDemoCredentials(demo.email)}
                    disabled={isLoading}
                  >
                    <View style={styles.demoIconContainer}>
                      <Ionicons name={demo.icon as any} size={20} color="#3b82f6" />
                    </View>
                    <View style={styles.demoInfo}>
                      <Text style={styles.demoRole}>{demo.role}</Text>
                      <Text style={styles.demoEmail}>{demo.email}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                ))}
                <Text style={styles.demoNote}>
                  Password: demo-hash (auto-filled)
                </Text>
              </Animated.View>

              {/* Footer */}
              <Animated.View
                entering={FadeIn.delay(600)}
                style={styles.footer}
              >
                <Text style={styles.footerText}>
                  By signing in, you agree to our{' '}
                  <Text style={styles.footerLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.footerLink}>Privacy Policy</Text>
                </Text>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: isDark ? '#f1f5f9' : '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: isDark ? '#cbd5e1' : '#475569',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    height: 56,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  rememberMeText: {
    fontSize: 14,
    color: isDark ? '#cbd5e1' : '#475569',
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorMessage: {
    flex: 1,
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  signInButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signInGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    gap: 8,
  },
  signInText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    gap: 12,
  },
  biometricText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  demoSection: {
    marginBottom: 32,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  demoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  demoInfo: {
    flex: 1,
  },
  demoRole: {
    fontSize: 15,
    fontWeight: '600',
    color: isDark ? '#f1f5f9' : '#1e293b',
    marginBottom: 2,
  },
  demoEmail: {
    fontSize: 13,
    color: '#64748b',
  },
  demoNote: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});
