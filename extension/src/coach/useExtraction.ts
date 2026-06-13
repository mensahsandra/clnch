/**
 * Hook for managing form context extraction
 */

import { useState, useCallback } from 'react';
import { FormContext } from '../types';
import { callWorker } from '../utils/api';
import { logger } from '../utils/logger';

export interface UseExtractionResult {
  context: FormContext | null;
  isExtracting: boolean;
  extractContext: () => Promise<void>;
  error: string | null;
}

export function useExtraction(): UseExtractionResult {
  const [context, setContext] = useState<FormContext | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractContext = useCallback(async () => {
    try {
      setError(null);
      setIsExtracting(true);

      // Get current page URL and basic context
      const pageTitle = document.title;
      const currentUrl = window.location.href;

      // Try to detect current form field
      const activeElement = document.activeElement as HTMLElement;
      let fieldLabel = '';
      let fieldValue = '';

      if (activeElement instanceof HTMLTextAreaElement || activeElement instanceof HTMLInputElement) {
        fieldValue = activeElement.value;
        // Try to find associated label
        if (activeElement.id) {
          const label = document.querySelector(`label[for="${activeElement.id}"]`);
          if (label) {
            fieldLabel = label.textContent || '';
          }
        }
        if (!fieldLabel && activeElement.placeholder) {
          fieldLabel = activeElement.placeholder;
        }
      }

      // Try to extract page context via worker (if Firecrawl is configured)
      let jobDescription = '';
      try {
        const response = await callWorker(
          '/extract-context',
          { url: currentUrl },
          'POST'
        );
        if (response.ok) {
          const data = await response.json() as { content: string };
          jobDescription = data.content;
        }
      } catch (e) {
        logger.warn('Failed to extract page context', e);
        // Continue without it
      }

      const extractedContext: FormContext = {
        pageTitle,
        url: currentUrl,
        fieldLabel,
        fieldValue,
        jobDescription,
      };

      setContext(extractedContext);
      logger.info('Context extracted', extractedContext);
      setIsExtracting(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Extraction failed';
      setError(message);
      logger.error('Extraction error', err);
      setIsExtracting(false);
    }
  }, []);

  return {
    context,
    isExtracting,
    extractContext,
    error,
  };
}
