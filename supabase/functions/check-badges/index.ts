import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar todas as badges
    const { data: allBadges } = await supabase
      .from('badges')
      .select('*');

    // Buscar badges já conquistadas
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', user_id);

    const earnedBadgeIds = new Set(userBadges?.map((ub) => ub.badge_id) || []);
    const newBadges = [];

    // Buscar estatísticas do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('level, xp_total')
      .eq('user_id', user_id)
      .single();

    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user_id)
      .order('day', { ascending: false });

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user_id);

    const { data: focusSessions } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', user_id);

    const completedTasks = tasks?.filter((t) => t.status === 'completed') || [];
    const completedFocus = focusSessions?.filter((f) => !f.abandoned) || [];

    // Verificar cada badge
    for (const badge of allBadges || []) {
      if (earnedBadgeIds.has(badge.id)) continue;

      const rule = badge.rule_json as any;
      let earned = false;

      switch (rule.type) {
        case 'tasks_completed':
          earned = completedTasks.length >= rule.count;
          break;

        case 'tasks_per_day':
          const today = new Date().toISOString().split('T')[0];
          const tasksToday = completedTasks.filter((t) => 
            t.completed_at?.startsWith(today)
          ).length;
          earned = tasksToday >= rule.count;
          break;

        case 'streak_days':
          const currentStreak = stats?.[0]?.streak || 0;
          earned = currentStreak >= rule.count;
          break;

        case 'focus_completed':
          earned = completedFocus.length >= rule.count;
          break;

        case 'focus_per_day':
          const todayDate = new Date().toISOString().split('T')[0];
          const focusToday = completedFocus.filter((f) => 
            f.started_at?.startsWith(todayDate)
          ).length;
          earned = focusToday >= rule.count;
          break;

        case 'level':
          earned = (profile?.level || 1) >= rule.count;
          break;

        case 'weekly_minutes':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const weekStats = stats?.filter((s) => new Date(s.day) >= weekAgo) || [];
          const weeklyMinutes = weekStats.reduce((sum, s) => sum + (s.minutes_focused || 0), 0);
          earned = weeklyMinutes >= rule.count;
          break;

        case 'perfect_days':
          let perfectStreak = 0;
          for (const stat of stats || []) {
            if (stat.tasks_done > 0 && stat.tasks_done === completedTasks.filter((t) => 
              t.completed_at?.startsWith(stat.day)
            ).length) {
              perfectStreak++;
            } else {
              break;
            }
          }
          earned = perfectStreak >= rule.count;
          break;

        case 'no_abandon_days':
          const recentDays = stats?.slice(0, rule.count) || [];
          const hasAbandoned = focusSessions?.some((f) => 
            f.abandoned && recentDays.some((d) => f.started_at?.startsWith(d.day))
          );
          earned = recentDays.length >= rule.count && !hasAbandoned;
          break;

        case 'early_completions':
          const earlyTasks = completedTasks.filter((t) => 
            t.due_date && t.completed_at && 
            new Date(t.completed_at) < new Date(t.due_date)
          ).length;
          earned = earlyTasks >= rule.count;
          break;
      }

      if (earned) {
        // Inserir badge conquistada
        await supabase
          .from('user_badges')
          .insert({ user_id, badge_id: badge.id, notified: false });

        // Adicionar XP
        await supabase
          .from('user_profiles')
          .update({ 
            xp_total: (profile?.xp_total || 0) + badge.xp_reward 
          })
          .eq('user_id', user_id);

        newBadges.push({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          xp_reward: badge.xp_reward,
        });

        console.log(`Badge earned: ${badge.name} (+${badge.xp_reward} XP)`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        new_badges: newBadges,
        count: newBadges.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking badges:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
