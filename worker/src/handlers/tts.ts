/**
 * ElevenLabs TTS proxy handler
 * Converts text to speech
 */

import { TTSRequest, Env, ErrorResponse } from '../types';

export async function handleTTS(request: Request, env: Env): Promise<Response> {
  try {
    if (!env.ELEVENLABS_API_KEY) {
      const error: ErrorResponse = {
        error: 'Missing ELEVENLABS_API_KEY',
        code: 'MISSING_ENV_VAR',
      };
      return new Response(JSON.stringify(error), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json<TTSRequest>();

    if (!body.text) {
      const error: ErrorResponse = {
        error: 'Missing text field',
        code: 'INVALID_REQUEST',
      };
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const voiceId = body.voice_id || env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
    const modelId = body.model_id || 'eleven_multilingual_v2';
    const outputFormat = body.output_format || 'mp3_44100_128';

    const ttsRequest = {
      text: body.text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    };

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${outputFormat}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': env.ELEVENLABS_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify(ttsRequest),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`ElevenLabs API error ${response.status}:`, errorBody);

      const error: ErrorResponse = {
        error: `ElevenLabs API error: ${response.status}`,
        code: 'TTS_API_ERROR',
        details: { status: response.status, message: errorBody },
      };

      return new Response(JSON.stringify(error), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Forward audio response
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('TTS handler error:', error);

    const err = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse: ErrorResponse = {
      error: err,
      code: 'TTS_HANDLER_ERROR',
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
