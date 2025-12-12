import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockSchedule: Record<string, Array<{ id: string; title: string; time: string; customer: string }>> = {
  [format(new Date(), 'yyyy-MM-dd')]: [
    { id: '1', title: 'HVAC Maintenance', time: '9:00 AM', customer: 'John Smith' },
    { id: '2', title: 'AC Repair', time: '1:00 PM', customer: 'Sarah Johnson' },
  ],
  [format(addDays(new Date(), 1), 'yyyy-MM-dd')]: [
    { id: '3', title: 'Furnace Installation', time: '8:00 AM', customer: 'Mike Williams' },
  ],
  [format(addDays(new Date(), 2), 'yyyy-MM-dd')]: [
    { id: '4', title: 'Duct Cleaning', time: '10:00 AM', customer: 'Emily Brown' },
  ],
};

export default function ScheduleScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const styles = createStyles(isDark);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const jobsForDay = mockSchedule[selectedDateKey] || [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Week Selector */}
      <View style={styles.weekSelector}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={() => setWeekStart(addDays(weekStart, -7))} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
          <Text style={styles.monthText}>{format(weekStart, 'MMMM yyyy')}</Text>
          <TouchableOpacity onPress={() => setWeekStart(addDays(weekStart, 7))} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDays}>
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const hasJobs = mockSchedule[format(day, 'yyyy-MM-dd')]?.length > 0;

            return (
              <TouchableOpacity
                key={day.toISOString()}
                onPress={() => setSelectedDate(day)}
                style={[
                  styles.dayButton,
                  isSelected && styles.dayButtonSelected,
                  isToday && !isSelected && styles.dayButtonToday,
                ]}
              >
                <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                  {format(day, 'EEE')}
                </Text>
                <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                  {format(day, 'd')}
                </Text>
                {hasJobs && !isSelected && <View style={styles.jobIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Day Schedule */}
      <ScrollView style={styles.scheduleList}>
        <Text style={styles.dateTitle}>{format(selectedDate, 'EEEE, MMMM d')}</Text>

        {jobsForDay.length > 0 ? (
          jobsForDay.map((job) => (
            <TouchableOpacity key={job.id} style={styles.jobCard} activeOpacity={0.7}>
              <View style={styles.timeColumn}>
                <Text style={styles.jobTime}>{job.time}</Text>
              </View>
              <View style={styles.jobDetails}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobCustomer}>👤 {job.customer}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No jobs scheduled</Text>
            <Text style={styles.emptySubtext}>This day is free</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#111827' : '#f3f4f6',
  },
  weekSelector: {
    backgroundColor: isDark ? '#1f2937' : 'white',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#374151' : '#e5e7eb',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: isDark ? 'white' : '#111827',
  },
  weekDays: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 10,
  },
  dayButtonSelected: {
    backgroundColor: '#2563eb',
  },
  dayButtonToday: {
    backgroundColor: isDark ? '#374151' : '#f3f4f6',
  },
  dayName: {
    fontSize: 12,
    color: '#6b7280',
  },
  dayNameSelected: {
    color: '#bfdbfe',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
    color: isDark ? 'white' : '#111827',
  },
  dayNumberSelected: {
    color: 'white',
  },
  jobIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563eb',
    marginTop: 4,
  },
  scheduleList: {
    flex: 1,
    padding: 16,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: isDark ? 'white' : '#111827',
  },
  jobCard: {
    flexDirection: 'row',
    backgroundColor: isDark ? '#1f2937' : 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  timeColumn: {
    marginRight: 16,
    alignItems: 'center',
  },
  jobTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  jobDetails: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? 'white' : '#111827',
  },
  jobCustomer: {
    color: '#6b7280',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: isDark ? '#1f2937' : 'white',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
});
