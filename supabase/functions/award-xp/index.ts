import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const XP_BASE = { easy: 10, med: 20, hard: 35 } as const;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id, task_id, difficulty, abandoned, minutes } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'missing user_id' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const diff = (difficulty ?? 'easy') as 'easy' | 'med' | 'hard';
    let xp: number = XP_BASE[diff];
    xp += Math.floor((minutes ?? 0) / 10);
    if (abandoned) xp = Math.floor(xp * 0.5);

    const today = new Date().toISOString().slice(0, 10);
    const { data: statsToday } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user_id)
      .eq('day', today)
      .maybeSingle();

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const { data: statsYesterday } = await supabase
      .from('user_stats')
      .select('streak')
      .eq('user_id', user_id)
      .eq('day', yesterday)
      .maybeSingle();

    let newStreak = 1;
    if (statsYesterday?.streak) newStreak = statsYesterday.streak + 1;

    const { data: up } = await supabase
      .from('user_stats')
      .upsert({
        user_id,
        day: today,
        minutes_focused: (statsToday?.minutes_focused ?? 0) + (minutes ?? 0),
        tasks_done: (statsToday?.tasks_done ?? 0) + (abandoned ? 0 : 1),
        streak: newStreak,
      })
      .select()
      .single();

    const streakBonus = 5 * Math.min(up?.streak ?? newStreak, 10);
    xp += streakBonus;

    // Atualizar XP e level no perfil do usuário
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('xp_total, level')
      .eq('user_id', user_id)
      .single();

    let newXpTotal = (profile?.xp_total ?? 0) + xp;
    let newLevel = profile?.level ?? 1;

    // Calcular level ups
    while (newXpTotal >= 100 * newLevel) {
      newXpTotal -= 100 * newLevel;
      newLevel += 1;
    }

    await supabase
      .from('user_profiles')
      .update({ xp_total: newXpTotal, level: newLevel })
      .eq('user_id', user_id);

    await supabase.from('rewards').insert({
      user_id,
      type: 'earn',
      amount: xp,
      meta: { task_id, difficulty, minutes, streak_bonus: streakBonus }
    });

    // Award badges
    const { count } = await supabase
      .from('focus_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('abandoned', false);

    if (count === 1) {
      const { data: badge } = await supabase
        .from('badges').select('id').eq('slug', 'primeiro-foco').single();
      if (badge) {
        await supabase.from('user_badges').insert({ user_id, badge_id: badge.id });
      }
    }

    return new Response(
      JSON.stringify({ 
        ok: true, 
        xp_awarded: xp, 
        streak: up?.streak ?? newStreak,
        new_level: newLevel,
        xp_total: newXpTotal
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('Error in award-xp:', e);
    return new Response(JSON.stringify({ error: String(e) }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
