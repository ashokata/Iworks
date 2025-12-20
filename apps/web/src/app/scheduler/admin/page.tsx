'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scheduleService } from '@/services/scheduleService';
import { Employee } from '@/types/database.types';
import { employeeService } from '@/services/employeeService';
import { useAuth } from '@/contexts/AuthContext';
import { ScheduleEvent, CalendarViewType, TechnicianResource } from '@/types/scheduleTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Import React Big Calendar components
// Note: You need to install this package:
// npm install react-big-calendar date-fns

// Configure localizer for the calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }), // 0 = Sunday
  getDay,
  locales,
});

const AdminSchedulerPage = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [currentView, setCurrentView] = useState<CalendarViewType>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);

  // Fetch employees (technicians)
  const {
    data: technicians = [],
    isLoading: technicianLoading,
    error: technicianError
  } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getAllEmployees({ isDispatchEnabled: true }),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Fetch schedule events
  const {
    data: scheduleEvents = [],
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents
  } = useQuery({
    queryKey: ['scheduleEvents', selectedTechnicians, currentDate],
    queryFn: () => {
      // Calculate start and end dates based on current view
      const start = new Date(currentDate);
      const end = new Date(currentDate);
      
      if (currentView === 'day') {
        // For day view, just use the current date
      } else if (currentView === 'week') {
        // For week view, get 7 days
        start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
        end.setDate(end.getDate() + (6 - end.getDay())); // End of week (Saturday)
      } else if (currentView === 'month') {
        // For month view, get entire month
        start.setDate(1); // Start of month
        end.setMonth(end.getMonth() + 1, 0); // End of month
      }
      
      return scheduleService.getScheduleEvents({
        technicianIds: selectedTechnicians.length > 0 ? selectedTechnicians : undefined,
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });
    },
    enabled: isAuthenticated && !authLoading
  });
  
  // Handle technician selection
  const toggleTechnicianSelection = (technicianId: string) => {
    setSelectedTechnicians(prev => {
      if (prev.includes(technicianId)) {
        return prev.filter(id => id !== technicianId);
      } else {
        return [...prev, technicianId];
      }
    });
  };

  // Select all technicians
  const selectAllTechnicians = () => {
    setSelectedTechnicians(technicians.map((tech: Technician) => tech.id));
  };

  // Clear technician selection
  const clearTechnicianSelection = () => {
    setSelectedTechnicians([]);
  };

  // Navigate to previous period
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  // Navigate to next period
  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format date range display
  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    };
    
    if (currentView === 'day') {
      return new Date(currentDate).toLocaleDateString(undefined, options);
    } else if (currentView === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
    } else if (currentView === 'month') {
      return new Date(currentDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    
    return '';
  };

  // Transform events for the calendar
  const calendarEvents = useMemo(() => {
    return scheduleEvents.map(event => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      resourceId: event.technicianId,
      allDay: event.allDay,
      status: event.status,
      type: event.type,
      location: event.location,
      description: event.description,
    }));
  }, [scheduleEvents]);

  // Create resources for the resource view (technicians)
  const resources = useMemo(() => {
    return technicians.map(tech => ({
      id: tech.id,
      title: tech.name,
      status: tech.status,
    }));
  }, [technicians]);

  // Event styling
  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#3174ad'; // default blue
    
    switch (event.type) {
      case 'job':
        backgroundColor = '#4dabf7'; // blue
        break;
      case 'meeting':
        backgroundColor = '#9775fa'; // purple
        break;
      case 'training':
        backgroundColor = '#51cf66'; // green
        break;
      case 'break':
        backgroundColor = '#868e96'; // gray
        break;
      default:
        backgroundColor = '#339af0'; // default blue
    }

    // Status affects opacity
    let opacity = 1;
    if (event.status === 'cancelled') {
      opacity = 0.5;
    }

    return {
      style: {
        backgroundColor,
        opacity,
        borderRadius: '4px',
        color: '#fff',
        border: 'none',
        display: 'block',
      },
    };
  };

  // Convert view types
  const getCalendarView = () => {
    switch (currentView) {
      case 'day':
        return Views.DAY;
      case 'week':
        return Views.WEEK;
      case 'month':
        return Views.MONTH;
      default:
        return Views.WEEK;
    }
  };

  // Event rendering with details
  const renderEvents = () => {
    if (eventsLoading) {
      return <div className="flex justify-center p-8">Loading...</div>;
    }
    
    if (eventsError) {
      return <div className="text-red-500 p-4">Error loading events</div>;
    }
    
    if (scheduleEvents.length === 0 && !eventsLoading) {
      return <div className="p-4 text-center text-gray-500">No events scheduled for this period</div>;
    }
    
    return (
      <div className="h-[700px] bg-white rounded-md border">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          view={getCalendarView()}
          views={[Views.DAY, Views.WEEK, Views.MONTH, Views.AGENDA]}
          onView={(view) => {
            switch (view) {
              case Views.DAY:
                setCurrentView('day');
                break;
              case Views.WEEK:
                setCurrentView('week');
                break;
              case Views.MONTH:
                setCurrentView('month');
                break;
              default:
                setCurrentView('week');
            }
          }}
          date={currentDate}
          onNavigate={date => setCurrentDate(date)}
          eventPropGetter={eventStyleGetter}
          resources={selectedTechnicians.length > 0 ? resources.filter(r => selectedTechnicians.includes(r.id)) : undefined}
          resourceIdAccessor="id"
          resourceTitleAccessor="title"
          toolbar={false}
          formats={{
            timeGutterFormat: (date) => format(date, 'h:mm a'),
            dayFormat: (date) => format(date, 'EEE MM/dd'),
            dayRangeHeaderFormat: ({ start, end }) => 
              `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
          }}
          tooltipAccessor={(event: any) => {
            return `${event.title} - ${event.location || 'No location'}`;
          }}
          components={{
            event: ({ event }) => (
              <div className="text-sm truncate px-1">
                {event.title}
                {event.location && <div className="text-xs opacity-80">{event.location}</div>}
              </div>
            ),
            timeGutterHeader: () => <div className="text-center">Time</div>
          }}
        />
      </div>
    );
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Admin Schedule</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setCurrentView('day')}
              className={currentView === 'day' ? 'bg-blue-50' : ''}
            >
              Day
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCurrentView('week')}
              className={currentView === 'week' ? 'bg-blue-50' : ''}
            >
              Week
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCurrentView('month')}
              className={currentView === 'month' ? 'bg-blue-50' : ''}
            >
              Month
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <Button variant="outline" onClick={goToPrevious}>Previous</Button>
              <Button variant="outline" onClick={goToToday}>Today</Button>
              <Button variant="outline" onClick={goToNext}>Next</Button>
            </div>
            <div className="font-medium">
              {formatDateRange()}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Technicians</CardTitle>
                  <div className="flex justify-between mt-2">
                    <Button size="sm" variant="outline" onClick={selectAllTechnicians}>Select All</Button>
                    <Button size="sm" variant="outline" onClick={clearTechnicianSelection}>Clear</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {technicianLoading ? (
                    <div>Loading...</div>
                  ) : technicianError ? (
                    <div className="text-red-500">Error loading technicians</div>
                  ) : (
                    <div className="space-y-2">
                      {technicians.map((tech: Technician) => (
                        <div 
                          key={tech.id}
                          className={`
                            p-2 rounded cursor-pointer flex items-center
                            ${selectedTechnicians.includes(tech.id) ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}
                          `}
                          onClick={() => toggleTechnicianSelection(tech.id)}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedTechnicians.includes(tech.id)}
                            onChange={() => {}} // Handled by the div click
                            className="mr-2"
                          />
                          <div>
                            <div className="font-medium">{tech.name}</div>
                            <div className="text-xs text-gray-500">{tech.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-3">
              {renderEvents()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSchedulerPage;
