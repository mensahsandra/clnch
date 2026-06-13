/**
 * Hook for managing AssemblyAI transcription
 */

import { useState, useCallback, useRef } from 'react';
import { getTranscriptionToken } from '../utils/api';
import { logger } from '../utils/logger';

export interface UseTranscriptionResult {
  transcript: string;
  isTranscribing: boolean;
  startTranscription: (audioBuffer: ArrayBuffer) => Promise<void>;
  error: string | null;
}

export function useTranscription(): UseTranscriptionResult {
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const startTranscription = useCallback(async (audioBuffer: ArrayBuffer) => {
    try {
      setError(null);
      setIsTranscribing(true);
      setTranscript('');

      // Get temporary token from worker
      const token = await getTranscriptionToken(60);

      // Connect to AssemblyAI WebSocket
      const ws = new WebSocket(
        `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&speech_model=u3-rt-pro&token=${token}`
      );

      ws.onopen = () => {
        logger.info('WebSocket connected');
        // Send audio data
        ws.send(audioBuffer);
        // Signal end of stream
        setTimeout(() => {
          ws.send(JSON.stringify({ type: 'Terminate' }));
        }, 100);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'Turn') {
            setTranscript(message.transcript || '');
            if (message.end_of_turn) {
              logger.info('Transcription complete');
              setIsTranscribing(false);
              ws.close();
            }
          }
        } catch (e) {
          logger.warn('Failed to parse message', e);
        }
      };

      ws.onerror = (err) => {
        const message = 'WebSocket error';
        setError(message);
        logger.error(message, err);
        setIsTranscribing(false);
      };

      ws.onclose = () => {
        logger.info('WebSocket closed');
        setIsTranscribing(false);
      };

      wsRef.current = ws;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      setError(message);
      logger.error('Transcription error', err);
      setIsTranscribing(false);
    }
  }, []);

  return {
    transcript,
    isTranscribing,
    startTranscription,
    error,
  };
}
