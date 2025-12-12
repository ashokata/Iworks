import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, useColorScheme } from 'react-native';
import { useState } from 'react';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockJobs = [
  { id: '1', title: 'HVAC Maintenance', status: 'SCHEDULED', customer: 'John Smith', date: new Date().toISOString() },
  { id: '2', title: 'AC Repair', status: 'IN_PROGRESS', customer: 'Sarah Johnson', date: new Date().toISOString() },
  { id: '3', title: 'Furnace Installation', status: 'SCHEDULED', customer: 'Mike Williams', date: new Date(Date.now() + 86400000).toISOString() },
  { id: '4', title: 'Duct Cleaning', status: 'COMPLETED', customer: 'Emily Brown', date: new Date(Date.now() - 86400000).toISOString() },
  { id: '5', title: 'Heat Pump Repair', status: 'SCHEDULED', customer: 'David Lee', date: new Date(Date.now() + 172800000).toISOString() },
];

export default function JobsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs] = useState(mockJobs);

  const styles = createStyles(isDark);

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return '#3b82f6';
      case 'IN_PROGRESS': return '#10b981';
      case 'COMPLETED': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const renderJob = ({ item }: { item: typeof mockJobs[0] }) => (
    <TouchableOpacity style={styles.jobItem} activeOpacity={0.7}>
      <View style={styles.jobRow}>
        <Text style={styles.jobTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
      <Text style={styles.jobCustomer}>👤 {item.customer}</Text>
      <Text style={styles.jobDate}>📅 {format(new Date(item.date), 'MMM d, h:mm a')}</Text>
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
            placeholder="Search jobs..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Job List */}
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No jobs found</Text>
          </View>
        }
      />
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
  },
  jobItem: {
    backgroundColor: isDark ? '#1f2937' : 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  jobRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? 'white' : '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  jobCustomer: {
    color: '#6b7280',
    marginTop: 8,
  },
  jobDate: {
    color: '#9ca3af',
    marginTop: 4,
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
});
