import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { JobCard } from '../../components/jobs/JobCard';
import { useAuthStore } from '../../stores/authStore';

const mockJobs = [
  {
    id: '1',
    title: 'HVAC Maintenance',
    status: 'SCHEDULED' as const,
    customer: 'John Smith',
    time: '9:00 AM',
    address: '123 Main St, Austin',
    priority: 'HIGH' as const,
  },
  {
    id: '2',
    title: 'AC Repair',
    status: 'IN_PROGRESS' as const,
    customer: 'Sarah Johnson',
    time: '1:00 PM',
    address: '456 Oak Ave, Austin',
    priority: 'NORMAL' as const,
  },
  {
    id: '3',
    title: 'Furnace Installation',
    status: 'SCHEDULED' as const,
    customer: 'Mike Williams',
    time: '4:00 PM',
    address: '789 Pine Rd, Round Rock',
  },
];

export default function TodayScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState(mockJobs);
  const [clockedIn, setClockedIn] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleStatusChange = (jobId: string, newStatus: string) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === jobId ? { ...job, status: newStatus as any } : job
      )
    );

    // Show success feedback
    if (newStatus === 'COMPLETED') {
      Alert.alert(
        '✅ Job Completed!',
        'Great work! The job has been marked as complete.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleQuickAction = async (jobId: string, action: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    switch (action) {
      case 'call':
        // In real app, would have customer phone
        Alert.alert('Call Customer', `Calling ${job.customer}...`);
        break;
      case 'navigate':
        // Open in maps
        const address = encodeURIComponent(job.address);
        const url = `maps://app?daddr=${address}`;
        Linking.openURL(url).catch(() => {
          Alert.alert('Error', 'Unable to open maps');
        });
        break;
      case 'time':
        Alert.alert('Scheduled Time', `This job is scheduled for ${job.time}`);
        break;
    }
  };

  const toggleClock = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setClockedIn(!clockedIn);
    Alert.alert(
      clockedIn ? 'Clocked Out' : 'Clocked In',
      clockedIn
        ? 'You have been clocked out. Have a great day!'
        : 'You are now clocked in. Let\'s get to work!',
      [{ text: 'OK' }]
    );
  };

  // Job statistics
  const stats = {
    scheduled: jobs.filter(j => j.status === 'SCHEDULED').length,
    inProgress: jobs.filter(j => j.status === 'IN_PROGRESS').length,
    completed: jobs.filter(j => j.status === 'COMPLETED').length,
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-900" edges={['bottom']}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header with Clock In/Out */}
        <View className="bg-primary-600 pb-6">
          <View className="px-4 pt-4 flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-white/80 text-sm">
                {format(new Date(), 'EEEE')}
              </Text>
              <Text className="text-white text-3xl font-bold">
                {format(new Date(), 'MMM d')}
              </Text>
              <Text className="text-white/80 mt-1">
                {stats.scheduled} jobs today
              </Text>
            </View>

            {/* Big Clock In/Out Button */}
            <TouchableOpacity
              onPress={toggleClock}
              className={`px-6 py-3 rounded-full ${
                clockedIn ? 'bg-red-500' : 'bg-green-500'
              }`}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={clockedIn ? 'time' : 'time-outline'}
                  size={24}
                  color="white"
                />
                <Text className="text-white font-semibold ml-2">
                  {clockedIn ? 'Clock Out' : 'Clock In'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View className="flex-row mt-4 px-4">
            <View className="flex-1 items-center">
              <Text className="text-white text-2xl font-bold">{stats.scheduled}</Text>
              <Text className="text-white/80 text-sm">Pending</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-white text-2xl font-bold">{stats.inProgress}</Text>
              <Text className="text-white/80 text-sm">Active</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-white text-2xl font-bold">{stats.completed}</Text>
              <Text className="text-white/80 text-sm">Done</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-4 -mt-4">
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
            <Text className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              QUICK ACTIONS
            </Text>
            <View className="flex-row -mx-1">
              <TouchableOpacity
                className="flex-1 mx-1 bg-blue-50 dark:bg-blue-900/20 py-4 rounded-xl items-center"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/camera');
                }}
              >
                <Ionicons name="camera" size={28} color="#2563eb" />
                <Text className="text-blue-600 text-sm mt-1">Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 mx-1 bg-green-50 dark:bg-green-900/20 py-4 rounded-xl items-center"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/notes');
                }}
              >
                <Ionicons name="mic" size={28} color="#10b981" />
                <Text className="text-green-600 text-sm mt-1">Note</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 mx-1 bg-purple-50 dark:bg-purple-900/20 py-4 rounded-xl items-center"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/signature');
                }}
              >
                <Ionicons name="create" size={28} color="#8b5cf6" />
                <Text className="text-purple-600 text-sm mt-1">Sign</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 mx-1 bg-orange-50 dark:bg-orange-900/20 py-4 rounded-xl items-center"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/emergency');
                }}
              >
                <Ionicons name="warning" size={28} color="#f97316" />
                <Text className="text-orange-600 text-sm mt-1">SOS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Jobs List */}
        <View className="px-4 mt-6">
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-3">
            TODAY'S JOBS
          </Text>

          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onStatusChange={handleStatusChange}
              onQuickAction={handleQuickAction}
            />
          ))}

          {jobs.length === 0 && (
            <View className="items-center py-12">
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
              <Text className="text-gray-500 text-lg mt-4">All done for today!</Text>
              <Text className="text-gray-400 mt-2">Great work! 🎉</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button - Voice Assistant */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-16 h-16 bg-primary-600 rounded-full items-center justify-center shadow-lg"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/(tabs)/aira');
        }}
      >
        <Ionicons name="mic" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}