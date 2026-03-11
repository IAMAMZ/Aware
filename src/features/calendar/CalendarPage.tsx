import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { CalendarEvent } from '../../types';
import { Calendar, Clock, Zap } from 'lucide-react';

const ENERGY_TYPES = ['deep', 'admin', 'creative', 'physical', 'social', 'rest'];

export default function CalendarPage() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [energyType, setEnergyType] = useState('admin');
  const [isFocusBlock, setIsFocusBlock] = useState(false);
  const [notes, setNotes] = useState('');

  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar-events', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user!.id)
        .gte('start_time', new Date(Date.now() - 86400000).toISOString()) // yesterday onwards
        .order('start_time', { ascending: true })
        .limit(30);
      if (error) throw error;
      return data as CalendarEvent[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !startTime || !endTime) throw new Error('Title, start, and end time required');
      const { error } = await supabase.from('calendar_events').insert({
        user_id: user!.id,
        title: title.trim(),
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        energy_type: energyType,
        is_focus_block: isFocusBlock,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setTitle(''); setStartTime(''); setEndTime(''); setNotes('');
      setIsFocusBlock(false); setShowForm(false);
    },
  });

  const grouped = events?.reduce((acc, e) => {
    const day = new Date(e.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (!acc[day]) acc[day] = [];
    acc[day].push(e);
    return acc;
  }, {} as Record<string, CalendarEvent[]>) || {};

  const formatTime = (t: string) =>
    new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const durationMins = (start: string, end: string) =>
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-main">Calendar & Energy Blocks</h1>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Event'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Event</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <input type="text" placeholder="Event title..." value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Start</label>
                <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">End</label>
                <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary" />
              </div>
            </div>

            <div>
              <p className="text-xs text-text-muted mb-2">Energy type</p>
              <div className="flex flex-wrap gap-2">
                {ENERGY_TYPES.map((e) => (
                  <button key={e} onClick={() => setEnergyType(e)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${energyType === e ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div onClick={() => setIsFocusBlock(!isFocusBlock)}
                className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${isFocusBlock ? 'bg-primary' : 'bg-border'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isFocusBlock ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-sm text-text-muted">Focus block</span>
            </label>

            <input type="text" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary" />

            <Button variant="primary" onClick={() => addMutation.mutate()} disabled={addMutation.isPending} className="w-full">
              {addMutation.isPending ? 'Adding...' : 'Add Event'}
            </Button>
            {addMutation.isError && <p className="text-danger text-sm">{(addMutation.error as Error).message}</p>}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-text-muted text-sm">Loading...</p>
      ) : !Object.keys(grouped).length ? (
        <div className="text-center py-12 text-text-muted">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No upcoming events. Add one above.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([day, dayEvents]) => (
          <div key={day}>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">{day}</h2>
            <div className="space-y-2">
              {dayEvents.map((event) => (
                <Card key={event.id} className={event.is_focus_block ? 'border-primary/30 bg-primary/5' : ''}>
                  <CardContent className="p-4 flex items-center gap-4">
                    {event.is_focus_block && <Zap className="w-5 h-5 text-primary flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-main">{event.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(event.start_time)} – {formatTime(event.end_time)}
                          <span className="ml-1">({durationMins(event.start_time, event.end_time)}m)</span>
                        </span>
                        {event.energy_type && <span className="text-xs text-primary">{event.energy_type}</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
