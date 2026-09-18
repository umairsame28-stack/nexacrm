'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, parseISO,
} from 'date-fns';
import { useCalendarEvents, useDeleteEvent, type CalendarEvent } from '@/queries/calendar.queries';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EventForm } from '@/components/features/calendar/event-form';
import { cn } from '@/lib/cn';

const EVENT_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

// Chart token mapping for event colors - Premium Indigo/Violet Palette
const CHART_COLORS = [
  'rgb(99 102 241)',    // chart-1: Primary Indigo
  'rgb(139 92 246)',    // chart-2: Accent Violet
  'rgb(59 130 246)',    // chart-3: Info Blue
  'rgb(16 185 129)',    // chart-4: Success Green  
  'rgb(245 158 11)',    // chart-5: Warning Amber
  'rgb(239 68 68)',     // chart-6: Danger Red
];

function EventDot({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  // Support both old hex format (from DB) and new RGB format
  const eventColor = event.color ?? CHART_COLORS[0];
  const isRgbFormat = eventColor.startsWith('rgb(');
  
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      aria-label={`Event: ${event.title} at ${event.allDay ? format(parseISO(event.startAt), 'MMMM d') : format(parseISO(event.startAt), 'h:mm a')}`}
      className="w-full text-left rounded-md px-2 py-1 text-xs font-medium truncate hover:shadow-sm transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
      style={{ 
        backgroundColor: isRgbFormat ? `${eventColor} / 0.15` : `${eventColor}15`,
        color: eventColor,
        borderLeft: `3px solid ${eventColor}`
      }}
    >
      <span className="group-hover:underline">
        {event.allDay ? '🗓️ ' : format(parseISO(event.startAt), 'h:mm a') + ' '}
        {event.title}
      </span>
    </button>
  );
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [clickedDate, setClickedDate] = useState<Date | null>(null);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const deleteEvent = useDeleteEvent();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const { data: events = [], isLoading, isError, error, refetch } = useCalendarEvents(calStart, calEnd);

  const getEventsForDay = (day: Date) =>
    events.filter(e => isSameDay(parseISO(e.startAt), day));

  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );

  return (
    <div>
      <PageHeader
        title="Calendar"
        actions={
          <Button size="sm" onClick={() => { setClickedDate(new Date()); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> New Event
          </Button>
        }
      />

      {/* Month navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            aria-label="Previous month"
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-xl font-bold text-foreground min-w-[180px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            aria-label="Next month"
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle (mobile only) */}
          <div className="md:hidden flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'month' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background text-muted-foreground hover:text-foreground'
              )}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors border-l border-border',
                viewMode === 'agenda' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-background text-muted-foreground hover:text-foreground'
              )}
            >
              Agenda
            </button>
          </div>
          <button 
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <CalIcon className="h-4 w-4 inline mr-1.5 -mt-0.5" />
            Today
          </button>
        </div>
      </div>

      {/* Calendar grid (desktop) / Agenda view (mobile) */}
      {isLoading ? (
        <>
          {/* Month view skeleton (desktop) */}
          <div className="hidden md:block rounded-xl border border-border overflow-hidden bg-card shadow-sm">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/50">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <div key={d} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">{d}</div>
              ))}
            </div>
            {/* Skeleton day cells */}
            <div className="grid grid-cols-7">
              {Array.from({ length: 35 }).map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'min-h-28 p-2 border-r border-b border-border/50',
                    idx % 7 === 6 && 'border-r-0'
                  )}
                >
                  <Skeleton className="h-7 w-7 rounded-full mb-1.5" />
                  <div className="space-y-1">
                    {Math.random() > 0.6 && <Skeleton className="h-6 w-full rounded" />}
                    {Math.random() > 0.8 && <Skeleton className="h-6 w-full rounded" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Agenda view skeleton (mobile) */}
          <div className="md:hidden space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-1 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mb-4">
            <CalIcon className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Events</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            {error instanceof Error ? error.message : 'Unable to fetch calendar events. Please check your connection and try again.'}
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* Month view - hidden on mobile when agenda mode */}
          <div className={cn(
            "rounded-xl border border-border overflow-hidden bg-card shadow-sm",
            viewMode === 'agenda' && 'hidden md:block'
          )}
          role="grid"
          aria-label="Calendar month view"
          >
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/50">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <div key={d} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 relative">
              {days.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => { setClickedDate(day); setFormOpen(true); }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${format(day, 'EEEE, MMMM d, yyyy')}${dayEvents.length > 0 ? `, ${dayEvents.length} ${dayEvents.length === 1 ? 'event' : 'events'}` : ', no events'}. Click to create event.`}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setClickedDate(day); setFormOpen(true); }}}
                    className={cn(
                      'min-h-28 p-2 border-r border-b border-border/50 cursor-pointer hover:bg-accent/50 transition-colors group',
                      idx % 7 === 6 && 'border-r-0',
                      !isCurrentMonth && 'bg-muted/5',
                      isTodayDate && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={cn(
                        'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                        isTodayDate 
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary/20' 
                          : isCurrentMonth 
                          ? 'text-foreground group-hover:bg-muted' 
                          : 'text-muted-foreground/50',
                      )}>
                        {format(day, 'd')}
                      </div>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <EventDot key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-[10px] font-medium text-muted-foreground pl-2 py-1">
                          +{dayEvents.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Empty state overlay for month view */}
              {events.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] pointer-events-none">
                  <div className="text-center p-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                      <CalIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Events This Month</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Click any day to create your first event
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Agenda view - mobile only */}
          <div className={cn(
            "md:hidden space-y-3",
            viewMode === 'month' && 'hidden'
          )}>
            {sortedEvents.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <CalIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No events this month</p>
              </div>
            ) : (
              sortedEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  aria-label={`View event: ${event.title} on ${event.allDay ? format(parseISO(event.startAt), 'EEEE, MMMM d') : format(parseISO(event.startAt), 'EEEE, MMMM d at h:mm a')}`}
                  className="w-full rounded-lg border border-border bg-card p-4 text-left hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="h-12 w-1 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: event.color ?? CHART_COLORS[0] }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground mb-1">
                        {event.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {event.allDay 
                          ? format(parseISO(event.startAt), 'EEE, MMM d')
                          : `${format(parseISO(event.startAt), 'EEE, MMM d · h:mm a')} – ${format(parseISO(event.endAt), 'h:mm a')}`
                        }
                      </p>
                      {event.location && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          📍 {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}

      {/* Event detail popover */}
      {selectedEvent && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setSelectedEvent(null)} aria-hidden="true" />
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-detail-title"
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl border border-border bg-popover shadow-2xl animate-fade-in"
          >
            <div className="p-6 space-y-4">
              {/* Header with color indicator and title */}
              <div className="flex items-start gap-3">
                <div 
                  className="h-10 w-1 rounded-full flex-shrink-0 mt-1" 
                  style={{ backgroundColor: selectedEvent.color ?? CHART_COLORS[0] }} 
                />
                <div className="flex-1 min-w-0">
                  <h3 id="event-detail-title" className="font-semibold text-lg text-foreground leading-tight mb-1">
                    {selectedEvent.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalIcon className="h-3.5 w-3.5" />
                    <span>
                      {selectedEvent.allDay 
                        ? format(parseISO(selectedEvent.startAt), 'EEE, MMM d, yyyy')
                        : `${format(parseISO(selectedEvent.startAt), 'EEE, MMM d · h:mm a')} – ${format(parseISO(selectedEvent.endAt), 'h:mm a')}`
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Event details */}
              <div className="space-y-3">
                {selectedEvent.location && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground mt-0.5">📍</span>
                    <span className="text-foreground">{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.description && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground mt-0.5">📝</span>
                    <p className="text-foreground whitespace-pre-wrap">{selectedEvent.description}</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => { 
                    setEventToEdit(selectedEvent);
                    setFormOpen(true); 
                    setSelectedEvent(null);
                  }}
                >
                  Edit Event
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => { 
                    setEventToDelete(selectedEvent);
                    setDeleteConfirmOpen(true);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {formOpen && (
        <EventForm
          defaultDate={clickedDate ?? undefined}
          event={eventToEdit ?? undefined}
          onClose={() => { 
            setFormOpen(false); 
            setClickedDate(null);
            setEventToEdit(null);
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirmOpen && eventToDelete && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmOpen(false)} aria-hidden="true" />
          <div 
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl border border-border bg-background shadow-2xl p-6 animate-fade-in"
          >
            <h3 id="delete-dialog-title" className="text-lg font-semibold text-foreground mb-2">Delete Event</h3>
            <p id="delete-dialog-description" className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete "{eventToDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setEventToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  deleteEvent.mutate(eventToDelete.id);
                  setDeleteConfirmOpen(false);
                  setEventToDelete(null);
                  setSelectedEvent(null);
                }}
              >
                Delete Event
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
