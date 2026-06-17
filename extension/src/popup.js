/**
 * Popup script
 */

let extensionState = {
  isAuthenticated: false,
  user: null,
  userToken: null,
  workerUrl: 'https://your-worker.workers.dev',
};

// Load state from storage
chrome.storage.local.get(['extensionState'], (result) => {
  if (result.extensionState) {
    extensionState = result.extensionState;
    if (extensionState.isAuthenticated) {
      showCoachingScreen();
    }
  }
});

// Auth buttons
document.getElementById('google-login').addEventListener('click', () => {
  initiateGoogleOAuth();
});

document.getElementById('github-login').addEventListener('click', () => {
  initiateGitHubOAuth();
});

document.getElementById('guest-btn').addEventListener('click', () => {
  extensionState.isAuthenticated = false;
  saveState();
  showCoachingScreen();
});

document.getElementById('logout-btn').addEventListener('click', () => {
  extensionState.isAuthenticated = false;
  extensionState.user = null;
  extensionState.userToken = null;
  saveState();
  showLoginScreen();
});

// Input handlers
const userInput = document.getElementById('user-input');
const submitBtn = document.getElementById('submit-btn');
const voiceBtn = document.getElementById('voice-btn');

userInput.addEventListener('input', () => {
  submitBtn.disabled = !userInput.value.trim();
});

voiceBtn.addEventListener('click', simulateVoiceInput);
submitBtn.addEventListener('click', refineAnswer);

function showLoginScreen() {
  document.getElementById('login-screen').classList.add('active');
  document.getElementById('coaching-screen').classList.remove('active');
}

function showCoachingScreen() {
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('coaching-screen').classList.add('active');

  if (extensionState.user) {
    document.getElementById('user-info').innerHTML = `
      <div style="font-size: 12px;">
        <strong>${extensionState.user.name}</strong><br>
        <span style="opacity: 0.7;">${extensionState.user.email}</span>
      </div>
    `;
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

function refineAnswer() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  userInput.value = '';
  submitBtn.disabled = true;

  // Show typing
  showTypingIndicator();

  // Simulate coaching response
  setTimeout(() => {
    removeTypingIndicator();
    const refined = 'I've successfully architected and deployed multiple AI-powered workflows that dramatically accelerated our product development cycles. Most notably, I implemented agile workflow orchestration systems that reduced manual tracking requirements by 40%, while building custom evaluation frameworks using Claude and specialized coding agents for comprehensive validation across development phases.';
    addMessage(refined, 'assistant');
  }, 1500);
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
          <button class="copy-btn">📋 Copy</button>
          <button class="edit-btn">✏️ Edit</button>
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

function saveState() {
  chrome.storage.local.set({ extensionState });
}

function initiateGoogleOAuth() {
  console.log('Initiating Google OAuth...');
  // In production, this would redirect to worker OAuth endpoint
  alert('Google OAuth flow would initiate here');
}

function initiateGitHubOAuth() {
  console.log('Initiating GitHub OAuth...');
  // In production, this would redirect to worker OAuth endpoint
  alert('GitHub OAuth flow would initiate here');
}
