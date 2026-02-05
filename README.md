# n8n Chat UX

A **decoupled agentic AI chat interface** that separates the presentation layer (React frontend) from the orchestration logic (n8n workflow backend). This architecture enables sophisticated AI behaviors—including reasoning visualization, tool usage transparency, and multimodal file analysis—while maintaining a brandable, zero-code configurable frontend.

## ✨ Key Features

- **Real-time Streaming**: SSE (Server-Sent Events) for live AI response visualization
- **Tool Call Transparency**: Visualize AI "thinking" and tool execution in real-time
- **Zero-Code Branding**: Configure colors, fonts, and styling via JSON—no code changes required
- **Multimodal Support**: Handle file uploads (images, PDFs) alongside text messages
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
│   │   │   ├── components/        # UI components (Chat, Messages, Theming)
│   │   │   ├── services/          # API & stream parsing services
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

### 3. Configure Connection
Update `src/frontend/public/config.json` with your n8n webhook URL:
```json
{
  "n8n": {
    "webhookUrl": "http://localhost:5678/webhook/your-workflow-id"
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
4. **Scalability**: n8n workflows scale independently from the frontend

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | CSS Modules, CSS Custom Properties |
| Backend | n8n (workflow automation) |
| Communication | SSE (streaming), multipart/form-data (uploads) |
| Development | Docker Compose, ESLint |
