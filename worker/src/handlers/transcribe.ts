/**
 * AssemblyAI transcription token handler
 * Mints temporary tokens for browser-based streaming
 */

import { TranscribeTokenResponse, Env, ErrorResponse } from '../types';

export async function handleTranscribeToken(request: Request, env: Env): Promise<Response> {
  try {
    if (!env.ASSEMBLYAI_API_KEY) {
      const error: ErrorResponse = {
        error: 'Missing ASSEMBLYAI_API_KEY',
        code: 'MISSING_ENV_VAR',
      };
      return new Response(JSON.stringify(error), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const expiresInSeconds = parseInt(url.searchParams.get('expires_in_seconds') || '60');
    const maxSessionDuration = parseInt(url.searchParams.get('max_session_duration_seconds') || '3600');

    // Validate parameters
    if (expiresInSeconds < 1 || expiresInSeconds > 600) {
      const error: ErrorResponse = {
        error: 'expires_in_seconds must be between 1 and 600',
        code: 'INVALID_PARAMETER',
      };
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Request token from AssemblyAI
    const response = await fetch(
      `https://streaming.assemblyai.com/v3/token?expires_in_seconds=${expiresInSeconds}&max_session_duration_seconds=${maxSessionDuration}`,
      {
        method: 'GET',
        headers: {
          authorization: env.ASSEMBLYAI_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`AssemblyAI token error ${response.status}:`, errorBody);

      const error: ErrorResponse = {
        error: `AssemblyAI token error: ${response.status}`,
        code: 'TRANSCRIBE_TOKEN_ERROR',
        details: { status: response.status, message: errorBody },
      };

      return new Response(JSON.stringify(error), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json<TranscribeTokenResponse>();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Transcribe token handler error:', error);

    const err = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse: ErrorResponse = {
      error: err,
      code: 'TRANSCRIBE_TOKEN_HANDLER_ERROR',
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
