import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, Loader2, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIProgressIndicatorProps {
  isGenerating: boolean;
  onCancel?: () => void;
  buttonText?: string;
  estimatedSeconds?: number;
  steps?: string[];
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  onClick: () => void;
}

const DEFAULT_STEPS = [
  "Analyse du contexte entreprise...",
  "Extraction des données de traitement...",
  "Application de la méthodologie CNIL...",
  "Génération de l'analyse personnalisée...",
  "Finalisation de la réponse..."
];

export function AIProgressIndicator({
  isGenerating,
  onCancel,
  buttonText = "Générer avec l'IA",
  estimatedSeconds = 35,
  steps = DEFAULT_STEPS,
  disabled = false,
  className,
  variant = 'default',
  size = 'default',
  onClick
}: AIProgressIndicatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStep(0);
      setElapsedTime(0);
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1;
        
        // Update progress based on elapsed time
        const progressPercent = Math.min((newTime / estimatedSeconds) * 100, 95);
        setProgress(progressPercent);

        // Update current step based on progress
        const stepIndex = Math.floor((progressPercent / 100) * steps.length);
        setCurrentStep(Math.min(stepIndex, steps.length - 1));

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isGenerating, estimatedSeconds, steps.length]);

  if (!isGenerating) {
    return (
      <Button
        onClick={onClick}
        disabled={disabled}
        className={className}
        variant={variant}
        size={size}
      >
        {buttonText ? (
          <>
            <Brain className="w-4 h-4 mr-2" />
            {buttonText}
          </>
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-sm font-medium">
            Génération en cours...
          </span>
        </div>
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="h-8 px-2"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <span className="text-sm text-muted-foreground">
          {steps[currentStep]}
        </span>
      </div>
      
      <div className="text-xs text-muted-foreground">
        L'IA analyse selon les critères EDPB/CNIL pour générer une réponse conforme aux standards RGPD
      </div>
    </div>
  );
}