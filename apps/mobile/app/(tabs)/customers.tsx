import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, useColorScheme, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { customerService, Customer } from '../../services/api/customerService';

interface DisplayCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: string;
  city: string;
}

function transformCustomer(customer: Customer): DisplayCustomer {
  const name = customerService.getDisplayName(customer);
  const primaryAddress = customer.addresses?.find(a => a.isPrimary) || customer.addresses?.[0];
  const phone = customer.mobilePhone || customer.homePhone || customer.workPhone || '';
  
  return {
    id: customer.id,
    name,
    phone,
    email: customer.email || '',
    type: customer.type,
    city: primaryAddress?.city || 'No address',
  };
}

export default function CustomersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<DisplayCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await customerService.getCustomers({ search: searchQuery || undefined });
      const transformedCustomers = response.customers.map(transformCustomer);
      setCustomers(transformedCustomers);
    } catch (err: any) {
      console.error('[Customers] Error fetching:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCall = (phone: string) => {
    if (phone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(`tel:${phone}`);
    }
  };

  const styles = createStyles(isDark);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCustomer = ({ item, index }: { item: DisplayCustomer; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity style={styles.customerItem} activeOpacity={0.7}>
        <View style={[styles.avatar, { 
          backgroundColor: item.type === 'COMMERCIAL' ? '#fef3c7' : '#dbeafe' 
        }]}>
          <Text style={[styles.avatarText, {
            color: item.type === 'COMMERCIAL' ? '#d97706' : '#3b82f6'
          }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.customerInfo}>
          <View style={styles.customerRow}>
            <Text style={styles.customerName} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.typeBadge, { 
              backgroundColor: item.type === 'COMMERCIAL' ? '#fef3c7' : '#dbeafe' 
            }]}>
              <Text style={[styles.typeText, { 
                color: item.type === 'COMMERCIAL' ? '#d97706' : '#3b82f6' 
              }]}>
                {item.type}
              </Text>
            </View>
          </View>
          {item.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={14} color="#64748b" />
              <Text style={styles.infoText}>{item.phone}</Text>
            </View>
          )}
          {item.city && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color="#64748b" />
              <Text style={styles.infoText}>{item.city}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.callBtn}
          onPress={() => handleCall(item.phone)}
        >
          <Ionicons name="call" size={18} color="#10b981" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#172554', '#1e3a8a'] : ['#2563eb', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Customers</Text>
            <Text style={styles.headerSubtitle}>{customers.length} total</Text>
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search customers..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Customer List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
              colors={['#3b82f6']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No customers found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try a different search' : 'Add your first customer'}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          // Navigate to add customer
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1e293b' : 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  customerInfo: {
    flex: 1,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? '#f1f5f9' : '#1e293b',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  infoText: {
    color: isDark ? '#94a3b8' : '#64748b',
    fontSize: 13,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? '#064e3b' : '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? '#94a3b8' : '#64748b',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
