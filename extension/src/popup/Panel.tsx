/**
 * Coach Sidebar Panel Component
 */

import React, { useState, useEffect } from 'react';
import { Waveform } from './Waveform';
import { useAudio } from '../coach/useAudio';
import { useCoach } from '../coach/useCoach';
import { useTranscription } from '../coach/useTranscription';
import { useExtraction } from '../coach/useExtraction';
import { getSettings, saveSettings } from '../utils/storage';
import { logger } from '../utils/logger';
import '../index.css';

export function Panel(): React.ReactElement {
  const [workerUrl, setWorkerUrl] = useState('');
  const [model, setModel] = useState<'sonnet' | 'opus'>('sonnet');
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'responding'>('idle');
  const [showSettings, setShowSettings] = useState(false);

  const audio = useAudio();
  const coach = useCoach(workerUrl, model);
  const transcription = useTranscription();
  const extraction = useExtraction();

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setWorkerUrl(settings.workerUrl);
      setModel(settings.model);
    };
    loadSettings();
  }, []);

  const handleStartListening = async () => {
    setStatus('listening');
    await audio.startRecording();
  };

  const handleStopListening = async () => {
    setStatus('processing');
    const audioBuffer = await audio.stopRecording();

    if (audioBuffer) {
      // Start transcription
      await transcription.startTranscription(audioBuffer);

      // Once transcription completes, refine the answer
      if (transcription.transcript) {
        setStatus('processing');
        const result = await coach.refineAnswer(
          transcription.transcript,
          extraction.context?.fieldLabel
        );

        if (result) {
          setStatus('responding');
          // TODO: Play audio if autoPlay is enabled
        }
      }
    }

    setStatus('idle');
  };

  const handleCopyAnswer = () => {
    if (coach.refinedAnswer) {
      navigator.clipboard.writeText(coach.refinedAnswer);
      logger.info('Answer copied to clipboard');
    }
  };

  const handleSaveSettings = async () => {
    await saveSettings({ workerUrl, model });
    setShowSettings(false);
    logger.info('Settings saved');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">CLNCH</h1>
          <p className="text-gray-400 text-sm">AI Coach</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-700 rounded-lg transition"
        >
          ⚙️
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h2 className="font-semibold mb-4">Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Worker URL</label>
              <input
                type="text"
                value={workerUrl}
                onChange={(e) => setWorkerUrl(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white text-sm"
                placeholder="https://your-worker.workers.dev"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as 'sonnet' | 'opus')}
                className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white text-sm"
              >
                <option value="sonnet">Claude Sonnet (Fast)</option>
                <option value="opus">Claude Opus (Thorough)</option>
              </select>
            </div>
            <button
              onClick={handleSaveSettings}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded font-semibold transition"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Status */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-2">Status</p>
          <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
            <p className="font-semibold capitalize">
              {status === 'idle' && '🟢 Ready'}
              {status === 'listening' && '🔴 Listening...'}
              {status === 'processing' && '🟡 Processing...'}
              {status === 'responding' && '🟣 Responding...'}
            </p>
          </div>
        </div>

        {/* Waveform */}
        {status === 'listening' && (
          <div className="mb-6">
            <Waveform isActive={audio.isListening} level={audio.audioLevel} />
          </div>
        )}

        {/* Transcript */}
        {transcription.transcript && (
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">Transcript</p>
            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-sm">{transcription.transcript}</p>
            </div>
          </div>
        )}

        {/* Refined Answer */}
        {coach.refinedAnswer && (
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">Refined Answer</p>
            <div className="p-3 bg-indigo-900 rounded-lg border border-indigo-700">
              <p className="text-sm mb-3">{coach.refinedAnswer}</p>
              <button
                onClick={handleCopyAnswer}
                className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm font-semibold transition"
              >
                📋 Copy Answer
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {(audio.error || coach.error || transcription.error) && (
          <div className="mb-6 p-3 bg-red-900 rounded-lg border border-red-700">
            <p className="text-sm font-semibold">⚠️ Error</p>
            <p className="text-sm mt-1">{audio.error || coach.error || transcription.error}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-auto pt-6 border-t border-gray-700">
        {status === 'idle' ? (
          <button
            onClick={handleStartListening}
            className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            🎤 Start Speaking
          </button>
        ) : status === 'listening' ? (
          <button
            onClick={handleStopListening}
            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
          >
            ⏹️ Stop
          </button>
        ) : (
          <div className="w-full px-4 py-3 bg-gray-700 rounded-lg font-semibold text-center opacity-50 cursor-not-allowed">
            Processing...
          </div>
        )}
      </div>
    </div>
  );
}

export default Panel;
