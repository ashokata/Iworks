import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  useColorScheme,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { useRouter } from 'expo-router';

interface Job {
  id: string;
  title: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  customer: string;
  time: string;
  address: string;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
}

interface JobCardProps {
  job: Job;
  onStatusChange: (jobId: string, newStatus: string) => void;
  onQuickAction: (jobId: string, action: string) => void;
}

export function JobCard({ job, onStatusChange, onQuickAction }: JobCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const swipeableRef = useRef<Swipeable>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return '#3b82f6';
      case 'IN_PROGRESS': return '#10b981';
      case 'COMPLETED': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'HIGH': return '#ef4444';
      case 'LOW': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  const renderLeftActions = () => {
    return (
      <TouchableOpacity
        className="bg-green-500 justify-center px-8 rounded-l-xl"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          if (job.status === 'SCHEDULED') {
            onStatusChange(job.id, 'IN_PROGRESS');
          } else if (job.status === 'IN_PROGRESS') {
            onStatusChange(job.id, 'COMPLETED');
          }
          swipeableRef.current?.close();
        }}
      >
        <View className="items-center">
          <Ionicons name="checkmark-circle" size={32} color="white" />
          <Text className="text-white text-xs mt-1">
            {job.status === 'SCHEDULED' ? 'Start' : 'Complete'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRightActions = () => {
    return (
      <View className="flex-row">
        <TouchableOpacity
          className="bg-blue-500 justify-center px-6"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onQuickAction(job.id, 'call');
            swipeableRef.current?.close();
          }}
        >
          <Ionicons name="call" size={28} color="white" />
          <Text className="text-white text-xs mt-1">Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-orange-500 justify-center px-6 rounded-r-xl"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onQuickAction(job.id, 'navigate');
            swipeableRef.current?.close();
          }}
        >
          <Ionicons name="navigate" size={28} color="white" />
          <Text className="text-white text-xs mt-1">Nav</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableOpen={(direction) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <TouchableOpacity
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 mb-3 shadow-sm`}
        activeOpacity={0.9}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/job/${job.id}`);
        }}
      >
        {/* Priority Indicator */}
        {job.priority && (
          <View
            className="absolute top-0 right-4 h-12 w-1 rounded-b-full"
            style={{ backgroundColor: getPriorityColor(job.priority) }}
          />
        )}

        {/* Job Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-4">
            <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {job.title}
            </Text>
            <View className="flex-row items-center mt-1">
              <Ionicons name="person" size={16} color="#6b7280" />
              <Text className="text-gray-600 dark:text-gray-400 ml-1 text-base">
                {job.customer}
              </Text>
            </View>
          </View>
          <View
            className="px-3 py-1.5 rounded-full"
            style={{ backgroundColor: getStatusColor(job.status) + '20' }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: getStatusColor(job.status) }}
            >
              {job.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {/* Time and Location - Large touch targets */}
        <View className="space-y-2">
          <TouchableOpacity
            className="flex-row items-center py-2"
            onPress={() => onQuickAction(job.id, 'time')}
          >
            <View className="w-8 h-8 items-center justify-center">
              <Ionicons name="time-outline" size={20} color="#6b7280" />
            </View>
            <Text className="text-gray-600 dark:text-gray-400 ml-2 text-base">
              {job.time}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center py-2"
            onPress={() => onQuickAction(job.id, 'navigate')}
          >
            <View className="w-8 h-8 items-center justify-center">
              <Ionicons name="location-outline" size={20} color="#6b7280" />
            </View>
            <Text className="text-gray-600 dark:text-gray-400 ml-2 text-base flex-1">
              {job.address}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions - Big Thumb Targets */}
        <View className="flex-row mt-4 -mx-2">
          <TouchableOpacity
            className={`flex-1 mx-2 py-4 rounded-xl items-center ${
              job.status === 'IN_PROGRESS'
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (job.status === 'SCHEDULED') {
                onStatusChange(job.id, 'IN_PROGRESS');
              } else if (job.status === 'IN_PROGRESS') {
                onStatusChange(job.id, 'COMPLETED');
              }
            }}
          >
            <Ionicons
              name={job.status === 'IN_PROGRESS' ? 'checkmark-circle' : 'play-circle'}
              size={24}
              color="white"
            />
            <Text className="text-white font-semibold mt-1">
              {job.status === 'IN_PROGRESS' ? 'Complete Job' : 'Start Job'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}