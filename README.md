# n8n Chat UX

A **decoupled agentic AI chat interface** that separates the presentation layer (React frontend) from the orchestration logic (n8n workflow backend). This architecture enables sophisticated AI behaviors—including reasoning visualization, tool usage transparency, and multimodal file analysis—while maintaining a brandable, zero-code configurable frontend.

## ✨ Key Features

- **Real-time Streaming**: SSE (Server-Sent Events) for live AI response visualization
- **Tool Call Transparency**: Visualize AI "thinking" and tool execution in real-time
- **Developer Metrics**: Token usage and latency tracking via n8n REST API
- **Zero-Code Branding**: Configure colors, fonts, and styling via JSON—no code changes required
- **AI-Powered Theme Extraction**: Perplexity Wizard automatically extracts branding from any website
- **Multi-Company Watermarking**: Display multiple partner/agency logos as configurable watermarks
- **Multimodal Support**: Handle file uploads with image thumbnail previews in messages
- **Shareable Sessions**: URL-based session management for conversation continuity

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React Frontend)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ ChatInput   │  │MessageBubble│  │ThemeInjector│  │ToolCall    │ │
│  │             │  │             │  │             │  │ Indicator  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│              │              ▲                                       │
└──────────────┼──────────────┼───────────────────────────────────────┘
               │              │
          POST (multipart)    │ SSE (text/event-stream)
               │              │
               ▼              │
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (n8n Workflow)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │
│  │   Webhook   │──│  AI Agent   │──│   Tools (Vector Store,      │ │
│  │    Node     │  │    Node     │  │   Functions, Sub-workflows) │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## 📂 Project Structure

```
n8n_chat_ux/
├── README.md                      # This file
├── src/
│   ├── frontend/                  # React + TypeScript + Vite application
│   │   ├── README.md              # Frontend documentation
│   │   ├── src/
│   │   │   ├── components/        # UI components (Chat, Messages, Theming, Settings)
│   │   │   ├── services/          # API, stream parsing, Perplexity integration
│   │   │   └── types/             # TypeScript type definitions
│   │   └── public/config.json     # Zero-code branding configuration
│   └── docker/                    # Container configurations
│       ├── README.md              # Docker overview
│       └── local-n8n/             # Local n8n development environment
│           └── README.md          # n8n setup instructions
└── references/                    # Research & reference materials
    └── README.md                  # Research documentation index
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### 1. Start n8n Backend
```bash
cd src/docker/local-n8n
docker-compose up -d
```
Access n8n at [http://localhost:5678](http://localhost:5678)

### 2. Install & Run Frontend
```bash
cd src/frontend
npm install
npm run dev
```
Access the chat UI at [http://localhost:5173](http://localhost:5173)

### 3. Configure via Settings UI
Click the ⚙️ button to open Settings and configure:
- **n8n Connection**: Set your webhook URL
- **Identity**: Bot name, avatar, intro message, system prompt
- **Theme Colors**: Primary, secondary, background, surface colors
- **Integrator Branding**: Optional watermark with your company logo

### 4. Configure n8n API Key (Optional, for Token Metrics)
To enable token usage tracking in the metrics display:

1. Copy `src/frontend/public/n8n-api-key.template.json` to `n8n-api-key.json`
2. Generate an API key from n8n Settings → API
3. Replace the placeholder in the JSON file with your key

Once configured, messages display latency and token counts (input/output).

### 5. Configure Perplexity API Key (Optional)
The Perplexity Wizard requires an API key to extract branding automatically:

**Option A: Configuration File (Recommended)**
1. Copy `src/frontend/public/perplexity-api-key.template.json` to `perplexity-api-key.json`
2. Replace the placeholder with your actual API key from [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
3. The file is gitignored for security

**Option B: Settings UI**
1. Open Settings → Perplexity Wizard section
2. Enter your API key directly (stored in browser session only)

### 5. Use Perplexity Wizard
1. Enter a website URL
2. Click "✨ Run Wizard" to extract colors, bot name, intro message, and system prompt

## ⚙️ Configuration

Edit `src/frontend/public/config.json` or use the Settings UI:

```json
{
  "identity": {
    "botName": "n8n Assistant",
    "avatarUrl": "",
    "introMessage": "Hello! How can I help you today?",
    "systemPrompt": "You are a helpful AI assistant..."
  },
  "theme": {
    "primaryColor": "#ff6d5a",
    "secondaryColor": "#ff8f7e",
    "backgroundColor": "#0f0f23"
  },
  "n8n": {
    "webhookUrl": "http://localhost:5678/webhook/chat"
  },
  "branding": {
    "enabled": true,
    "companies": [
      { "id": "1", "name": "n8n", "logoUrl": "/n8n-logo.svg", "linkUrl": "https://n8n.io" }
    ],
    "position": "bottom-right",
    "opacity": 0.4,
    "size": 48
  }
}
```

## 📖 Documentation

| Directory | Purpose |
|-----------|---------|
| [src/frontend/README.md](src/frontend/README.md) | Frontend architecture, components, and configuration |
| [src/docker/README.md](src/docker/README.md) | Docker environments overview |
| [src/docker/local-n8n/README.md](src/docker/local-n8n/README.md) | Local n8n setup and usage |
| [references/README.md](references/README.md) | Research documents and design rationale |

## 💡 Value & Impact

This architecture addresses key challenges in enterprise AI deployment:

1. **Separation of Concerns**: AI logic (n8n) iterates independently from UI (React)—no frontend deployments needed for prompt changes
2. **Transparency**: Users see what the AI is doing, building trust through visibility
3. **Flexibility**: Brand the interface for any client without code changes
4. **Visual Attachments**: Uploaded images display as thumbnails in message bubbles
5. **Scalability**: n8n workflows scale independently from the frontend
6. **White-Labeling**: Integrator watermarking enables reseller/partner branding

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | CSS Modules, CSS Custom Properties |
| AI Extraction | Perplexity API (Sonar model) |
| Backend | n8n (workflow automation) |
| Communication | SSE (streaming), multipart/form-data (uploads) |
| Development | Docker Compose, ESLint |
