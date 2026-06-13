/**
 * Reusable Coach Client Library
 * Can be used in extension, web app, or other integrations
 */

import { ChatMessage, FormContext } from './types';

export interface CoachClientConfig {
  workerUrl: string;
  model?: 'sonnet' | 'opus';
}

export interface RefineAnswerOptions {
  rawInput: string;
  fieldLabel?: string;
  context?: FormContext;
  conversationHistory?: ChatMessage[];
}

export interface RefineAnswerResult {
  refined: string;
  suggestions?: string[];
  audioUrl?: string;
}

const COACHING_SYSTEM_PROMPT = `You are CLNCH, an expert career coach helping candidates refine their application answers.

Your role:
- Take raw, unpolished thoughts from the user
- Transform them into compelling, concise answers
- Make answers specific and actionable
- Keep them professional but authentic
- Suggest how to back up claims with examples

Guidelines:
- Keep answers concise (2-3 sentences max for forms)
- Use active voice and strong verbs
- Highlight unique value and fit
- Avoid generic corporate speak
- Make it memorable

Format your response as JSON:
{
  "refined": "The polished answer",
  "suggestions": ["Optional suggestion 1", "Optional suggestion 2"]
}`;

export class CoachClient {
  private config: CoachClientConfig;

  constructor(config: CoachClientConfig) {
    if (!config.workerUrl) {
      throw new Error('workerUrl is required');
    }
    this.config = {
      model: 'sonnet',
      ...config,
    };
  }

  /**
   * Refine a user's answer using Claude
   */
  async refineAnswer(options: RefineAnswerOptions): Promise<RefineAnswerResult> {
    const messages: ChatMessage[] = [
      ...(options.conversationHistory || []),
      {
        role: 'user',
        content: this.buildUserPrompt(options),
      },
    ];

    try {
      const response = await fetch(`${this.config.workerUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model === 'opus' ? 'claude-opus-4-1' : 'claude-sonnet-4-6',
          system: COACHING_SYSTEM_PROMPT,
          messages,
          max_tokens: 512,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json() as {
        content: Array<{ text: string }>;
      };
      const textContent = data.content[0]?.text || '';

      // Try to parse as JSON response
      try {
        const parsed = JSON.parse(textContent);
        return {
          refined: parsed.refined || textContent,
          suggestions: parsed.suggestions || [],
        };
      } catch {
        // If not JSON, return the raw text
        return {
          refined: textContent,
          suggestions: [],
        };
      }
    } catch (error) {
      throw new Error(`Failed to refine answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert refined text to speech
   */
  async synthesizeSpeech(text: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(`${this.config.workerUrl}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS error: ${response.status}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      throw new Error(`Failed to synthesize speech: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get AssemblyAI streaming token
   */
  async getTranscriptionToken(expiresInSeconds = 60): Promise<string> {
    try {
      const response = await fetch(`${this.config.workerUrl}/transcribe-token?expires_in_seconds=${expiresInSeconds}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Token error: ${response.status}`);
      }

      const data = await response.json() as { token: string };
      return data.token;
    } catch (error) {
      throw new Error(`Failed to get transcription token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract page context using Firecrawl
   */
  async extractPageContext(url: string): Promise<FormContext> {
    try {
      const response = await fetch(`${this.config.workerUrl}/extract-context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        // If extraction fails, return empty context
        return { url };
      }

      const data = await response.json() as {
        title: string;
        description: string;
        content: string;
      };
      return {
        url,
        pageTitle: data.title,
        jobDescription: data.content.substring(0, 500), // Truncate for context window
      };
    } catch (error) {
      console.warn('Failed to extract page context:', error);
      return { url };
    }
  }

  /**
   * Build the user prompt with context
   */
  private buildUserPrompt(options: RefineAnswerOptions): string {
    let prompt = `Help me refine this answer:\n\n"${options.rawInput}"`;

    if (options.fieldLabel) {
      prompt += `\n\nQuestion: ${options.fieldLabel}`;
    }

    if (options.context?.jobDescription) {
      prompt += `\n\nContext: ${options.context.jobDescription}`;
    }

    return prompt;
  }
}

export default CoachClient;
