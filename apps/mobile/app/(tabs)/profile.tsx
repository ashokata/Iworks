import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, useColorScheme, Alert, Linking } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../stores/authStore';

type SettingSection = {
  title: string;
  items: SettingItem[];
};

type SettingItem = {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  type: 'navigate' | 'toggle' | 'action';
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  destructive?: boolean;
  badge?: string;
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, logout } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const [darkMode, setDarkMode] = useState(isDark);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
      }},
    ]);
  };

  const sections: SettingSection[] = [
    {
      title: 'WORK',
      items: [
        {
          icon: 'time-outline',
          iconColor: '#3b82f6',
          iconBg: '#dbeafe',
          title: 'Time Tracking',
          subtitle: 'View your timesheet',
          type: 'navigate',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          icon: 'receipt-outline',
          iconColor: '#10b981',
          iconBg: '#d1fae5',
          title: 'My Earnings',
          subtitle: 'Commissions & payouts',
          type: 'navigate',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          icon: 'stats-chart-outline',
          iconColor: '#60a5fa',
          iconBg: '#dbeafe',
          title: 'Performance',
          subtitle: 'Jobs, ratings & metrics',
          type: 'navigate',
          badge: 'NEW',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        {
          icon: 'notifications-outline',
          iconColor: '#f59e0b',
          iconBg: '#fef3c7',
          title: 'Push Notifications',
          subtitle: 'Job alerts & updates',
          type: 'toggle',
          value: notificationsEnabled,
          onToggle: (val) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setNotificationsEnabled(val);
          },
        },
        {
          icon: 'cloud-offline-outline',
          iconColor: '#3b82f6',
          iconBg: '#e0e7ff',
          title: 'Offline Mode',
          subtitle: 'Work without internet',
          type: 'toggle',
          value: offlineMode,
          onToggle: (val) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setOfflineMode(val);
          },
        },
        {
          icon: 'location-outline',
          iconColor: '#ef4444',
          iconBg: '#fee2e2',
          title: 'Location Tracking',
          subtitle: 'GPS for navigation & dispatch',
          type: 'toggle',
          value: locationTracking,
          onToggle: (val) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setLocationTracking(val);
          },
        },
        {
          icon: 'moon-outline',
          iconColor: '#64748b',
          iconBg: '#f1f5f9',
          title: 'Dark Mode',
          subtitle: 'Use dark appearance',
          type: 'toggle',
          value: darkMode,
          onToggle: (val) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDarkMode(val);
          },
        },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        {
          icon: 'person-outline',
          iconColor: '#3b82f6',
          iconBg: '#dbeafe',
          title: 'Edit Profile',
          subtitle: 'Name, photo & contact',
          type: 'navigate',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          icon: 'shield-checkmark-outline',
          iconColor: '#10b981',
          iconBg: '#d1fae5',
          title: 'Security',
          subtitle: 'Password & biometrics',
          type: 'navigate',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          icon: 'card-outline',
          iconColor: '#60a5fa',
          iconBg: '#dbeafe',
          title: 'Payment Methods',
          subtitle: 'Manage cards & accounts',
          type: 'navigate',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        {
          icon: 'help-buoy-outline',
          iconColor: '#06b6d4',
          iconBg: '#cffafe',
          title: 'Help Center',
          subtitle: 'FAQs & tutorials',
          type: 'navigate',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          icon: 'chatbubbles-outline',
          iconColor: '#3b82f6',
          iconBg: '#e0e7ff',
          title: 'Contact Support',
          subtitle: 'Chat or call us',
          type: 'navigate',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          icon: 'document-text-outline',
          iconColor: '#64748b',
          iconBg: '#f1f5f9',
          title: 'Terms & Privacy',
          type: 'navigate',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL('https://infieldworks.com/privacy');
          },
        },
      ],
    },
  ];

  const renderSetting = (item: SettingItem, idx: number, isLast: boolean) => (
    <Animated.View key={idx} entering={FadeInDown.delay(idx * 30).springify()}>
      <TouchableOpacity
        style={[
          settingStyles.item,
          { backgroundColor: isDark ? '#1e293b' : '#ffffff' }
        ]}
        onPress={item.type === 'navigate' || item.type === 'action' ? item.onPress : undefined}
        activeOpacity={item.type === 'toggle' ? 1 : 0.7}
      >
        <View style={[settingStyles.iconContainer, { backgroundColor: item.iconBg }]}>
          <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
        </View>
        
        <View style={settingStyles.content}>
          <View style={settingStyles.titleRow}>
            <Text style={[
              settingStyles.title, 
              { color: item.destructive ? '#ef4444' : (isDark ? '#f1f5f9' : '#1e293b') }
            ]}>
              {item.title}
            </Text>
            {item.badge && (
              <View style={settingStyles.badge}>
                <Text style={settingStyles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </View>
          {item.subtitle && (
            <Text style={[settingStyles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {item.subtitle}
            </Text>
          )}
        </View>

        {item.type === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: isDark ? '#475569' : '#e2e8f0', true: '#3b82f6' }}
            thumbColor="white"
            ios_backgroundColor={isDark ? '#475569' : '#e2e8f0'}
          />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={isDark ? '#475569' : '#cbd5e1'} />
        )}
      </TouchableOpacity>
      {!isLast && <View style={[settingStyles.divider, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]} />}
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      {/* Header with gradient */}
      <LinearGradient
        colors={isDark ? ['#172554', '#1e3a8a'] : ['#2563eb', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#60a5fa', '#3b82f6']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {user?.firstName?.[0]?.toUpperCase() || 'F'}{user?.lastName?.[0]?.toUpperCase() || 'T'}
                </Text>
              </LinearGradient>
              <View style={styles.onlineIndicator} />
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.firstName || 'Field'} {user?.lastName || 'Tech'}
              </Text>
              <Text style={styles.userRole}>{user?.role || 'Field Technician'}</Text>
            </View>

            <TouchableOpacity 
              style={styles.editBtn}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Ionicons name="pencil" size={16} color="white" />
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>127</Text>
              <Text style={styles.statLabel}>Jobs Done</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4.9</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>98%</Text>
              <Text style={styles.statLabel}>On-Time</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Settings */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, sectionIdx) => (
          <Animated.View 
            key={sectionIdx}
            entering={FadeInDown.delay(sectionIdx * 100).springify()}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: isDark ? '#64748b' : '#94a3b8' }]}>
              {section.title}
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
              {section.items.map((item, idx) => 
                renderSetting(item, idx, idx === section.items.length - 1)
              )}
            </View>
          </Animated.View>
        ))}

        {/* Logout Button */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <TouchableOpacity 
            style={[styles.logoutBtn, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}
            onPress={handleLogout}
          >
            <View style={[settingStyles.iconContainer, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </View>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Infield Works</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
  },
  userRole: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 2,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
  appVersion: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});

const settingStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginLeft: 70,
  },
});
