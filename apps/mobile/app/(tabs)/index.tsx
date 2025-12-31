import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, useColorScheme, Dimensions, Pressable, ActivityIndicator } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInRight, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { jobService, Job as ApiJob } from '../../services/api/jobService';
import { useAuthStore } from '../../stores/authStore';

const { width } = Dimensions.get('window');

// Transform API job to display format
interface DisplayJob {
  id: string;
  jobNumber: string;
  title: string;
  status: string;
  priority: string;
  customer: { name: string; phone: string };
  time: string;
  address: string;
  estimatedDuration: number;
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
    time,
    address,
    estimatedDuration: job.estimatedDuration || 60,
    jobType: { 
      name: 'General', 
      color: '#3b82f6' 
    },
  };
}

type Job = DisplayJob;

export default function TodayScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<DisplayJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockedTime, setClockedTime] = useState('0h 0m');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { user } = useAuthStore();

  const fetchJobs = useCallback(async () => {
    try {
      setError(null);
      const response = await jobService.getTodaysJobs();
      const transformedJobs = response.jobs.map(transformJob);
      setJobs(transformedJobs);
    } catch (err: any) {
      console.error('[Today] Error fetching jobs:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchJobs();
  }, [fetchJobs]);

  const handleClockToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsClockedIn(!isClockedIn);
    if (!isClockedIn) {
      setClockedTime('0h 0m');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return { color: '#f59e0b', bg: '#fef3c7', label: 'Scheduled' };
      case 'DISPATCHED': return { color: '#3b82f6', bg: '#dbeafe', label: 'Dispatched' };
      case 'EN_ROUTE': return { color: '#60a5fa', bg: '#dbeafe', label: 'En Route' };
      case 'IN_PROGRESS': return { color: '#10b981', bg: '#d1fae5', label: 'In Progress' };
      case 'COMPLETED': return { color: '#6b7280', bg: '#f3f4f6', label: 'Completed' };
      default: return { color: '#6b7280', bg: '#f3f4f6', label: status };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY': return { color: '#dc2626', icon: 'alert-circle' };
      case 'HIGH': return { color: '#f59e0b', icon: 'warning' };
      case 'NORMAL': return { color: '#6b7280', icon: null };
      case 'LOW': return { color: '#9ca3af', icon: null };
      default: return { color: '#6b7280', icon: null };
    }
  };

  const styles = createStyles(isDark);
  const scheduledCount = jobs.filter(j => j.status === 'SCHEDULED').length;
  const inProgressCount = jobs.filter(j => j.status === 'IN_PROGRESS').length;
  const completedCount = jobs.filter(j => j.status === 'COMPLETED').length;

  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={isDark ? ['#172554', '#1e3a8a'] : ['#2563eb', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Good {getTimeOfDay()}</Text>
              <Text style={styles.userName}>{user?.firstName || 'Field Tech'}</Text>
              {user?.tenant && (
                <Text style={styles.tenantName}>{user.tenant.name}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color="white" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>2</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Clock In/Out Card */}
          <Animated.View 
            entering={FadeInDown.delay(100).springify()}
            style={styles.clockCard}
          >
            <View style={styles.clockLeft}>
              <View style={[styles.clockIndicator, { backgroundColor: isClockedIn ? '#10b981' : '#ef4444' }]} />
              <View>
                <Text style={styles.clockStatus}>
                  {isClockedIn ? 'Clocked In' : 'Clocked Out'}
                </Text>
                <Text style={styles.clockTime}>
                  {isClockedIn ? `Working: ${clockedTime}` : 'Tap to start your day'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.clockButton, { backgroundColor: isClockedIn ? '#ef4444' : '#10b981' }]}
              onPress={handleClockToggle}
            >
              <Ionicons 
                name={isClockedIn ? 'stop-circle' : 'play-circle'} 
                size={20} 
                color="white" 
              />
              <Text style={styles.clockButtonText}>
                {isClockedIn ? 'Clock Out' : 'Clock In'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Stats Row */}
          <Animated.View 
            entering={FadeInDown.delay(200).springify()}
            style={styles.statsRow}
          >
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{jobs.length}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#fbbf24' }]}>{scheduledCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#34d399' }]}>{inProgressCount}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#a3a3a3' }]}>{completedCount}</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      {/* Jobs List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <Animated.View entering={FadeInRight.delay(300).springify()}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContainer}
          >
            <QuickActionButton
              icon="add-circle"
              label="New Job"
              color="#3b82f6"
              isDark={isDark}
            />
            <QuickActionButton
              icon="document-text"
              label="Estimate"
              color="#60a5fa"
              isDark={isDark}
            />
            <QuickActionButton
              icon="receipt"
              label="Invoice"
              color="#10b981"
              isDark={isDark}
            />
            <QuickActionButton
              icon="camera"
              label="Photo"
              color="#f59e0b"
              isDark={isDark}
            />
            <QuickActionButton
              icon="navigate"
              label="Navigate"
              color="#3b82f6"
              isDark={isDark}
            />
          </ScrollView>
        </Animated.View>

        {/* Calendar */}
        <Animated.View entering={FadeIn.delay(350).springify()}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <Text style={styles.sectionTitle}>Calendar</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCurrentMonth(new Date());
                setSelectedDate(new Date());
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#3b82f6' }}>Today</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.calendarCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
            {/* Month Header */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrentMonth(subMonths(currentMonth, 1));
                }}
                style={styles.calendarNavBtn}
              >
                <Ionicons name="chevron-back" size={20} color="#3b82f6" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthText}>
                {format(currentMonth, 'MMMM yyyy')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrentMonth(addMonths(currentMonth, 1));
                }}
                style={styles.calendarNavBtn}
              >
                <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
              </TouchableOpacity>
            </View>

            {/* Week Days */}
            <View style={styles.weekDaysRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <Text key={day} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            {/* Calendar Days */}
            <CalendarGrid
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedDate(date);
              }}
              jobs={jobs}
              isDark={isDark}
            />
          </View>
        </Animated.View>

        {/* Today's Jobs */}
        <Text style={styles.sectionTitle}>
          {isSameDay(selectedDate, new Date()) ? "Today's Schedule" : format(selectedDate, 'EEEE, MMM d')}
        </Text>
        
        {jobs.filter(job => isSameDay(new Date(job.date), selectedDate)).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No jobs scheduled</Text>
            <Text style={styles.emptySubtitle}>
              {isSameDay(selectedDate, new Date()) ? 'Enjoy your day off!' : 'No appointments for this date'}
            </Text>
          </View>
        ) : (
          jobs
            .filter(job => isSameDay(new Date(job.date), selectedDate))
            .map((job, index) => (
              <Animated.View
                key={job.id}
                entering={FadeInDown.delay(400 + index * 100).springify()}
              >
                <JobCard job={job} isDark={isDark} />
              </Animated.View>
            ))
        )}

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// Quick Action Button Component
function QuickActionButton({ icon, label, color, isDark }: { 
  icon: string; 
  label: string; 
  color: string;
  isDark: boolean;
}) {
  return (
    <TouchableOpacity 
      style={{
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        minWidth: 80,
      }}
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
    >
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        backgroundColor: color + '20',
      }}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={{
        fontSize: 12,
        fontWeight: '600',
        color: isDark ? '#e2e8f0' : '#334155',
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Calendar Grid Component
function CalendarGrid({
  currentMonth,
  selectedDate,
  onSelectDate,
  jobs,
  isDark,
}: {
  currentMonth: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  jobs: DisplayJob[];
  isDark: boolean;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Group jobs by date
  const jobsByDate = jobs.reduce((acc, job) => {
    const dateKey = format(new Date(job.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(job);
    return acc;
  }, {} as Record<string, DisplayJob[]>);

  const rows: Date[][] = [];
  let currentRow: Date[] = [];

  days.forEach((day, index) => {
    currentRow.push(day);
    if ((index + 1) % 7 === 0) {
      rows.push(currentRow);
      currentRow = [];
    }
  });

  return (
    <View style={{ marginTop: 8 }}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 }}>
          {row.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const hasJobs = jobsByDate[dateKey]?.length > 0;
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);

            return (
              <TouchableOpacity
                key={day.toISOString()}
                onPress={() => onSelectDate(day)}
                style={{
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 20,
                  backgroundColor: isSelected
                    ? '#3b82f6'
                    : isTodayDate
                    ? isDark ? '#1e3a8a' : '#e0e7ff'
                    : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: isSelected || isTodayDate ? '700' : '400',
                    color: isSelected
                      ? 'white'
                      : isTodayDate
                      ? '#3b82f6'
                      : !isCurrentMonth
                      ? '#9ca3af'
                      : isDark ? '#f1f5f9' : '#1e293b',
                  }}
                >
                  {format(day, 'd')}
                </Text>
                {hasJobs && !isSelected && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: isTodayDate ? '#3b82f6' : '#10b981',
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// Job Card Component
function JobCard({ job, isDark }: { job: Job; isDark: boolean }) {
  const statusConfig = getStatusConfig(job.status);
  const priorityConfig = getPriorityConfig(job.priority);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to job detail
  };

  const handleNavigate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Open maps
  };

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Call customer
  };

  const cardStyles = {
    jobCard: {
      flexDirection: 'row' as const,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
      overflow: 'hidden' as const,
    },
    jobTypeIndicator: {
      width: 4,
    },
    jobContent: {
      flex: 1,
      padding: 16,
    },
    jobHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    jobTitleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600' as const,
    },
    jobTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      marginTop: 8,
    },
    jobTimeRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginTop: 8,
      gap: 4,
    },
    jobDetails: {
      marginTop: 12,
      gap: 6,
    },
    jobDetailRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    jobActions: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#334155' : '#f1f5f9',
      gap: 12,
    },
    jobActionBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    startJobBtn: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 10,
      borderRadius: 10,
      gap: 6,
    },
  };

  return (
    <Pressable 
      style={({ pressed }) => [
        cardStyles.jobCard,
        { 
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          transform: [{ scale: pressed ? 0.98 : 1 }],
        }
      ]}
      onPress={handlePress}
    >
      {/* Job Type Indicator */}
      <View style={[cardStyles.jobTypeIndicator, { backgroundColor: job.jobType.color }]} />
      
      <View style={cardStyles.jobContent}>
        {/* Header Row */}
        <View style={cardStyles.jobHeader}>
          <View style={cardStyles.jobTitleRow}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#94a3b8' : '#64748b' }}>
              {job.jobNumber}
            </Text>
            {priorityConfig.icon && (
              <Ionicons 
                name={priorityConfig.icon as any} 
                size={16} 
                color={priorityConfig.color} 
                style={{ marginLeft: 6 }}
              />
            )}
          </View>
          <View style={[cardStyles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[cardStyles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Job Title */}
        <Text style={[cardStyles.jobTitle, { color: isDark ? '#f1f5f9' : '#1e293b' }]} numberOfLines={1}>
          {job.title}
        </Text>

        {/* Time & Duration */}
        <View style={cardStyles.jobTimeRow}>
          <Ionicons name="time-outline" size={14} color="#64748b" />
          <Text style={{ fontSize: 13, color: '#64748b', marginLeft: 4 }}>{job.time}</Text>
          <Text style={{ fontSize: 13, color: '#94a3b8' }}>• {job.estimatedDuration} min</Text>
        </View>

        {/* Customer & Address */}
        <View style={cardStyles.jobDetails}>
          <View style={cardStyles.jobDetailRow}>
            <Ionicons name="person-outline" size={14} color="#64748b" />
            <Text style={{ fontSize: 13, flex: 1, color: isDark ? '#cbd5e1' : '#475569' }}>
              {job.customer.name}
            </Text>
          </View>
          <View style={cardStyles.jobDetailRow}>
            <Ionicons name="location-outline" size={14} color="#64748b" />
            <Text 
              style={{ fontSize: 13, flex: 1, color: isDark ? '#cbd5e1' : '#475569' }}
              numberOfLines={1}
            >
              {job.address}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={cardStyles.jobActions}>
          <TouchableOpacity style={cardStyles.jobActionBtn} onPress={handleNavigate}>
            <Ionicons name="navigate" size={18} color="#3b82f6" />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#3b82f6' }}>Navigate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cardStyles.jobActionBtn} onPress={handleCall}>
            <Ionicons name="call" size={18} color="#10b981" />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#10b981' }}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[cardStyles.startJobBtn, { 
              backgroundColor: job.status === 'IN_PROGRESS' ? '#10b981' : '#3b82f6' 
            }]}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
              {job.status === 'IN_PROGRESS' ? 'View Job' : 'Start Job'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}

// Helper functions
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'SCHEDULED': return { color: '#f59e0b', bg: '#fef3c7', label: 'Scheduled' };
    case 'DISPATCHED': return { color: '#3b82f6', bg: '#dbeafe', label: 'Dispatched' };
    case 'EN_ROUTE': return { color: '#60a5fa', bg: '#dbeafe', label: 'En Route' };
    case 'IN_PROGRESS': return { color: '#10b981', bg: '#d1fae5', label: 'In Progress' };
    case 'COMPLETED': return { color: '#6b7280', bg: '#f3f4f6', label: 'Completed' };
    default: return { color: '#6b7280', bg: '#f3f4f6', label: status };
  }
}

function getPriorityConfig(priority: string) {
  switch (priority) {
    case 'EMERGENCY': return { color: '#dc2626', icon: 'alert-circle' };
    case 'HIGH': return { color: '#f59e0b', icon: 'warning' };
    default: return { color: '#6b7280', icon: null };
  }
}

const styles = StyleSheet.create({});

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerLeft: {},
  greeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  userName: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  tenantName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  clockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
  },
  clockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  clockStatus: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  clockTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  clockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  clockButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: isDark ? '#f1f5f9' : '#1e293b',
    marginBottom: 12,
    marginTop: 8,
  },
  quickActionsContainer: {
    gap: 12,
    paddingBottom: 8,
  },
  quickActionBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 80,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
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
  jobCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  jobTypeIndicator: {
    width: 4,
  },
  jobContent: {
    flex: 1,
    padding: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  jobTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  jobTime: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 4,
  },
  jobDuration: {
    fontSize: 13,
    color: '#94a3b8',
  },
  jobDetails: {
    marginTop: 12,
    gap: 6,
  },
  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobDetailText: {
    fontSize: 13,
    flex: 1,
  },
  jobActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#334155' : '#f1f5f9',
    gap: 12,
  },
  jobActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  startJobBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  startJobText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  calendarCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? '#1e3a8a' : '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: '700',
    color: isDark ? '#f1f5f9' : '#1e293b',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#334155' : '#e2e8f0',
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
});
