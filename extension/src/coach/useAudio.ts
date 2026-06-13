/**
 * Hook for managing audio recording
 */

import { useState, useCallback, useRef } from 'react';
import { getAudioStream, createMediaRecorder, blobToArrayBuffer } from '../utils/audio';
import { logger } from '../utils/logger';

export interface UseAudioResult {
  isListening: boolean;
  audioLevel: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<ArrayBuffer | null>;
  error: string | null;
}

export function useAudio(): UseAudioResult {
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioBufferRef = useRef<Blob | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await getAudioStream();
      streamRef.current = stream;

      // Setup audio level monitoring
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamAudioSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start monitoring levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(Math.min(100, (average / 255) * 100));
        if (isListening || recorderRef.current?.state === 'recording') {
          requestAnimationFrame(updateLevel);
        }
      };
      updateLevel();

      // Create recorder
      const recorder = createMediaRecorder(
        stream,
        (blob) => {
          audioBufferRef.current = blob;
        },
        () => {
          setIsListening(false);
          setAudioLevel(0);
        }
      );

      recorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
      logger.info('Recording started');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      logger.error('Failed to start recording', err);
    }
  }, [isListening]);

  const stopRecording = useCallback(async (): Promise<ArrayBuffer | null> => {
    return new Promise((resolve) => {
      try {
        if (recorderRef.current && recorderRef.current.state === 'recording') {
          recorderRef.current.onstop = async () => {
            if (audioBufferRef.current) {
              const arrayBuffer = await blobToArrayBuffer(audioBufferRef.current);
              resolve(arrayBuffer);
            } else {
              resolve(null);
            }

            // Clean up
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            recorderRef.current = null;
            audioBufferRef.current = null;
            setIsListening(false);
            setAudioLevel(0);
          };
          recorderRef.current.stop();
          logger.info('Recording stopped');
        } else {
          resolve(null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to stop recording';
        setError(message);
        logger.error('Failed to stop recording', err);
        resolve(null);
      }
    });
  }, []);

  return {
    isListening,
    audioLevel,
    startRecording,
    stopRecording,
    error,
  };
}
