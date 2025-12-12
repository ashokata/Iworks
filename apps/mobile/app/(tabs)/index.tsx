import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, useColorScheme } from 'react-native';
import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockJobs = [
  {
    id: '1',
    title: 'HVAC Maintenance',
    status: 'SCHEDULED',
    customer: 'John Smith',
    time: '9:00 AM',
    address: '123 Main St, Austin',
  },
  {
    id: '2',
    title: 'AC Repair',
    status: 'IN_PROGRESS',
    customer: 'Sarah Johnson',
    time: '1:00 PM',
    address: '456 Oak Ave, Austin',
  },
  {
    id: '3',
    title: 'Furnace Installation',
    status: 'SCHEDULED',
    customer: 'Mike Williams',
    time: '4:00 PM',
    address: '789 Pine Rd, Round Rock',
  },
];

export default function TodayScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [jobs] = useState(mockJobs);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return '#3b82f6';
      case 'IN_PROGRESS': return '#10b981';
      case 'COMPLETED': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const styles = createStyles(isDark);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerDay}>{format(new Date(), 'EEEE')}</Text>
          <Text style={styles.headerDate}>{format(new Date(), 'MMMM d, yyyy')}</Text>
          <Text style={styles.headerCount}>{jobs.length} jobs scheduled today</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#3b82f6' }]}>
              {jobs.filter(j => j.status === 'SCHEDULED').length}
            </Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>
              {jobs.filter(j => j.status === 'IN_PROGRESS').length}
            </Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#6b7280' }]}>
              {jobs.filter(j => j.status === 'COMPLETED').length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Job List */}
        <View style={styles.jobsSection}>
          <Text style={styles.sectionTitle}>Today's Jobs</Text>
          
          {jobs.map((job) => (
            <TouchableOpacity key={job.id} style={styles.jobCard} activeOpacity={0.7}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
                    {job.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              <Text style={styles.jobInfo}>👤 {job.customer}</Text>
              <Text style={styles.jobInfo}>🕐 {job.time}</Text>
              <Text style={styles.jobInfo}>📍 {job.address}</Text>

              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  { backgroundColor: job.status === 'IN_PROGRESS' ? '#10b981' : '#2563eb' }
                ]}
              >
                <Text style={styles.actionButtonText}>
                  {job.status === 'IN_PROGRESS' ? 'Complete Job' : 'Start Job'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
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
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 10,
  },
  headerDay: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerDate: {
    color: '#bfdbfe',
    fontSize: 16,
    marginTop: 4,
  },
  headerCount: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: isDark ? '#1f2937' : 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  jobsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: isDark ? 'white' : '#111827',
  },
  jobCard: {
    backgroundColor: isDark ? '#1f2937' : 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? 'white' : '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  jobInfo: {
    color: '#6b7280',
    marginTop: 6,
    fontSize: 14,
  },
  actionButton: {
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
