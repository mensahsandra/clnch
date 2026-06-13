/**
 * Coach API client with TTS support
 */

import { ChatMessage, FormContext } from '../types';

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
}

const COACHING_SYSTEM_PROMPT = `You are CLNCH, an expert career coach helping candidates refine their application answers in real-time.

Your role:
- Take raw, unpolished thoughts from the user
- Transform them into compelling, concise answers
- Make answers specific and actionable
- Keep them professional but authentic
- Provide immediately usable text

Guidelines:
- Keep answers concise (2-3 sentences max for forms)
- Use active voice and strong verbs
- Highlight unique value and fit
- Avoid generic corporate speak
- Make it memorable and specific
- Format as plain text, ready to paste

Respond with ONLY the refined answer - no markdown, no formatting, just the polished text the user can copy and paste.`;

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

      return {
        refined: textContent.trim(),
        suggestions: [],
      };
    } catch (error) {
      throw new Error(`Failed to refine answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

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
        jobDescription: data.content.substring(0, 500),
      };
    } catch (error) {
      console.warn('Failed to extract page context:', error);
      return { url };
    }
  }

  private buildUserPrompt(options: RefineAnswerOptions): string {
    let prompt = `Help me refine this answer for my application:\n\n"${options.rawInput}"`;

    if (options.fieldLabel) {
      prompt += `\n\nQuestion: ${options.fieldLabel}`;
    }

    if (options.context?.jobDescription) {
      prompt += `\n\nJob/Application Context: ${options.context.jobDescription.substring(0, 300)}`;
    }

    return prompt;
  }
}

export default CoachClient;
