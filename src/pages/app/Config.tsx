import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LogOut, Save } from "lucide-react";

export default function Config() {
  const [displayName, setDisplayName] = useState("");
  const [pomodoroDuration, setPomodoroDuration] = useState([25]);
  const [fontSize, setFontSize] = useState("medium");
  const [highContrast, setHighContrast] = useState(false);
  const [soundFeedback, setSoundFeedback] = useState(true);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (data) {
      setDisplayName(data.display_name || "");
      setPomodoroDuration([data.pomodoro_duration || 25]);
      setFontSize(data.font_size || "medium");
      setHighContrast(data.high_contrast || false);
      setSoundFeedback(data.sound_feedback ?? true);
    }
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from("user_profiles")
      .update({
        display_name: displayName,
        pomodoro_duration: pomodoroDuration[0],
        font_size: fontSize,
        high_contrast: highContrast,
        sound_feedback: soundFeedback,
      })
      .eq("user_id", user?.id);

    if (error) {
      toast.error("Erro ao salvar");
    } else {
      toast.success("Configurações salvas!");
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Configurações</h1>

      <Card className="p-6 mb-4">
        <h2 className="text-xl font-bold mb-4">Perfil</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome de exibição</Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-4">
        <h2 className="text-xl font-bold mb-4">Timer</h2>
        <div>
          <Label>Duração do Pomodoro: {pomodoroDuration[0]} minutos</Label>
          <Slider
            value={pomodoroDuration}
            onValueChange={setPomodoroDuration}
            min={15}
            max={45}
            step={5}
            className="mt-2"
          />
        </div>
      </Card>

      <Card className="p-6 mb-4">
        <h2 className="text-xl font-bold mb-4">Acessibilidade</h2>
        <div className="space-y-4">
          <div>
            <Label>Tamanho da fonte</Label>
            <RadioGroup value={fontSize} onValueChange={setFontSize} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="small" id="small" />
                <Label htmlFor="small">Pequena</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium">Média</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="large" id="large" />
                <Label htmlFor="large">Grande</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="contrast">Contraste alto</Label>
            <Switch
              id="contrast"
              checked={highContrast}
              onCheckedChange={setHighContrast}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="sound">Sons de feedback</Label>
            <Switch
              id="sound"
              checked={soundFeedback}
              onCheckedChange={setSoundFeedback}
            />
          </div>
        </div>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Salvar alterações
        </Button>
        <Button variant="destructive" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
}
