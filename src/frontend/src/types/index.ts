// Configuration types for the n8n React Chat Interface

export interface ConfigIdentity {
  botName: string;
  avatarUrl: string;
  introMessage: string;
  systemPrompt: string;
}

export interface ConfigTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  textSecondaryColor: string;
  errorColor: string;
  successColor: string;
  fontFamily: string;
  bubbleRadius: string;
  inputBackground: string;
}

export interface ConfigCapabilities {
  fileUpload: boolean;
  voiceInput: boolean;
  thinkingVisualization: boolean;
  showToolCalls: boolean;
}

export interface ConfigN8n {
  webhookUrl: string;
  useProxy: boolean;
  proxyUrl?: string;
}

export interface ConfigPerplexity {
  enabled: boolean;
  apiKey: string;
  model: string;
}

// Individual branded company entry for multi-company branding
export interface BrandedCompany {
  id: string;           // Unique ID for React keys
  name: string;         // Company name for display
  logoUrl: string;      // Logo URL (from Perplexity wizard or manual entry)
  linkUrl?: string;     // Optional link when clicked
}

export interface ConfigBranding {
  enabled: boolean;
  companies: BrandedCompany[];  // Array of branded companies (supports multiple logos)
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity: number; // 0-1
  size: number; // pixels
}

export interface AppConfig {
  identity: ConfigIdentity;
  theme: ConfigTheme;
  capabilities: ConfigCapabilities;
  n8n: ConfigN8n;
  perplexity?: ConfigPerplexity;
  branding?: ConfigBranding;
}

// Message types
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status: MessageStatus;
  files?: AttachedFile[];
  toolCalls?: ToolCall[];
  thinkingContent?: string;
}

export interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
  preview?: string;
}

// Tool call types for agent visualization
export type ToolCallStatus = 'in-progress' | 'success' | 'failed';

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: ToolCallStatus;
  startTime: Date;
  endTime?: Date;
}

// SSE Event types from n8n
export type SSEEventType =
  | 'workflow:start'
  | 'workflow:end'
  | 'node:start'
  | 'node:end'
  | 'tool-call-start'
  | 'tool-call-end'
  | 'data'
  | 'error';

export interface SSEEvent {
  event: SSEEventType;
  data: unknown;
}

export interface ToolCallStartEvent {
  tool: string;
  input: Record<string, unknown>;
}

export interface ToolCallEndEvent {
  tool: string;
  output: string;
}

// Chat state
export type ConnectionStatus = 'idle' | 'connecting' | 'streaming' | 'error';
