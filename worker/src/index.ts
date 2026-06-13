/**
 * CLNCH - Cloudflare Worker
 * Backend API for the CLNCH browser extension
 *
 * Routes:
 * - POST /chat              - Claude API proxy (streaming)
 * - POST /tts               - ElevenLabs TTS proxy
 * - GET  /transcribe-token  - AssemblyAI token minting
 * - POST /extract-context   - Firecrawl page extraction
 */

import { Router } from 'itty-router';
import { handleChat } from './handlers/chat';
import { handleTTS } from './handlers/tts';
import { handleTranscribeToken } from './handlers/transcribe';
import { handleExtractContext } from './handlers/extract';
import { Env, ErrorResponse } from './types';

const router = Router();

// CORS headers for extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Options handler (preflight)
router.options('*', () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
});

// Routes
router.post('/chat', async (request: Request, env: Env) => {
  const response = await handleChat(request, env);
  return addCorsHeaders(response);
});

router.post('/tts', async (request: Request, env: Env) => {
  const response = await handleTTS(request, env);
  return addCorsHeaders(response);
});

router.get('/transcribe-token', async (request: Request, env: Env) => {
  const response = await handleTranscribeToken(request, env);
  return addCorsHeaders(response);
});

router.post('/extract-context', async (request: Request, env: Env) => {
  const response = await handleExtractContext(request, env);
  return addCorsHeaders(response);
});

// Health check
router.get('/health', () => {
  return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
});

// 404 handler
router.all('*', () => {
  const error: ErrorResponse = {
    error: 'Not Found',
    code: 'NOT_FOUND',
  };
  return new Response(JSON.stringify(error), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
});

// Helper to add CORS headers
function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  return newResponse;
}

// Main handler
export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
    return router.handle(request, env, ctx);
  },
};
