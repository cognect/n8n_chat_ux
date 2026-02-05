# n8n Chat UX - Frontend

A **React + TypeScript + Vite** chat interface designed for decoupled AI agent systems. The frontend is a "thin" client that renders the UI, manages session state, and parses incoming SSE streams—all business logic lives in the n8n backend.

**[← Back to Project Root](../../README.md)**

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
| `ToolCallIndicator.tsx` | Visualizes AI tool execution ("thinking" states) |

### Services Layer

| Service | Purpose |
|---------|---------|
| `configService.ts` | Loads and validates `config.json` |
| `n8nService.ts` | Handles API communication with n8n webhooks |
| `streamParser.ts` | Parses SSE events from n8n (tool calls, text deltas, etc.) |

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

Edit `public/config.json` to customize:

```json
{
  "n8n": {
    "webhookUrl": "http://localhost:5678/webhook/your-workflow-id",
    "useProxy": false,
    "proxyUrl": ""
  },
  "theme": {
    "primaryColor": "#6366f1",
    "backgroundColor": "#0f0f23",
    "fontFamily": "Inter, system-ui, sans-serif"
  },
  "features": {
    "fileUpload": true,
    "showToolCalls": true
  }
}
```

### Theme Variables
The `ThemeInjector` component maps config values to CSS custom properties:
- `--chat-primary` → Primary accent color
- `--chat-bg` → Background color
- `--chat-font` → Font family

## 📁 Directory Structure

```
src/frontend/
├── public/
│   └── config.json          # Runtime configuration
├── src/
│   ├── components/
│   │   ├── ChatContainer.tsx
│   │   ├── ChatInput.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ThemeInjector.tsx
│   │   ├── ToolCallIndicator.tsx
│   │   └── styles/          # Component CSS modules
│   ├── services/
│   │   ├── configService.ts
│   │   ├── n8nService.ts
│   │   └── streamParser.ts
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css            # Global styles
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
