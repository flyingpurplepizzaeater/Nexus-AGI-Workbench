import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Terminal, Image as ImageIcon, Edit, FolderOpen, 
  Settings, Send, Plus, Save, Trash2, 
  MonitorPlay, Cpu, FileCode, RefreshCw,
  ImagePlus, Download, Database, Puzzle,
  AlertTriangle, CheckCircle, XCircle, Activity,
  Server, Shield, Play, FileIcon, CornerDownRight,
  Search, Github, Star, ExternalLink, Globe,
  Workflow, Zap, Link as LinkIcon, MousePointer, Layers
} from 'lucide-react';
import { AgentType, Message, FileSystemState, ImageSize, AspectRatio, AIModel, LogEntry, EditorPlugin, FileNode, WorkflowNode, WorkflowEdge, WorkflowNodeType } from './types';
import * as GeminiService from './services/geminiService';
import * as FileService from './services/fileService';

// --- Types & Mock Data for New Features ---

const INITIAL_MODELS: AIModel[] = [
  {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    provider: 'Google',
    type: 'Cloud',
    description: 'Fastest multimodal model for high-frequency tasks.',
    requirements: 'API Key',
    status: 'Active',
    apiKeyRequired: true,
    stars: 2400
  },
  {
    id: 'gemini-3-pro',
    name: 'Gemini 3 Pro',
    provider: 'Google',
    type: 'Cloud',
    description: 'Best-in-class model for complex reasoning and coding.',
    requirements: 'Paid API Key',
    status: 'Ready',
    apiKeyRequired: true,
    stars: 3100
  },
  {
    id: 'llama-3-8b',
    name: 'Llama 3 (8B)',
    provider: 'Ollama',
    type: 'Local',
    description: 'Powerful open-weight model optimized for consumer hardware.',
    requirements: '8GB VRAM',
    status: 'Not Installed',
    stars: 52400
  },
  {
    id: 'mistral-7b',
    name: 'Mistral 7B',
    provider: 'Ollama',
    type: 'Local',
    description: 'High performance small language model.',
    requirements: '4GB VRAM',
    status: 'Ready',
    stars: 38200
  }
];

const EDITOR_PLUGINS: EditorPlugin[] = [
  { id: 'vscode', name: 'VS Code', icon: 'FileCode', status: 'Disconnected', version: '1.2.0', port: 54321 },
  { id: 'jetbrains', name: 'IntelliJ / PyCharm', icon: 'Terminal', status: 'Not Installed', version: '0.9.5', port: 54322 },
  { id: 'sublime', name: 'Sublime Text', icon: 'Edit', status: 'Not Installed', version: '1.0.1', port: 54323 }
];

// --- Sub-components ---

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
      active ? 'bg-nexus-accent text-white shadow-lg shadow-blue-900/50' : 'text-gray-400 hover:bg-nexus-800 hover:text-white'
    }`}
  >
    <div className="shrink-0">{icon}</div>
    <span className="hidden lg:block font-medium truncate">{label}</span>
  </button>
);

const Sidebar = ({ activeAgent, setActiveAgent, toggleSettings }: any) => (
  <div className="w-20 lg:w-64 bg-nexus-900 border-r border-nexus-700 flex flex-col h-full transition-all duration-300">
    <div className="p-4 flex items-center justify-center lg:justify-start gap-3 border-b border-nexus-700 h-16">
      <div className="w-8 h-8 bg-nexus-accent rounded-lg flex items-center justify-center shrink-0">
        <Cpu className="text-white w-5 h-5" />
      </div>
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

// --- Workflow Builder Component ---

const WorkflowEditor = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: '1', type: 'TRIGGER', position: { x: 100, y: 100 }, data: { label: 'On Start' } },
    { id: '2', type: 'AGENT_CHAT', position: { x: 400, y: 150 }, data: { label: 'Summarize' } }
  ]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([
    { id: 'e1-2', source: '1', target: '2' }
  ]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<{id: string, startX: number, startY: number} | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(nodeId);
      setIsDragging({ id: nodeId, startX: e.clientX, startY: e.clientY });
      setDragOffset({ x: e.clientX - node.position.x, y: e.clientY - node.position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Snap to grid (20px)
      const snappedX = Math.round(newX / 20) * 20;
      const snappedY = Math.round(newY / 20) * 20;

      setNodes(prev => prev.map(n => 
        n.id === isDragging.id ? { ...n, position: { x: snappedX, y: snappedY } } : n
      ));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const addNode = (type: WorkflowNodeType) => {
    const id = Date.now().toString();
    const label = type === 'TRIGGER' ? 'Trigger' : type === 'AGENT_CHAT' ? 'Chat Agent' : type === 'AGENT_IMAGE' ? 'Image Gen' : 'File Op';
    const newNode: WorkflowNode = {
      id,
      type,
      position: { x: 200, y: 200 },
      data: { label }
    };
    setNodes([...nodes, newNode]);
  };

  const getNodeColor = (type: WorkflowNodeType) => {
    switch (type) {
      case 'TRIGGER': return 'bg-emerald-600 border-emerald-400';
      case 'AGENT_CHAT': return 'bg-blue-600 border-blue-400';
      case 'AGENT_IMAGE': return 'bg-purple-600 border-purple-400';
      default: return 'bg-slate-600 border-slate-400';
    }
  };

  const getNodeIcon = (type: WorkflowNodeType) => {
    switch (type) {
      case 'TRIGGER': return <Zap size={16} />;
      case 'AGENT_CHAT': return <Terminal size={16} />;
      case 'AGENT_IMAGE': return <ImageIcon size={16} />;
      default: return <FileCode size={16} />;
    }
  };

  return (
    <div className="flex h-full bg-[#111] overflow-hidden">
      {/* Node Palette */}
      <div className="w-48 bg-nexus-900 border-r border-nexus-700 flex flex-col p-4 z-10">
        <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Nodes</h3>
        <div className="space-y-2">
          <button onClick={() => addNode('TRIGGER')} className="w-full flex items-center gap-2 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg text-sm text-gray-200 border border-nexus-700">
            <Zap size={16} className="text-emerald-400" /> Trigger
          </button>
          <button onClick={() => addNode('AGENT_CHAT')} className="w-full flex items-center gap-2 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg text-sm text-gray-200 border border-nexus-700">
            <Terminal size={16} className="text-blue-400" /> Chat Agent
          </button>
          <button onClick={() => addNode('AGENT_IMAGE')} className="w-full flex items-center gap-2 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg text-sm text-gray-200 border border-nexus-700">
            <ImageIcon size={16} className="text-purple-400" /> Image Gen
          </button>
          <button onClick={() => addNode('FILE_READ')} className="w-full flex items-center gap-2 p-3 bg-nexus-800 hover:bg-nexus-700 rounded-lg text-sm text-gray-200 border border-nexus-700">
            <FolderOpen size={16} className="text-yellow-400" /> File Op
          </button>
        </div>
        
        <div className="mt-auto">
           <button className="w-full py-2 bg-nexus-accent hover:bg-nexus-accentHover text-white rounded font-bold flex items-center justify-center gap-2">
             <Play size={16} /> Run Workflow
           </button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        className="flex-1 relative bg-[#0a0f1c] overflow-hidden cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >
        {/* SVG Layer for Edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {edges.map(edge => {
            const source = nodes.find(n => n.id === edge.source);
            const target = nodes.find(n => n.id === edge.target);
            if (!source || !target) return null;
            
            const startX = source.position.x + 180; // Right side
            const startY = source.position.y + 40;  // Middle height (approx)
            const endX = target.position.x;
            const endY = target.position.y + 40;

            const cX1 = startX + 50;
            const cY1 = startY;
            const cX2 = endX - 50;
            const cY2 = endY;

            return (
              <path 
                key={edge.id}
                d={`M ${startX} ${startY} C ${cX1} ${cY1}, ${cX2} ${cY2}, ${endX} ${endY}`}
                stroke="#64748b"
                strokeWidth="2"
                fill="none"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map(node => (
          <div
            key={node.id}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            className={`absolute w-[180px] h-[80px] rounded-lg border-2 shadow-xl flex flex-col transition-shadow ${
              selectedNode === node.id ? 'border-white shadow-blue-500/20' : getNodeColor(node.type) + ' border-opacity-50'
            }`}
            style={{ 
              left: node.position.x, 
              top: node.position.y,
              backgroundColor: '#1e293b'
            }}
          >
             {/* Header */}
             <div className={`h-8 px-3 flex items-center gap-2 rounded-t-md text-white text-xs font-bold ${getNodeColor(node.type).split(' ')[0]}`}>
               {getNodeIcon(node.type)}
               {node.data.label}
             </div>
             
             {/* Body */}
             <div className="flex-1 p-2 flex items-center justify-between relative">
                {/* Input Handle */}
                {node.type !== 'TRIGGER' && (
                  <div className="w-3 h-3 rounded-full bg-gray-400 absolute -left-1.5 top-1/2 -translate-y-1/2 border border-gray-900 cursor-pointer hover:bg-white" />
                )}
                
                <div className="text-[10px] text-gray-400 px-1">
                  {node.type === 'AGENT_CHAT' ? 'Model: Gemini Flash' : node.type === 'TRIGGER' ? 'Manual Trigger' : 'Configured'}
                </div>

                {/* Output Handle */}
                <div className="w-3 h-3 rounded-full bg-gray-400 absolute -right-1.5 top-1/2 -translate-y-1/2 border border-gray-900 cursor-pointer hover:bg-white" />
             </div>
          </div>
        ))}
      </div>
      
      {/* Property Panel (Mock) */}
      {selectedNode && (
        <div className="w-64 bg-nexus-900 border-l border-nexus-700 p-4 z-10 animate-in slide-in-from-right duration-200">
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-white">Properties</h3>
             <button onClick={() => setSelectedNode(null)}><XCircle size={16} className="text-gray-500 hover:text-white" /></button>
           </div>
           
           <div className="space-y-4">
             <div>
               <label className="text-xs text-gray-500 block mb-1">Node Name</label>
               <input className="w-full bg-nexus-800 border border-nexus-700 rounded p-2 text-sm text-white" defaultValue="New Node" />
             </div>
             <div>
               <label className="text-xs text-gray-500 block mb-1">Description</label>
               <textarea className="w-full bg-nexus-800 border border-nexus-700 rounded p-2 text-sm text-white h-20" defaultValue="Executes a task..." />
             </div>
             <button className="text-red-400 text-xs flex items-center gap-1 hover:text-red-300">
               <Trash2 size={12} /> Delete Node
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

// --- 2. Model Registry Component ---
const ModelRegistry = () => {
  const [activeTab, setActiveTab] = useState<'installed' | 'search'>('installed');
  const [models, setModels] = useState<AIModel[]>(INITIAL_MODELS);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AIModel[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleDownload = (modelToDownload: AIModel) => {
    // If it's a search result, add it to my models
    if (!models.find(m => m.id === modelToDownload.id)) {
      setModels(prev => [...prev, { ...modelToDownload, status: 'Downloading', progress: 0 }]);
    } else {
      setModels(prev => prev.map(m => m.id === modelToDownload.id ? { ...m, status: 'Downloading', progress: 0 } : m));
    }
    
    // Switch to installed tab to show progress
    setActiveTab('installed');

    // Simulate download
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
    if (text.includes('30b') || text.includes('33b') || text.includes('34b') || text.includes('command r')) return '24GB+ VRAM';
    if (text.includes('13b') || text.includes('14b') || text.includes('mixtral')) return '16GB VRAM';
    if (text.includes('7b') || text.includes('8b') || text.includes('mistral') || text.includes('llama 3')) return '8GB VRAM';
    if (text.includes('3b') || text.includes('phi')) return '4GB VRAM';
    if (text.includes('1b') || text.includes('tiny')) return '2GB VRAM';
    return 'Manual Setup';
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      // Searching GitHub for repositories tagged with 'llm' or 'model' matching the query
      // Adding 'topic:model' or 'topic:llm' to refine results
      const query = encodeURIComponent(`${searchQuery} topic:llm`);
      const response = await fetch(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=10`);
      
      if (!response.ok) throw new Error("GitHub API limit reached or network error.");
      
      const data = await response.json();
      const mappedResults: AIModel[] = data.items.map((item: any) => ({
        id: String(item.id),
        name: item.name,
        provider: item.owner.login, // GitHub owner as provider
        type: 'Local',
        description: item.description || 'No description provided.',
        requirements: estimateRequirements(item.name, item.description || ''),
        status: 'Not Installed',
        downloadUrl: item.html_url,
        stars: item.stargazers_count
      }));
      
      setSearchResults(mappedResults);
    } catch (e) {
      console.error(e);
      // Fallback/Mock data if API fails (likely due to rate limits in demo)
      setSearchResults([
        {
          id: 'gh-mock-1',
          name: `DeepSeek-${searchQuery}-7B`,
          provider: 'DeepSeek-AI',
          type: 'Local',
          description: `A mock result for ${searchQuery} (7B parameters) because GitHub API might be rate-limited.`,
          requirements: '8GB VRAM',
          status: 'Not Installed',
          stars: 12450,
          downloadUrl: '#'
        },
        {
          id: 'gh-mock-2',
          name: `${searchQuery}-Pro-34B`,
          provider: 'OpenSource-Hub',
          type: 'Local',
          description: `High performance 34B parameter model for ${searchQuery}.`,
          requirements: '24GB+ VRAM',
          status: 'Not Installed',
          stars: 8320,
          downloadUrl: '#'
        }
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') performSearch();
  };

  return (
    <div className="flex flex-col h-full bg-nexus-900 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-0 shrink-0">
        <h2 className="text-2xl font-bold text-white mb-2">Model Registry</h2>
        <p className="text-gray-400 mb-6">Manage local and cloud AI models. Download, configure, and select the active engine.</p>
        
        {/* Tabs */}
        <div className="flex gap-4 border-b border-nexus-700">
           <button 
             onClick={() => setActiveTab('installed')}
             className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${
               activeTab === 'installed' ? 'border-nexus-accent text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
             }`}
           >
             My Registry
           </button>
           <button 
             onClick={() => setActiveTab('search')}
             className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
               activeTab === 'search' ? 'border-nexus-accent text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
             }`}
           >
             <Github size={14} /> GitHub Search
           </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'search' && (
           <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex gap-2 max-w-2xl">
                 <div className="relative flex-1">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                   <input 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     onKeyDown={handleKeyDown}
                     placeholder="Search for models (e.g. 'llama 3', 'mistral', 'bert')..." 
                     className="w-full bg-nexus-800 border border-nexus-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-nexus-accent outline-none transition-colors"
                   />
                 </div>
                 <button 
                   onClick={performSearch}
                   disabled={isSearching}
                   className="bg-nexus-accent hover:bg-nexus-accentHover text-white px-6 rounded-xl font-medium transition-colors disabled:opacity-50"
                 >
                   {isSearching ? 'Searching...' : 'Search'}
                 </button>
              </div>
           </div>
        )}

        {/* List */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {(activeTab === 'installed' ? models : searchResults).map(model => (
            <div key={model.id} className="bg-nexus-800 border border-nexus-700 rounded-xl p-5 hover:border-nexus-600 transition-all flex flex-col group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 w-full">
                  {/* Icon Box */}
                  <div className={`p-3 rounded-xl shadow-inner shrink-0 ${model.type === 'Cloud' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                    {model.type === 'Cloud' ? <Server size={24} /> : <Cpu size={24} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2 truncate pr-2">
                            {model.name}
                            {model.downloadUrl && (
                                <a href={model.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-nexus-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0" title="View on GitHub">
                                <ExternalLink size={14} />
                                </a>
                            )}
                        </h3>
                         {/* Status Badge */}
                        <div className="flex flex-col items-end shrink-0">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${
                                model.status === 'Active' ? 'bg-nexus-accent/20 border-nexus-accent/50 text-nexus-accent' : 
                                model.status === 'Ready' ? 'bg-green-900/20 border-green-800 text-green-400' : 
                                model.status === 'Downloading' ? 'bg-yellow-900/20 border-yellow-800 text-yellow-400' :
                                'bg-gray-800 border-gray-700 text-gray-500'
                            }`}>
                                {model.status}
                            </span>
                        </div>
                    </div>
                    
                    {/* Enhanced Metadata Row */}
                    <div className="flex flex-wrap gap-2 text-xs mt-2">
                        {/* Provider Badge */}
                        <span className="bg-nexus-900 px-2 py-1 rounded-md text-gray-400 border border-nexus-700 flex items-center gap-1.5">
                            {activeTab === 'search' ? <Github size={12} /> : <Database size={12} />}
                            {model.provider}
                        </span>
                        
                        {/* Requirements Badge - Color coded */}
                        <span className={`px-2 py-1 rounded-md border flex items-center gap-1.5 ${
                            model.requirements.includes('VRAM') 
                            ? 'bg-orange-950/30 border-orange-900/50 text-orange-400' 
                            : 'bg-blue-950/30 border-blue-900/50 text-blue-400'
                        }`}>
                            {model.requirements.includes('VRAM') ? <MonitorPlay size={12} /> : <Shield size={12} />}
                            {model.requirements}
                        </span>
                        
                        {/* Stars Badge */}
                        {model.stars !== undefined && (
                            <span className="bg-yellow-950/20 px-2 py-1 rounded-md text-yellow-500 border border-yellow-900/30 flex items-center gap-1.5">
                            <Star size={12} fill="currentColor" /> {model.stars > 1000 ? (model.stars / 1000).toFixed(1) + 'k' : model.stars}
                            </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-400 text-sm mb-6 flex-1 min-h-[40px] leading-relaxed">{model.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-nexus-700 mt-auto">
                 {model.status === 'Downloading' ? (
                   <div className="w-full">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Downloading parameters...</span>
                        <span>{model.progress}%</span>
                      </div>
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
                         <button onClick={() => handleDownload(model)} className="flex items-center gap-2 px-3 py-1.5 bg-nexus-700 hover:bg-nexus-600 rounded-lg text-sm text-white transition-colors">
                           <Download size={14} /> {activeTab === 'search' ? 'Pull Model' : 'Install'}
                         </button>
                       )}
                       {(model.status === 'Ready' || model.status === 'Active') && (
                          <button 
                            onClick={() => toggleActive(model.id)}
                            disabled={model.status === 'Active'}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              model.status === 'Active' ? 'bg-green-600/20 text-green-400 cursor-default' : 'bg-nexus-accent hover:bg-nexus-accentHover text-white'
                            }`}
                          >
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
          
          {activeTab === 'search' && searchResults.length === 0 && !isSearching && searchQuery && (
             <div className="col-span-full text-center py-10 text-gray-500">
                No repositories found matching "{searchQuery}"
             </div>
          )}
          
          {activeTab === 'search' && !searchQuery && (
             <div className="col-span-full flex flex-col items-center justify-center py-10 text-gray-600 gap-2">
                <Github size={48} className="opacity-20" />
                <p>Enter a query to search GitHub for open-source LLMs</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 3. Editor Integrations Component ---
const IntegrationManager = () => {
  return (
    <div className="flex flex-col h-full bg-nexus-900 p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Editor Bridge</h2>
        <p className="text-gray-400">Connect Nexus AGI to your local development environment.</p>
      </div>
      <div className="space-y-4">
        {EDITOR_PLUGINS.map(plugin => (
          <div key={plugin.id} className="bg-nexus-800 border border-nexus-700 rounded-xl p-6 flex items-center justify-between hover:border-nexus-600 transition-all">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-nexus-900 rounded-xl flex items-center justify-center border border-nexus-700 text-white">
                 {plugin.icon === 'FileCode' ? <FileCode size={24} /> : plugin.icon === 'Terminal' ? <Terminal size={24} /> : <Edit size={24} />}
               </div>
               <div>
                 <h3 className="font-bold text-white text-lg">{plugin.name}</h3>
                 <div className="flex items-center gap-2 text-sm text-gray-500">
                   <span>v{plugin.version}</span>
                   <span>•</span>
                   <span>Port {plugin.port}</span>
                 </div>
               </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                plugin.status === 'Connected' ? 'bg-green-900/30 border-green-800 text-green-400' :
                plugin.status === 'Disconnected' ? 'bg-yellow-900/30 border-yellow-800 text-yellow-400' :
                'bg-gray-800 border-gray-700 text-gray-500'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                   plugin.status === 'Connected' ? 'bg-green-400 animate-pulse' :
                   plugin.status === 'Disconnected' ? 'bg-yellow-400' :
                   'bg-gray-500'
                }`}></div>
                {plugin.status}
              </div>
              <button className="px-4 py-2 bg-nexus-700 hover:bg-nexus-600 text-white rounded-lg text-sm font-medium transition-colors">
                {plugin.status === 'Not Installed' ? 'Get Plugin' : 'Configure'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- New Component: File System Selector Modal ---
const FileSystemSelector = ({ rootHandle, onSelect, onCancel }: { rootHandle: FileSystemDirectoryHandle | null, onSelect: (file: File) => void, onCancel: () => void }) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [currentHandle, setCurrentHandle] = useState<FileSystemDirectoryHandle | null>(rootHandle);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<{name: string, handle: FileSystemDirectoryHandle}[]>([]);

  useEffect(() => {
    if (currentHandle) {
      FileService.readDirectory(currentHandle).then(setFiles);
    }
  }, [currentHandle]);

  const handleNavigate = (dir: FileNode) => {
    if (dir.kind === 'directory' && currentHandle) {
      setBreadcrumbs([...breadcrumbs, { name: currentHandle.name, handle: currentHandle }]);
      setCurrentHandle(dir.handle as FileSystemDirectoryHandle);
      setCurrentPath(prev => `${prev}${dir.name}/`);
    }
  };

  const handleBack = () => {
    const newBreadcrumbs = [...breadcrumbs];
    const prev = newBreadcrumbs.pop();
    if (prev) {
      setBreadcrumbs(newBreadcrumbs);
      setCurrentHandle(prev.handle);
      setCurrentPath(path => path.split('/').slice(0, -2).join('/') + '/');
    }
  };

  const handleFileSelect = async (fileNode: FileNode) => {
    if (fileNode.kind === 'file') {
       const file = await FileService.getFile(fileNode.handle as FileSystemFileHandle);
       onSelect(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-nexus-800 border border-nexus-600 rounded-xl shadow-2xl max-w-lg w-full flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-nexus-700 flex justify-between items-center bg-nexus-900 rounded-t-xl">
           <h3 className="font-bold text-white flex items-center gap-2">
             <FolderOpen size={18} className="text-nexus-accent" /> Select File from System
           </h3>
           <button onClick={onCancel} className="text-gray-400 hover:text-white"><XCircle size={20} /></button>
        </div>
        
        <div className="p-2 bg-nexus-800 border-b border-nexus-700 flex items-center gap-2 text-xs text-gray-400">
           {breadcrumbs.length > 0 && (
             <button onClick={handleBack} className="hover:text-white flex items-center"><CornerDownRight className="rotate-180 mr-1" size={12}/> Back</button>
           )}
           <span className="font-mono">{currentPath}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 bg-nexus-900 min-h-[300px]">
           {!rootHandle ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center">
               <AlertTriangle size={32} className="mb-2 opacity-50"/>
               <p>No Root Directory Open</p>
               <p className="text-xs mt-1">Please open a folder in the "File System" tab first.</p>
             </div>
           ) : (
             <div className="space-y-1">
               {files.map((file, idx) => (
                 <div 
                   key={idx}
                   onClick={() => file.kind === 'directory' ? handleNavigate(file) : handleFileSelect(file)}
                   className="flex items-center justify-between p-3 rounded cursor-pointer hover:bg-nexus-800 group transition-colors"
                 >
                   <div className="flex items-center gap-3">
                     {file.kind === 'directory' ? <FolderOpen size={18} className="text-yellow-500" /> : <FileIcon size={18} className="text-blue-400" />}
                     <span className="text-sm text-gray-200">{file.name}</span>
                   </div>
                   {file.kind === 'file' && <span className="text-[10px] text-nexus-accent opacity-0 group-hover:opacity-100 uppercase font-bold tracking-wider">Select</span>}
                 </div>
               ))}
               {files.length === 0 && <div className="text-gray-600 text-center py-4 text-sm">Empty Directory</div>}
             </div>
           )}
        </div>
        
        <div className="p-4 border-t border-nexus-700 bg-nexus-800 rounded-b-xl flex justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-300 hover:text-white">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// --- 4. Enhanced File System Manager ---

const FileSystemManager = ({ fsState, setFsState, addGlobalLog }: any) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingAction, setPendingAction] = useState<{type: 'SAVE' | 'DELETE' | 'CREATE', target: string, data?: string} | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<any>(null);

  const addLog = (action: LogEntry['action'], details: string, status: LogEntry['status']) => {
    const entry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      action,
      details,
      status
    };
    setLogs(prev => [entry, ...prev]);
    if(addGlobalLog) addGlobalLog(entry);
  };

  const openDirectory = async () => {
    try {
      const handle = await FileService.getDirectoryHandle();
      addLog('READ', `Opened directory handle: ${handle.name}`, 'SUCCESS');
      const files = await FileService.readDirectory(handle);
      setFsState({
        ...fsState,
        rootHandle: handle,
        files,
        currentPath: handle.name
      });
    } catch (err) {
      addLog('READ', 'Failed to open directory picker', 'FAILURE');
      alert("Failed to open directory. Please try again.");
    }
  };

  const loadFile = async (fileNode: any) => {
    try {
      const content = await FileService.readFile(fileNode.handle);
      addLog('READ', `Read file: ${fileNode.name}`, 'SUCCESS');
      setFsState((prev: any) => ({ ...prev, selectedFile: fileNode, fileContent: content }));
      setIsDirty(false);
    } catch (e) {
      addLog('READ', `Failed to read ${fileNode.name}`, 'FAILURE');
    }
  };

  const handleFileClick = async (fileNode: any) => {
    if (fileNode.kind === 'file') {
      if (isDirty) {
        setPendingNavigation(fileNode);
      } else {
        await loadFile(fileNode);
      }
    }
  };

  const confirmNavigation = async () => {
    if (pendingNavigation) {
      await loadFile(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const cancelNavigation = () => {
    setPendingNavigation(null);
  };

  const requestAction = (type: 'SAVE' | 'DELETE' | 'CREATE', target: string, data?: string) => {
    setPendingAction({ type, target, data });
  };

  const confirmAction = async () => {
    if (!pendingAction || !fsState.rootHandle) return;

    addLog('PERMISSION_GRANT', `User authorized ${pendingAction.type} on ${pendingAction.target}`, 'SUCCESS');

    try {
      if (pendingAction.type === 'SAVE') {
        if (fsState.selectedFile) {
          await FileService.saveFile(fsState.selectedFile.handle as FileSystemFileHandle, pendingAction.data || '');
          addLog('MODIFY', `Saved changes to ${pendingAction.target}`, 'SUCCESS');
          setIsDirty(false);
        }
      } else if (pendingAction.type === 'DELETE') {
        await FileService.deleteEntry(fsState.rootHandle, pendingAction.target);
        const files = await FileService.readDirectory(fsState.rootHandle);
        setFsState((prev: any) => ({ ...prev, files, selectedFile: null, fileContent: '' }));
        addLog('DELETE', `Deleted ${pendingAction.target}`, 'SUCCESS');
      } else if (pendingAction.type === 'CREATE') {
        await FileService.createFile(fsState.rootHandle, pendingAction.target);
        const files = await FileService.readDirectory(fsState.rootHandle);
        setFsState((prev: any) => ({ ...prev, files }));
        addLog('CREATE', `Created new file ${pendingAction.target}`, 'SUCCESS');
      }
    } catch (e) {
      addLog(pendingAction.type as any, `Operation failed on ${pendingAction.target}: ${String(e)}`, 'FAILURE');
    } finally {
      setPendingAction(null);
    }
  };

  const cancelAction = () => {
    addLog('PERMISSION_DENY', `User denied ${pendingAction?.type} permission for ${pendingAction?.target}`, 'FAILURE');
    setPendingAction(null);
  };

  const handleCreateFile = async () => {
    if (!fsState.rootHandle) return;
    const name = prompt("Enter file name (e.g., script.js):");
    if (name) requestAction('CREATE', name);
  };

  if (!fsState.rootHandle) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-nexus-900 text-gray-400">
        <FolderOpen size={64} className="mb-4 text-nexus-700" />
        <h2 className="text-xl font-bold mb-2">No Folder Opened</h2>
        <p className="mb-6 text-center max-w-md">Connect a local directory to read, edit, and create files directly from the browser.</p>
        <button onClick={openDirectory} className="px-6 py-3 bg-nexus-accent hover:bg-nexus-accentHover text-white rounded-lg font-medium transition-colors">
          Open Directory
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-nexus-900 text-gray-300 relative">
      <div className="w-64 border-r border-nexus-700 flex flex-col shrink-0">
        <div className="p-4 border-b border-nexus-700 flex justify-between items-center bg-nexus-800">
          <span className="font-bold truncate" title={fsState.currentPath}>{fsState.currentPath}</span>
          <button onClick={handleCreateFile} className="p-1 hover:bg-nexus-700 rounded"><Plus size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {fsState.files.map((file: any, idx: number) => (
            <div 
              key={idx}
              className={`flex items-center justify-between p-2 rounded cursor-pointer group ${
                fsState.selectedFile?.name === file.name ? 'bg-nexus-700 text-white' : 'hover:bg-nexus-800'
              }`}
              onClick={() => handleFileClick(file)}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {file.kind === 'directory' ? <FolderOpen size={16} className="text-yellow-500" /> : <FileCode size={16} className="text-blue-400" />}
                <span className="truncate text-sm">{file.name}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); requestAction('DELETE', file.name); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        
        <div className="h-48 border-t border-nexus-700 bg-[#0a0f1c] flex flex-col">
          <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase border-b border-nexus-800 flex justify-between items-center">
            <span>System Logs</span>
            <Activity size={12} />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 font-mono text-[10px]">
            {logs.length === 0 && <div className="text-gray-600 italic">No activity recorded</div>}
            {logs.map(log => (
              <div key={log.id} className="flex gap-2">
                <span className="text-gray-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className={`font-bold ${
                  log.action === 'DELETE' ? 'text-red-400' :
                  log.action === 'MODIFY' ? 'text-yellow-400' :
                  log.action === 'CREATE' ? 'text-green-400' :
                  log.action === 'PERMISSION_GRANT' ? 'text-emerald-400' :
                  log.action === 'PERMISSION_DENY' ? 'text-orange-500' :
                  'text-blue-400'
                }`}>{log.action}</span>
                <span className="text-gray-400 truncate">{log.details}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-nexus-900 min-w-0">
        {fsState.selectedFile ? (
          <>
            <div className="h-12 border-b border-nexus-700 flex items-center justify-between px-4 bg-nexus-800 shrink-0">
               <span className="text-sm font-mono">{fsState.selectedFile.name}</span>
               <button 
                onClick={() => requestAction('SAVE', fsState.selectedFile!.name, fsState.fileContent)}
                disabled={!isDirty}
                className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${
                   isDirty ? 'bg-nexus-accent text-white' : 'bg-nexus-700 text-gray-400'
                }`}
               >
                 <Save size={14} /> Save
               </button>
            </div>
            <textarea 
              value={fsState.fileContent}
              onChange={(e) => {
                setFsState((prev: any) => ({...prev, fileContent: e.target.value}));
                setIsDirty(true);
              }}
              className="flex-1 w-full bg-[#0d1117] text-gray-300 p-4 font-mono text-sm outline-none resize-none"
              spellCheck={false}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600">
             Select a file to edit
          </div>
        )}
      </div>

      {pendingAction && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-nexus-800 border border-nexus-600 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4 text-yellow-400">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold text-white">Permission Required</h3>
            </div>
            <p className="text-gray-300 mb-6">
              You are about to <span className="font-bold text-white">{pendingAction.type}</span> the file <span className="font-mono bg-nexus-900 px-1 rounded text-nexus-accent">{pendingAction.target}</span>.
              <br/><br/>
              This action interacts directly with your file system. Do you want to proceed?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={cancelAction} className="px-4 py-2 rounded-lg bg-nexus-700 hover:bg-nexus-600 text-white font-medium transition-colors">
                Cancel
              </button>
              <button onClick={confirmAction} className="px-4 py-2 rounded-lg bg-nexus-accent hover:bg-nexus-accentHover text-white font-bold transition-colors shadow-lg shadow-blue-900/50">
                Confirm {pendingAction.type}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingNavigation && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-nexus-800 border border-nexus-600 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold text-white">Unsaved Changes</h3>
            </div>
            <p className="text-gray-300 mb-6">
              You have unsaved changes in <span className="font-mono bg-nexus-900 px-1 rounded text-nexus-accent">{fsState.selectedFile?.name}</span>.
              <br/><br/>
              Switching files now will discard these changes. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={cancelNavigation} className="px-4 py-2 rounded-lg bg-nexus-700 hover:bg-nexus-600 text-white font-medium transition-colors">
                Keep Editing
              </button>
              <button onClick={confirmNavigation} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-lg shadow-red-900/50">
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Chat Interface (Refactored to be cleaner) ---
const ChatInterface = ({ messages, onSendMessage, isLoading, agentType, imageConfig, setImageConfig, rootHandle }: any) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showFsSelector, setShowFsSelector] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() && !selectedFile) return;
    onSendMessage(input, selectedFile);
    setInput('');
    setSelectedFile(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFsFileSelect = (file: File) => {
    setSelectedFile(file);
    setShowFsSelector(false);
  };

  return (
    <div className="flex flex-col h-full bg-nexus-900">
      {/* Header with Controls for specific agents */}
      {agentType === AgentType.IMAGE_GEN && (
        <div className="h-16 border-b border-nexus-700 flex items-center px-6 gap-4 bg-nexus-800 shrink-0">
          <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Nano Banana Pro Config</span>
          <select value={imageConfig.size} onChange={(e) => setImageConfig({...imageConfig, size: e.target.value})} className="bg-nexus-900 text-white text-sm rounded px-3 py-1 border border-nexus-700 focus:border-nexus-accent outline-none">
            <option value={ImageSize.SIZE_1K}>1K Resolution</option>
            <option value={ImageSize.SIZE_2K}>2K Resolution</option>
            <option value={ImageSize.SIZE_4K}>4K Resolution</option>
          </select>
          <select value={imageConfig.aspectRatio} onChange={(e) => setImageConfig({...imageConfig, aspectRatio: e.target.value})} className="bg-nexus-900 text-white text-sm rounded px-3 py-1 border border-nexus-700 focus:border-nexus-accent outline-none">
            <option value={AspectRatio.SQUARE}>1:1 Square</option>
            <option value={AspectRatio.LANDSCAPE}>16:9 Landscape</option>
            <option value={AspectRatio.PORTRAIT}>9:16 Portrait</option>
          </select>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
             <div className="w-16 h-16 rounded-full bg-nexus-800 flex items-center justify-center mb-4">
                {agentType === AgentType.IMAGE_GEN ? <ImageIcon size={32} /> : agentType === AgentType.IMAGE_EDIT ? <Edit size={32} /> : <Terminal size={32} />}
             </div>
             <p>Ready to {agentType === AgentType.IMAGE_GEN ? 'generate masterpieces' : agentType === AgentType.IMAGE_EDIT ? 'edit images' : 'assist you'}.</p>
          </div>
        )}
        
        {messages.map((msg: Message) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-xl ${
              msg.role === 'user' ? 'bg-nexus-accent text-white rounded-br-none' : msg.isError ? 'bg-red-900/50 border border-red-700 text-red-200' : 'bg-nexus-800 text-gray-100 border border-nexus-700 rounded-bl-none'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              {msg.image && (
                <div className="mt-3 rounded-lg overflow-hidden border border-nexus-600">
                   <img src={msg.image} alt="content" className="max-w-full h-auto" />
                </div>
              )}
              <div className="mt-2 text-xs opacity-50 text-right">{new Date(msg.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-nexus-800 rounded-2xl p-4 border border-nexus-700">
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-nexus-accent animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-nexus-accent animate-bounce delay-75"></div>
                <div className="w-2 h-2 rounded-full bg-nexus-accent animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-nexus-800 border-t border-nexus-700 shrink-0">
         {/* File Preview */}
        {selectedFile && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-nexus-900 rounded-lg border border-nexus-600 inline-block">
             <span className="text-xs text-nexus-accent font-mono truncate max-w-[200px]">{selectedFile.name}</span>
             <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
          </div>
        )}

        <div className="flex gap-2 relative">
          {/* Enhanced Image Upload for CHAT, EDIT, GEN */}
          {(agentType === AgentType.CHAT || agentType === AgentType.IMAGE_EDIT || agentType === AgentType.IMAGE_GEN) && (
            <>
             <div className="relative group">
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-10 overflow-hidden z-10" onChange={(e) => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }} />
                <button className={`h-12 w-12 rounded-xl flex items-center justify-center border transition-all relative ${selectedFile ? 'bg-nexus-accent border-nexus-accent text-white' : 'bg-nexus-900 border-nexus-600 text-gray-400 hover:text-white'}`}>
                   <ImagePlus size={20} />
                </button>
             </div>
             
             {/* File System Selector Trigger */}
             <button 
                onClick={() => setShowFsSelector(true)}
                title="Select from File System"
                className="h-12 w-12 rounded-xl flex items-center justify-center border border-nexus-600 bg-nexus-900 text-gray-400 hover:text-white hover:bg-nexus-800 transition-all"
             >
                <FolderOpen size={20} />
             </button>
            </>
          )}

          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type a message..." className="flex-1 bg-nexus-900 text-white rounded-xl px-4 border border-nexus-600 focus:border-nexus-accent outline-none transition-colors" />
          <button onClick={handleSend} disabled={isLoading || (!input && !selectedFile)} className="h-12 w-12 bg-nexus-accent text-white rounded-xl flex items-center justify-center hover:bg-nexus-accentHover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/30">
            <Send size={20} />
          </button>
        </div>
      </div>
      
      {showFsSelector && (
        <FileSystemSelector 
          rootHandle={rootHandle} 
          onSelect={handleFsFileSelect} 
          onCancel={() => setShowFsSelector(false)} 
        />
      )}
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [activeAgent, setActiveAgent] = useState<AgentType>(AgentType.CHAT);
  const [showSettings, setShowSettings] = useState(false);
  
  // Lifted File System State
  const [fsState, setFsState] = useState<FileSystemState>({
    rootHandle: null,
    currentPath: '/',
    files: [],
    selectedFile: null,
    fileContent: ''
  });
  
  // State for each agent to preserve history
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [genHistory, setGenHistory] = useState<Message[]>([]);
  const [editHistory, setEditHistory] = useState<Message[]>([]);
  const [localHistory, setLocalHistory] = useState<Message[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [imageConfig, setImageConfig] = useState<{size: ImageSize, aspectRatio: AspectRatio}>({ 
    size: ImageSize.SIZE_1K, 
    aspectRatio: AspectRatio.SQUARE 
  });

  // Helpers
  const getCurrentMessages = () => {
    switch (activeAgent) {
      case AgentType.IMAGE_GEN: return genHistory;
      case AgentType.IMAGE_EDIT: return editHistory;
      case AgentType.LOCAL_LLM: return localHistory;
      default: return chatHistory;
    }
  };

  const addMessage = (msg: Message, type: AgentType) => {
    switch (type) {
      case AgentType.IMAGE_GEN: setGenHistory(prev => [...prev, msg]); break;
      case AgentType.IMAGE_EDIT: setEditHistory(prev => [...prev, msg]); break;
      case AgentType.LOCAL_LLM: setLocalHistory(prev => [...prev, msg]); break;
      default: setChatHistory(prev => [...prev, msg]); break;
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSendMessage = async (text: string, file: File | null) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      image: file ? URL.createObjectURL(file) : undefined
    };
    
    addMessage(userMsg, activeAgent);
    setIsLoading(true);

    try {
       let responseText = "";
       let responseImage = undefined;

       if (activeAgent === AgentType.IMAGE_GEN) {
           const imgData = await GeminiService.generateImagePro(text, imageConfig.size, imageConfig.aspectRatio);
           responseImage = imgData;
           responseText = "Generated image based on prompt.";
       } else if (activeAgent === AgentType.IMAGE_EDIT && file) {
           const base64 = await fileToBase64(file);
           const editedImg = await GeminiService.editImage(text, base64, file.type);
           responseImage = editedImg;
           responseText = "Edited image.";
       } else if (activeAgent === AgentType.CHAT) {
           // Construct history with potential previous images
           const history = chatHistory.map(m => {
             const parts: any[] = [{ text: m.content }];
             if (m.image) {
                // If there was an image in history, we try to extract base64 from blob url 
                // Note: In a real persistent app, we'd store base64 or reference differently. 
                // For now, history won't re-send old images to avoid complexity/staleness,
                // but the prompt below handles the current image.
             }
             return { role: m.role === 'user' ? 'user' : 'model', parts };
           });
           
           const currentImageBase64 = file ? await fileToBase64(file) : undefined;
           responseText = await GeminiService.generateText(text, currentImageBase64, history);
       } else {
           // Fallback or other agents
           responseText = "This agent capability is not connected.";
       }

       const modelMsg: Message = {
         id: (Date.now() + 1).toString(),
         role: 'model',
         content: responseText,
         timestamp: Date.now(),
         image: responseImage
       };
       addMessage(modelMsg, activeAgent);

    } catch (e) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `Error: ${e instanceof Error ? e.message : String(e)}`,
        timestamp: Date.now(),
        isError: true
      };
      addMessage(errorMsg, activeAgent);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-nexus-900 text-white font-sans overflow-hidden">
      <Sidebar 
        activeAgent={activeAgent} 
        setActiveAgent={setActiveAgent} 
        toggleSettings={() => setShowSettings(!showSettings)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        {activeAgent === AgentType.MODELS && <ModelRegistry />}
        {activeAgent === AgentType.INTEGRATIONS && <IntegrationManager />}
        {activeAgent === AgentType.WORKFLOW && <WorkflowEditor />}
        {activeAgent === AgentType.FILESYSTEM && (
          <FileSystemManager 
             fsState={fsState} 
             setFsState={setFsState} 
          />
        )}
        
        {(activeAgent === AgentType.CHAT || activeAgent === AgentType.IMAGE_GEN || activeAgent === AgentType.IMAGE_EDIT) && (
           <ChatInterface 
             messages={getCurrentMessages()}
             onSendMessage={handleSendMessage}
             isLoading={isLoading}
             agentType={activeAgent}
             imageConfig={imageConfig}
             setImageConfig={setImageConfig}
             rootHandle={fsState.rootHandle}
           />
        )}
      </div>
    </div>
  );
};

export default App;