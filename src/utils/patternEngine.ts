import type { MoodLog, FocusSession, DistractionLog } from '../types';

// Utility for AI and Pattern extraction
export const patternEngine = {
    getRecentMoodAverage: (moods: MoodLog[]): number => {
        if (!moods.length) return 0;
        const sum = moods.reduce((acc, log) => acc + log.mood_score, 0);
        return sum / moods.length;
    },

    calculateFocusEfficiency: (sessions: FocusSession[]): number => {
        if (!sessions.length) return 0;
        const completed = sessions.filter(s => s.completion_status === 'completed').length;
        return (completed / sessions.length) * 100;
    },

    analyzeDistractionTriggers: (distractions: DistractionLog[]): Record<string, number> => {
        const triggers: Record<string, number> = {};
        distractions.forEach(d => {
            triggers[d.trigger_tag] = (triggers[d.trigger_tag] || 0) + 1;
        });
        return triggers;
    }
};
