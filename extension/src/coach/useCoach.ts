/**
 * Hook for managing coaching logic with TTS support
 */

import { useState, useCallback } from 'react';
import { ChatMessage } from '../types';
import { CoachClient, RefineAnswerResult } from '../coach-client';
import { logger } from '../utils/logger';

export interface UseCoachResult {
  refinedAnswer: string | null;
  isCoaching: boolean;
  messages: ChatMessage[];
  refineAnswer: (rawInput: string, fieldLabel?: string) => Promise<RefineAnswerResult | null>;
  synthesizeSpeech: (text: string) => Promise<ArrayBuffer>;
  playAudio: (audioData: ArrayBuffer) => Promise<void>;
  error: string | null;
  clearMessages: () => void;
}

export function useCoach(workerUrl: string, model: 'sonnet' | 'opus' = 'sonnet'): UseCoachResult {
  const [refinedAnswer, setRefinedAnswer] = useState<string | null>(null);
  const [isCoaching, setIsCoaching] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const client = new CoachClient({ workerUrl, model });

  const refineAnswer = useCallback(
    async (rawInput: string, fieldLabel?: string): Promise<RefineAnswerResult | null> => {
      try {
        setError(null);
        setIsCoaching(true);

        const userMessage: ChatMessage = {
          role: 'user',
          content: rawInput,
        };
        setMessages((prev) => [...prev, userMessage]);

        const result = await client.refineAnswer({
          rawInput,
          fieldLabel,
          conversationHistory: messages,
        });

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: result.refined,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        setRefinedAnswer(result.refined);
        logger.info('Answer refined successfully');
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Refinement failed';
        setError(message);
        logger.error('Refinement error', err);
        return null;
      } finally {
        setIsCoaching(false);
      }
    },
    [messages]
  );

  const synthesizeSpeech = useCallback(async (text: string): Promise<ArrayBuffer> => {
    try {
      return await client.synthesizeSpeech(text);
    } catch (err) {
      logger.error('Failed to synthesize speech', err);
      throw err;
    }
  }, []);

  const playAudio = useCallback(async (audioData: ArrayBuffer) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(audioData);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (err) {
      logger.error('Failed to play audio', err);
      throw err;
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setRefinedAnswer(null);
    setError(null);
  }, []);

  return {
    refinedAnswer,
    isCoaching,
    messages,
    refineAnswer,
    synthesizeSpeech,
    playAudio,
    error,
    clearMessages,
  };
}
