'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scheduleService } from '@/services/scheduleService';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarViewType } from '@/types/scheduleTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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

const TechnicianSchedulePage = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [currentView, setCurrentView] = useState<CalendarViewType>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Verify user is a technician
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role !== 'Technician' && user?.role !== 'technician') {
      // If user is not a technician, redirect to appropriate page
      if (typeof window !== 'undefined') {
        window.location.href = '/scheduler/admin';
      }
    }
  }, [authLoading, isAuthenticated, user]);

  // Fetch schedule events for the current technician
  const {
    data: scheduleEvents = [],
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents
  } = useQuery({
    queryKey: ['technicianScheduleEvents', user?.id, currentDate, currentView],
    queryFn: () => {
      if (!user?.id) return Promise.resolve([]);
      
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
      
      return scheduleService.getTechnicianSchedule(
        user.id,
        start.toISOString(),
        end.toISOString()
      );
    },
    enabled: isAuthenticated && !authLoading && !!user?.id
  });

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

  // Group events by date
  const groupEventsByDate = () => {
    const groupedEvents: Record<string, typeof scheduleEvents> = {};
    
    scheduleEvents.forEach(event => {
      const date = new Date(event.start).toLocaleDateString();
      
      if (!groupedEvents[date]) {
        groupedEvents[date] = [];
      }
      
      groupedEvents[date].push(event);
    });
    
    return groupedEvents;
  };

  if (authLoading) {
    return <div className="p-4">Loading authentication details...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-4">Please login to view your schedule</div>;
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Schedule</CardTitle>
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
          
          <div className="h-[700px] bg-white rounded-md border">
            {eventsLoading ? (
              <div className="p-8 text-center">Loading your schedule...</div>
            ) : eventsError ? (
              <div className="p-4 text-red-500">Error loading schedule</div>
            ) : (
              <Calendar
                localizer={localizer}
                events={scheduleEvents.map(event => ({
                  id: event.id,
                  title: event.title,
                  start: new Date(event.start),
                  end: new Date(event.end),
                  allDay: event.allDay,
                  status: event.status,
                  type: event.type,
                  location: event.location,
                  description: event.description,
                  jobId: event.jobId,
                }))}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                view={(() => {
                  switch(currentView) {
                    case 'day': return Views.DAY;
                    case 'week': return Views.WEEK;
                    case 'month': return Views.MONTH;
                    default: return Views.WEEK;
                  }
                })()}
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
                toolbar={false}
                eventPropGetter={(event) => {
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
                }}
                formats={{
                  timeGutterFormat: (date) => format(date, 'h:mm a'),
                  dayFormat: (date) => format(date, 'EEE MM/dd'),
                  dayRangeHeaderFormat: ({ start, end }) => 
                    `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
                }}
                tooltipAccessor={(event) => {
                  return `${event.title} - ${event.location || 'No location'}`;
                }}
                components={{
                  event: (props) => (
                    <div className="text-sm truncate px-1">
                      <div>{props.event.title}</div>
                      {props.event.location && (
                        <div className="text-xs opacity-80">{props.event.location}</div>
                      )}
                    </div>
                  ),
                  agenda: {
                    event: (props) => (
                      <div className="flex items-center p-2">
                        <div 
                          className="w-4 h-4 rounded-full mr-2"
                          style={{
                            backgroundColor: 
                              props.event.type === 'job' ? '#4dabf7' : 
                              props.event.type === 'meeting' ? '#9775fa' : 
                              props.event.type === 'training' ? '#51cf66' : 
                              '#868e96'
                          }}
                        />
                        <div>
                          <div className="font-medium">{props.event.title}</div>
                          <div className="text-xs text-gray-500">
                            {props.event.location || 'No location'}
                          </div>
                        </div>
                      </div>
                    )
                  }
                }}
                popup
                selectable
                onSelectEvent={(event) => {
                  if (event.jobId) {
                    // Handle job detail navigation here
                    // router.push(`/jobs/${event.jobId}`);
                    alert(`View job details for ${event.title}`);
                  }
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicianSchedulePage;
