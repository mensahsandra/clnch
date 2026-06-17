/**
 * Background Service Worker
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('🎙️ CLNCH extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PAGE_CONTEXT') {
    // Request page context from content script
    chrome.tabs.sendMessage(sender.tab.id, {
      type: 'EXTRACT_PAGE_CONTEXT',
    }, (response) => {
      sendResponse(response);
    });
    return true; // Keep channel open
  }
});
