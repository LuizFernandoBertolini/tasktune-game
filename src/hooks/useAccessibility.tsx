import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useAccessibility() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const loadAndApplySettings = async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("font_size, high_contrast, low_stimulus")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        const html = document.documentElement;

        // Aplicar tamanho de fonte
        html.classList.remove('text-[0.9rem]', 'text-base', 'text-[1.15rem]');
        if (data.font_size === 'small') {
          html.classList.add('text-[0.9rem]');
        } else if (data.font_size === 'medium') {
          html.classList.add('text-base');
        } else if (data.font_size === 'large') {
          html.classList.add('text-[1.15rem]');
        }

        // Aplicar contraste alto
        if (data.high_contrast) {
          html.setAttribute("data-high-contrast", "true");
        } else {
          html.removeAttribute("data-high-contrast");
        }

        // Aplicar modo reduzido de estímulo
        if (data.low_stimulus) {
          html.setAttribute("data-low-stimulus", "true");
        } else {
          html.removeAttribute("data-low-stimulus");
        }
      }
    };

    loadAndApplySettings();
  }, [user]);
}
