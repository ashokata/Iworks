import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Custom AIRA center button component
function AIRAButton({ onPress, focused }: { onPress: () => void; focused: boolean }) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    // Subtle pulse animation for the glow
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const animatedScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={styles.airaContainer}>
      {/* Outer glow ring */}
      <Animated.View style={[styles.glowRing, animatedGlow]}>
        <LinearGradient
          colors={['#8b5cf6', '#6366f1', '#3b82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glowGradient}
        />
      </Animated.View>
      
      {/* Main button */}
      <Animated.View style={[styles.airaButton, animatedScale]}>
        <LinearGradient
          colors={focused ? ['#7c3aed', '#4f46e5'] : ['#8b5cf6', '#6366f1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.airaGradient}
        >
          <Ionicons 
            name={focused ? 'sparkles' : 'sparkles-outline'} 
            size={28} 
            color="white" 
          />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const activeColor = '#6366f1';
  const inactiveColor = isDark ? '#6b7280' : '#9ca3af';
  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const borderColor = isDark ? '#1e293b' : '#f1f5f9';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: bgColor,
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 68,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 12,
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: bgColor,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: isDark ? '#f8fafc' : '#0f172a',
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
      }}
    >
      {/* Today/Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons 
                name={focused ? 'calendar' : 'calendar-outline'} 
                size={24} 
                color={color} 
              />
              {focused && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
            </View>
          ),
          headerShown: false,
        }}
      />

      {/* Jobs */}
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons 
                name={focused ? 'briefcase' : 'briefcase-outline'} 
                size={24} 
                color={color} 
              />
              {focused && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
            </View>
          ),
          headerShown: false,
        }}
      />

      {/* AIRA - Center Button */}
      <Tabs.Screen
        name="aira"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => null, // Custom button handles this
          tabBarButton: (props) => (
            <AIRAButton
              onPress={() => props.onPress?.(undefined as any)}
              focused={props.accessibilityState?.selected ?? false}
            />
          ),
          headerShown: false,
        }}
      />

      {/* Customers */}
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons 
                name={focused ? 'people' : 'people-outline'} 
                size={24} 
                color={color} 
              />
              {focused && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
            </View>
          ),
          headerShown: false,
        }}
      />

      {/* More/Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons 
                name={focused ? 'menu' : 'menu-outline'} 
                size={24} 
                color={color} 
              />
              {focused && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
            </View>
          ),
          headerShown: false,
        }}
      />

      {/* Hidden screens */}
      <Tabs.Screen name="schedule" options={{ href: null }} />
      <Tabs.Screen name="index-new" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  airaContainer: {
    top: -20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
  },
  glowRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
    borderRadius: 36,
  },
  airaButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  airaGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
