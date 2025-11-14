import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LogOut, Save, Volume2, Palette, Type, Eye, Sparkles, Clock } from "lucide-react";
import { updateSoundPreferencesCache } from "@/lib/sounds";

export default function Config() {
  const [displayName, setDisplayName] = useState("");
  const [pomodoroDuration, setPomodoroDuration] = useState([25]);
  const [fontSize, setFontSize] = useState("medium");
  const [theme, setTheme] = useState("light");
  const [soundFeedback, setSoundFeedback] = useState(true);
  const [lowStimulus, setLowStimulus] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from("user_profiles").select("*").eq("user_id", user?.id).maybeSingle();
    if (data) {
      setDisplayName(data.display_name || "");
      setPomodoroDuration([data.pomodoro_duration || 25]);
      setFontSize(data.font_size || "medium");
      setSoundFeedback(data.sound_feedback ?? true);
      setLowStimulus(data.low_stimulus || false);
      const savedTheme = localStorage.getItem('app-theme') || 'light';
      setTheme(savedTheme);
    }
  };

  const applySettings = (fontSizeValue: string, themeValue: string, lowStimulusValue: boolean) => {
    const html = document.documentElement;
    html.classList.remove('text-[0.9rem]', 'text-base', 'text-[1.15rem]');
    if (fontSizeValue === 'small') html.classList.add('text-[0.9rem]');
    else if (fontSizeValue === 'medium') html.classList.add('text-base');
    else if (fontSizeValue === 'large') html.classList.add('text-[1.15rem]');
    
    html.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast');
    html.classList.add(`theme-${themeValue}`);
    localStorage.setItem('app-theme', themeValue);
    
    if (lowStimulusValue) html.setAttribute("data-low-stimulus", "true");
    else html.removeAttribute("data-low-stimulus");
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    applySettings(fontSize, newTheme, lowStimulus);
  };

  const handleSave = async () => {
    const { error } = await supabase.from("user_profiles").update({
      display_name: displayName,
      pomodoro_duration: pomodoroDuration[0],
      font_size: fontSize,
      sound_feedback: soundFeedback,
      low_stimulus: lowStimulus,
    }).eq("user_id", user?.id);

    if (error) {
      toast.error("Erro ao salvar");
    } else {
      applySettings(fontSize, theme, lowStimulus);
      updateSoundPreferencesCache({ sound_feedback: soundFeedback, low_stimulus: lowStimulus });
      toast.success("Configurações aplicadas com sucesso!");
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Configurações</h1>
        <p className="text-sm text-muted-foreground">Personalize sua experiência</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />Perfil</CardTitle></CardHeader>
        <CardContent>
          <Label htmlFor="name">Nome de exibição</Label>
          <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" className="mt-1.5" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Timer</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <Label>Duração do Pomodoro</Label>
            <span className="text-sm font-semibold text-primary">{pomodoroDuration[0]} min</span>
          </div>
          <Slider value={pomodoroDuration} onValueChange={setPomodoroDuration} min={15} max={60} step={5} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5 text-primary" />Aparência</CardTitle></CardHeader>
        <CardContent>
          <Label>Tema</Label>
          <Select value={theme} onValueChange={handleThemeChange}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="light">☀️ Claro</SelectItem>
              <SelectItem value="dark">🌙 Escuro</SelectItem>
              <SelectItem value="high-contrast">⚡ Alto Contraste</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-primary" />Acessibilidade</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2"><Type className="w-4 h-4" /><Label>Tamanho da fonte</Label></div>
            <RadioGroup value={fontSize} onValueChange={setFontSize}>
              <div className="flex items-center space-x-2"><RadioGroupItem value="small" id="small" /><Label htmlFor="small" className="font-normal cursor-pointer">Pequena</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="medium" id="medium" /><Label htmlFor="medium" className="font-normal cursor-pointer">Média</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="large" id="large" /><Label htmlFor="large" className="font-normal cursor-pointer">Grande</Label></div>
            </RadioGroup>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Volume2 className="w-4 h-4" /><Label htmlFor="sound" className="cursor-pointer">Sons de feedback</Label></div>
            <Switch id="sound" checked={soundFeedback} onCheckedChange={setSoundFeedback} />
          </div>
          <div className="flex items-center justify-between">
            <div><Label htmlFor="lowStimulus" className="cursor-pointer">Modo reduzido de estímulo</Label><p className="text-sm text-muted-foreground">Desativa animações e sons</p></div>
            <Switch id="lowStimulus" checked={lowStimulus} onCheckedChange={setLowStimulus} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} className="flex-1"><Save className="mr-2" />Salvar alterações</Button>
        <Button onClick={signOut} variant="destructive"><LogOut className="mr-2" />Sair</Button>
      </div>
    </div>
  );
}
