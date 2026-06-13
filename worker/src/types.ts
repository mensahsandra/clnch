/**
 * CLNCH Worker Type Definitions
 */

// Request/Response types
export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string | Array<{ type: 'text' | 'image'; text?: string; source?: { type: 'base64'; media_type: string; data: string } }>;
  }>;
  system?: string;
  model?: string;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface TranscribeTokenRequest {
  expires_in_seconds?: number;
}

export interface TranscribeTokenResponse {
  token: string;
}

export interface TTSRequest {
  text: string;
  voice_id?: string;
  model_id?: string;
  output_format?: string;
}

export interface ExtractContextRequest {
  url: string;
  include_tags?: string[];
}

export interface ExtractContextResponse {
  title: string;
  description: string;
  content: string;
  metadata: Record<string, unknown>;
}

// Worker environment
export interface Env {
  ANTHROPIC_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  ELEVENLABS_VOICE_ID: string;
  ASSEMBLYAI_API_KEY: string;
  FIRECRAWL_API_KEY?: string;
}

// Error response
export interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}
