import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { User, Globe, Pill, Download, CheckCircle, Loader } from 'lucide-react';

// ── Timezone list (common ones — enough for a class project) ───────────
const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Amsterdam',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland',
];

// ── Data export ────────────────────────────────────────────────────────
async function exportAllData(userId: string): Promise<void> {
  const tables = [
    'mood_logs', 'sleep_logs', 'focus_sessions', 'food_logs',
    'distraction_logs', 'journal_entries', 'tasks', 'calendar_events',
    'medication_logs', 'urge_surf_logs',
  ];

  const results: Record<string, unknown[]> = {};
  await Promise.all(
    tables.map(async (table) => {
      const { data } = await supabase.from(table).select('*').eq('user_id', userId);
      results[table] = data || [];
    })
  );

  const payload = {
    exported_at: new Date().toISOString(),
    app: 'Aware — ADHD Health Tracker',
    note: 'This file contains all your personal health data from Aware. You own this data.',
    data: results,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aware-health-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Toggle switch ──────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
        on ? 'bg-primary' : 'bg-border'
      }`}
      role="switch"
      aria-checked={on}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {children}
      </CardContent>
    </Card>
  );
}

// ── Main ───────────────────────────────────────────────────────────────
export default function Settings() {
  const { user, updateUser } = useAppStore();

  const [savingMed, setSavingMed] = useState(false);
  const [savedMed, setSavedMed] = useState(false);
  const [timezone, setTimezone] = useState(user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [savingTz, setSavingTz] = useState(false);
  const [savedTz, setSavedTz] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const handleMedToggle = async (val: boolean) => {
    setSavingMed(true);
    await updateUser({ medication_tracking: val });
    setSavingMed(false);
    setSavedMed(true);
    setTimeout(() => setSavedMed(false), 2000);
  };

  const handleSaveTz = async () => {
    setSavingTz(true);
    await updateUser({ timezone });
    setSavingTz(false);
    setSavedTz(true);
    setTimeout(() => setSavedTz(false), 2000);
  };

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    await exportAllData(user.id);
    setExporting(false);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <h1 className="text-3xl font-bold text-text-main">Settings</h1>

      {/* ── Account ── */}
      <Section icon={<User className="w-5 h-5 text-primary" />} title="Account">
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Email</label>
          <div className="mt-1.5 px-3 py-2.5 bg-forest rounded-lg border border-border text-sm text-text-main">
            {user?.email || '—'}
          </div>
          <p className="text-xs text-text-muted mt-1">Email cannot be changed here. Contact support to update.</p>
        </div>
      </Section>

      {/* ── Timezone ── */}
      <Section icon={<Globe className="w-5 h-5 text-primary" />} title="Timezone">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Your timezone</label>
            <p className="text-xs text-text-muted mt-0.5">Used for daily summaries and streak calculation.</p>
          </div>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary"
          >
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <button
            onClick={handleSaveTz}
            disabled={savingTz || timezone === user?.timezone}
            className="px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {savingTz && <Loader className="w-3.5 h-3.5 animate-spin" />}
            {savedTz ? <><CheckCircle className="w-3.5 h-3.5" /> Saved!</> : 'Save timezone'}
          </button>
        </div>
      </Section>

      {/* ── ADHD preferences ── */}
      <Section icon={<Pill className="w-5 h-5 text-violet-400" />} title="ADHD Preferences">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-text-main">Medication tracking</p>
            <p className="text-sm text-text-muted mt-0.5">
              Shows a daily medication check-in prompt and includes medication data in your Health Patterns analysis.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {savingMed && <Loader className="w-4 h-4 animate-spin text-text-muted" />}
            {savedMed && <CheckCircle className="w-4 h-4 text-primary" />}
            <Toggle
              on={user?.medication_tracking ?? false}
              onChange={handleMedToggle}
            />
          </div>
        </div>
        <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <p className="text-xs text-text-muted leading-relaxed">
            <strong className="text-text-main">Why track medication?</strong> Correlating medication days with focus
            duration and mood helps you and your provider understand what's working. All data stays on your account.
          </p>
        </div>
      </Section>

      {/* ── Data export ── */}
      <Section icon={<Download className="w-5 h-5 text-primary" />} title="Your Data">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-text-main">Export all health data</p>
            <p className="text-sm text-text-muted mt-0.5">
              Download every log, session, and journal entry as a JSON file. You own your data — export it anytime
              to share with a therapist, ADHD coach, or for your own records.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-forest border border-border space-y-2">
            <p className="text-xs font-medium text-text-main">Includes:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                'Mood logs', 'Sleep logs', 'Focus sessions', 'Food & GI logs',
                'Distraction logs', 'Journal entries', 'Tasks', 'Calendar events',
                'Medication logs', 'Urge surf logs',
              ].map(item => (
                <p key={item} className="text-xs text-text-muted flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-primary inline-block shrink-0" />
                  {item}
                </p>
              ))}
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting || !user}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {exporting
              ? <><Loader className="w-4 h-4 animate-spin" /> Preparing export…</>
              : exportDone
                ? <><CheckCircle className="w-4 h-4" /> Downloaded!</>
                : <><Download className="w-4 h-4" /> Export my data</>
            }
          </button>

          <p className="text-xs text-text-muted">
            File format: JSON · Health data portability standard · No account deletion required
          </p>
        </div>
      </Section>

      {/* ── Privacy note ── */}
      <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/10">
        <p className="text-xs text-text-muted leading-relaxed">
          <strong className="text-text-main">Privacy:</strong> All your health data is stored securely in your personal
          account and never shared or sold. Aware is a personal health tracking tool — your data belongs to you.
        </p>
      </div>
    </div>
  );
}
