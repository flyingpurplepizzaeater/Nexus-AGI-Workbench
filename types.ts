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
  provider: string; // Changed to string to support GitHub usernames
  type: 'Cloud' | 'Local';
  description: string;
  requirements: string; // e.g. "8GB RAM" or "API Key"
  status: 'Not Installed' | 'Downloading' | 'Ready' | 'Active' | 'Error';
  progress?: number; // 0-100 for downloading
  apiKeyRequired?: boolean;
  downloadUrl?: string; // URL to the GitHub repo
  stars?: number; // GitHub stars
}

export interface EditorPlugin {
  id: string;
  name: string;
  icon: string; // lucide icon name
  status: 'Connected' | 'Disconnected' | 'Not Installed';
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

export interface GeminiConfig {
  apiKey?: string;
  ollamaUrl?: string;
  selectedModel?: string;
}

// Workflow Types
export type WorkflowNodeType = 'TRIGGER' | 'AGENT_CHAT' | 'AGENT_IMAGE' | 'FILE_READ' | 'FILE_WRITE';

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: { 
    label: string; 
    status?: 'IDLE' | 'RUNNING' | 'COMPLETE' | 'ERROR';
    output?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}