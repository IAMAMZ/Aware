export interface User {
  id: string;
  email: string;
  timezone: string;
  medication_tracking: boolean;
}

export type GICategory = 'low' | 'medium' | 'high' | 'zero';
export type MealType = 'meal' | 'snack' | 'caffeine' | 'water' | 'supplement' | 'alcohol';
export type EatingContext = 'planned' | 'impulsive' | 'stress' | 'boredom' | 'forgot' | 'not_hungry' | 'social';

export interface FoodLog {
  id: string;
  user_id: string;
  timestamp: string;
  food_name: string;
  gi_category: GICategory;
  gl_value: number | null;
  meal_type: MealType;
  eating_context: EatingContext;
  hunger_level: number;
  post_meal_energy: string | null;
  satisfaction: string | null;
  notes: string | null;
}

export interface SleepLog {
  id: string;
  user_id: string;
  date: string;
  bedtime: string;
  wake_time: string;
  duration_hours: number;
  quality: number;
  sleep_type: string | null;
  pre_sleep_context: string[] | null;
}

export interface MoodLog {
  id: string;
  user_id: string;
  timestamp: string;
  mood_score: number;
  emotion_tags: string[] | null;
  stress_event: boolean;
  rsd_moment: boolean;
  notes: string | null;
}

export type EnergyTag = 'deep' | 'medium' | 'low' | 'autopilot';
export type CompletionStatus = 'completed' | 'partial' | 'abandoned';
export type EnvironmentType = 'silence' | 'music' | 'lo-fi' | 'white noise' | 'café' | 'office';

export interface FocusSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  task_label: string | null;
  /** stored in the music_type column */
  environment: EnvironmentType | null;
  energy_tag: EnergyTag;
  completion_status: CompletionStatus;
  contamination_score: number | null;
  interruption_count: number;
  notes: string | null;
}

export type DistractionCategory = 'social_media' | 'news' | 'stocks' | 'youtube' | 'email' | 'productivity_procrastination' | 'research_loop' | 'comparison' | 'notification' | 'other';
export type TriggerTag = 'boredom' | 'avoidance' | 'anxiety' | 'habit' | 'notification' | 'glucose_crash' | 'stress';

export interface DistractionLog {
  id: string;
  user_id: string;
  timestamp: string;
  category: DistractionCategory;
  domain: string | null;
  duration_minutes: number;
  trigger_tag: TriggerTag;
  intentional: boolean;
  post_mood: string | null;
  session_id: string | null;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  timestamp: string;
  body: string;
  tags: string[] | null;
  mood_at_writing: number | null;
  linked_session_id: string | null;
  prompt_used: string | null;
}

export type Priority = 'must_today' | 'should_this_week' | 'someday';
export type TaskSize = '5min' | '30min' | '2h_plus';
export type TaskEnergyType = 'deep' | 'admin' | 'creative' | 'physical';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  priority: Priority;
  size: TaskSize;
  energy_type: TaskEnergyType;
  due_date: string | null;
  completed: boolean;
  linked_session_id: string | null;
  notes: string | null;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  energy_type: string | null;
  is_focus_block: boolean;
  glucose_prep_noted: boolean;
  color: string | null;
  recurrence: string | null;
  notes: string | null;
}

export type CheckinStatus = 'on_track' | 'sidetracked';
export type SidetrackReason = 'phone' | 'email' | 'rabbit_hole' | 'snack' | 'rest' | 'other';

export interface CalendarCheckin {
  id: string;
  user_id: string;
  event_id: string;
  timestamp: string;
  status: CheckinStatus;
  sidetrack_reason: SidetrackReason | null;
}

export interface InsightsCache {
  id: string;
  user_id: string;
  generated_at: string;
  insight_type: string;
  insight_body: string;
  data_range_start: string;
  data_range_end: string;
}

export interface DailyIntention {
  id: string;
  user_id: string;
  date: string;
  intention: string | null;
  top_priorities: string[] | null;
  morning_energy: number | null;
  intention_met: boolean | null;
}

export type UrgeSurfTriggerSource = 'dashboard_button' | 'focus_nudge' | 'snack_sidetrack' | 'productivity_button';
export type UrgeSurfOutcome = 'redirected' | 'ate_anyway' | 'dismissed';

export interface UrgeSurfLog {
  id: string;
  user_id: string;
  timestamp: string;
  trigger_source: UrgeSurfTriggerSource;
  pre_intensity: number | null;
  post_intensity: number | null;
  outcome: UrgeSurfOutcome;
  redirect_activity: string | null;
  breathing_completed: boolean;
  notes: string | null;
  focus_session_id: string | null;
}
