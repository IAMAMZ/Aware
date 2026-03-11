import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import type { InsightsCache } from '../../types';
import { BrainCircuit, TrendingUp } from 'lucide-react';

const INSIGHT_ICONS: Record<string, string> = {
  focus: '🎯',
  mood: '💭',
  sleep: '🌙',
  nutrition: '🥗',
  distraction: '📱',
  environment: '🎵',
  pattern: '📊',
};

export default function InsightsPage() {
  const { user } = useAppStore();

  const { data: insights, isLoading } = useQuery({
    queryKey: ['insights', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insights_cache')
        .select('*')
        .eq('user_id', user!.id)
        .order('generated_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as InsightsCache[];
    },
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <BrainCircuit className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold text-text-main">AI Counsellor & Patterns</h1>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5 flex gap-4 items-start">
          <TrendingUp className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-main">How insights work</p>
            <p className="text-xs text-text-muted mt-1">
              Insights are generated from your logged data across mood, sleep, focus sessions, food, distractions, and environment context.
              The more you log, the more accurate and personalized your insights become.
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-text-muted text-sm">Loading insights...</p>
      ) : !insights?.length ? (
        <div className="text-center py-16 text-text-muted space-y-3">
          <BrainCircuit className="w-16 h-16 mx-auto opacity-20" />
          <p className="text-lg font-medium">No insights yet</p>
          <p className="text-sm max-w-sm mx-auto">
            Start logging your mood, sleep, food, and focus sessions. Insights will appear here as patterns emerge in your data.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <Card key={insight.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span>{INSIGHT_ICONS[insight.insight_type] || '💡'}</span>
                  <span className="capitalize">{insight.insight_type.replace(/_/g, ' ')}</span>
                  <span className="ml-auto text-xs font-normal text-text-muted">
                    {new Date(insight.generated_at).toLocaleDateString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-main leading-relaxed">{insight.insight_body}</p>
                {(insight.data_range_start || insight.data_range_end) && (
                  <p className="text-xs text-text-muted mt-3">
                    Data range: {insight.data_range_start} → {insight.data_range_end}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
