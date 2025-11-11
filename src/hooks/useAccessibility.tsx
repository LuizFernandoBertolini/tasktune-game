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
        const root = document.documentElement;

        // Aplicar tamanho de fonte
        if (data.font_size === "large") {
          root.style.fontSize = "120%";
        } else {
          root.style.fontSize = "100%";
        }

        // Aplicar contraste alto
        if (data.high_contrast) {
          root.setAttribute("data-high-contrast", "true");
        } else {
          root.removeAttribute("data-high-contrast");
        }

        // Aplicar modo reduzido de estímulo
        if (data.low_stimulus) {
          root.setAttribute("data-low-stimulus", "true");
        } else {
          root.removeAttribute("data-low-stimulus");
        }
      }
    };

    loadAndApplySettings();
  }, [user]);
}
