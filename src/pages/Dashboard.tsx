import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TrendChart, CategoryBarChart } from '../components/charts/Charts';
import { evaluateGIRisk } from '../utils/gi';
import { getHoursBetween } from '../utils/dateHelpers';
import { 
  Smile, 
  Moon, 
  Timer, 
  Smartphone, 
  Play, 
  BookText, 
  Utensils 
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAppStore();

  const { data: todayStats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString();
      
      // 1. Mood
      const { data: moodData } = await supabase
        .from('mood_logs')
        .select('mood_score')
        .eq('user_id', user!.id)
        .gte('timestamp', todayStr)
        .order('timestamp', { ascending: false })
        .limit(1);

      // 2. Sleep (Last night)
      const { data: sleepData } = await supabase
        .from('sleep_logs')
        .select('duration_hours, quality')
        .eq('user_id', user!.id)
        .gte('bedtime', yesterdayStr)
        .order('bedtime', { ascending: false })
        .limit(1);

      // 3. Focus Mins
      const { data: focusData } = await supabase
        .from('focus_sessions')
        .select('duration_minutes')
        .eq('user_id', user!.id)
        .gte('started_at', todayStr);
        
      const totalFocus = focusData?.reduce((acc: number, curr: any) => acc + (curr.duration_minutes || 0), 0) || 0;

      // 4. Distraction Mins
      const { data: distData } = await supabase
        .from('distraction_logs')
        .select('duration_minutes')
        .eq('user_id', user!.id)
        .gte('timestamp', todayStr);
        
      const totalDist = distData?.reduce((acc: number, curr: any) => acc + (curr.duration_minutes || 0), 0) || 0;

      // 5. GI Risk
      const { data: foodData } = await supabase
        .from('food_logs')
        .select('gi_category, timestamp')
        .eq('user_id', user!.id)
        .order('timestamp', { ascending: false })
        .limit(1);
        
      let giRisk = 'safe';
      if (foodData && foodData.length > 0) {
        const hoursSince = getHoursBetween(foodData[0].timestamp, new Date().toISOString());
        giRisk = evaluateGIRisk(foodData[0].gi_category as any, hoursSince);
      }

      return {
        mood: moodData?.[0]?.mood_score || null,
        sleep: sleepData?.[0] || null,
        focusMins: totalFocus,
        distractMins: totalDist,
        giRisk: giRisk as 'safe' | 'warning' | 'danger'
      };
    }
  });

  // Mock data for charts
  const focusTimelineData = [
    { name: '8am', value: 0 },
    { name: '10am', value: 45 },
    { name: '12pm', value: 20 },
    { name: '2pm', value: 90 },
    { name: '4pm', value: 30 },
  ];

  const distractionData = [
    { name: 'Social', value: 45 },
    { name: 'News', value: 20 },
    { name: 'YouTube', value: 60 },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-main">
          Hello, {user?.email?.split('@')[0]}
        </h1>
        <div className="text-sm text-text-muted">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="secondary" className="h-auto py-3 flex-col gap-2 border-border shadow-sm">
          <Utensils className="w-5 h-5 text-primary" />
          <span>Log Food</span>
        </Button>
        <Button variant="primary" className="h-auto py-3 flex-col gap-2">
          <Play className="w-5 h-5 text-white fill-white" />
          <span>Start Focus</span>
        </Button>
        <Button variant="secondary" className="h-auto py-3 flex-col gap-2 border-border shadow-sm">
          <Smile className="w-5 h-5 text-warning" />
          <span>Mood Check</span>
        </Button>
        <Button variant="secondary" className="h-auto py-3 flex-col gap-2 border-border shadow-sm">
          <BookText className="w-5 h-5 text-text-main" />
          <span>Journal Entry</span>
        </Button>
      </div>

      {/* Status Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <Smile className="w-8 h-8 text-warning" />
            <div className="text-2xl font-bold text-text-main">
              {isLoading ? '-' : todayStats?.mood ? `${todayStats.mood}/5` : 'None'}
            </div>
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Today's Mood</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <Moon className="w-8 h-8 text-primary-light" />
            <div className="text-2xl font-bold text-text-main">
              {isLoading ? '-' : todayStats?.sleep ? `${todayStats.sleep.duration_hours}h` : 'No log'}
            </div>
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Last Night</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <Timer className="w-8 h-8 text-primary" />
            <div className="text-2xl font-bold text-text-main">
              {isLoading ? '-' : `${todayStats?.focusMins || 0}m`}
            </div>
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Focus Time</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <Smartphone className="w-8 h-8 text-danger" />
            <div className="text-2xl font-bold text-text-main">
              {isLoading ? '-' : `${todayStats?.distractMins || 0}m`}
            </div>
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Distraction</div>
          </CardContent>
        </Card>

        <Card className={
          todayStats?.giRisk === 'danger' ? 'border-danger/50 bg-danger/5' :
          todayStats?.giRisk === 'warning' ? 'border-warning/50 bg-warning/5' : ''
        }>
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              todayStats?.giRisk === 'danger' ? 'bg-danger/20 text-danger' :
              todayStats?.giRisk === 'warning' ? 'bg-warning/20 text-warning' :
              'bg-primary/20 text-primary'
            }`}>
              <Utensils className="w-4 h-4" />
            </div>
            <div className={`text-xl font-bold ${
              todayStats?.giRisk === 'danger' ? 'text-danger' :
              todayStats?.giRisk === 'warning' ? 'text-warning' :
              'text-primary'
            }`}>
              {isLoading ? '-' : todayStats?.giRisk === 'safe' ? 'Stable' : todayStats?.giRisk === 'warning' ? 'Moderate' : 'High Risk'}
            </div>
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider">GI Alert Level</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <h2 className="text-xl font-bold text-text-main mt-8 mb-4">Today at a Glance</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Focus Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={focusTimelineData} height={250} dataKey="value" lineName="Focus Minutes" />
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Distraction Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBarChart data={distractionData} height={250} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
