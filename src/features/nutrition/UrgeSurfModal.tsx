import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { UrgeSurfTriggerSource, UrgeSurfOutcome } from '../../types';
import { X, HeartPulse, ShieldAlert, Activity } from 'lucide-react';

interface UrgeSurfModalProps {
  onClose: () => void;
  triggerSource: UrgeSurfTriggerSource;
  activeFocusSessionId?: string | null;
  onRedirected?: () => void;
  onAteAnyway?: () => void;
}

type Step = 'intro' | 'breathe' | 'reassess' | 'done';

const REDIRECT_ACTIVITIES = [
  'Drink a glass of water',
  'Take a 2-min walk',
  'Do 10 stretches',
  'Text a friend',
  'Start a 5-min focus sprint',
  'Just sit with the feeling'
];

export default function UrgeSurfModal({
  onClose,
  triggerSource,
  activeFocusSessionId = null,
  onRedirected,
  onAteAnyway,
}: UrgeSurfModalProps) {
  const { user } = useAppStore();
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>('intro');
  const [breathingPhase, setBreathingPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [breatheProgress, setBreatheProgress] = useState(0); // 0 to 100
  const [preIntensity, setPreIntensity] = useState<number>(7);
  const [postIntensity, setPostIntensity] = useState<number>(5);
  const [redirectActivity, setRedirectActivity] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Constants for breathing
  const TOTAL_BREATHE_TIME = 90; // seconds
  const BREATHE_PHASES = { in: 4, hold: 4, out: 6 }; // 14s cycle

  // 1. Introduction message based on trigger
  const introMessage = {
    dashboard_button: "Feeling a craving coming on? That's completely normal.",
    focus_nudge: "Getting restless? Your brain might be looking for cheap dopamine.",
    snack_sidetrack: "A snack break sounds good, but let's check in first.",
    productivity_button: "Distracted by a craving? Let's take a quick pause.",
  }[triggerSource];

  // 2. Breathing timer logic
  useEffect(() => {
    if (step !== 'breathe') return;

    const startTime = Date.now();
    let phaseStart = startTime;
    let currentPhase: 'in' | 'hold' | 'out' = 'in';

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedTotal = (now - startTime) / 1000;
      const elapsedPhase = (now - phaseStart) / 1000;

      // Update total progress
      setBreatheProgress(Math.min(100, (elapsedTotal / TOTAL_BREATHE_TIME) * 100));

      if (elapsedTotal >= TOTAL_BREATHE_TIME) {
        clearInterval(interval);
        setStep('reassess');
        return;
      }

      // Handle phase transitions
      if (currentPhase === 'in' && elapsedPhase >= BREATHE_PHASES.in) {
        currentPhase = 'hold';
        phaseStart = now;
        setBreathingPhase('hold');
      } else if (currentPhase === 'hold' && elapsedPhase >= BREATHE_PHASES.hold) {
        currentPhase = 'out';
        phaseStart = now;
        setBreathingPhase('out');
      } else if (currentPhase === 'out' && elapsedPhase >= BREATHE_PHASES.out) {
        currentPhase = 'in';
        phaseStart = now;
        setBreathingPhase('in');
      }
    }, 100);

    return () => clearInterval(interval);
  }, [step]);

  // 3. Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (outcome: UrgeSurfOutcome) => {
      const { error } = await supabase.from('urge_surf_logs').insert({
        user_id: user!.id,
        timestamp: new Date().toISOString(),
        trigger_source: triggerSource,
        pre_intensity: preIntensity,
        post_intensity: step === 'intro' ? null : postIntensity,
        outcome,
        redirect_activity: redirectActivity,
        breathing_completed: step === 'reassess' || step === 'done',
        notes: notes || null,
        focus_session_id: activeFocusSessionId,
      });
      if (error) throw error;
      return outcome;
    },
    onSuccess: (outcome) => {
      qc.invalidateQueries({ queryKey: ['urge-surf-logs'] });
      
      if (outcome === 'redirected') {
        setStep('done');
        setTimeout(() => {
          onRedirected?.();
          onClose();
        }, 2000);
      } else if (outcome === 'ate_anyway') {
        onAteAnyway?.();
        onClose();
      } else {
        onClose();
      }
    },
  });

  const handleSkip = () => {
    saveMutation.mutate('dismissed');
  };

  const handleRedirect = () => {
    saveMutation.mutate('redirected');
  };

  const handleEat = () => {
    saveMutation.mutate('ate_anyway');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md shadow-2xl ring-1 ring-black/5 bg-card overflow-hidden relative rounded-[2rem]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <CardContent className="p-8">
          {/* STEP 1: INTRO */}
          {step === 'intro' && (
            <div className="text-center space-y-6 animate-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-main mb-2">Urge Surf</h2>
                <p className="text-sm text-text-muted">{introMessage}</p>
                <p className="text-sm text-text-muted mt-2">Let's pause. Cravings usually pass in a few minutes if we don't act on them immediately.</p>
              </div>

              <div className="space-y-3 mt-8">
                <div>
                  <label className="text-xs text-text-muted mb-2 block">How strong is the urge right now? ({preIntensity}/10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={preIntensity}
                    onChange={(e) => setPreIntensity(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>Mild</span>
                    <span>Overwhelming</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 space-y-3">
                <Button variant="primary" className="w-full text-lg py-5 rounded-full shadow-lg shadow-primary/20" onClick={() => setStep('breathe')}>
                  Surf the Urge (90s)
                </Button>
                <Button variant="ghost" className="w-full text-xs underline" onClick={handleSkip} disabled={saveMutation.isPending}>
                  Skip, I still want to eat
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: BREATHE */}
          {step === 'breathe' && (
            <div className="text-center space-y-12 py-8 animate-in fade-in duration-500">
              <h2 className="text-xl font-medium text-text-main">
                {breathingPhase === 'in' ? 'Breathe In...' :
                 breathingPhase === 'hold' ? 'Hold...' : 'Breathe Out...'}
              </h2>

              <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                {/* Expanding/Contracting Circle */}
                <div
                  className="absolute bg-primary/20 rounded-full transition-all duration-1000 ease-in-out flex items-center justify-center"
                  style={{
                    width: breathingPhase === 'in' || breathingPhase === 'hold' ? '100%' : '40%',
                    height: breathingPhase === 'in' || breathingPhase === 'hold' ? '100%' : '40%',
                  }}
                >
                  <div
                    className="bg-primary/40 rounded-full transition-all duration-1000 ease-in-out"
                    style={{
                      width: breathingPhase === 'in' || breathingPhase === 'hold' ? '70%' : '100%',
                      height: breathingPhase === 'in' || breathingPhase === 'hold' ? '70%' : '100%',
                    }}
                  />
                </div>
                {/* Static center dot */}
                <div className="absolute w-4 h-4 bg-primary rounded-full z-10" />
              </div>

              <div>
                <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-200" style={{ width: `${breatheProgress}%` }} />
                </div>
                <button
                  onClick={() => setStep('reassess')}
                  className="mt-6 text-xs text-text-muted hover:text-text-main underline"
                >
                  Skip breathing
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REASSESS */}
          {step === 'reassess' && (
            <div className="text-center space-y-6 animate-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-main mb-2">Check-in</h2>
                <p className="text-sm text-text-muted">Take a deep breath. How are you feeling now?</p>
              </div>

              <div className="space-y-3 bg-forest/50 ring-1 ring-inset ring-black/5 p-6 rounded-2xl">
                <label className="text-sm font-medium text-text-main mb-2 block">New urging intensity ({postIntensity}/10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={postIntensity}
                  onChange={(e) => setPostIntensity(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Gone</span>
                  <span>Same/Worse</span>
                </div>
              </div>

              {!redirectActivity && preIntensity - postIntensity > 0 && (
                <p className="text-xs text-primary font-medium">Great job! The craving decreased by {preIntensity - postIntensity} points.</p>
              )}

              <div className="text-left">
                <p className="text-xs text-text-muted mb-2 font-medium">Choose a redirect activity (optional):</p>
                <div className="flex flex-wrap gap-2">
                  {REDIRECT_ACTIVITIES.map((act) => (
                    <button
                      key={act}
                      onClick={() => setRedirectActivity(act === redirectActivity ? null : act)}
                      className={`px-4 py-2 rounded-full text-xs ring-1 ring-inset transition-all ${
                        redirectActivity === act ? 'bg-primary text-white ring-primary shadow-md' : 'bg-card ring-black/5 text-text-muted hover:ring-black/20 hover:text-text-main hover:bg-forest/50'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-left mt-2">
                <p className="text-xs text-text-muted mb-2 font-medium">Any notes? What triggered this? (optional)</p>
                <textarea
                  placeholder="e.g., Felt stuck on my project, just wanted dopamine..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-card ring-1 ring-inset ring-black/5 rounded-xl px-4 py-3 text-sm text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none shadow-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button variant="secondary" onClick={handleEat} disabled={saveMutation.isPending} className="whitespace-normal h-auto py-3 text-xs leading-relaxed border-warning hover:bg-warning/10 text-text-main">
                  I will have a<br/>mindful snack
                </Button>
                <Button variant="primary" onClick={handleRedirect} disabled={saveMutation.isPending} className="whitespace-normal h-auto py-3 text-xs leading-relaxed">
                  I will redirect<br/>my energy
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: DONE */}
          {step === 'done' && (
            <div className="text-center space-y-4 py-8 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                <HeartPulse className="w-10 h-10 animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold text-text-main">Awesome Job!</h2>
              <p className="text-sm text-text-muted">You successfully rode the wave. That builds massive resilience.</p>
              <p className="text-xs font-semibold text-primary">Closing...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
