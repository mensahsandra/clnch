/**
 * Content Script for CLNCH Extension
 * Injects the sidebar into the page
 */

function injectPanel() {
  // Check if panel already exists
  if (document.getElementById('clnch-panel')) {
    return;
  }

  // Create container
  const container = document.createElement('div');
  container.id = 'clnch-panel';
  container.style.cssText = `
    position: fixed;
    right: 0;
    top: 0;
    width: 380px;
    height: 100vh;
    background: #1f2937;
    border-left: 1px solid #374151;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: -4px 0 12px rgba(0, 0, 0, 0.3);
  `;

  // Create root element for React
  const root = document.createElement('div');
  root.id = 'clnch-root';
  container.appendChild(root);

  document.body.appendChild(container);

  // Load the panel bundle
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('panel.js');
  script.onload = function () {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'openPanel') {
    injectPanel();
    sendResponse({ status: 'ok' });
  }
});

console.log('CLNCH content script loaded');
