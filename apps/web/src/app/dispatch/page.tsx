'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { jobService } from '@/services/jobService';
import { employeeService } from '@/services/employeeService';
import { Job } from '@/types/database.types';
import { Employee } from '@/services/employeeService';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';

interface TaskCard {
  id: string;
  title: string;
  customer: string;
  status: string;
  statusColor: string;
  roomNumber?: string;
  additionalTaskCount: number;
}

interface DayColumn {
  date: Date;
  dateLabel: string;
  dayName: string;
  isToday: boolean;
}

export default function DispatchCalendarPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // State
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [draggedJob, setDraggedJob] = useState<{ jobId: string; sourceEmployeeId: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    task: '',
    status: '',
    customer: '',
    createdBy: '',
    taskStart: '',
    lastUpdate: '',
  });

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch employees
  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => employeeService.getAllEmployees(),
    enabled: isAuthenticated,
  });

  // Fetch jobs for the week
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
  const { data: jobs = [], isLoading: jobsLoading, refetch: refetchJobs } = useQuery<Job[]>({
    queryKey: ['dispatch-jobs', currentWeekStart.toISOString()],
    queryFn: () => jobService.getAllJobs({
      scheduledFrom: currentWeekStart.toISOString(),
      scheduledTo: weekEnd.toISOString(),
    }),
    enabled: isAuthenticated,
  });

  // Generate week columns
  const weekColumns: DayColumn[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeekStart, i);
    return {
      date,
      dateLabel: format(date, 'd'),
      dayName: format(date, 'EEEE'),
      isToday: isSameDay(date, new Date()),
    };
  });

  // Navigate weeks
  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, jobId: string, sourceEmployeeId: string) => {
    setDraggedJob({ jobId, sourceEmployeeId });
    setIsDragging(true);

    // Create custom drag preview
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      const dragPreview = document.createElement('div');
      dragPreview.style.cssText = `
        position: absolute;
        top: -1000px;
        left: -1000px;
        padding: 12px 16px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        min-width: 200px;
        max-width: 250px;
        pointer-events: none;
        z-index: 9999;
      `;
      
      dragPreview.innerHTML = `
        <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${job.title || 'Untitled Job'}
        </div>
        <div style="font-size: 13px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${job.customer?.displayName || 'No customer'}
        </div>
      `;
      
      document.body.appendChild(dragPreview);
      e.dataTransfer.setDragImage(dragPreview, 125, 30);
      
      // Remove preview after drag starts
      setTimeout(() => {
        document.body.removeChild(dragPreview);
      }, 0);
    }
  };

  const handleDragEnd = () => {
    setDraggedJob(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetEmployeeId: string, targetDate: Date) => {
    e.preventDefault();
    
    if (!draggedJob) return;

    const { jobId, sourceEmployeeId } = draggedJob;
    
    try {
      // Set scheduled date to the target date
      const scheduledStart = new Date(targetDate);
      scheduledStart.setHours(9, 0, 0, 0); // Default 9 AM start
      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setHours(17, 0, 0, 0); // Default 5 PM end

      console.log('Attempting to update job:', jobId);
      console.log('Target employee:', targetEmployeeId);
      console.log('Scheduled start:', scheduledStart.toISOString());

      // Try to update job with new schedule and status
      try {
        await jobService.updateJob(jobId, {
          scheduledStart: scheduledStart.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
          status: 'DISPATCHED',
        });
        console.log('Job updated successfully');
      } catch (updateError: any) {
        console.error('Job update failed:', updateError);
        throw new Error('Unable to update job schedule. Backend API may not be running.');
      }

      // Try to handle employee assignment if different
      if (sourceEmployeeId !== targetEmployeeId && targetEmployeeId) {
        try {
          // Remove old assignment if exists
          if (sourceEmployeeId && sourceEmployeeId.trim() !== '') {
            try {
              await jobService.unassignEmployee(jobId, sourceEmployeeId);
              console.log('Old employee unassigned successfully');
            } catch (unassignError: any) {
              console.warn('Could not remove old assignment:', unassignError);
              // Continue anyway - might not have existed
            }
          }
          
          // Add new assignment
          await jobService.assignEmployee(jobId, targetEmployeeId, 'PRIMARY');
          console.log('New employee assigned successfully');
        } catch (assignError: any) {
          console.warn('Assignment failed:', assignError);
        }
      }

      // Refetch jobs to update UI
      await refetchJobs();
      
      setToast({ message: 'Job scheduled successfully!', type: 'success' });
    } catch (error: any) {
      console.error('Error in handleDrop:', error);
      setToast({ 
        message: error.message || 'Failed to assign job. Please ensure the backend API is running.', 
        type: 'error' 
      });
    } finally {
      handleDragEnd();
    }
  };

  const handleDropToTaskTable = async (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedJob) return;

    const { jobId, sourceEmployeeId } = draggedJob;
    
    try {
      console.log('Moving job back to task table:', jobId);

      // Remove employee assignment
      if (sourceEmployeeId && sourceEmployeeId.trim() !== '') {
        try {
          await jobService.unassignEmployee(jobId, sourceEmployeeId);
          console.log('Employee unassigned successfully');
        } catch (unassignError: any) {
          console.warn('Could not remove assignment:', unassignError);
        }
      }

      // Update job to unscheduled status and clear dates
      await jobService.updateJob(jobId, {
        status: 'UNSCHEDULED',
        scheduledStart: null,
        scheduledEnd: null,
      });
      console.log('Job unscheduled successfully');

      // Refetch jobs to update UI
      await refetchJobs();
      
      setToast({ message: 'Job moved back to task table!', type: 'success' });
    } catch (error: any) {
      console.error('Error moving to task table:', error);
      setToast({ 
        message: error.message || 'Failed to move job. Please try again.', 
        type: 'error' 
      });
    } finally {
      handleDragEnd();
    }
  };

  // Group jobs by employee and date
  const getJobsForEmployeeAndDate = (employeeId: string, date: Date): TaskCard[] => {
    const dayJobs = jobs.filter(job => {
      if (!job.scheduledStart) return false;
      const jobDate = parseISO(job.scheduledStart);
      const hasEmployee = job.assignments?.some(a => a.employeeId === employeeId);
      return isSameDay(jobDate, date) && hasEmployee;
    });

    if (dayJobs.length === 0) return [];

    // Show first job as card, count rest
    const firstJob = dayJobs[0];
    const customer = firstJob.customer?.displayName || 'No customer';
    
    return [{
      id: firstJob.id,
      title: firstJob.title || 'Untitled',
      customer: customer,
      status: getStatusLabel(firstJob.status),
      statusColor: getStatusColor(firstJob.status),
      roomNumber: undefined, // We'll add this later
      additionalTaskCount: dayJobs.length > 1 ? dayJobs.length - 1 : 0,
    }];
  };

  // Get status label and color
  const getStatusLabel = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'UNSCHEDULED': 'Pending',
      'SCHEDULED': 'Waiting',
      'DISPATCHED': 'Dispatched',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'ON_HOLD': 'Pending',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colorMap: { [key: string]: string } = {
      'UNSCHEDULED': 'bg-red-100 text-red-800',
      'SCHEDULED': 'bg-yellow-100 text-yellow-800',
      'DISPATCHED': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-purple-100 text-purple-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'ON_HOLD': 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  // Filter active dispatch-enabled employees
  const activeEmployees = employees.filter(emp => 
    emp.isDispatchEnabled && !emp.isArchived
  );

  // Filter unassigned/unscheduled jobs for task detail table
  const unassignedJobs = jobs.filter(job => 
    !job.assignments || job.assignments.length === 0 || job.status === 'UNSCHEDULED'
  );

  // Apply filters to unassigned jobs
  const filteredJobs = unassignedJobs.filter(job => {
    const matchTask = !filters.task || job.title?.toLowerCase().includes(filters.task.toLowerCase());
    const matchStatus = !filters.status || getStatusLabel(job.status).toLowerCase().includes(filters.status.toLowerCase());
    const matchCustomer = !filters.customer || 
      job.customer?.displayName?.toLowerCase().includes(filters.customer.toLowerCase());
    const matchTaskStart = !filters.taskStart || 
      (job.scheduledStart && format(parseISO(job.scheduledStart), 'MMM d, yyyy').toLowerCase().includes(filters.taskStart.toLowerCase()));
    const matchLastUpdate = !filters.lastUpdate || 
      (job.updatedAt && format(parseISO(job.updatedAt), 'MMM d, yyyy').toLowerCase().includes(filters.lastUpdate.toLowerCase()));
    
    return matchTask && matchStatus && matchCustomer && matchTaskStart && matchLastUpdate;
  });

  // Loading state
  if (authLoading || employeesLoading || jobsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
                {toast.type === 'error' ? 'Error Occurred' : 'Success!'}
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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dispatch Calendar</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {format(currentWeekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Week Navigation */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={goToPreviousWeek}
                  className="p-1.5 rounded-md hover:bg-gray-100"
                >
                  <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={goToToday}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Today
                </button>
                <button
                  onClick={goToNextWeek}
                  className="p-1.5 rounded-md hover:bg-gray-100"
                >
                  <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="px-6 pt-3 pb-2">
        <div className="bg-white rounded-lg shadow overflow-hidden" style={{ maxHeight: '40vh', display: 'flex', flexDirection: 'column' }}>
          {/* Calendar Header - Days */}
          <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Employees ({activeEmployees.length})
            </div>
            {weekColumns.map((col, idx) => (
              <div
                key={idx}
                className={`px-2 py-2 text-center text-xs font-medium uppercase tracking-wider ${
                  col.isToday ? 'bg-red-50 text-red-600' : 'text-gray-500'
                }`}
              >
                <div className="font-semibold text-xs">{col.dayName}</div>
                <div className={`text-xl mt-0.5 ${col.isToday ? 'text-red-600' : 'text-gray-900'}`}>
                  {col.dateLabel}
                  {col.isToday && <div className="w-1 h-1 bg-red-600 rounded-full mx-auto mt-0.5"></div>}
                </div>
              </div>
            ))}
          </div>

          {/* Calendar Body - Employee Rows */}
          <div className="divide-y divide-gray-200 overflow-y-auto flex-1">
            {activeEmployees.map((employee) => (
              <div key={employee.id} className="grid grid-cols-8 hover:bg-gray-50 w-full">
                {/* Employee Column */}
                <div className="px-3 py-2 flex items-center space-x-2 border-r border-gray-200">
                  <div className="flex-shrink-0">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                      style={{ backgroundColor: employee.colorHex || '#3B82F6' }}
                    >
                      {employee.firstName?.[0]}{employee.lastName?.[0]}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {employee.firstName} {employee.lastName}
                    </p>
                  </div>
                </div>

                {/* Day Columns */}
                {weekColumns.map((col, idx) => {
                  const tasks = getJobsForEmployeeAndDate(employee.id, col.date);
                  return (
                    <div
                      key={idx}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, employee.id, col.date)}
                      className={`px-1.5 py-1.5 border-r border-gray-200 min-h-[70px] transition-colors ${
                        isDragging ? 'hover:bg-blue-50' : ''
                      }`}
                    >
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id, employee.id)}
                          onDragEnd={handleDragEnd}
                          className="mb-1.5 last:mb-0 cursor-move"
                          onClick={() => setSelectedTask(task.id)}
                        >
                          <div className="bg-white border border-gray-200 rounded p-1.5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate leading-tight">
                                  {task.title}
                                </p>
                                <p className="text-[10px] text-gray-500 truncate mt-0.5">
                                  {task.customer}
                                </p>
                                {task.additionalTaskCount > 0 && (
                                  <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                                    +{task.additionalTaskCount} Task{task.additionalTaskCount > 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Detail Panel (Bottom) */}
      <div className="px-6 pt-2 pb-6">
        <div 
          className="bg-white rounded-lg shadow"
          onDragOver={handleDragOver}
          onDrop={handleDropToTaskTable}
          style={{ maxHeight: '30vh', display: 'flex', flexDirection: 'column' }}
        >
          <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Task Details</h2>
              {isDragging && (
                <p className="text-xs text-gray-500 mt-0.5">Drop here to unassign and move back to task list</p>
              )}
            </div>
            <button
              onClick={() => {
                if (showFilters) {
                  // Reset filters when hiding
                  setFilters({
                    task: '',
                    status: '',
                    customer: '',
                    createdBy: '',
                    taskStart: '',
                    lastUpdate: '',
                  });
                }
                setShowFilters(!showFilters);
              }}
              className={`p-1.5 rounded-md transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Toggle filters"
            >
              <FunnelIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created by
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task Start
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Update
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
                {/* Filter Row */}
                {showFilters && (
                  <tr className="bg-white border-b border-gray-200">
                    <th className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Filter task..."
                        value={filters.task}
                        onChange={(e) => setFilters({...filters, task: e.target.value})}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </th>
                    <th className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Filter status..."
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </th>
                    <th className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Filter customer..."
                        value={filters.customer}
                        onChange={(e) => setFilters({...filters, customer: e.target.value})}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </th>
                    <th className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Filter created by..."
                        value={filters.createdBy}
                        onChange={(e) => setFilters({...filters, createdBy: e.target.value})}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </th>
                    <th className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Filter date..."
                        value={filters.taskStart}
                        onChange={(e) => setFilters({...filters, taskStart: e.target.value})}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </th>
                    <th className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Filter date..."
                        value={filters.lastUpdate}
                        onChange={(e) => setFilters({...filters, lastUpdate: e.target.value})}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </th>
                    <th className="px-4 py-2">
                      {/* Empty for actions column */}
                    </th>
                  </tr>
                )}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs.slice(0, 10).map((job) => {
                  const currentAssignedEmployeeId = job.assignments?.[0]?.employeeId || '';
                  return (
                  <tr 
                    key={job.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, job.id, currentAssignedEmployeeId)}
                    onDragEnd={handleDragEnd}
                    className="hover:bg-gray-50 cursor-move"
                  >
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                        {getStatusLabel(job.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {job.customer?.displayName || 'No customer'}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-semibold text-white">
                          DA
                        </div>
                        <div className="ml-2 text-sm text-gray-900">Admin</div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-500">
                      {job.scheduledStart ? format(parseISO(job.scheduledStart), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-500">
                      {job.updatedAt ? format(parseISO(job.updatedAt), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-gray-600">
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
