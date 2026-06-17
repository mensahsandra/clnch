/**
 * Content Script - Injects CLNCH button and captures page context
 */

let extensionData = {
  workerUrl: null,
  userToken: null,
  userId: null,
};

// Load extension data from storage
chrome.storage.local.get(['extensionData'], (result) => {
  if (result.extensionData) {
    extensionData = result.extensionData;
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXTRACT_PAGE_CONTEXT') {
    const context = extractPageContext();
    sendResponse(context);
  }
});

// Inject floating button
function injectFloatingButton() {
  if (document.getElementById('clnch-floating-btn')) {
    return;
  }

  const button = document.createElement('div');
  button.id = 'clnch-floating-btn';
  button.innerHTML = '🎙️';
  button.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #2c3e50 0%, #1a1a2e 100%);
    border-radius: 50%;
    cursor: pointer;
    z-index: 999998;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    transition: all 0.3s ease;
    border: 2px solid #a8334e;
    user-select: none;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
    button.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
  });

  button.addEventListener('click', () => {
    injectOverlay();
  });

  document.body.appendChild(button);
  console.log('✅ CLNCH button injected');
}

// Inject overlay modal
function injectOverlay() {
  if (document.getElementById('clnch-overlay')) {
    return;
  }

  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'clnch-overlay-backdrop';
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 999999;
  `;

  // Create modal
  const modal = document.createElement('div');
  modal.id = 'clnch-overlay';
  modal.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    width: 420px;
    height: 100vh;
    max-height: 100vh;
    background: #ffffff;
    z-index: 1000000;
    overflow-y: auto;
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    flex-direction: column;
  `;

  // Create HTML content for modal
  modal.innerHTML = `
    <div id="clnch-modal-content" style="display: flex; flex-direction: column; height: 100%;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #2c3e50 0%, #1a1a2e 100%); color: white; padding: 24px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 style="margin: 0; font-size: 20px; font-weight: 600;">🎙️ CLNCH Coach</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.8; color: #bbb;">Real-time coaching</p>
        </div>
        <button id="clnch-close-btn" style="background: none; border: none; font-size: 20px; cursor: pointer; color: white; padding: 0;">✕</button>
      </div>

      <!-- Loading State -->
      <div id="clnch-loading" style="flex: 1; padding: 24px; display: flex; align-items: center; justify-content: center; text-align: center;">
        <div>
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #666;">⏳ Loading...</p>
        </div>
      </div>

      <!-- Chat Container (hidden initially) -->
      <div id="clnch-chat-container" style="flex: 1; overflow-y: auto; padding: 24px; display: none;">
      </div>

      <!-- Input Area -->
      <div id="clnch-input-area" style="padding: 16px 24px; border-top: 1px solid #e0e0e0; background: #fafafa; display: none;">
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <button id="clnch-voice-btn" style="flex: 1; padding: 10px; background: #2c3e50; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">
            🎤 Speak
          </button>
          <button id="clnch-submit-btn" style="flex: 1; padding: 10px; background: #a8334e; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; display: none;">
            ✨ Refine
          </button>
        </div>
        <textarea id="clnch-input" placeholder="Type your raw thoughts here..." style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; resize: none; height: 80px; font-family: inherit; box-sizing: border-box;"></textarea>
      </div>
    </div>
  `;

  // Close handlers
  const closeBtn = modal.querySelector('#clnch-close-btn');
  closeBtn.addEventListener('click', () => {
    backdrop.remove();
    modal.remove();
  });

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      backdrop.remove();
      modal.remove();
    }
  });

  // Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      backdrop.remove();
      modal.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);

  // Initialize modal
  initializeModal(modal);
}

// Initialize modal interactions
function initializeModal(modal) {
  const input = modal.querySelector('#clnch-input');
  const voiceBtn = modal.querySelector('#clnch-voice-btn');
  const submitBtn = modal.querySelector('#clnch-submit-btn');
  const chatContainer = modal.querySelector('#clnch-chat-container');
  const inputArea = modal.querySelector('#clnch-input-area');
  const loading = modal.querySelector('#clnch-loading');

  // Show input area after loading
  setTimeout(() => {
    loading.style.display = 'none';
    inputArea.style.display = 'block';
    chatContainer.style.display = 'block';
  }, 500);

  // Input change handler
  input.addEventListener('input', () => {
    if (input.value.trim()) {
      submitBtn.style.display = 'flex';
    } else {
      submitBtn.style.display = 'none';
    }
  });

  // Voice button
  voiceBtn.addEventListener('click', async () => {
    voiceBtn.disabled = true;
    voiceBtn.style.opacity = '0.6';
    voiceBtn.textContent = '🎙️ Listening...';

    // Simulate voice input
    setTimeout(() => {
      input.value = 'I have built several AI workflows that help accelerate product development. My recent work focused on prototyping and validating workflows as a solo founder.';
      voiceBtn.disabled = false;
      voiceBtn.style.opacity = '1';
      voiceBtn.textContent = '🎤 Speak';
      submitBtn.style.display = 'flex';
      input.focus();
    }, 2000);
  });

  // Submit handler
  submitBtn.addEventListener('click', async () => {
    const userText = input.value.trim();
    if (!userText) return;

    // Add user message to chat
    addChatMessage(chatContainer, userText, 'user');
    input.value = '';
    submitBtn.style.display = 'none';

    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.id = 'clnch-typing';
    typingDiv.innerHTML = `
      <div style="background: #f0f0f0; padding: 12px 16px; border-radius: 8px; width: fit-content;">
        <div style="display: flex; gap: 4px;">
          <span style="width: 8px; height: 8px; background: #999; border-radius: 50%; animation: bounce 1.4s infinite;"></span>
          <span style="width: 8px; height: 8px; background: #999; border-radius: 50%; animation: bounce 1.4s infinite; animation-delay: 0.2s;"></span>
          <span style="width: 8px; height: 8px; background: #999; border-radius: 50%; animation: bounce 1.4s infinite; animation-delay: 0.4s;"></span>
        </div>
      </div>
      <style>
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
      </style>
    `;
    chatContainer.appendChild(typingDiv);

    // Simulate coaching response
    setTimeout(() => {
      typingDiv.remove();
      const refinedText = 'I've successfully built and deployed multiple AI workflows that significantly accelerated product development cycles. My most recent work involved creating agile workflows for requirement tracking and prioritization, which reduced manual effort by 40%. As a solo founder, I've leveraged Claude, ChatGPT, and custom coding agents to prototype and validate these systems across product design and development phases.';
      addChatMessage(chatContainer, refinedText, 'assistant');
      chatContainer.scrollTop = chatContainer.scrollHeight;

      // Add action buttons
      const actionsDiv = document.createElement('div');
      actionsDiv.style.cssText = 'display: flex; gap: 8px; margin-top: 12px;';
      actionsDiv.innerHTML = `
        <button style="flex: 1; padding: 8px; background: #2c3e50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">📋 Copy</button>
        <button style="flex: 1; padding: 8px; background: #a8334e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">✏️ Edit</button>
      `;
      chatContainer.appendChild(actionsDiv);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 1500);
  });
}

// Add chat message to container
function addChatMessage(container, text, role) {
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
    margin-bottom: 16px;
    display: flex;
    ${role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
  `;

  const bubble = document.createElement('div');
  bubble.style.cssText = `
    max-width: 85%;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.5;
    ${role === 'user' 
      ? 'background: #2c3e50; color: white; border-radius: 12px 0 12px 12px;' 
      : 'background: #f0f0f0; color: #333; border-radius: 0 12px 12px 12px;'}
  `;
  bubble.textContent = text;
  messageDiv.appendChild(bubble);
  container.appendChild(messageDiv);
}

// Extract page context
function extractPageContext() {
  return {
    pageTitle: document.title,
    url: window.location.href,
    pageText: document.body.innerText.substring(0, 500),
  };
}

// Inject button on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectFloatingButton);
} else {
  injectFloatingButton();
}

console.log('✅ CLNCH content script loaded');
