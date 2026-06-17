/**
 * Updated Popup script with OAuth integration and Guest mode
 */

let extensionState = {
  isAuthenticated: false,
  guestMode: false,
  user: null,
  userToken: null,
  workerUrl: 'https://your-worker.workers.dev', // UPDATE THIS
  conversations: [],
};

// Load state from storage
chrome.storage.local.get(['extensionState'], (result) => {
  if (result.extensionState) {
    extensionState = result.extensionState;
    if (extensionState.isAuthenticated || extensionState.guestMode) {
      showCoachingScreen();
    }
  }
});

// Auth buttons
document.getElementById('google-login').addEventListener('click', initiateGoogleOAuth);
document.getElementById('github-login').addEventListener('click', initiateGitHubOAuth);
document.getElementById('guest-btn').addEventListener('click', continueAsGuest);
document.getElementById('logout-btn').addEventListener('click', logout);

// Input handlers
const userInput = document.getElementById('user-input');
const submitBtn = document.getElementById('submit-btn');
const voiceBtn = document.getElementById('voice-btn');

userInput.addEventListener('input', () => {
  submitBtn.disabled = !userInput.value.trim();
});

voiceBtn.addEventListener('click', simulateVoiceInput);
submitBtn.addEventListener('click', refineAnswer);

// ============ Auth Functions ============

function initiateGoogleOAuth() {
  const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // UPDATE
  const redirectUrl = chrome.identity.getRedirectURL();
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
    `&response_type=code` +
    `&scope=openid%20email%20profile`;

  chrome.identity.launchWebAuthFlow(
    { url: authUrl, interactive: true },
    (redirectUrl) => {
      if (chrome.runtime.lastError) {
        alert('Auth failed: ' + chrome.runtime.lastError.message);
        return;
      }
      handleOAuthCallback(redirectUrl, 'google');
    }
  );
}

function initiateGitHubOAuth() {
  const clientId = 'YOUR_GITHUB_CLIENT_ID'; // UPDATE
  const redirectUrl = chrome.identity.getRedirectURL();
  const authUrl = `https://github.com/login/oauth/authorize?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
    `&scope=user:email`;

  chrome.identity.launchWebAuthFlow(
    { url: authUrl, interactive: true },
    (redirectUrl) => {
      if (chrome.runtime.lastError) {
        alert('Auth failed: ' + chrome.runtime.lastError.message);
        return;
      }
      handleOAuthCallback(redirectUrl, 'github');
    }
  );
}

async function handleOAuthCallback(url, provider) {
  const code = new URL(url).searchParams.get('code');
  if (!code) {
    alert('No authorization code received');
    return;
  }

  try {
    // Exchange code with your worker
    const response = await fetch(`${extensionState.workerUrl}/auth/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, provider }),
    });

    if (!response.ok) {
      throw new Error('Auth failed: ' + response.statusText);
    }

    const data = await response.json();
    
    extensionState.isAuthenticated = true;
    extensionState.user = data.user;
    extensionState.userToken = data.access_token;
    extensionState.guestMode = false;
    saveState();
    showCoachingScreen();
  } catch (error) {
    console.error('OAuth error:', error);
    alert('Authentication failed: ' + error.message);
  }
}

function continueAsGuest() {
  extensionState.isAuthenticated = false;
  extensionState.guestMode = true;
  extensionState.user = { name: 'Guest', email: 'guest@clnch.local' };
  saveState();
  showCoachingScreen();
}

function logout() {
  extensionState.isAuthenticated = false;
  extensionState.guestMode = false;
  extensionState.user = null;
  extensionState.userToken = null;
  extensionState.conversations = [];
  saveState();
  showLoginScreen();
}

// ============ UI Functions ============

function showLoginScreen() {
  document.getElementById('login-screen').classList.add('active');
  document.getElementById('coaching-screen').classList.remove('active');
}

function showCoachingScreen() {
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('coaching-screen').classList.add('active');

  if (extensionState.user) {
    const userInfoDiv = document.getElementById('user-info');
    userInfoDiv.innerHTML = `
      <div style="font-size: 12px;">
        <strong>${extensionState.user.name}</strong><br>
        <span style="opacity: 0.7;">${extensionState.user.email}</span>
        ${extensionState.guestMode ? '<br><span style="opacity: 0.6; font-size: 11px;">Guest Mode</span>' : ''}
      </div>
    `;
  }

  // Load conversation history if authenticated
  if (extensionState.isAuthenticated) {
    loadConversationHistory();
  }
}

function simulateVoiceInput() {
  voiceBtn.disabled = true;
  voiceBtn.textContent = '🎤 Listening...';

  setTimeout(() => {
    userInput.value = 'I have successfully deployed several AI workflows and systems that significantly improved our product development process.';
    voiceBtn.disabled = false;
    voiceBtn.textContent = '🎤 Voice';
    submitBtn.disabled = false;
  }, 2000);
}

async function refineAnswer() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  userInput.value = '';
  submitBtn.disabled = true;

  // Show typing
  showTypingIndicator();

  try {
    // Call worker chat endpoint
    const response = await fetch(`${extensionState.workerUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(extensionState.userToken && { 'Authorization': `Bearer ${extensionState.userToken}` }),
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: text }],
        system: 'You are CLNCH, an expert AI coach helping users refine their answers for job applications and professional communications. Provide concise, impactful refinements.',
      }),
    });

    if (!response.ok) {
      throw new Error('API call failed');
    }

    const data = await response.json();
    const refined = data.content[0].text;

    removeTypingIndicator();
    addMessage(refined, 'assistant');

    // Save conversation if authenticated
    if (extensionState.isAuthenticated) {
      await saveConversation(text, refined);
    }
  } catch (error) {
    console.error('Coaching error:', error);
    removeTypingIndicator();
    addMessage('Error: Could not refine your answer. Please try again.', 'assistant');
  }
}

function addMessage(text, role) {
  const container = document.getElementById('chat-container');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  messageDiv.innerHTML = `
    <div class="message-bubble">
      ${role === 'assistant' ? '<strong>CLNCH Coach:</strong><br>' : ''}
      ${text}
      ${role === 'assistant' ? `
        <div class="message-actions">
          <button class="copy-btn" onclick="copyToClipboard('${text.replace(/'/g, "\\'")}')">📋 Copy</button>
          <button class="edit-btn" onclick="editMessage('${text.replace(/'/g, "\\'")}')">✏️ Edit</button>
        </div>
      ` : ''}
    </div>
  `;
  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
  const container = document.getElementById('chat-container');
  const typing = document.createElement('div');
  typing.id = 'typing-indicator';
  typing.className = 'message assistant';
  typing.innerHTML = `
    <div class="message-bubble">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  const typing = document.getElementById('typing-indicator');
  if (typing) typing.remove();
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied to clipboard!');
  });
}

function editMessage(text) {
  userInput.value = text;
  userInput.focus();
  submitBtn.disabled = false;
}

// ============ Conversation Management ============

async function saveConversation(rawInput, refinedAnswer) {
  try {
    const response = await fetch(`${extensionState.workerUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${extensionState.userToken}`,
      },
      body: JSON.stringify({
        raw_input: rawInput,
        refined_answer: refinedAnswer,
        field_label: 'Application Answer',
        model_used: 'sonnet',
      }),
    });

    if (response.ok) {
      const conversation = await response.json();
      extensionState.conversations.push(conversation);
      saveState();
    }
  } catch (error) {
    console.error('Save conversation error:', error);
  }
}

async function loadConversationHistory() {
  try {
    const response = await fetch(`${extensionState.workerUrl}/conversations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${extensionState.userToken}`,
      },
    });

    if (response.ok) {
      extensionState.conversations = await response.json();
      saveState();
    }
  } catch (error) {
    console.error('Load conversation error:', error);
  }
}

// ============ State Management ============

function saveState() {
  chrome.storage.local.set({ extensionState });
}
