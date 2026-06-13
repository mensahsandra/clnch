/**
 * Service Worker for CLNCH Extension
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('CLNCH extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ping') {
    sendResponse({ type: 'pong' });
  }
});
