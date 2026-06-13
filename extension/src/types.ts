/**
 * CLNCH Extension Types
 */

export interface Message {
  type: string;
  payload?: unknown;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CoachState {
  status: 'idle' | 'listening' | 'processing' | 'responding';
  transcript: string;
  response: string;
  audioUrl?: string;
  error?: string;
}

export interface FormContext {
  fieldLabel?: string;
  fieldValue?: string;
  pageTitle?: string;
  jobDescription?: string;
  url?: string;
}

export interface StoredConversation {
  fieldId: string;
  messages: ChatMessage[];
  timestamp: number;
}

export interface ExtensionSettings {
  workerUrl: string;
  model: 'sonnet' | 'opus';
  autoPlay: boolean;
}
