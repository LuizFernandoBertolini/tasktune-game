import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { updateSoundPreferencesCache } from "@/lib/sounds";

export function useAccessibility() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const loadAndApplySettings = async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("font_size, low_stimulus, sound_feedback")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        const html = document.documentElement;

        // Atualizar cache de preferências de som
        updateSoundPreferencesCache({
          sound_feedback: data.sound_feedback ?? true,
          low_stimulus: data.low_stimulus ?? false,
        });

        // Aplicar tamanho de fonte
        html.classList.remove('text-[0.9rem]', 'text-base', 'text-[1.15rem]');
        if (data.font_size === 'small') {
          html.classList.add('text-[0.9rem]');
        } else if (data.font_size === 'medium') {
          html.classList.add('text-base');
        } else if (data.font_size === 'large') {
          html.classList.add('text-[1.15rem]');
        }

        // Aplicar modo reduzido de estímulo
        if (data.low_stimulus) {
          html.setAttribute("data-low-stimulus", "true");
        } else {
          html.removeAttribute("data-low-stimulus");
        }
        
        // Aplicar tema salvo no localStorage
        const savedTheme = localStorage.getItem('app-theme') || 'light';
        html.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast');
        html.classList.add(`theme-${savedTheme}`);
      }
    };

    loadAndApplySettings();
  }, [user]);
}
