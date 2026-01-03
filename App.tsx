import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Terminal, Image as ImageIcon, Edit, FolderOpen, 
  Settings, Send, Plus, Save, Trash2, 
  MonitorPlay, Cpu, FileCode, RefreshCw,
  ImagePlus, Download, Database, Puzzle,
  AlertTriangle, CheckCircle, XCircle, Activity,
  Server, Shield, Play, FileIcon, CornerDownRight,
  Search, Github, Star, ExternalLink, Globe,
  Workflow, Zap, Link as LinkIcon, MousePointer, Layers,
  Flame, Clock, ArrowUpRight, X, Copy,
  Bot, Box, Brain, HardDrive, MessageSquare, Globe as GlobeIcon, Command,
  ZoomIn, ZoomOut, Maximize, Key, Network, Calculator, Code, Hash, Sliders
} from 'lucide-react';
import { AgentType, Message, FileSystemState, ImageSize, AspectRatio, AIModel, LogEntry, EditorPlugin, FileNode, WorkflowNode, WorkflowEdge, WorkflowNodeType, ApiKeyConfig } from './types';
import * as GeminiService from './services/geminiService';
import * as FileService from './services/fileService';

// --- Types & Mock Data ---

const INITIAL_MODELS: AIModel[] = [
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', provider: 'Google', type: 'Cloud', description: 'Fastest multimodal model for high-frequency tasks.', requirements: 'API Key', status: 'Active', apiKeyRequired: true, stars: 2400 },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro', provider: 'Google', type: 'Cloud', description: 'Best-in-class model for complex reasoning and coding.', requirements: 'Paid API Key', status: 'Ready', apiKeyRequired: true, stars: 3100 },
  { id: 'llama-3-8b', name: 'Llama 3 (8B)', provider: 'Ollama', type: 'Local', description: 'Powerful open-weight model optimized for consumer hardware.', requirements: '8GB VRAM', status: 'Not Installed', stars: 52400 },
  { id: 'mistral-7b', name: 'Mistral 7B', provider: 'Ollama', type: 'Local', description: 'High performance small language model.', requirements: '4GB VRAM', status: 'Ready', stars: 38200 }
];

const INITIAL_PLUGINS: EditorPlugin[] = [
  { id: 'vscode', name: 'VS Code', icon: 'FileCode', status: 'Disconnected', version: '1.86.0', port: 54321 },
  { id: 'jetbrains', name: 'IntelliJ / PyCharm', icon: 'Terminal', status: 'Disconnected', version: '2024.1', port: 54322 },
  { id: 'sublime', name: 'Sublime Text', icon: 'Edit', status: 'Disconnected', version: '4.0', port: 54323 },
  { id: 'nvim', name: 'NeoVim', icon: 'Command', status: 'Disconnected', version: '0.9.5', port: 54324 }
];

// --- Sub-components ---

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${active ? 'bg-nexus-accent text-white shadow-lg shadow-blue-900/50' : 'text-gray-400 hover:bg-nexus-800 hover:text-white'}`}>
    <div className="shrink-0">{icon}</div>
    <span className="hidden lg:block font-medium truncate">{label}</span>
  </button>
);

const Sidebar = ({ activeAgent, setActiveAgent, toggleSettings }: any) => (
  <div className="w-20 lg:w-64 bg-nexus-900 border-r border-nexus-700 flex flex-col h-full transition-all duration-300">
    <div className="p-4 flex items-center justify-center lg:justify-start gap-3 border-b border-nexus-700 h-16">
      <div className="w-8 h-8 bg-nexus-accent rounded-lg flex items-center justify-center shrink-0"><Cpu className="text-white w-5 h-5" /></div>
      <h1 className="hidden lg:block font-bold text-xl tracking-tight text-white">Nexus AGI</h1>
    </div>
    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
      <div className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2 hidden lg:block">Agents</div>
      <NavButton active={activeAgent === AgentType.CHAT} onClick={() => setActiveAgent(AgentType.CHAT)} icon={<Terminal size={20} />} label="General Chat" />
      <NavButton active={activeAgent === AgentType.IMAGE_GEN} onClick={() => setActiveAgent(AgentType.IMAGE_GEN)} icon={<ImagePlus size={20} />} label="Image Gen Pro" />
      <NavButton active={activeAgent === AgentType.IMAGE_EDIT} onClick={() => setActiveAgent(AgentType.IMAGE_EDIT)} icon={<Edit size={20} />} label="Image Editor" />
      
      <div className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2 mt-6 hidden lg:block">Automation</div>
      <NavButton active={activeAgent === AgentType.WORKFLOW} onClick={() => setActiveAgent(AgentType.WORKFLOW)} icon={<Workflow size={20} />} label="Workflow Builder" />
      
      <div className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2 mt-6 hidden lg:block">System</div>
      <NavButton active={activeAgent === AgentType.FILESYSTEM} onClick={() => setActiveAgent(AgentType.FILESYSTEM)} icon={<FolderOpen size={20} />} label="File System" />
      <NavButton active={activeAgent === AgentType.MODELS} onClick={() => setActiveAgent(AgentType.MODELS)} icon={<Database size={20} />} label="Model Registry" />
      <NavButton active={activeAgent === AgentType.INTEGRATIONS} onClick={() => setActiveAgent(AgentType.INTEGRATIONS)} icon={<Puzzle size={20} />} label="Editor Bridge" />
    </nav>
    <div className="p-4 border-t border-nexus-700">
      <button onClick={toggleSettings} className="flex items-center gap-3 w-full p-3 rounded-lg text-nexus-700 hover:bg-nexus-800 hover:text-white transition-colors">
        <Settings size={20} className="text-gray-400" />
        <span className="hidden lg:block text-gray-400 font-medium">Settings</span>
      </button>
    </div>
  </div>
);

// --- Settings Modal ---
const SettingsModal = ({ isOpen, onClose, apiKeys, setApiKeys }: any) => {
  if (!isOpen) return null;

  const handleChange = (provider: keyof ApiKeyConfig, value: string) => {
    setApiKeys((prev: any) => ({ ...prev, [provider]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-nexus-900 border border-nexus-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-nexus-700">
           <h2 className="text-xl font-bold text-white flex items-center gap-2"><Key size={20} className="text-nexus-accent"/> API Keys & Configuration</h2>
           <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           <p className="text-sm text-gray-400">
             Configure your API keys to enable various AI models in the Workflow Builder and Agents. 
             These keys are stored locally in your browser session for this demo.
           </p>

           <div className="space-y-4">
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Google Gemini (Default)</label>
                 <div className="relative">
                    <input 
                      type="password" 
                      value={process.env.API_KEY ? "**********************" : ""} 
                      disabled 
                      className="w-full bg-nexus-800 border border-nexus-700 rounded-lg p-3 text-gray-400 pl-10 cursor-not-allowed"
                    />
                    <Cpu size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500"/>
                 </div>
                 <p className="text-[10px] text-gray-600 mt-1">Managed securely via environment variables.</p>
              </div>

              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">OpenAI API Key</label>
                 <div className="relative">
                    <input 
                      type="password" 
                      value={apiKeys.openai}
                      onChange={(e) => handleChange('openai', e.target.value)}
                      placeholder="sk-..." 
                      className="w-full bg-nexus-800 border border-nexus-700 rounded-lg p-3 text-white pl-10 focus:border-green-500 outline-none transition-colors"
                    />
                    <Zap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500"/>
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Anthropic API Key</label>
                 <div className="relative">
                    <input 
                      type="password" 
                      value={apiKeys.anthropic}
                      onChange={(e) => handleChange('anthropic', e.target.value)}
                      placeholder="sk-ant-..." 
                      className="w-full bg-nexus-800 border border-nexus-700 rounded-lg p-3 text-white pl-10 focus:border-amber-500 outline-none transition-colors"
                    />
                    <Brain size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500"/>
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Groq API Key</label>
                 <div className="relative">
                    <input 
                      type="password" 
                      value={apiKeys.groq}
                      onChange={(e) => handleChange('groq', e.target.value)}
                      placeholder="gsk_..." 
                      className="w-full bg-nexus-800 border border-nexus-700 rounded-lg p-3 text-white pl-10 focus:border-orange-500 outline-none transition-colors"
                    />
                    <Flame size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500"/>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-6 border-t border-nexus-700 bg-nexus-800/50 rounded-b-2xl flex justify-end">
           <button onClick={onClose} className="px-6 py-2 bg-nexus-accent hover:bg-nexus-accentHover text-white rounded-lg font-medium transition-colors">
              Save Configuration
           </button>
        </div>
      </div>
    </div>
  );
};

// --- 1. Workflow Builder (Updated) ---

const WorkflowEditor = ({ apiKeys }: { apiKeys: ApiKeyConfig }) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: '1', type: 'TRIGGER', position: { x: 100, y: 100 }, data: { label: 'On Chat Message', icon: 'zap', config: {} } },
    { id: '2', type: 'AGENT', position: { x: 450, y: 200 }, data: { label: 'Customer Support', subLabel: 'AI Agent', icon: 'bot', config: {} } },
    { id: '3', type: 'MODEL', position: { x: 100, y: 300 }, data: { label: 'Gemini 3 Pro', subLabel: 'Chat Model', icon: 'cpu', provider: 'google', config: { temp: 0.7, maxTokens: 2048, preset: 'balanced' } } },
    { id: '4', type: 'TOOL', position: { x: 450, y: 400 }, data: { label: 'Google Search', subLabel: 'Tool', icon: 'globe', config: {} } }
  ]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e3-2', source: '3', target: '2' },
    { id: 'e4-2', source: '4', target: '2' }
  ]);
  
  // Viewport State (Zoom & Pan)
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'triggers'|'models'|'agents'|'tools'>('models');
  
  // Linking State
  const [connectionStartId, setConnectionStartId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // --- Deletion Handler ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
          setEdges(prev => prev.filter(edge => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
          setSelectedNodeId(null);
        }
        if (selectedEdgeId) {
          setEdges(prev => prev.filter(edge => edge.id !== selectedEdgeId));
          setSelectedEdgeId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId]);

  // --- Zoom & Pan Handlers ---
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const sensitivity = 0.001;
        const delta = -e.deltaY * sensitivity;
        const newZoom = Math.min(Math.max(view.zoom + delta, 0.2), 3);
        setView(prev => ({ ...prev, zoom: newZoom }));
    } else {
        setView(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.button === 0 && !draggingNodeId) { 
        setIsPanning(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setView(prev => ({ 
        ...prev, 
        zoom: Math.min(Math.max(prev.zoom + (direction === 'in' ? 0.2 : -0.2), 0.2), 3) 
    }));
  };

  const resetView = () => setView({ x: 0, y: 0, zoom: 1 });

  // --- Node Logic ---
  const handleMouseDownNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setDraggingNodeId(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        setLastMousePos({ x: e.clientX, y: e.clientY });
        return;
    }

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - view.x) / view.zoom;
      const worldY = (e.clientY - rect.top - view.y) / view.zoom;
      setMousePos({ x: worldX, y: worldY });

      if (draggingNodeId) {
        const snappedX = Math.round(worldX / 10) * 10 - 110; 
        const snappedY = Math.round(worldY / 10) * 10 - 45; 
        setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, position: { x: snappedX, y: snappedY } } : n));
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setConnectionStartId(null);
    setIsPanning(false);
  };

  const handleEdgeClick = (e: React.MouseEvent, edgeId: string) => {
    e.stopPropagation();
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
  };

  // --- Linking ---
  const handleMouseDownHandle = (e: React.MouseEvent, nodeId: string, type: 'source' | 'target') => {
    e.stopPropagation();
    if (type === 'source') setConnectionStartId(nodeId);
  };

  const handleMouseUpHandle = (e: React.MouseEvent, nodeId: string, type: 'source' | 'target') => {
    e.stopPropagation();
    if (connectionStartId && type === 'target' && connectionStartId !== nodeId) {
      const newEdge: WorkflowEdge = {
        id: `e${connectionStartId}-${nodeId}-${Date.now()}`,
        source: connectionStartId,
        target: nodeId
      };
      if (!edges.find(e => e.source === connectionStartId && e.target === nodeId)) {
         setEdges([...edges, newEdge]);
      }
    }
    setConnectionStartId(null);
  };

  // --- Helper Functions ---
  const addNode = (type: WorkflowNodeType, label: string, subLabel: string, icon: string, provider: any = 'system') => {
    const id = Date.now().toString();
    const spawnX = (-view.x + (canvasRef.current?.clientWidth || 800)/2) / view.zoom;
    const spawnY = (-view.y + (canvasRef.current?.clientHeight || 600)/2) / view.zoom;
    
    setNodes([...nodes, {
      id, type,
      position: { x: spawnX, y: spawnY },
      data: { label, subLabel, icon, provider, config: type === 'MODEL' ? { temp: 0.7, maxTokens: 2048, preset: 'balanced' } : {} }
    }]);
  };

  const getNodeColor = (type: WorkflowNodeType, provider?: string) => {
    if (type === 'TRIGGER') return 'border-emerald-500/50 bg-[#152e25]';
    if (type === 'AGENT') return 'border-gray-500/50 bg-[#1e293b]';
    if (type === 'MODEL') {
        if (provider === 'anthropic') return 'border-amber-700/50 bg-[#2d2418]';
        if (provider === 'openai') return 'border-green-600/50 bg-[#152e1e]';
        if (provider === 'groq') return 'border-orange-600/50 bg-[#2d1b15]';
        return 'border-blue-500/50 bg-[#151f32]';
    }
    if (type === 'TOOL') return 'border-teal-500/50 bg-[#132e2e]';
    return 'border-purple-500/50 bg-[#261836]';
  };

  const renderIcon = (icon: string) => {
    if (icon === 'zap') return <Zap size={16} />;
    if (icon === 'bot') return <Bot size={16} />;
    if (icon === 'cpu') return <Cpu size={16} />;
    if (icon === 'globe') return <GlobeIcon size={16} />;
    if (icon === 'brain') return <Brain size={16} />;
    if (icon === 'box') return <Box size={16} />;
    if (icon === 'command') return <Command size={16} />;
    if (icon === 'flame') return <Flame size={16} />;
    if (icon === 'calculator') return <Calculator size={16} />;
    if (icon === 'code') return <Code size={16} />;
    if (icon === 'network') return <Network size={16} />;
    if (icon === 'hash') return <Hash size={16} />;
    return <Activity size={16} />;
  };

  // --- Model Config Presets ---
  const applyModelPreset = (nodeId: string, preset: string) => {
    let configUpdate: Record<string, any> = { preset };
    if (preset === 'fast') {
        configUpdate = { ...configUpdate, temp: 0.3, maxTokens: 1024 };
    } else if (preset === 'balanced') {
        configUpdate = { ...configUpdate, temp: 0.7, maxTokens: 2048 };
    } else if (preset === 'creative') {
        configUpdate = { ...configUpdate, temp: 1.0, maxTokens: 4096 };
    }
    // For 'custom', we just set the preset name, values stay as they were (or are handled by sliders)

    setNodes(prev => prev.map(n => 
        n.id === nodeId 
        ? { ...n, data: { ...n.data, config: { ...n.data.config, ...configUpdate } } } 
        : n
    ));
  };

  return (
    <div className="flex h-full bg-[#111] overflow-hidden select-none">
      {/* Sidebar Palette (Left) */}
      <div className="w-64 bg-nexus-900 border-r border-nexus-700 flex flex-col z-10 shrink-0">
        <div className="p-4 border-b border-nexus-700">
           <h3 className="text-sm font-bold text-white mb-4">Node Library</h3>
           <div className="flex bg-nexus-800 p-1 rounded-lg">
              {['triggers', 'models', 'agents', 'tools'].map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat as any)} className={`flex-1 py-1.5 rounded text-xs font-medium capitalize transition-colors ${activeCategory === cat ? 'bg-nexus-700 text-white' : 'text-gray-400 hover:text-white'}`}>{cat}</button>
              ))}
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
           {activeCategory === 'triggers' && (
             <>
                <button onClick={() => addNode('TRIGGER', 'Chat Message', 'Start', 'zap')} className="w-full flex items-center gap-3 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg border border-nexus-700 text-left">
                    <div className="bg-emerald-900/50 p-2 rounded text-emerald-400"><Zap size={18} /></div>
                    <div><div className="text-sm font-medium text-gray-200">On Message</div><div className="text-xs text-gray-500">Trigger</div></div>
                </button>
                <button onClick={() => addNode('TRIGGER', 'Webhook', 'HTTP', 'network')} className="w-full flex items-center gap-3 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg border border-nexus-700 text-left">
                    <div className="bg-emerald-900/50 p-2 rounded text-emerald-400"><Network size={18} /></div>
                    <div><div className="text-sm font-medium text-gray-200">Webhook</div><div className="text-xs text-gray-500">External Call</div></div>
                </button>
                <button onClick={() => addNode('TRIGGER', 'Schedule', 'Time', 'clock')} className="w-full flex items-center gap-3 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg border border-nexus-700 text-left">
                    <div className="bg-emerald-900/50 p-2 rounded text-emerald-400"><Clock size={18} /></div>
                    <div><div className="text-sm font-medium text-gray-200">Cron Job</div><div className="text-xs text-gray-500">Recurring</div></div>
                </button>
             </>
           )}
           {activeCategory === 'models' && (
             <>
               <button onClick={() => addNode('MODEL', 'Gemini 3 Pro', 'Google', 'cpu', 'google')} className="w-full flex items-center gap-3 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg border border-nexus-700 text-left">
                  <div className="bg-blue-900/30 p-2 rounded text-blue-400"><Cpu size={18} /></div>
                  <div><div className="text-sm font-medium text-gray-200">Gemini 3 Pro</div><div className="text-xs text-gray-500">Reasoning</div></div>
               </button>
               <button onClick={() => addNode('MODEL', 'GPT-4o', 'OpenAI', 'zap', 'openai')} className="w-full flex items-center gap-3 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg border border-nexus-700 text-left">
                  <div className="bg-green-900/30 p-2 rounded text-green-400"><Zap size={18} /></div>
                  <div><div className="text-sm font-medium text-gray-200">GPT-4o</div><div className="text-xs text-gray-500">OpenAI</div></div>
               </button>
               <button onClick={() => addNode('MODEL', 'Claude 3.5', 'Anthropic', 'brain', 'anthropic')} className="w-full flex items-center gap-3 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg border border-nexus-700 text-left">
                  <div className="bg-amber-900/30 p-2 rounded text-amber-400"><Brain size={18} /></div>
                  <div><div className="text-sm font-medium text-gray-200">Claude 3.5</div><div className="text-xs text-gray-500">Anthropic</div></div>
               </button>
               <button onClick={() => addNode('MODEL', 'Mixtral 8x7B', 'Groq', 'flame', 'groq')} className="w-full flex items-center gap-3 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg border border-nexus-700 text-left">
                  <div className="bg-orange-900/30 p-2 rounded text-orange-400"><Flame size={18} /></div>
                  <div><div className="text-sm font-medium text-gray-200">Mixtral</div><div className="text-xs text-gray-500">Groq Fast Inference</div></div>
               </button>
               <button onClick={() => addNode('MODEL', 'Llama 3', 'Local', 'box', 'ollama')} className="w-full flex items-center gap-3 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg border border-nexus-700 text-left">
                  <div className="bg-gray-700/50 p-2 rounded text-gray-300"><Box size={18} /></div>
                  <div><div className="text-sm font-medium text-gray-200">Llama 3</div><div className="text-xs text-gray-500">Ollama</div></div>
               </button>
             </>
           )}
           {activeCategory === 'agents' && (
             <>
                 <button onClick={() => addNode('AGENT', 'AI Agent', 'Orchestrator', 'bot')} className="w-full flex items-center gap-3 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg border border-nexus-700 text-left">
                    <div className="bg-indigo-900/30 p-2 rounded text-indigo-400"><Bot size={18} /></div>
                    <div><div className="text-sm font-medium text-gray-200">AI Agent</div><div className="text-xs text-gray-500">Logic Core</div></div>
                 </button>
                 <button onClick={() => addNode('CHAIN', 'ReAct Chain', 'Reasoning', 'layers')} className="w-full flex items-center gap-3 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg border border-nexus-700 text-left">
                    <div className="bg-indigo-900/30 p-2 rounded text-indigo-400"><Layers size={18} /></div>
                    <div><div className="text-sm font-medium text-gray-200">ReAct Chain</div><div className="text-xs text-gray-500">Thought Loop</div></div>
                 </button>
             </>
           )}
           {activeCategory === 'tools' && (
             <>
                <button onClick={() => addNode('TOOL', 'Web Search', 'Tool', 'globe')} className="w-full flex items-center gap-3 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg border border-nexus-700 text-left">
                    <div className="bg-teal-900/30 p-2 rounded text-teal-400"><GlobeIcon size={18} /></div>
                    <div><div className="text-sm font-medium text-gray-200">Google Search</div><div className="text-xs text-gray-500">Grounding</div></div>
                </button>
                <button onClick={() => addNode('TOOL', 'HTTP Request', 'API', 'network')} className="w-full flex items-center gap-3 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg border border-nexus-700 text-left">
                    <div className="bg-teal-900/30 p-2 rounded text-teal-400"><Network size={18} /></div>
                    <div><div className="text-sm font-medium text-gray-200">HTTP Request</div><div className="text-xs text-gray-500">External API</div></div>
                </button>
                <button onClick={() => addNode('TOOL', 'Calculator', 'Math', 'calculator')} className="w-full flex items-center gap-3 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg border border-nexus-700 text-left">
                    <div className="bg-teal-900/30 p-2 rounded text-teal-400"><Calculator size={18} /></div>
                    <div><div className="text-sm font-medium text-gray-200">Calculator</div><div className="text-xs text-gray-500">Math Ops</div></div>
                </button>
                <button onClick={() => addNode('TOOL', 'Python Code', 'Code', 'code')} className="w-full flex items-center gap-3 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg border border-nexus-700 text-left">
                    <div className="bg-teal-900/30 p-2 rounded text-teal-400"><Code size={18} /></div>
                    <div><div className="text-sm font-medium text-gray-200">Python Sandbox</div><div className="text-xs text-gray-500">Execution</div></div>
                </button>
                <button onClick={() => addNode('TOOL', 'Vector Store', 'DB', 'hash')} className="w-full flex items-center gap-3 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg border border-nexus-700 text-left">
                    <div className="bg-teal-900/30 p-2 rounded text-teal-400"><Hash size={18} /></div>
                    <div><div className="text-sm font-medium text-gray-200">Vector Store</div><div className="text-xs text-gray-500">RAG Memory</div></div>
                </button>
             </>
           )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative bg-[#0f1219] overflow-hidden">
         <div className="absolute top-4 right-4 z-50 flex gap-2 bg-nexus-800 border border-nexus-700 p-1 rounded-lg shadow-xl">
            <button onClick={() => handleZoom('out')} className="p-2 hover:bg-nexus-700 rounded text-gray-300"><ZoomOut size={18}/></button>
            <span className="px-2 flex items-center text-xs font-mono text-gray-400 w-12 justify-center">{Math.round(view.zoom * 100)}%</span>
            <button onClick={() => handleZoom('in')} className="p-2 hover:bg-nexus-700 rounded text-gray-300"><ZoomIn size={18}/></button>
            <div className="w-px bg-nexus-700 mx-1"></div>
            <button onClick={resetView} className="p-2 hover:bg-nexus-700 rounded text-gray-300" title="Reset View"><Maximize size={18}/></button>
         </div>

         <div 
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            onWheel={handleWheel}
            onMouseDown={handleMouseDownCanvas}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
         >
            <div 
                style={{ 
                    transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
                    transformOrigin: '0 0',
                    width: '100%', height: '100%'
                }}
                className="relative"
            >
                <svg className="absolute -top-[5000px] -left-[5000px] w-[10000px] h-[10000px] pointer-events-none opacity-20 z-0">
                    <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="#64748b" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Edges */}
                <svg className="absolute -top-[5000px] -left-[5000px] w-[10000px] h-[10000px] pointer-events-none z-0 overflow-visible">
                    {edges.map(edge => {
                        const s = nodes.find(n => n.id === edge.source);
                        const t = nodes.find(n => n.id === edge.target);
                        if (!s || !t) return null;
                        const sx = s.position.x + 5000 + 220;
                        const sy = s.position.y + 5000 + 45;
                        const tx = t.position.x + 5000;
                        const ty = t.position.y + 5000 + 45;
                        const isSelected = selectedEdgeId === edge.id;
                        
                        return (
                            <g key={edge.id} className="group cursor-pointer pointer-events-auto" onClick={(e) => handleEdgeClick(e, edge.id)}>
                                {/* Hit area for easier selection */}
                                <path 
                                    d={`M ${sx} ${sy} C ${sx+70} ${sy}, ${tx-70} ${ty}, ${tx} ${ty}`}
                                    stroke="transparent" strokeWidth="20" fill="none"
                                />
                                {/* Visible path */}
                                <path 
                                    d={`M ${sx} ${sy} C ${sx+70} ${sy}, ${tx-70} ${ty}, ${tx} ${ty}`}
                                    stroke={isSelected ? "#3b82f6" : "#64748b"} 
                                    strokeWidth={isSelected ? "4" : "2"} 
                                    fill="none"
                                    className="transition-colors group-hover:stroke-nexus-accent"
                                />
                            </g>
                        );
                    })}
                    {connectionStartId && (
                        <path 
                            d={`M ${nodes.find(n=>n.id===connectionStartId)!.position.x + 5000 + 220} ${nodes.find(n=>n.id===connectionStartId)!.position.y + 5000 + 45} L ${mousePos.x + 5000} ${mousePos.y + 5000}`}
                            stroke="#fbbf24" strokeWidth="2" strokeDasharray="5,5" fill="none"
                        />
                    )}
                </svg>

                {/* Nodes */}
                {nodes.map(node => (
                    <div
                        key={node.id}
                        onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                        className={`absolute w-[220px] h-[90px] rounded-xl shadow-2xl border flex flex-col transition-shadow ${selectedNodeId === node.id ? 'border-white ring-2 ring-blue-500/50 z-20' : `${getNodeColor(node.type, node.data.provider)} z-10`}`}
                        style={{ left: node.position.x, top: node.position.y }}
                    >
                         <div className={`h-1.5 w-full rounded-t-xl ${node.type === 'TRIGGER' ? 'bg-emerald-600' : node.type === 'MODEL' ? (node.data.provider === 'anthropic' ? 'bg-amber-600' : node.data.provider === 'openai' ? 'bg-green-600' : node.data.provider === 'groq' ? 'bg-orange-600' : 'bg-blue-600') : node.type === 'TOOL' ? 'bg-teal-600' : 'bg-gray-600'}`} />
                         
                         <div className="flex-1 p-4 flex items-center gap-3 relative">
                            <div onMouseUp={(e) => handleMouseUpHandle(e, node.id, 'target')} className="w-3 h-3 rounded-full bg-gray-400 absolute -left-1.5 top-1/2 -translate-y-1/2 border border-black hover:bg-white cursor-crosshair z-10" />
                            <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center shrink-0 text-white/80">{renderIcon(node.data.icon || 'activity')}</div>
                            <div className="min-w-0">
                                <div className="text-white text-sm font-bold truncate">{node.data.label}</div>
                                <div className="text-[10px] text-gray-400 uppercase font-semibold">{node.data.subLabel}</div>
                            </div>
                            <div onMouseDown={(e) => handleMouseDownHandle(e, node.id, 'source')} className="w-3 h-3 rounded-full bg-gray-400 absolute -right-1.5 top-1/2 -translate-y-1/2 border border-black hover:bg-white cursor-crosshair z-10" />
                         </div>
                    </div>
                ))}
            </div>
         </div>
      </div>
      
      {/* Property Panel */}
      {selectedNode && (
        <div className="w-80 bg-nexus-900 border-l border-nexus-700 p-6 z-20 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
             <div className="flex justify-between items-center mb-6 border-b border-nexus-700 pb-4">
                 <h3 className="font-bold text-white">Properties</h3>
                 <button onClick={() => setSelectedNodeId(null)}><X size={18} className="text-gray-500 hover:text-white" /></button>
             </div>
             <div className="space-y-4 flex-1 overflow-y-auto">
                 <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Label</label>
                    <input className="w-full bg-nexus-800 border border-nexus-600 rounded p-2 text-white text-sm mt-1" value={selectedNode.data.label} onChange={(e) => setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: e.target.value } } : n))} />
                 </div>
                 
                 {selectedNode.type === 'MODEL' && (
                    <>
                        <div className="p-3 bg-nexus-800 rounded-lg border border-nexus-700">
                           <div className="text-xs text-gray-400 mb-2">Provider Configuration</div>
                           {selectedNode.data.provider === 'google' && <div className="text-xs text-green-400 flex items-center gap-2"><CheckCircle size={12}/> Using default Google API Key</div>}
                           {selectedNode.data.provider === 'openai' && (
                                apiKeys.openai ? <div className="text-xs text-green-400 flex items-center gap-2"><CheckCircle size={12}/> OpenAI Key Configured</div> : <div className="text-xs text-red-400 flex items-center gap-2"><AlertTriangle size={12}/> Missing API Key (See Settings)</div>
                           )}
                           {selectedNode.data.provider === 'anthropic' && (
                                apiKeys.anthropic ? <div className="text-xs text-green-400 flex items-center gap-2"><CheckCircle size={12}/> Anthropic Key Configured</div> : <div className="text-xs text-red-400 flex items-center gap-2"><AlertTriangle size={12}/> Missing API Key (See Settings)</div>
                           )}
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2"><Sliders size={12}/> Configuration Preset</label>
                            <select 
                                className="w-full bg-nexus-800 border border-nexus-600 rounded p-2 text-white text-sm mt-1"
                                value={selectedNode.data.config?.preset || 'custom'}
                                onChange={(e) => applyModelPreset(selectedNode.id, e.target.value)}
                            >
                                <option value="fast">Fastest (Low Temp, Low Tokens)</option>
                                <option value="balanced">Balanced (Default)</option>
                                <option value="creative">Highest Quality (High Temp, Max Tokens)</option>
                                <option value="custom">Custom Configuration</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Temperature ({selectedNode.data.config?.temp ?? 0.7})</label>
                            <input 
                                type="range" min="0" max="1" step="0.1" 
                                className="w-full mt-2 accent-nexus-accent" 
                                value={selectedNode.data.config?.temp ?? 0.7}
                                onChange={(e) => {
                                    const newVal = parseFloat(e.target.value);
                                    setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, config: { ...n.data.config, temp: newVal, preset: 'custom' } } } : n));
                                }}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Max Tokens</label>
                            <input 
                                type="number" 
                                className="w-full bg-nexus-800 border border-nexus-600 rounded p-2 text-white text-sm mt-1" 
                                value={selectedNode.data.config?.maxTokens ?? 2048}
                                onChange={(e) => {
                                    const newVal = parseInt(e.target.value);
                                    setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, config: { ...n.data.config, maxTokens: newVal, preset: 'custom' } } } : n));
                                }}
                            />
                        </div>
                    </>
                 )}
                 {selectedNode.type === 'TOOL' && (
                     <div className="p-3 bg-nexus-800 rounded-lg border border-nexus-700 text-xs text-gray-400">
                        Tool specific configurations would appear here.
                     </div>
                 )}
             </div>
             
             <button onClick={() => { setNodes(nodes.filter(n => n.id !== selectedNode.id)); setEdges(edges.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id)); setSelectedNodeId(null); }} className="w-full bg-red-900/20 text-red-400 py-3 rounded-lg text-sm font-bold mt-4 flex items-center justify-center gap-2 border border-red-900/50 hover:bg-red-900/40 transition-colors"><Trash2 size={16}/> Delete Node</button>
        </div>
      )}
    </div>
  );
};

// --- 2. Advanced Model Registry (Restored) ---
const ModelRegistry = () => {
  const [activeTab, setActiveTab] = useState<'installed' | 'discover'>('installed');
  const [models, setModels] = useState<AIModel[]>(INITIAL_MODELS);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AIModel[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Trending State
  const [trendingModels, setTrendingModels] = useState<AIModel[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);

  // Install Modal State
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);

  // Fetch trending on tab change
  useEffect(() => {
    if (activeTab === 'discover' && trendingModels.length === 0) {
      fetchTrending();
    }
  }, [activeTab]);

  const startDownloadSimulation = (modelToDownload: AIModel) => {
    if (!models.find(m => m.id === modelToDownload.id)) {
      setModels(prev => [...prev, { ...modelToDownload, status: 'Downloading', progress: 0 }]);
    } else {
      setModels(prev => prev.map(m => m.id === modelToDownload.id ? { ...m, status: 'Downloading', progress: 0 } : m));
    }
    
    setActiveTab('installed');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setModels(prev => prev.map(m => m.id === modelToDownload.id ? { ...m, progress } : m));
      if (progress >= 100) {
        clearInterval(interval);
        setModels(prev => prev.map(m => m.id === modelToDownload.id ? { ...m, status: 'Ready', progress: undefined } : m));
      }
    }, 300);
  };

  const handleInstallClick = (model: AIModel) => {
    if (model.type === 'Local') {
        setSelectedModel(model);
        setShowInstallModal(true);
    } else {
        startDownloadSimulation(model);
    }
  };

  const toggleActive = (id: string) => {
    setModels(prev => prev.map(m => {
      if (m.id === id) return { ...m, status: 'Active' };
      if (m.status === 'Active') return { ...m, status: 'Ready' };
      return m;
    }));
  };

  const estimateRequirements = (name: string, description: string): string => {
    const text = (name + " " + description).toLowerCase();
    if (text.includes('70b')) return '48GB+ VRAM';
    if (text.includes('30b') || text.includes('33b') || text.includes('34b')) return '24GB+ VRAM';
    if (text.includes('13b') || text.includes('14b') || text.includes('mixtral')) return '16GB VRAM';
    if (text.includes('7b') || text.includes('8b') || text.includes('mistral')) return '8GB VRAM';
    if (text.includes('3b') || text.includes('phi')) return '4GB VRAM';
    if (text.includes('1b') || text.includes('tiny')) return '2GB VRAM';
    return 'Manual Setup';
  };

  const mapGithubItems = (items: any[]): AIModel[] => {
    return items.map((item: any) => ({
      id: String(item.id),
      name: item.name,
      provider: item.owner.login,
      type: 'Local',
      description: item.description || 'No description provided.',
      requirements: estimateRequirements(item.name, item.description || ''),
      status: 'Not Installed',
      downloadUrl: item.html_url,
      stars: item.stargazers_count
    }));
  };

  const fetchTrending = async () => {
    setIsLoadingTrending(true);
    try {
      const query = encodeURIComponent("topic:llm pushed:>2023-12-01");
      const response = await fetch(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=30`);
      
      if (!response.ok) throw new Error("GitHub API error");
      
      const data = await response.json();
      setTrendingModels(mapGithubItems(data.items));
    } catch (e) {
      console.error("Trending fetch failed", e);
      setTrendingModels([
         {
          id: 'mock-trend-1',
          name: 'Llama-3-Open-v1',
          provider: 'MockAI',
          type: 'Local',
          description: 'Trending model fallback data due to API rate limits.',
          requirements: '16GB VRAM',
          status: 'Not Installed',
          stars: 15420
        }
      ]);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const query = encodeURIComponent(`${searchQuery} topic:llm`);
      const response = await fetch(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=10`);
      if (!response.ok) throw new Error("GitHub API limit reached or network error.");
      const data = await response.json();
      setSearchResults(mapGithubItems(data.items));
    } catch (e) {
      console.error(e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getInstallCommand = (model: AIModel) => {
    if (model.provider === 'Ollama') {
        const name = model.name.toLowerCase();
        if (name.includes('llama 3')) return 'ollama pull llama3';
        if (name.includes('mistral')) return 'ollama pull mistral';
        if (name.includes('gemma')) return 'ollama pull gemma';
        if (name.includes('phi')) return 'ollama pull phi';
        return `ollama pull ${name.replace(/\s+/g, '-')}`;
    }
    return `git clone ${model.downloadUrl || 'https://github.com/example/repo'}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') performSearch();
  };

  const isDiscoveryMode = activeTab === 'discover';
  const showTrending = isDiscoveryMode && !searchQuery;
  const showResults = isDiscoveryMode && !!searchQuery;
  const displayModels = activeTab === 'installed' ? models : (showResults ? searchResults : trendingModels);

  return (
    <div className="flex flex-col h-full bg-nexus-900 overflow-hidden relative">
      <div className="p-6 pb-0 shrink-0">
        <h2 className="text-2xl font-bold text-white mb-2">Model Registry</h2>
        <p className="text-gray-400 mb-6">Manage local and cloud AI models. Download, configure, and select the active engine.</p>
        
        <div className="flex gap-4 border-b border-nexus-700">
           <button onClick={() => setActiveTab('installed')} className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'installed' ? 'border-nexus-accent text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>My Registry</button>
           <button onClick={() => setActiveTab('discover')} className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'discover' ? 'border-nexus-accent text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}><Globe size={14} /> Discover</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'discover' && (
           <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex gap-2 max-w-2xl mb-6">
                 <div className="relative flex-1">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                   <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Search for models (e.g. 'llama 3', 'mistral', 'bert')..." className="w-full bg-nexus-800 border border-nexus-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-nexus-accent outline-none transition-colors" />
                 </div>
                 <button onClick={performSearch} disabled={isSearching} className="bg-nexus-accent hover:bg-nexus-accentHover text-white px-6 rounded-xl font-medium transition-colors disabled:opacity-50">{isSearching ? 'Searching...' : 'Search'}</button>
              </div>
              
              {showTrending && (
                 <div className="flex items-center gap-2 text-white mb-4">
                    <Flame className="text-orange-500" size={20} />
                    <h3 className="text-lg font-bold">Trending & Recently Updated</h3>
                    <button onClick={fetchTrending} className="p-1.5 hover:bg-nexus-700 rounded-full transition-colors group" title="Refresh Trending">
                       <RefreshCw className={`text-gray-400 group-hover:text-white ${isLoadingTrending ? 'animate-spin' : ''}`} size={16} />
                    </button>
                 </div>
              )}
           </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {displayModels.map(model => (
            <div key={model.id} className="bg-nexus-800 border border-nexus-700 rounded-xl p-5 hover:border-nexus-600 transition-all flex flex-col group animate-in fade-in duration-500">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 w-full">
                  <div className={`p-3 rounded-xl shadow-inner shrink-0 ${model.type === 'Cloud' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                    {model.type === 'Cloud' ? <Server size={24} /> : <Cpu size={24} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2 truncate pr-2">
                            {model.name}
                            {model.downloadUrl && (
                                <a href={model.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-nexus-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0" title="View on GitHub"><ExternalLink size={14} /></a>
                            )}
                        </h3>
                        <div className="flex flex-col items-end shrink-0">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${
                                model.status === 'Active' ? 'bg-nexus-accent/20 border-nexus-accent/50 text-nexus-accent' : 
                                model.status === 'Ready' ? 'bg-green-900/20 border-green-800 text-green-400' : 
                                model.status === 'Downloading' ? 'bg-yellow-900/20 border-yellow-800 text-yellow-400' :
                                'bg-gray-800 border-gray-700 text-gray-500'
                            }`}>{model.status}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs mt-2">
                        <span className="bg-nexus-900 px-2 py-1 rounded-md text-gray-400 border border-nexus-700 flex items-center gap-1.5">
                            {activeTab === 'discover' ? <Github size={12} /> : <Database size={12} />}
                            {model.provider}
                        </span>
                        <span className={`px-2 py-1 rounded-md border flex items-center gap-1.5 ${model.requirements.includes('VRAM') ? 'bg-orange-950/30 border-orange-900/50 text-orange-400' : 'bg-blue-950/30 border-blue-900/50 text-blue-400'}`}>
                            {model.requirements.includes('VRAM') ? <MonitorPlay size={12} /> : <Shield size={12} />}
                            {model.requirements}
                        </span>
                        {model.stars !== undefined && (
                            <span className="bg-yellow-950/20 px-2 py-1 rounded-md text-yellow-500 border border-yellow-900/30 flex items-center gap-1.5">
                            <Star size={12} fill="currentColor" /> {model.stars > 1000 ? (model.stars / 1000).toFixed(1) + 'k' : model.stars}
                            </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-400 text-sm mb-6 flex-1 min-h-[40px] leading-relaxed line-clamp-2">{model.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-nexus-700 mt-auto">
                 {model.status === 'Downloading' ? (
                   <div className="w-full">
                      <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Downloading parameters...</span><span>{model.progress}%</span></div>
                      <div className="h-2 bg-nexus-900 rounded-full overflow-hidden">
                        <div className="h-full bg-nexus-accent transition-all duration-300" style={{width: `${model.progress}%`}}></div>
                      </div>
                   </div>
                 ) : (
                   <>
                     <div className="text-xs text-gray-500 flex items-center gap-1">
                       {model.apiKeyRequired && <Shield size={12} />}
                       {model.apiKeyRequired ? 'Secure Key Storage' : 'Local Storage'}
                     </div>
                     <div className="flex gap-2">
                       {model.status === 'Not Installed' && (
                         <button onClick={() => handleInstallClick(model)} className="flex items-center gap-2 px-3 py-1.5 bg-nexus-700 hover:bg-nexus-600 rounded-lg text-sm text-white transition-colors">
                           <Download size={14} /> {activeTab === 'discover' ? 'Pull' : 'Install'}
                         </button>
                       )}
                       {(model.status === 'Ready' || model.status === 'Active') && (
                          <button onClick={() => toggleActive(model.id)} disabled={model.status === 'Active'} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${model.status === 'Active' ? 'bg-green-600/20 text-green-400 cursor-default' : 'bg-nexus-accent hover:bg-nexus-accentHover text-white'}`}>
                            {model.status === 'Active' ? <CheckCircle size={14} /> : <Play size={14} />}
                            {model.status === 'Active' ? 'Active' : 'Activate'}
                          </button>
                       )}
                     </div>
                   </>
                 )}
              </div>
            </div>
          ))}
          
          {showResults && searchResults.length === 0 && !isSearching && searchQuery && (
             <div className="col-span-full text-center py-10 text-gray-500">No repositories found matching "{searchQuery}"</div>
          )}
          
          {showTrending && displayModels.length === 0 && !isLoadingTrending && (
             <div className="col-span-full flex flex-col items-center justify-center py-10 text-gray-600 gap-2"><Activity size={48} className="opacity-20" /><p>Unable to load trending models. Try searching manually.</p></div>
          )}
        </div>
      </div>

      {showInstallModal && selectedModel && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-nexus-800 border border-nexus-600 rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><Download size={20} className="text-nexus-accent" /> Install {selectedModel.name}</h3>
                    <button onClick={() => setShowInstallModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>
                
                <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                    {selectedModel.provider === 'Ollama' 
                        ? "This model is designed to run locally using Ollama. To install it, copy and run the following command in your terminal:" 
                        : "To install this model, clone the repository to your local machine using the command below:"}
                </p>

                <div className="bg-[#0a0f1c] border border-nexus-700 rounded-lg p-4 font-mono text-sm text-green-400 mb-6 flex items-center justify-between group relative overflow-hidden">
                    <code className="truncate mr-4">{getInstallCommand(selectedModel)}</code>
                    <button onClick={() => navigator.clipboard.writeText(getInstallCommand(selectedModel))} className="text-gray-500 hover:text-white bg-[#0a0f1c] pl-2 transition-colors" title="Copy to Clipboard"><Copy size={18} /></button>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-nexus-700">
                    <button onClick={() => setShowInstallModal(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium">Cancel</button>
                    <button onClick={() => { setShowInstallModal(false); startDownloadSimulation(selectedModel); }} className="px-5 py-2 bg-nexus-accent hover:bg-nexus-accentHover text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-blue-900/30">Done / Installed</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// --- 3. Restored File System & Integration ---
const FileSystemManager = ({ fsState, setFsState }: any) => {
    const handleOpen = async () => {
        try {
            const handle = await FileService.getDirectoryHandle();
            const files = await FileService.readDirectory(handle);
            setFsState({ rootHandle: handle, files, currentPath: handle.name, selectedFile: null, fileContent: '' });
        } catch (e) { console.error(e); }
    };

    return (
        <div className="h-full flex flex-col bg-nexus-900">
            <div className="p-4 border-b border-nexus-700 flex justify-between items-center bg-nexus-800">
                <span className="font-bold text-gray-300">{fsState.rootHandle ? fsState.rootHandle.name : 'No Folder'}</span>
                <button onClick={handleOpen} className="p-2 bg-nexus-700 rounded hover:bg-nexus-600 text-white"><FolderOpen size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {fsState.files.length === 0 && <div className="text-gray-500 text-center mt-10 text-sm">Open a directory to view files</div>}
                {fsState.files.map((f: FileNode, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 hover:bg-nexus-800 rounded cursor-pointer text-gray-300 text-sm">
                        {f.kind === 'directory' ? <FolderOpen size={14} className="text-yellow-500"/> : <FileCode size={14} className="text-blue-400"/>}
                        {f.name}
                    </div>
                ))}
            </div>
        </div>
    );
};

const IntegrationManager = () => {
    const [plugins, setPlugins] = useState<EditorPlugin[]>(INITIAL_PLUGINS);

    const toggleConnection = (id: string) => {
        setPlugins(prev => prev.map(p => {
            if (p.id === id) {
                if (p.status === 'Connected') return { ...p, status: 'Disconnected' };
                return { ...p, status: 'Connecting' };
            }
            return p;
        }));

        // Simulate connection
        setTimeout(() => {
            setPlugins(prev => prev.map(p => {
                if (p.id === id && p.status === 'Connecting') {
                    return { ...p, status: 'Connected' };
                }
                return p;
            }));
        }, 1500);
    };

    return (
        <div className="p-6 bg-nexus-900 h-full">
            <h2 className="text-2xl font-bold text-white mb-6">Editor Bridge</h2>
            <p className="text-gray-400 mb-6">Connect Nexus to your favorite IDEs for real-time code synchronization and context sharing.</p>
            <div className="space-y-4">
                {plugins.map(p => (
                    <div key={p.id} className="bg-nexus-800 border border-nexus-700 p-4 rounded-xl flex justify-between items-center transition-colors hover:border-nexus-600">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-nexus-900 rounded-lg text-white border border-nexus-700 relative">
                                {p.icon === 'FileCode' && <FileCode size={20}/>}
                                {p.icon === 'Terminal' && <Terminal size={20}/>}
                                {p.icon === 'Edit' && <Edit size={20}/>}
                                {p.icon === 'Command' && <Command size={20}/>}
                                {p.status === 'Connected' && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-nexus-900"></div>}
                            </div>
                            <div>
                                <div className="font-bold text-white flex items-center gap-2">{p.name}</div>
                                <div className="text-xs text-gray-500">v{p.version} • Port {p.port}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-xs rounded-full border ${
                                p.status === 'Connected' ? 'bg-green-900/20 text-green-500 border-green-900/50' : 
                                p.status === 'Connecting' ? 'bg-yellow-900/20 text-yellow-500 border-yellow-900/50' :
                                'bg-gray-800 text-gray-500 border-gray-700'
                            }`}>
                                {p.status}
                            </span>
                            <button 
                                onClick={() => toggleConnection(p.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                    p.status === 'Connected' ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 
                                    'bg-nexus-accent hover:bg-nexus-accentHover text-white'
                                }`}
                                title={p.status === 'Connected' ? 'Disconnect' : 'Connect'}
                            >
                                {p.status === 'Connected' ? <XCircle size={18} /> : <LinkIcon size={18} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 p-4 bg-nexus-800/50 rounded-lg border border-nexus-700 border-dashed">
                <div className="flex items-center gap-2 text-sm text-gray-400 justify-center">
                    <Activity size={16} /> 
                    <span>Listening for incoming connections on localhost:54320...</span>
                </div>
            </div>
        </div>
    );
};

// --- 4. Upgraded Chat Interface (Multi-modal) ---

const ChatInterface = ({ agentType }: { agentType: AgentType }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Configs
  const [imgSize, setImgSize] = useState<ImageSize>(ImageSize.SIZE_1K);
  const [aspect, setAspect] = useState<AspectRatio>(AspectRatio.SQUARE);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
  });

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;
    
    const userMsg: Message = { 
        id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now(),
        image: selectedFile ? URL.createObjectURL(selectedFile) : undefined
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const fileToProcess = selectedFile; // Capture ref
    setSelectedFile(null);
    setLoading(true);

    try {
        let responseText = "";
        let responseImage = undefined;

        if (agentType === AgentType.IMAGE_GEN) {
            // Generate Image
            const b64 = await GeminiService.generateImagePro(userMsg.content, imgSize, aspect);
            responseImage = b64;
            responseText = "Here is your generated image:";
        } else if (agentType === AgentType.IMAGE_EDIT && fileToProcess) {
            // Edit Image
            const b64Input = await fileToBase64(fileToProcess);
            const b64Output = await GeminiService.editImage(userMsg.content, b64Input, fileToProcess.type);
            responseImage = b64Output;
            responseText = "Here is the edited version:";
        } else {
            // Standard Chat (Flash/Pro)
            const b64 = fileToProcess ? await fileToBase64(fileToProcess) : undefined;
            const history = messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }));
            responseText = await GeminiService.generateText(userMsg.content, b64, history);
        }

        setMessages(prev => [...prev, {
            id: (Date.now()+1).toString(), role: 'model', content: responseText, timestamp: Date.now(), image: responseImage
        }]);

    } catch (e) {
        setMessages(prev => [...prev, {
            id: (Date.now()+1).toString(), role: 'model', content: `Error: ${e instanceof Error ? e.message : String(e)}`, timestamp: Date.now(), isError: true
        }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1219]">
       {/* Toolbar for Image Agents */}
       {agentType === AgentType.IMAGE_GEN && (
           <div className="h-14 border-b border-nexus-700 bg-nexus-800 flex items-center px-4 gap-4 shrink-0">
               <span className="text-xs font-bold text-gray-400 uppercase">Config</span>
               <select className="bg-nexus-900 text-white text-xs p-1.5 rounded border border-nexus-600" value={imgSize} onChange={(e)=>setImgSize(e.target.value as ImageSize)}>
                   <option value={ImageSize.SIZE_1K}>1K</option><option value={ImageSize.SIZE_2K}>2K</option><option value={ImageSize.SIZE_4K}>4K</option>
               </select>
               <select className="bg-nexus-900 text-white text-xs p-1.5 rounded border border-nexus-600" value={aspect} onChange={(e)=>setAspect(e.target.value as AspectRatio)}>
                   <option value={AspectRatio.SQUARE}>1:1</option><option value={AspectRatio.LANDSCAPE}>16:9</option><option value={AspectRatio.PORTRAIT}>9:16</option>
               </select>
           </div>
       )}

       {/* Message List */}
       <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50 gap-2">
                {agentType === AgentType.IMAGE_GEN ? <ImagePlus size={48}/> : agentType === AgentType.IMAGE_EDIT ? <Edit size={48}/> : <Bot size={48}/>}
                <p>Ready to {agentType === AgentType.IMAGE_GEN ? "create" : agentType === AgentType.IMAGE_EDIT ? "edit" : "chat"}...</p>
             </div>
          )}
          {messages.map(msg => (
             <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-xl ${msg.role === 'user' ? 'bg-nexus-accent text-white' : 'bg-nexus-800 text-gray-100 border border-nexus-700'} ${msg.isError ? 'border-red-500 bg-red-900/20' : ''}`}>
                   {msg.image && <img src={msg.image} alt="content" className="max-w-full rounded-lg mb-2 border border-black/20" />}
                   <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                </div>
             </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-nexus-800 p-3 rounded-xl border border-nexus-700 text-gray-400 text-sm animate-pulse">Processing...</div></div>}
          <div ref={scrollRef} />
       </div>

       {/* Input Area */}
       <div className="p-4 border-t border-nexus-700 bg-[#0f1219]">
          {selectedFile && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-nexus-800 rounded border border-nexus-700 inline-flex">
                  <span className="text-xs text-blue-400 truncate max-w-[150px]">{selectedFile.name}</span>
                  <button onClick={()=>setSelectedFile(null)} className="text-gray-500 hover:text-white"><X size={12}/></button>
              </div>
          )}
          <div className="flex gap-2 relative">
             {(agentType === AgentType.CHAT || agentType === AgentType.IMAGE_EDIT) && (
                 <div className="relative">
                     <input type="file" className="absolute inset-0 opacity-0 cursor-pointer w-10" onChange={(e)=>setSelectedFile(e.target.files?.[0] || null)} />
                     <button className={`p-3 rounded-lg border ${selectedFile ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-nexus-800 border-nexus-700 text-gray-400 hover:text-white'}`}>
                        <ImagePlus size={20} />
                     </button>
                 </div>
             )}
             <input 
                value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={agentType === AgentType.IMAGE_GEN ? "Describe the image to generate..." : "Type a message..."}
                className="w-full bg-nexus-800 border border-nexus-700 rounded-lg pl-4 pr-12 py-3 text-white focus:outline-none focus:border-nexus-accent transition-colors"
             />
             <button onClick={handleSend} disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-nexus-accent text-white rounded-md hover:bg-blue-500 disabled:opacity-50 transition-colors">
                <Send size={16} />
             </button>
          </div>
       </div>
    </div>
  );
};

// --- Main App ---

const App = () => {
  const [activeAgent, setActiveAgent] = useState<AgentType>(AgentType.CHAT);
  const [fsState, setFsState] = useState<FileSystemState>({ rootHandle: null, currentPath: '/', files: [], selectedFile: null, fileContent: '' });
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig>({ google: '', openai: '', anthropic: '', groq: '', mistral: '' });

  return (
    <div className="flex h-screen bg-[#0f1219] text-white font-sans overflow-hidden">
      <Sidebar activeAgent={activeAgent} setActiveAgent={setActiveAgent} toggleSettings={() => setShowSettings(!showSettings)} />
      <div className="flex-1 relative flex flex-col min-w-0">
         {activeAgent === AgentType.WORKFLOW && <WorkflowEditor apiKeys={apiKeys} />}
         {activeAgent === AgentType.MODELS && <ModelRegistry />}
         {activeAgent === AgentType.FILESYSTEM && <FileSystemManager fsState={fsState} setFsState={setFsState} />}
         {activeAgent === AgentType.INTEGRATIONS && <IntegrationManager />}
         {(activeAgent === AgentType.CHAT || activeAgent === AgentType.IMAGE_GEN || activeAgent === AgentType.IMAGE_EDIT) && (
            <ChatInterface agentType={activeAgent} />
         )}
      </div>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} apiKeys={apiKeys} setApiKeys={setApiKeys} />
    </div>
  );
};

export default App;