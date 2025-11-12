import { supabase } from "@/integrations/supabase/client";

let cachedPreferences: { sound_feedback: boolean; low_stimulus: boolean } | null = null;

/**
 * Carrega as preferências de som do usuário
 */
async function loadSoundPreferences(userId: string) {
  const { data } = await supabase
    .from("user_profiles")
    .select("sound_feedback, low_stimulus")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) {
    cachedPreferences = {
      sound_feedback: data.sound_feedback ?? true,
      low_stimulus: data.low_stimulus ?? false,
    };
  }
  return cachedPreferences;
}

/**
 * Reproduz um som de feedback se as preferências permitirem
 * @param name - Nome do arquivo de som (sem extensão)
 * @param userId - ID do usuário para verificar preferências
 */
export async function playSound(name: string, userId?: string) {
  try {
    // Se tiver userId, carrega preferências
    if (userId && !cachedPreferences) {
      await loadSoundPreferences(userId);
    }

    // Verifica se sons estão habilitados
    if (cachedPreferences && (!cachedPreferences.sound_feedback || cachedPreferences.low_stimulus)) {
      return;
    }

    const audio = new Audio(`/sounds/${name}.mp3`);
    audio.volume = 0.25; // Volume leve
    await audio.play().catch(() => {
      // Ignora erros de reprodução silenciosamente
    });
  } catch (e) {
    console.warn("Erro ao reproduzir som:", e);
  }
}

/**
 * Limpa o cache de preferências (útil ao fazer logout)
 */
export function clearSoundPreferencesCache() {
  cachedPreferences = null;
}

/**
 * Atualiza o cache de preferências manualmente
 */
export function updateSoundPreferencesCache(preferences: { sound_feedback: boolean; low_stimulus: boolean }) {
  cachedPreferences = preferences;
}
