
export enum AgentType {
  CHAT = 'CHAT',
  IMAGE_GEN = 'IMAGE_GEN',
  IMAGE_EDIT = 'IMAGE_EDIT',
  FILESYSTEM = 'FILESYSTEM',
  LOCAL_LLM = 'LOCAL_LLM',
  MODELS = 'MODELS',
  INTEGRATIONS = 'INTEGRATIONS',
  WORKFLOW = 'WORKFLOW'
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  image?: string; // Base64
  isError?: boolean;
}

export interface FileNode {
  name: string;
  kind: 'file' | 'directory';
  handle: FileSystemHandle;
  path: string;
  children?: FileNode[];
}

export interface FileSystemState {
  rootHandle: FileSystemDirectoryHandle | null;
  currentPath: string;
  files: FileNode[];
  selectedFile: FileNode | null;
  fileContent: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  action: 'READ' | 'CREATE' | 'MODIFY' | 'DELETE' | 'PERMISSION_GRANT' | 'PERMISSION_DENY';
  details: string;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
}

export interface AIModel {
  id: string;
  name: string;
  provider: string; 
  type: 'Cloud' | 'Local';
  description: string;
  requirements: string; 
  status: 'Not Installed' | 'Downloading' | 'Ready' | 'Active' | 'Error';
  progress?: number; 
  apiKeyRequired?: boolean;
  downloadUrl?: string; 
  stars?: number; 
}

export interface EditorPlugin {
  id: string;
  name: string;
  icon: string; 
  status: 'Connected' | 'Disconnected' | 'Connecting' | 'Error';
  version: string;
  port: number;
}

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K'
}

export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
  FOUR_THREE = '4:3',
  THREE_FOUR = '3:4'
}

export interface ApiKeyConfig {
  google: string;
  openai: string;
  anthropic: string;
  groq: string;
  mistral: string;
}

// Workflow Types
export type WorkflowNodeType = 'TRIGGER' | 'AGENT' | 'MODEL' | 'TOOL' | 'MEMORY' | 'OUTPUT' | 'CHAIN';

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: { 
    label: string; 
    subLabel?: string;
    icon?: string;
    provider?: 'google' | 'openai' | 'anthropic' | 'ollama' | 'mistral' | 'groq' | 'system' | 'custom';
    status?: 'IDLE' | 'RUNNING' | 'COMPLETE' | 'ERROR';
    config?: Record<string, any>;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}
