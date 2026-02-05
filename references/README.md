# n8n Chat UX - References

Research documents and design rationale for the n8n Chat UX project.

**[← Back to Project Root](../README.md)**

## Research Documents

| Document | Description |
|----------|-------------|
| [research-n8n-react-interact.md](research/research-n8n-react-interact.md) | Technical guide on decoupled agentic systems with n8n orchestration and headless React interfaces |

## Key Concepts Covered

The research document provides in-depth analysis of:

1. **SSE (Server-Sent Events)**: Real-time streaming protocols for AI response visualization
2. **Headless UI Pattern**: Configuration-driven theming for zero-code branding
3. **Multimodal Handling**: Binary data transmission via multipart/form-data
4. **Transparency UX**: Visualizing AI "thinking" and tool execution
5. **Security Patterns**: Proxy architectures, rate limiting, and credential management

## Design Decisions Implemented

### Perplexity Wizard
- Uses Perplexity AI (Sonar model) to analyze website branding
- Extracts colors, logo, bot name, intro message, and system prompt
- Implements WCAG 2.1 color contrast validation and auto-correction

### Integrator Branding
- Semi-transparent watermark in configurable corner positions
- Logo extracted via Google Favicon service
- Configurable opacity, size, and link URL

### Theme Extraction Pipeline
```
Website URL → Perplexity API → JSON Parsing → WCAG Validation → Config Update
```

### Color Contrast Algorithm
- Relative luminance calculation per WCAG 2.1
- 4.5:1 minimum contrast for normal text
- 3:1 minimum contrast for large text/UI elements
- Automatic lightening/darkening for compliance

### Secure API Key Configuration
- Perplexity API keys stored in separate `perplexity-api-key.json` file
- Template file (`perplexity-api-key.template.json`) committed for reference
- Secret file gitignored to prevent accidental commits
- Fallback to manual entry in Settings UI

## Usage

Reference these documents when:
- Designing new features or components
- Understanding architectural decisions
- Troubleshooting integration issues
- Onboarding new team members
