'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/services/customerService';
import { employeeService } from '@/services/employeeService';
import { appointmentService } from '@/services/appointmentService';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

type ViewMode = 'day' | 'week' | 'month';

export default function AppointmentsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  
  // Appointment form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [appointmentType, setAppointmentType] = useState('SERVICE');
  const [customerId, setCustomerId] = useState('');
  const [addressId, setAddressId] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [duration, setDuration] = useState('60');
  const [status, setStatus] = useState('SCHEDULED');
  const [priority, setPriority] = useState('NORMAL');
  const [assignedToId, setAssignedToId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
  // Ref for scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current && (viewMode === 'week' || viewMode === 'day')) {
      const now = new Date();
      const currentHour = now.getHours();
      // Scroll to 2 hours before current time for better context
      const scrollHour = Math.max(0, currentHour - 2);
      const scrollPosition = scrollHour * 80; // 80px per hour
      
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [viewMode]);

  // Fetch customers (verified only)
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAllCustomers(),
    enabled: isAuthenticated,
  });

  // Fetch employees (active only)
  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getAllEmployees(),
    enabled: isAuthenticated,
  });

  // Fetch appointments
  const { data: appointmentsData, isLoading: isLoadingAppointments, refetch: refetchAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentService.getAllAppointments(),
    enabled: isAuthenticated,
  });

  // Show all customers and employees
  const verifiedCustomers = customersData || [];
  const activeEmployees = employeesData || [];
  const appointments = appointmentsData || [];

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a8a]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  // Get week dates
  const getWeekDates = () => {
    const dates = [];
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day; // Start from Sunday
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      date.setDate(diff + i);
      dates.push(date);
    }
    return dates;
  };

  // Get month name
  const getMonthYear = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  // Get month calendar dates (including padding days from prev/next month)
  const getMonthDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay(); // Days from previous month
    const endPadding = 6 - lastDay.getDay(); // Days from next month
    
    const dates = [];
    
    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      dates.push({ date, currentMonth: false });
    }
    
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      dates.push({ date, currentMonth: true });
    }
    
    // Next month padding
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(year, month + 1, i);
      dates.push({ date, currentMonth: false });
    }
    
    return dates;
  };

  // Generate hour slots for day view
  const getHourSlots = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const hour12 = i === 0 ? 12 : i > 12 ? i - 12 : i;
      const ampm = i < 12 ? 'AM' : 'PM';
      hours.push({ hour24: i, display: `${hour12}:00 ${ampm}` });
    }
    return hours;
  };

  // Navigate dates
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const selectMonth = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
    setShowMonthPicker(false);
  };

  const selectYear = (year: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    setCurrentDate(newDate);
    setShowYearPicker(false);
  };

  const handleGridClick = (date: Date, hour?: number) => {
    // Clear selected appointment when creating new
    setSelectedAppointment(null);
    
    const selectedDate = new Date(date);
    if (hour !== undefined) {
      selectedDate.setHours(hour, 0, 0, 0);
    } else {
      selectedDate.setHours(9, 0, 0, 0); // Default to 9 AM
    }
    
    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const hours = String(selectedDate.getHours()).padStart(2, '0');
    const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
    const formattedStart = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Set end time 1 hour later
    const endDate = new Date(selectedDate);
    endDate.setHours(endDate.getHours() + 1);
    const endHours = String(endDate.getHours()).padStart(2, '0');
    const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
    const formattedEnd = `${year}-${month}-${day}T${endHours}:${endMinutes}`;
    
    setScheduledStart(formattedStart);
    setScheduledEnd(formattedEnd);
    setShowAppointmentModal(true);
  };

  const handleAppointmentClick = (appointment: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering grid click
    
    // Load appointment data into form
    setSelectedAppointment(appointment);
    setTitle(appointment.title || '');
    setDescription(appointment.description || '');
    setAppointmentType(appointment.appointmentType || 'SERVICE');
    setCustomerId(appointment.customerId || '');
    setAddressId(appointment.addressId || '');
    setScheduledStart(appointment.scheduledStart ? new Date(appointment.scheduledStart).toISOString().slice(0, 16) : '');
    setScheduledEnd(appointment.scheduledEnd ? new Date(appointment.scheduledEnd).toISOString().slice(0, 16) : '');
    setDuration(String(appointment.duration || 60));
    setStatus(appointment.status || 'SCHEDULED');
    setPriority(appointment.priority || 'NORMAL');
    setAssignedToId(appointment.assignedToId || '');
    setNotes(appointment.notes || '');
    
    setShowAppointmentModal(true);
  };

  const handleSaveAppointment = async () => {
    // Validate required fields
    if (!title || !customerId || !scheduledStart || !scheduledEnd) {
      alert('Please fill in all required fields:\n- Title\n- Customer\n- Start Time\n- End Time');
      console.error('[Calendar Page] Validation failed:', {
        hasTitle: !!title,
        hasCustomerId: !!customerId,
        hasScheduledStart: !!scheduledStart,
        hasScheduledEnd: !!scheduledEnd,
      });
      return;
    }

    console.log('[Calendar Page] Saving appointment with data:', {
      title,
      customerId,
      scheduledStart,
      scheduledEnd,
      duration,
      status,
      priority,
      description,
      appointmentType,
      addressId,
      assignedToId,
      notes,
    });

    setIsSaving(true);
    try {
      const appointmentData = {
        title,
        description: description || undefined,
        appointmentType: appointmentType || undefined,
        customerId,
        addressId: addressId || undefined,
        scheduledStart,
        scheduledEnd,
        duration: parseInt(duration),
        status: status || undefined,
        priority: priority || undefined,
        assignedToId: assignedToId || undefined,
        notes: notes || undefined,
      };

      let result;
      if (selectedAppointment) {
        // Update existing appointment
        result = await appointmentService.updateAppointment(selectedAppointment.id, appointmentData);
        console.log('[Calendar Page] Appointment updated successfully:', result);
        setToast({ message: 'Appointment updated successfully!', type: 'success' });
      } else {
        // Create new appointment
        result = await appointmentService.createAppointment(appointmentData);
        console.log('[Calendar Page] Appointment created successfully:', result);
        setToast({ message: 'Appointment created successfully!', type: 'success' });
      }
      
      // Close modal and reset form
      setShowAppointmentModal(false);
      resetForm();
      
      // Refetch appointments to update calendar display
      refetchAppointments();
    } catch (error: any) {
      console.error('[Calendar Page] Error saving appointment:', error);
      console.error('[Calendar Page] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create appointment';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedAppointment(null);
    setTitle('');
    setDescription('');
    setAppointmentType('SERVICE');
    setCustomerId('');
    setAddressId('');
    setScheduledStart('');
    setScheduledEnd('');
    setDuration('60');
    setStatus('SCHEDULED');
    setPriority('NORMAL');
    setAssignedToId('');
    setNotes('');
  };

  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const weekDates = getWeekDates();

  // Helper to get appointments for a specific date and time slot
  const getAppointmentsForSlot = (date: Date, hour: number) => {
    return appointments.filter((apt: any) => {
      const aptStart = new Date(apt.scheduledStart);
      const aptDate = new Date(aptStart.getFullYear(), aptStart.getMonth(), aptStart.getDate());
      const slotDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      return aptDate.getTime() === slotDate.getTime() && aptStart.getHours() === hour;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
          <div className={`flex items-start gap-4 px-5 py-4 rounded-xl shadow-2xl backdrop-blur-sm min-w-[420px] border ${
            toast.type === 'error' 
              ? 'bg-red-50/95 border-red-200'
              : 'bg-emerald-50/95 border-emerald-200'
          }`}>
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
              toast.type === 'error'
                ? 'bg-gradient-to-br from-red-500 to-red-600'
                : 'bg-gradient-to-br from-emerald-500 to-green-600'
            }`}>
              {toast.type === 'error' ? (
                <XMarkIcon className="h-6 w-6 text-white" />
              ) : (
                <CheckIcon className="h-6 w-6 text-white" />
              )}
            </div>
            <div className="flex-1 pt-1">
              <p className={`text-sm font-bold ${
                toast.type === 'error' ? 'text-red-900' : 'text-emerald-900'
              }`}>
                {toast.type === 'error' ? '⚠️ Error Occurred' : '✓ Success!'}
              </p>
              <p className={`text-sm mt-1.5 ${
                toast.type === 'error' ? 'text-red-700' : 'text-emerald-700'
              }`}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-all hover:rotate-90 duration-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e3a8a] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Calendar</h1>
              <p className="text-white/80 text-sm">Manage your schedule and appointments</p>
            </div>
            <button
              onClick={() => setShowAppointmentModal(true)}
              className="inline-flex items-center px-6 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-50 shadow-md hover:shadow-lg transition-all"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Appointment
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* View Mode Buttons */}
            <div className="inline-flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => setViewMode('day')}
                className={`px-6 py-2 text-sm font-medium transition-colors border-r border-gray-300 ${
                  viewMode === 'day'
                    ? 'bg-[#1e3a8a] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-6 py-2 text-sm font-medium transition-colors border-r border-gray-300 ${
                  viewMode === 'week'
                    ? 'bg-[#1e3a8a] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-[#1e3a8a] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Month
              </button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={navigatePrevious}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              
              {/* Month and Year Selectors */}
              <div className="flex items-center space-x-2 relative">
                <button
                  onClick={() => {
                    setShowMonthPicker(!showMonthPicker);
                    setShowYearPicker(false);
                  }}
                  className="px-4 py-2 text-lg font-semibold text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'][currentDate.getMonth()]}
                </button>
                
                <button
                  onClick={() => {
                    setShowYearPicker(!showYearPicker);
                    setShowMonthPicker(false);
                  }}
                  className="px-4 py-2 text-lg font-semibold text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {currentDate.getFullYear()}
                </button>

                {/* Month Picker Dropdown */}
                {showMonthPicker && (
                  <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2 grid grid-cols-3 gap-2">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                      <button
                        key={month}
                        onClick={() => selectMonth(index)}
                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                          currentDate.getMonth() === index
                            ? 'bg-[#1e3a8a] text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                )}

                {/* Year Picker Dropdown */}
                {showYearPicker && (
                  <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2 grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {Array.from({ length: 21 }, (_, i) => currentDate.getFullYear() - 10 + i).map((year) => (
                      <button
                        key={year}
                        onClick={() => selectYear(year)}
                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                          currentDate.getFullYear() === year
                            ? 'bg-[#1e3a8a] text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={navigateNext}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="w-[140px]"></div> {/* Spacer for alignment */}
          </div>
        </div>
      </div>

      {/* Week View Calendar */}
      {viewMode === 'week' && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Scrollable container wrapping entire calendar */}
            <div ref={scrollContainerRef} className="overflow-y-auto" style={{ maxHeight: '600px' }}>
              <div className="grid" style={{ gridTemplateColumns: '100px repeat(7, 1fr)' }}>
                {/* Week Header Row */}
                <div className="sticky top-0 z-20 border-r border-b border-gray-200 bg-gray-50 py-4"></div>
                {weekDates.map((date, index) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={index}
                      className="sticky top-0 z-20 py-4 text-center border-r last:border-r-0 border-b border-gray-200 bg-white"
                    >
                      <div className="text-xs font-medium mb-1 text-gray-600">
                        {dayNames[index]}
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          isToday
                            ? 'bg-[#1e3a8a] text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto'
                            : 'text-gray-900'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                    </div>
                  );
                })}
                
                {/* Time slots rows */}
                {getHourSlots().map((slot, hourIndex) => {
                  const now = new Date();
                  const currentHour = now.getHours();
                  const currentMinutes = now.getMinutes();
                  const isCurrentHour = currentHour === slot.hour24;
                  
                  return (
                    <React.Fragment key={`hour-${hourIndex}`}>
                      {/* Time label */}
                      <div className="flex items-start pt-2 px-4 text-sm text-gray-600 font-medium border-r border-b border-gray-200 bg-gray-50" style={{ height: '80px' }}>
                        {slot.display}
                      </div>
                      
                      {/* Day columns */}
                      {weekDates.map((date, dayIndex) => {
                        const slotAppointments = getAppointmentsForSlot(date, slot.hour24);
                        
                        return (
                          <div
                            key={`${hourIndex}-${dayIndex}`}
                            className="border-r last:border-r-0 border-b border-gray-200 hover:bg-gray-50 cursor-pointer relative"
                            style={{ height: '80px' }}
                            onDoubleClick={() => handleGridClick(date, slot.hour24)}
                          >
                            {/* Appointments in this slot */}
                            {slotAppointments.map((apt: any, aptIndex: number) => {
                              const aptCount = slotAppointments.length;
                              const heightPerApt = aptCount === 1 ? 50 : Math.min(30, Math.floor(60 / aptCount));
                              
                              return (
                                <div
                                  key={apt.id}
                                  className="absolute group"
                                  style={{ 
                                    top: `${2 + aptIndex * (heightPerApt + 2)}px`,
                                    left: '2px',
                                    right: '2px',
                                    height: `${heightPerApt}px`
                                  }}
                                >
                                  <div
                                    className="bg-blue-100 border-l-4 border-blue-500 rounded px-2 py-1 overflow-hidden z-20 cursor-pointer hover:bg-blue-200 transition-colors h-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAppointmentClick(apt, e);
                                    }}
                                  >
                                    <div className={`font-semibold text-blue-900 truncate ${aptCount === 1 ? 'text-sm' : 'text-xs'}`}>
                                      {apt.title}
                                    </div>
                                    <div className="text-blue-700 truncate text-xs">
                                      {apt.customer?.firstName} {apt.customer?.lastName}
                                    </div>
                                  </div>
                                  
                                  {/* Hover Tooltip */}
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-blue-900 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                                    <div className="font-semibold text-blue-100">{apt.customer?.firstName} {apt.customer?.lastName}</div>
                                    <div className="text-blue-200 text-xs mt-1">
                                      {new Date(apt.scheduledStart).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - {new Date(apt.scheduledEnd).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                    </div>
                                    {/* Arrow pointing down */}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-900"></div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Current time indicator - only show once per hour */}
                          {isCurrentHour && dayIndex === 0 && (
                            <div 
                              className="absolute z-30 pointer-events-none"
                              style={{ 
                                top: `${(currentMinutes / 60) * 80}px`,
                                left: '0',
                                right: `-${100 * 7}%`,
                                width: `${100 * 7}%`
                              }}
                            >
                              <div className="flex items-center group pointer-events-auto">
                                <div className="relative">
                                  <div className="w-3 h-3 rounded-full bg-[#1e3a8a] cursor-pointer"></div>
                                  {/* Tooltip */}
                                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                                    {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                </div>
                                <div className="flex-1 h-0.5 bg-[#1e3a8a]"></div>
                              </div>
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
            </div>
            <div ref={scrollContainerRef} className="overflow-y-auto relative" style={{ maxHeight: '600px' }}>
              {getHourSlots().map((slot, index) => {
                const now = new Date();
                const isCurrentHour = now.getHours() === slot.hour24 && 
                                     currentDate.toDateString() === now.toDateString();
                const isToday = currentDate.toDateString() === now.toDateString();
                const currentMinutes = now.getMinutes();
                
                return (
                  <div
                    key={index}
                    className="flex border-b border-gray-200 hover:bg-gray-50 transition-colors relative"
                    style={{ height: '80px' }}
                  >
                    <div className="w-24 flex items-start pt-2 px-4 text-sm text-gray-600 font-medium border-r border-gray-200">
                      {slot.display}
                    </div>
                    <div 
                      className="flex-1 cursor-pointer relative hover:bg-gray-50"
                      onDoubleClick={() => handleGridClick(currentDate, slot.hour24)}
                    >
                      {/* Appointments in this slot */}
                      {getAppointmentsForSlot(currentDate, slot.hour24).map((apt: any, aptIndex: number) => {
                        const aptCount = getAppointmentsForSlot(currentDate, slot.hour24).length;
                        const heightPerApt = aptCount === 1 ? 50 : Math.min(30, Math.floor(60 / aptCount));
                        
                        return (
                          <div
                            key={apt.id}
                            className="absolute group"
                            style={{ 
                              top: `${2 + aptIndex * (heightPerApt + 2)}px`,
                              left: '2px',
                              right: '2px',
                              height: `${heightPerApt}px`
                            }}
                          >
                            <div
                              className="bg-blue-100 border-l-4 border-blue-500 rounded px-3 py-2 overflow-hidden z-20 cursor-pointer hover:bg-blue-200 transition-colors h-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAppointmentClick(apt, e);
                              }}
                            >
                              <div className={`font-semibold text-blue-900 truncate ${aptCount === 1 ? 'text-base' : 'text-sm'}`}>
                                {apt.title}
                              </div>
                              <div className="text-blue-700 truncate text-xs">
                                {apt.customer?.firstName} {apt.customer?.lastName}
                              </div>
                            </div>
                            
                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-blue-900 text-white text-xs rounded-lg p-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                              <div className="font-semibold text-blue-100">{apt.customer?.firstName} {apt.customer?.lastName}</div>
                              <div className="text-blue-200 text-xs mt-1">
                                {new Date(apt.scheduledStart).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - {new Date(apt.scheduledEnd).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                              </div>
                              {/* Arrow pointing down */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-900"></div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Current time line */}
                      {isCurrentHour && isToday && (
                        <div 
                          className="absolute left-0 right-0 flex items-center z-30 group"
                          style={{ top: `${(currentMinutes / 60) * 80}px` }}
                        >
                          <div className="relative">
                            <div className="w-3 h-3 rounded-full bg-[#1e3a8a] ml-2 cursor-pointer"></div>
                            {/* Tooltip */}
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                              {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                          <div className="flex-1 h-0.5 bg-[#1e3a8a]"></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Month Grid Header */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                <div
                  key={index}
                  className="p-4 text-center text-sm font-semibold text-gray-700 bg-gray-50 border-r last:border-r-0 border-gray-200"
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Month Grid Body */}
            <div className="grid grid-cols-7">
              {getMonthDates().map((item, index) => {
                const isToday = item.date.toDateString() === new Date().toDateString();
                const isCurrentMonth = item.currentMonth;
                
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-3 border-r border-b last:border-r-0 border-gray-200 ${
                      !isCurrentMonth ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                    } cursor-pointer transition-colors`}
                    onDoubleClick={() => handleGridClick(item.date)}
                  >
                    <div
                      className={`text-sm font-medium mb-2 ${
                        isToday
                          ? 'bg-[#1e3a8a] text-white rounded-full w-7 h-7 flex items-center justify-center'
                          : !isCurrentMonth
                          ? 'text-gray-400'
                          : 'text-gray-900'
                      }`}
                    >
                      {item.date.getDate()}
                    </div>
                    {/* Appointments will be displayed here */}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#1e3a8a] to-[#1e3a8a] text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {selectedAppointment ? 'Edit Appointment' : 'Add Appointment'}
              </h2>
              <button
                onClick={() => {
                  setShowAppointmentModal(false);
                  resetForm();
                  setSelectedAppointment(null);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[#1e3a8a] mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1e3a8a] mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] placeholder:text-gray-400"
                      placeholder="Enter appointment title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1e3a8a] mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] placeholder:text-gray-400"
                      placeholder="Enter appointment description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1e3a8a] mb-2">
                        Appointment Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={appointmentType}
                        onChange={(e) => setAppointmentType(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                      >
                        <option value="CONSULTATION">Consultation</option>
                        <option value="SERVICE">Service</option>
                        <option value="INSTALLATION">Installation</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="REPAIR">Repair</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1e3a8a] mb-2">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                      >
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1e3a8a] mb-2">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Scheduling */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[#1e3a8a] mb-4">Scheduling</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1e3a8a] mb-2">
                        Scheduled Start <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledStart}
                        onChange={(e) => setScheduledStart(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1e3a8a] mb-2">
                        Scheduled End <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledEnd}
                        onChange={(e) => setScheduledEnd(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1e3a8a] mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] placeholder:text-gray-400"
                      placeholder="60"
                    />
                  </div>
                </div>
              </div>

              {/* Customer & Location */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[#1e3a8a] mb-4">Customer & Location</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1e3a8a] mb-2">
                      Select Customer <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                      disabled={isLoadingCustomers}
                    >
                      <option value="">
                        {isLoadingCustomers ? 'Loading customers...' : '-- Select a customer --'}
                      </option>
                      {verifiedCustomers.length > 0 ? (
                        verifiedCustomers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.displayName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unnamed Customer'} 
                            {customer.companyName && ` (${customer.companyName})`}
                          </option>
                        ))
                      ) : (
                        !isLoadingCustomers && <option value="" disabled>No customers found</option>
                      )}
                    </select>
                    {!isLoadingCustomers && verifiedCustomers.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">No verified customers available</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1e3a8a] mb-2">
                      Service Address
                    </label>
                    <input
                      type="text"
                      value={addressId}
                      onChange={(e) => setAddressId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] placeholder:text-gray-400"
                      placeholder="Enter service address or address ID"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-[#1e3a8a] mb-4">Notes</h3>
                <div>
                  <label className="block text-sm font-medium text-[#1e3a8a] mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] placeholder:text-gray-400"
                    placeholder="Add any internal notes"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAppointmentModal(false);
                  resetForm();
                }}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-all"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAppointment}
                disabled={isSaving || !title || !scheduledStart || !scheduledEnd || !customerId}
                className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-lg text-sm font-semibold hover:bg-[#152d6b] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Appointment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
