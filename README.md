# CLNCH - AI Coach Browser Extension

An intelligent browser extension that helps users refine their application answers in real-time using voice and AI coaching.

## Features

- 🎤 **Push-to-Talk Voice Input** - Share your raw thoughts via microphone
- 🧠 **AI Coaching** - Claude refines your answers with intelligent suggestions
- 📝 **Real-time Transcription** - Live speech-to-text powered by AssemblyAI
- 🔊 **Audio Feedback** - Hear your refined answer via ElevenLabs TTS
- 📋 **Form Context** - Auto-detects application form fields and context
- 📚 **Conversation History** - Remembers your answers per form field
- 🌙 **Dark Theme** - Easy on the eyes while you're focused on applications

## Architecture

### Components

1. **Cloudflare Worker** - Backend API proxy (handles all third-party API calls securely)
2. **Browser Extension** - React-based sidebar UI with audio pipeline
3. **Coach Client Library** - Reusable TypeScript client for coaching logic
4. **Storage** - Chrome storage for conversation history & settings

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Wrangler CLI (for Cloudflare Worker)
- GitHub account with a new repository

### API Keys Required

You'll need accounts and API keys for:

1. **Anthropic (Claude)** - https://console.anthropic.com/
   - Create an API key at the dashboard
   - Save as `ANTHROPIC_API_KEY`

2. **AssemblyAI** - https://www.assemblyai.com/
   - Sign up and get your API key from the dashboard
   - Save as `ASSEMBLYAI_API_KEY`

3. **ElevenLabs** - https://elevenlabs.io/
   - Sign up, get API key and choose a voice ID
   - Save as `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`

4. **Firecrawl** (Optional) - https://www.firecrawl.dev/
   - For advanced form context extraction
   - Save as `FIRECRAWL_API_KEY`

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mensahsandra/clnch.git
   cd clnch
   ```

2. **Install dependencies:**
   ```bash
   # Worker
   cd worker && npm install && cd ..
   # Extension
   cd extension && npm install && cd ..
   ```

3. **Setup environment variables:**
   ```bash
   # Worker
   cp worker/.env.example worker/.env.local
   # Fill in your API keys
   
   # Extension
   cp extension/.env.example extension/.env.local
   # Fill in your API keys
   ```

4. **Run locally:**
   ```bash
   # Terminal 1: Worker
   cd worker && npm run dev
   
   # Terminal 2: Extension
   cd extension && npm run dev
   ```

5. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select `extension/dist` folder

## Project Structure

```
clnch/
├── worker/                    # Cloudflare Worker
│   ├── src/
│   │   ├── index.ts          # Main worker
│   │   ├── handlers/
│   │   │   ├── chat.ts       # Claude API proxy
│   │   │   ├── tts.ts        # ElevenLabs TTS
│   │   │   ├── transcribe.ts # AssemblyAI token
│   │   │   └── extract.ts    # Firecrawl extraction
│   │   └── types.ts          # TypeScript types
│   ├── wrangler.toml         # Cloudflare config
│   └── package.json
├── extension/                 # Browser Extension
│   ├── src/
│   │   ├── manifest.json     # Extension manifest
│   │   ├── background.ts     # Service worker
│   │   ├── content.ts        # Content script
│   │   ├── popup/
│   │   │   ├── Panel.tsx     # Main sidebar
│   │   │   └── styles.css
│   │   ├── coach/
│   │   │   ├── useAudio.ts   # Audio recording
│   │   │   ├── useCoach.ts   # Coaching logic
│   │   │   ├── useTranscription.ts
│   │   │   └── useExtraction.ts
│   │   ├── coach-client.ts   # Reusable library
│   │   └── types.ts
│   ├── vite.config.ts
│   └── package.json
└── docs/                      # Documentation
```

## Development

### Cloudflare Worker

```bash
cd worker

# Local development
npm run dev

# Deploy to production
npm run deploy
```

### Browser Extension

```bash
cd extension

# Development (watch mode)
npm run dev

# Production build
npm run build
```

## Usage

1. Navigate to any job application form
2. Click the CLNCH extension icon
3. Click "Open Coach"
4. Speak your raw thoughts about answering the question
5. Get AI-coached refinement with audio playback
6. Copy and use the refined answer

## Troubleshooting

### Extension won't load
- Ensure you're in Developer mode (`chrome://extensions`)
- Check DevTools console (F12) for errors
- Try refreshing the extension

### No transcription
- Verify AssemblyAI API key
- Check microphone permissions
- Look at browser console for WebSocket errors

### Worker not responding
- Ensure `WORKER_URL` is set correctly
- Verify all environment secrets are set
- Check worker logs in Cloudflare dashboard

## Contributing

Contributions welcome! Areas for help:

- Firefox & Edge support
- Advanced form detection
- More voice options
- Analytics
- Mobile app

## License

MIT

## Support

- 📖 See `docs/` for detailed guides
- 🐛 Open an issue on GitHub
- 💬 Start a discussion

---

**Built to help you land your dream role** 🚀
