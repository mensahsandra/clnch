/**
 * Modal Component - Appears as overlay on webpage
 */

import React, { useState, useEffect } from 'react';
import { ModalHeader } from './Modal/ModalHeader';
import { CoachingPanel } from './Modal/CoachingPanel';
import { useCoach } from '../coach/useCoach';
import { useAudio } from '../coach/useAudio';
import { useTranscription } from '../coach/useTranscription';
import { useExtraction } from '../coach/useExtraction';
import { getSettings } from '../utils/storage';
import { logger } from '../utils/logger';
import '../index.css';

export function ModalApp(): React.ReactElement {
  const [workerUrl, setWorkerUrl] = useState('');
  const [model, setModel] = useState<'sonnet' | 'opus'>('sonnet');
  const [pageContext, setPageContext] = useState<string>('');
  const [isLoadingContext, setIsLoadingContext] = useState(true);

  const audio = useAudio();
  const coach = useCoach(workerUrl, model);
  const transcription = useTranscription();
  const extraction = useExtraction();

  // Load settings and extract context on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load settings
        const settings = await getSettings();
        setWorkerUrl(settings.workerUrl);
        setModel(settings.model);

        // Extract page context
        await extraction.extractContext();
        if (extraction.context?.jobDescription) {
          setPageContext(extraction.context.jobDescription);
        }

        logger.info('Modal initialized with context');
      } catch (error) {
        logger.error('Failed to initialize modal', error);
      } finally {
        setIsLoadingContext(false);
      }
    };

    initialize();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col">
      <ModalHeader
        pageTitle={extraction.context?.pageTitle || 'CLNCH Coach'}
        fieldLabel={extraction.context?.fieldLabel}
      />

      <CoachingPanel
        audio={audio}
        coach={coach}
        transcription={transcription}
        extraction={extraction}
        pageContext={pageContext}
        isLoadingContext={isLoadingContext}
      />
    </div>
  );
}

export default ModalApp;
