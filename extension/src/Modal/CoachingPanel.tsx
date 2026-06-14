/**
 * Coaching Panel Component - Main interaction area
 */

import React, { useState, useEffect } from 'react';
import { Waveform } from '../popup/Waveform';
import { useAudio } from '../coach/useAudio';
import { useCoach } from '../coach/useCoach';
import { useTranscription } from '../coach/useTranscription';
import { useExtraction } from '../coach/useExtraction';
import { logger } from '../utils/logger';

export interface CoachingPanelProps {
  audio: ReturnType<typeof useAudio>;
  coach: ReturnType<typeof useCoach>;
  transcription: ReturnType<typeof useTranscription>;
  extraction: ReturnType<typeof useExtraction>;
  pageContext: string;
  isLoadingContext: boolean;
}

export function CoachingPanel({
  audio,
  coach,
  transcription,
  extraction,
  pageContext,
  isLoadingContext,
}: CoachingPanelProps): React.ReactElement {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'listening' | 'transcribing' | 'coaching' | 'ready'>
    ('idle');
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  // Handle voice recording
  const handleStartVoice = async () => {
    try {
      setStatus('listening');
      await audio.startRecording();
    } catch (error) {
      logger.error('Failed to start recording', error);
      setStatus('idle');
    }
  };

  const handleStopVoice = async () => {
    try {
      setStatus('transcribing');
      const audioBuffer = await audio.stopRecording();

      if (audioBuffer) {
        await transcription.startTranscription(audioBuffer);
        // Wait a bit for transcription to complete
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      setStatus('idle');
    } catch (error) {
      logger.error('Failed to stop recording', error);
      setStatus('idle');
    }
  };

  // Auto-refine when transcript is available
  useEffect(() => {
    if (transcription.transcript && !isProcessing) {
      setUserInput(transcription.transcript);
    }
  }, [transcription.transcript, isProcessing]);

  // Handle refining answer
  const handleRefineAnswer = async () => {
    if (!userInput.trim()) return;

    try {
      setStatus('coaching');
      setIsProcessing(true);

      const result = await coach.refineAnswer(
        userInput,
        extraction.context?.fieldLabel
      );

      if (result && autoPlayEnabled) {
        try {
          // Synthesize and play audio
          const audioData = await coach.synthesizeSpeech(result.refined);
          if (audioData) {
            await coach.playAudio(audioData);
          }
        } catch (error) {
          logger.warn('Failed to play audio', error);
        }
      }

      setStatus('ready');
    } catch (error) {
      logger.error('Failed to refine answer', error);
      setStatus('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyAnswer = () => {
    if (coach.refinedAnswer) {
      navigator.clipboard.writeText(coach.refinedAnswer);
      logger.info('Answer copied to clipboard');
    }
  };

  const handleClearAll = () => {
    setUserInput('');
    setStatus('idle');
    coach.clearMessages();
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
      {/* Loading state */}
      {isLoadingContext && (
        <div className="p-4 bg-indigo-900 rounded-lg border border-indigo-700 animate-pulse">
          <p className="text-sm font-semibold">⏳ Analyzing page context...</p>
        </div>
      )}

      {/* Page context info */}
      {pageContext && (
        <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 text-sm">
          <p className="text-gray-300 mb-2 font-semibold">📋 Page Context:</p>
          <p className="text-gray-400 line-clamp-3">{pageContext.substring(0, 150)}...</p>
        </div>
      )}

      {/* Status indicator */}
      <div className="text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wider">
          {status === 'listening' && '🎤 Listening...'}
          {status === 'transcribing' && '📝 Transcribing...'}
          {status === 'coaching' && '🧠 Coaching...'}
          {status === 'ready' && '✨ Ready!'}
          {status === 'idle' && 'Ready to help'}
        </p>
      </div>

      {/* Waveform during listening */}
      {status === 'listening' && (
        <div className="flex justify-center py-4">
          <Waveform isActive={audio.isListening} level={audio.audioLevel} />
        </div>
      )}

      {/* Transcript display */}
      {transcription.transcript && (
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-400 mb-2 font-semibold">YOUR THOUGHTS:</p>
          <p className="text-sm text-white leading-relaxed">{transcription.transcript}</p>
        </div>
      )}

      {/* Text input */}
      <div>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type or speak your raw thoughts here..."
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none resize-none"
          rows={4}
        />
      </div>

      {/* Error display */}
      {(audio.error || coach.error || transcription.error) && (
        <div className="p-3 bg-red-900 rounded-lg border border-red-700">
          <p className="text-xs text-red-200 font-semibold">⚠️ Error</p>
          <p className="text-xs text-red-100 mt-1">{audio.error || coach.error || transcription.error}</p>
        </div>
      )}

      {/* Refined answer */}
      {coach.refinedAnswer && (
        <div className="p-4 bg-gradient-to-r from-indigo-900 to-pink-900 rounded-lg border border-indigo-700">
          <p className="text-xs text-indigo-200 mb-2 font-semibold">✨ REFINED ANSWER:</p>
          <p className="text-sm text-white leading-relaxed mb-3">{coach.refinedAnswer}</p>
          <button
            onClick={handleCopyAnswer}
            className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded font-semibold text-sm transition"
          >
            📋 Copy to Clipboard
          </button>
        </div>
      )}

      {/* Suggestions */}
      {coach.messages.length > 0 && (
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-400 mb-3 font-semibold">CONVERSATION HISTORY:</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {coach.messages.map((msg, i) => (
              <div key={i} className={`text-xs p-2 rounded ${msg.role === 'user' ? 'bg-indigo-800' : 'bg-gray-700'}`}>
                <p className="font-semibold text-indigo-200">{msg.role === 'user' ? 'You' : 'Coach'}</p>
                <p className="text-gray-100 line-clamp-2">{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="sticky bottom-0 bg-gradient-to-t from-gray-900 to-transparent pt-6 pb-6 space-y-3">
        {status === 'idle' ? (
          <>
            <button
              onClick={handleStartVoice}
              className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              🎤 Speak
            </button>
            {userInput && (
              <button
                onClick={handleRefineAnswer}
                disabled={isProcessing}
                className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                ✨ Refine Answer
              </button>
            )}
          </>
        ) : status === 'listening' ? (
          <button
            onClick={handleStopVoice}
            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
          >
            ⏹️ Stop Recording
          </button>
        ) : (
          <div className="w-full px-4 py-3 bg-gray-700 rounded-lg font-semibold text-center opacity-50 cursor-not-allowed">
            Processing...
          </div>
        )}

        {(userInput || coach.refinedAnswer) && (
          <button
            onClick={handleClearAll}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-sm transition"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
