import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft } from "lucide-react";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("estudar");
  const [focusTime, setFocusTime] = useState("manha");
  const [pomodoroDuration, setPomodoroDuration] = useState([25]);
  const [fontSize, setFontSize] = useState("medium");
  const [highContrast, setHighContrast] = useState(false);
  const [soundFeedback, setSoundFeedback] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleComplete = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("user_profiles")
      .update({
        pomodoro_duration: pomodoroDuration[0],
        font_size: fontSize,
        high_contrast: highContrast,
        sound_feedback: soundFeedback,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao salvar preferências");
    } else {
      toast.success("Preferências salvas. Vamos começar!");
      navigate("/app/hoje");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader>
          <CardTitle>Vamos começar!</CardTitle>
          <CardDescription>Passo {step} de 3</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <Label>Qual é seu objetivo principal?</Label>
              <RadioGroup value={goal} onValueChange={setGoal}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="estudar" id="estudar" />
                  <Label htmlFor="estudar">Estudar</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="trabalho" id="trabalho" />
                  <Label htmlFor="trabalho">Trabalho</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ambos" id="ambos" />
                  <Label htmlFor="ambos">Ambos</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label>Quando você costuma focar?</Label>
                <RadioGroup value={focusTime} onValueChange={setFocusTime} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="manha" id="manha" />
                    <Label htmlFor="manha">Manhã</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tarde" id="tarde" />
                    <Label htmlFor="tarde">Tarde</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="noite" id="noite" />
                    <Label htmlFor="noite">Noite</Label>
                  </div>
                </RadioGroup>
              </div>

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
            </div>
          )}

          {step === 3 && (
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
          )}

          <div className="flex gap-2 mt-6">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} className="flex-1">
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="flex-1">
                Começar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
