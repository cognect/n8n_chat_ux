# n8n Chat UX - Frontend

A **React + TypeScript + Vite** chat interface designed for decoupled AI agent systems. The frontend is a "thin" client that renders the UI, manages session state, and parses incoming SSE streams—all business logic lives in the n8n backend.

**[← Back to Project Root](../../README.md)**

## ✨ Features

- **Configuration-Driven Theming**: Zero-code branding via `config.json` or Settings UI
- **Perplexity Wizard**: AI-powered extraction of branding, colors, and prompts from any website
- **Integrator Branding**: Configurable watermark with logo, position, opacity, and link
- **Real-time Streaming**: SSE parsing for live AI responses
- **Tool Call Visualization**: Shows AI "thinking" states and tool execution
- **Markdown Rendering**: Full markdown support with code highlighting
- **File Uploads**: Multimodal support for images and documents
- **Session Management**: URL-based sessions for shareable conversations

## 🏗️ Architecture

### Headless UI Pattern
The frontend is **configuration-driven**, enabling zero-code branding:

```
public/config.json → ThemeInjector → CSS Custom Properties → All Components
```

### Component Structure

| Component | Purpose |
|-----------|---------|
| `ChatContainer.tsx` | Main container, manages message state and SSE connection |
| `ChatInput.tsx` | User input with file upload support |
| `MessageBubble.tsx` | Renders user/assistant messages with markdown |
| `ThemeInjector.tsx` | Applies configuration-driven theming via CSS variables |
| `ThemeSettings.tsx` | Settings panel with Perplexity Wizard and branding controls |
| `ToolCallIndicator.tsx` | Visualizes AI tool execution ("thinking" states) |
| `BrandingWatermark.tsx` | Displays integrator logo watermark |

### Services Layer

| Service | Purpose |
|---------|---------|
| `configService.ts` | Loads, validates, and merges `config.json` |
| `n8nService.ts` | Handles API communication with n8n webhooks |
| `streamParser.ts` | Parses SSE events from n8n (tool calls, text deltas) |
| `perplexityService.ts` | AI-powered theme extraction with WCAG contrast validation |

## 🚀 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## ⚙️ Configuration

### Using Settings UI (Recommended)
Click the ⚙️ button in the app to access:
- **Perplexity Wizard**: Automatically extract branding from websites
- **Identity**: Bot name, avatar, intro message, system prompt
- **Theme Colors**: Full color palette customization
- **Styling**: Font family, bubble radius
- **Capabilities**: Toggle features (file upload, tool calls, etc.)
- **n8n Connection**: Webhook URL configuration
- **Integrator Branding**: Watermark with logo, position, opacity, size

### Manual Configuration
Edit `public/config.json`:

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
    "backgroundColor": "#0f0f23",
    "surfaceColor": "#1a1a2e",
    "textColor": "#ffffff",
    "textSecondaryColor": "#a1a1aa",
    "fontFamily": "'Inter', sans-serif",
    "bubbleRadius": "16px",
    "inputBackground": "#16162a"
  },
  "capabilities": {
    "fileUpload": true,
    "voiceInput": false,
    "thinkingVisualization": true,
    "showToolCalls": true
  },
  "n8n": {
    "webhookUrl": "http://localhost:5678/webhook/chat",
    "useProxy": false
  },
  "branding": {
    "enabled": true,
    "logoUrl": "/n8n-logo.svg",
    "position": "bottom-right",
    "opacity": 0.4,
    "size": 48,
    "linkUrl": "https://n8n.io"
  }
}
```

## 🪄 Perplexity Wizard

The Perplexity Wizard uses AI to extract branding from any website:

1. Get a Perplexity API key from [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Open Settings → Perplexity Wizard
3. Enter API key and website URL
4. Click "✨ Run Wizard"

**Extracts:**
- Brand colors (primary, secondary, background)
- Logo/favicon URL
- Bot name based on company name
- Intro message with brand personality
- System prompt for AI behavior

All colors are automatically adjusted for WCAG 2.1 contrast compliance.

## 📁 Directory Structure

```
src/frontend/
├── public/
│   ├── config.json          # Runtime configuration
│   └── n8n-logo.svg         # Default branding logo
├── src/
│   ├── components/
│   │   ├── ChatContainer.tsx
│   │   ├── ChatInput.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ThemeInjector.tsx
│   │   ├── ThemeSettings.tsx    # Settings panel with wizard
│   │   ├── BrandingWatermark.tsx
│   │   ├── ToolCallIndicator.tsx
│   │   └── styles/              # Component CSS
│   ├── services/
│   │   ├── configService.ts
│   │   ├── n8nService.ts
│   │   ├── streamParser.ts
│   │   └── perplexityService.ts # AI theme extraction
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🔑 Key Concepts

### SSE Stream Parsing
The frontend receives Server-Sent Events from n8n:
1. `tool-call-start` → Show "thinking" indicator
2. `tool-call-end` → Hide indicator, show result
3. `data` events → Stream text tokens into message bubble

### Session Management
Sessions are tracked via URL query parameter (`?session=<uuid>`), enabling:
- Shareable conversation links
- Agent memory continuity across refreshes

### Theme Injection
CSS Custom Properties are dynamically set by `ThemeInjector`:
- `--color-primary` → Primary accent color
- `--color-background` → Background color
- `--color-text` → Text color
- `--font-family` → Font stack
