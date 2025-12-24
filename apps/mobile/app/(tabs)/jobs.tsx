import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, useColorScheme, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, SlideInRight, Layout } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { jobService, Job as ApiJob } from '../../services/api/jobService';

const { width } = Dimensions.get('window');

// Transform API job to display format
interface DisplayJob {
  id: string;
  jobNumber: string;
  title: string;
  status: string;
  priority: string;
  customer: { name: string; phone: string };
  address: string;
  date: string;
  time: string;
  jobType: { name: string; color: string };
}

function transformJob(job: ApiJob): DisplayJob {
  const customerName = job.customer 
    ? `${job.customer.firstName || ''} ${job.customer.lastName || ''}`.trim() || job.customer.companyName || 'Unknown'
    : 'Unknown';
  
  const address = job.address
    ? `${job.address.street1}, ${job.address.city}, ${job.address.state}`
    : 'No address';

  const time = job.scheduledStart 
    ? format(new Date(job.scheduledStart), 'h:mm a')
    : 'Unscheduled';

  return {
    id: job.id,
    jobNumber: job.jobNumber || 'N/A',
    title: job.title || job.description || 'Untitled Job',
    status: job.status,
    priority: job.priority,
    customer: { 
      name: customerName, 
      phone: job.customer?.mobilePhone || job.customer?.homePhone || job.customer?.workPhone || '' 
    },
    address,
    date: job.scheduledStart || new Date().toISOString(),
    time,
    jobType: { 
      name: 'General', 
      color: '#6366f1' 
    },
  };
}

type Job = DisplayJob;
type FilterTab = 'all' | 'today' | 'upcoming' | 'completed';

export default function JobsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [jobs, setJobs] = useState<DisplayJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const params: { status?: string } = {};
      if (activeFilter === 'completed') {
        params.status = 'COMPLETED';
      }
      const response = await jobService.getJobs(params);
      const transformedJobs = response.jobs.map(transformJob);
      setJobs(transformedJobs);
    } catch (err: any) {
      console.error('[Jobs] Error fetching jobs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    setLoading(true);
    fetchJobs();
  }, [fetchJobs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchJobs();
  }, [fetchJobs]);

  const filterTabs: { key: FilterTab; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'today', label: 'Today', icon: 'today' },
    { key: 'upcoming', label: 'Upcoming', icon: 'calendar' },
    { key: 'completed', label: 'Done', icon: 'checkmark-circle' },
  ];

  const filteredJobs = jobs.filter(job => {
    // Search filter
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Tab filter
    const jobDate = new Date(job.date);
    switch (activeFilter) {
      case 'today':
        return isToday(jobDate) && job.status !== 'COMPLETED';
      case 'upcoming':
        return !isToday(jobDate) && job.status !== 'COMPLETED';
      case 'completed':
        return job.status === 'COMPLETED';
      default:
        return true;
    }
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return { color: '#f59e0b', bg: '#fef3c7', label: 'Scheduled' };
      case 'DISPATCHED': return { color: '#3b82f6', bg: '#dbeafe', label: 'Dispatched' };
      case 'EN_ROUTE': return { color: '#8b5cf6', bg: '#ede9fe', label: 'En Route' };
      case 'IN_PROGRESS': return { color: '#10b981', bg: '#d1fae5', label: 'In Progress' };
      case 'COMPLETED': return { color: '#6b7280', bg: '#f3f4f6', label: 'Completed' };
      default: return { color: '#6b7280', bg: '#f3f4f6', label: status };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY': return { color: '#dc2626', icon: 'alert-circle', label: 'Emergency' };
      case 'HIGH': return { color: '#f59e0b', icon: 'warning', label: 'High' };
      default: return null;
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM d');
  };

  const renderSwipeActions = (job: Job) => (
    <View style={swipeStyles.actionsContainer}>
      <TouchableOpacity 
        style={[swipeStyles.action, { backgroundColor: '#3b82f6' }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          // Navigate to job
        }}
      >
        <Ionicons name="navigate" size={20} color="white" />
        <Text style={swipeStyles.actionText}>Navigate</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[swipeStyles.action, { backgroundColor: '#10b981' }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          // Call customer
        }}
      >
        <Ionicons name="call" size={20} color="white" />
        <Text style={swipeStyles.actionText}>Call</Text>
      </TouchableOpacity>
    </View>
  );

  const renderJob = ({ item, index }: { item: Job; index: number }) => {
    const statusConfig = getStatusConfig(item.status);
    const priorityConfig = getPriorityConfig(item.priority);

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50).springify()}
        layout={Layout.springify()}
      >
        <Swipeable
          renderRightActions={() => renderSwipeActions(item)}
          friction={2}
          rightThreshold={40}
        >
          <Pressable 
            style={({ pressed }) => ({
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              borderRadius: 16,
              marginBottom: 12,
              overflow: 'hidden',
              transform: [{ scale: pressed ? 0.98 : 1 }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            })}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Navigate to job detail
            }}
          >
            <View style={{ flexDirection: 'row' }}>
              {/* Type indicator */}
              <View style={{ width: 4, backgroundColor: item.jobType.color }} />
              
              <View style={{ flex: 1, padding: 16 }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#94a3b8' : '#64748b' }}>
                        {item.jobNumber}
                      </Text>
                      {priorityConfig && (
                        <View style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          backgroundColor: priorityConfig.color + '20',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                          gap: 3,
                        }}>
                          <Ionicons name={priorityConfig.icon as any} size={12} color={priorityConfig.color} />
                          <Text style={{ fontSize: 10, fontWeight: '600', color: priorityConfig.color }}>
                            {priorityConfig.label}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text 
                      style={{ fontSize: 15, fontWeight: '600', color: isDark ? '#f1f5f9' : '#1e293b', marginTop: 4 }}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                  </View>
                  <View style={[{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }, { backgroundColor: statusConfig.bg }]}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: statusConfig.color }}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                {/* Details */}
                <View style={{ marginTop: 12, gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="person-outline" size={14} color="#64748b" />
                    <Text style={{ fontSize: 13, color: isDark ? '#cbd5e1' : '#475569' }}>
                      {item.customer.name}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="calendar-outline" size={14} color="#64748b" />
                    <Text style={{ fontSize: 13, color: isDark ? '#cbd5e1' : '#475569' }}>
                      {getDateLabel(item.date)} at {item.time}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="location-outline" size={14} color="#64748b" />
                    <Text style={{ fontSize: 13, color: isDark ? '#cbd5e1' : '#475569' }} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                </View>

                {/* Swipe hint */}
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'flex-end',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: isDark ? '#334155' : '#f1f5f9',
                }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8', marginRight: 4 }}>
                    Swipe for actions
                  </Text>
                  <Ionicons name="chevron-back" size={14} color="#94a3b8" />
                </View>
              </View>
            </View>
          </Pressable>
        </Swipeable>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1e1b4b', '#312e81'] : ['#4f46e5', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingBottom: 16 }}
      >
        <SafeAreaView edges={['top']}>
          <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '700' }}>Jobs</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 }}>
              {filteredJobs.length} jobs found
            </Text>
          </View>

          {/* Search */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: 'rgba(255,255,255,0.15)',
            marginHorizontal: 20,
            marginTop: 16,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 12,
            gap: 10,
          }}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search jobs, customers..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={{ flex: 1, fontSize: 16, color: 'white' }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Tabs */}
          <View style={{ 
            flexDirection: 'row', 
            marginHorizontal: 20, 
            marginTop: 16,
            gap: 8,
          }}>
            {filterTabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveFilter(tab.key);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: activeFilter === tab.key ? 'white' : 'rgba(255,255,255,0.15)',
                  gap: 6,
                }}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={16} 
                  color={activeFilter === tab.key ? '#6366f1' : 'rgba(255,255,255,0.8)'} 
                />
                <Text style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: activeFilter === tab.key ? '#6366f1' : 'white',
                }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Job List */}
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Ionicons name="briefcase-outline" size={48} color="#9ca3af" />
            <Text style={{ fontSize: 18, fontWeight: '600', color: isDark ? '#94a3b8' : '#64748b', marginTop: 16 }}>
              No jobs found
            </Text>
            <Text style={{ fontSize: 14, color: '#9ca3af', marginTop: 4 }}>
              {searchQuery ? 'Try a different search' : 'No jobs in this category'}
            </Text>
          </View>
        }
      />

      {/* FAB - New Job */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 100,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#6366f1',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#6366f1',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          // Create new job
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const swipeStyles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  action: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginLeft: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
