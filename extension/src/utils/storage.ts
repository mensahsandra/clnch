/**
 * Chrome storage utilities
 */

import { StoredConversation, ExtensionSettings } from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'clnch_conversations',
  SETTINGS: 'clnch_settings',
};

export async function getConversations(): Promise<StoredConversation[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.CONVERSATIONS], (result) => {
      resolve(result[STORAGE_KEYS.CONVERSATIONS] || []);
    });
  });
}

export async function saveConversation(conversation: StoredConversation): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.CONVERSATIONS], (result) => {
      const conversations: StoredConversation[] = result[STORAGE_KEYS.CONVERSATIONS] || [];
      const index = conversations.findIndex((c) => c.fieldId === conversation.fieldId);

      if (index >= 0) {
        conversations[index] = conversation;
      } else {
        conversations.push(conversation);
      }

      chrome.storage.local.set(
        {
          [STORAGE_KEYS.CONVERSATIONS]: conversations,
        },
        resolve
      );
    });
  });
}

export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (result) => {
      const defaults: ExtensionSettings = {
        workerUrl: 'https://clnch-worker.your-account.workers.dev',
        model: 'sonnet',
        autoPlay: true,
      };
      resolve(result[STORAGE_KEYS.SETTINGS] || defaults);
    });
  });
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (result) => {
      const currentSettings = result[STORAGE_KEYS.SETTINGS] || {
        workerUrl: 'https://clnch-worker.your-account.workers.dev',
        model: 'sonnet',
        autoPlay: true,
      };
      const merged = { ...currentSettings, ...settings };
      chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: merged }, resolve);
    });
  });
}

export async function clearStorage(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.clear(resolve);
  });
}
