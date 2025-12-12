import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, useColorScheme } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockCustomers = [
  { id: '1', name: 'John Smith', phone: '(512) 555-0101', type: 'RESIDENTIAL', city: 'Austin' },
  { id: '2', name: 'Sarah Johnson', phone: '(512) 555-0102', type: 'RESIDENTIAL', city: 'Austin' },
  { id: '3', name: 'ABC Contractors', phone: '(512) 555-0103', type: 'COMMERCIAL', city: 'Round Rock' },
  { id: '4', name: 'Emily Brown', phone: '(512) 555-0104', type: 'RESIDENTIAL', city: 'Cedar Park' },
  { id: '5', name: 'Tech Solutions LLC', phone: '(512) 555-0105', type: 'COMMERCIAL', city: 'Pflugerville' },
];

export default function CustomersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [customers] = useState(mockCustomers);

  const styles = createStyles(isDark);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const renderCustomer = ({ item }: { item: typeof mockCustomers[0] }) => (
    <TouchableOpacity style={styles.customerItem} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.customerInfo}>
        <View style={styles.customerRow}>
          <Text style={styles.customerName}>{item.name}</Text>
          <View style={[styles.typeBadge, { 
            backgroundColor: item.type === 'COMMERCIAL' ? '#fef3c7' : '#dbeafe' 
          }]}>
            <Text style={[styles.typeText, { 
              color: item.type === 'COMMERCIAL' ? '#d97706' : '#2563eb' 
            }]}>
              {item.type}
            </Text>
          </View>
        </View>
        <Text style={styles.customerPhone}>📞 {item.phone}</Text>
        <Text style={styles.customerCity}>📍 {item.city}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#6b7280" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search customers..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Customer List */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomer}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No customers found</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#111827' : '#f3f4f6',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: isDark ? '#1f2937' : 'white',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#374151' : '#e5e7eb',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#374151' : '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: isDark ? 'white' : '#111827',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  customerItem: {
    flexDirection: 'row',
    backgroundColor: isDark ? '#1f2937' : 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#2563eb',
    fontSize: 20,
    fontWeight: '600',
  },
  customerInfo: {
    flex: 1,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? 'white' : '#111827',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  customerPhone: {
    color: '#6b7280',
    marginTop: 4,
    fontSize: 14,
  },
  customerCity: {
    color: '#9ca3af',
    marginTop: 2,
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
