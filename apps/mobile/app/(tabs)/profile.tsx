import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, useColorScheme, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, logout } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(true);

  const styles = createStyles(isDark);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
        // Navigation will be handled by auth guard
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.userRole}>{user?.role || 'Field Technician'}</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="person-outline" size={20} color="#2563eb" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Edit Profile</Text>
                <Text style={styles.settingSubtitle}>Update your information</Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="shield-outline" size={20} color="#2563eb" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Security</Text>
                <Text style={styles.settingSubtitle}>Password and authentication</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingItem}>
              <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="notifications-outline" size={20} color="#2563eb" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSubtitle}>Receive job updates</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: '#2563eb' }}
                thumbColor="white"
              />
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.settingItem}>
              <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="sync-outline" size={20} color="#2563eb" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Offline Mode</Text>
                <Text style={styles.settingSubtitle}>Work without internet</Text>
              </View>
              <Switch
                value={offlineMode}
                onValueChange={setOfflineMode}
                trackColor={{ false: '#d1d5db', true: '#2563eb' }}
                thumbColor="white"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="help-circle-outline" size={20} color="#2563eb" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Help & Support</Text>
                <Text style={styles.settingSubtitle}>FAQs and contact</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
              <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: '#dc2626' }]}>Logout</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Version */}
        <Text style={styles.version}>FieldSmartPro v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#111827' : '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: isDark ? '#1f2937' : 'white',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#2563eb',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: isDark ? 'white' : '#111827',
  },
  userRole: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    color: '#6b7280',
    fontSize: 14,
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: isDark ? '#1f2937' : 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: isDark ? 'white' : '#111827',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: isDark ? '#374151' : '#f3f4f6',
    marginLeft: 68,
  },
  version: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    paddingVertical: 24,
  },
});
