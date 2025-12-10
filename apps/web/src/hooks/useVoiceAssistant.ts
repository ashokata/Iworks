import { useState, useCallback, useRef } from 'react';
import { VoiceIntent } from '@/types';

// Type declaration for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseVoiceAssistantReturn {
  isListening: boolean;
  isProcessing: boolean;
  lastIntent: VoiceIntent | null;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  processVoiceCommand: (command: string) => Promise<VoiceIntent | null>;
}

export const useVoiceAssistant = (): UseVoiceAssistantReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastIntent, setLastIntent] = useState<VoiceIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        setIsProcessing(true);
        
        try {
          const intent = await processVoiceCommand(transcript);
          setLastIntent(intent);
        } catch (err) {
          setError('Failed to process voice command');
        } finally {
          setIsProcessing(false);
        }
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        setError(`Speech recognition error: ${event.error}`);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.start();
    } catch (err) {
      setError('Failed to start speech recognition');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const processVoiceCommand = useCallback(async (command: string): Promise<VoiceIntent | null> => {
    // Placeholder implementation - in production, this would integrate with
    // Retell AI, OpenAI, or another voice processing service
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('create') && lowerCommand.includes('job')) {
      return {
        action: 'create_job',
        parameters: { command },
        confidence: 0.8
      };
    }
    
    if (lowerCommand.includes('update') && lowerCommand.includes('job')) {
      return {
        action: 'update_job',
        parameters: { command },
        confidence: 0.8
      };
    }
    
    if (lowerCommand.includes('show') || lowerCommand.includes('view')) {
      return {
        action: 'view_jobs',
        parameters: { command },
        confidence: 0.7
      };
    }
    
    if (lowerCommand.includes('search') || lowerCommand.includes('find')) {
      return {
        action: 'search_jobs',
        parameters: { command },
        confidence: 0.7
      };
    }

    return null;
  }, []);

  return {
    isListening,
    isProcessing,
    lastIntent,
    error,
    startListening,
    stopListening,
    processVoiceCommand
  };
};
