/**
 * Claude API proxy handler
 * Streams Claude responses with context from the extension
 */

import { ChatRequest, ChatResponse, Env, ErrorResponse } from '../types';

export async function handleChat(request: Request, env: Env): Promise<Response> {
  try {
    if (!env.ANTHROPIC_API_KEY) {
      const error: ErrorResponse = {
        error: 'Missing ANTHROPIC_API_KEY',
        code: 'MISSING_ENV_VAR',
      };
      return new Response(JSON.stringify(error), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json<ChatRequest>();

    // Build the request for Claude API
    const claudeRequest = {
      model: body.model || 'claude-opus-4-1',
      max_tokens: body.max_tokens || 1024,
      system: body.system,
      messages: body.messages,
      stream: body.stream !== false, // default to streaming
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(claudeRequest),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Claude API error ${response.status}:`, errorBody);

      const error: ErrorResponse = {
        error: `Claude API error: ${response.status}`,
        code: 'CLAUDE_API_ERROR',
        details: { status: response.status, message: errorBody },
      };

      return new Response(JSON.stringify(error), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Forward streaming response
    if (body.stream !== false) {
      return new Response(response.body, {
        status: 200,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'text/event-stream',
          'Cache-Control': 'no-cache',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // Non-streaming response
    const data = await response.json<ChatResponse>();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat handler error:', error);

    const err = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse: ErrorResponse = {
      error: err,
      code: 'CHAT_HANDLER_ERROR',
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
