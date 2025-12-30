import React, { useState, useEffect } from 'react';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import AdWorkflow from './components/AdWorkflow';
import VideoStudio from './components/VideoGenerator';
import ImageSuite from './components/ImageSuite';
import AudioSuite from './components/AudioSuite';
import Assistant from './components/Assistant';
import StoryboardStudio from './components/StoryboardStudio';
import AdResearcher from './components/AdResearcher';
import DeepResearchAgent from './components/DeepResearchAgent';
import IntelligenceSuite from './components/IntelligenceSuite';
import RepositoryGenerator from './components/RepositoryGenerator';
import CreativeLab from './components/CreativeLab';
import NeuralLab from './components/NeuralLab';
import ToolOrchestrator from './components/ToolOrchestrator';
import ConnectionCenter from './components/ConnectionCenter';
import { ModelVerifier } from './components/ModelVerifier';
import { DeepThinkingToast } from './components/DeepThinkingToast';
import { 
  SparklesIcon, BarChartIcon, WandIcon, VideoIcon, ImageIcon, 
  HeadphonesIcon, MessageSquareIcon, GridIcon, EyeIcon, 
  KeyIcon, CheckIcon, GoogleDriveIcon, ShieldIcon, UsersIcon, SlidersIcon, GlobeIcon
} from './components/icons';

type Sector = 'build' | 'strategize' | 'analyze';
type ToolId = 'workflow' | 'video' | 'image' | 'audio' | 'storyboard' | 'research' | 'deep-research' | 'war-room' | 'analytics' | 'intel' | 'project-architect' | 'creative-lab' | 'neural-lab' | 'remote-tools' | 'connections' | 'verification';

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId>('workflow');
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
        const result = await window.aistudio.hasSelectedApiKey();
        setHasKey(result);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
      await window.aistudio.openSelectKey();
      setHasKey(true);
  };

  const navItems: { id: ToolId; name: string; icon: any; sector: Sector; desc: string; badge?: boolean }[] = [
    { id: 'workflow', name: 'Ad Workflow', icon: WandIcon, sector: 'build', desc: 'Create direct response ads' },
    { id: 'creative-lab', name: 'Creative Lab', icon: ImageIcon, sector: 'build', desc: 'Replicate static winners' },
    { id: 'project-architect', name: 'Build Mode V2', icon: SparklesIcon, sector: 'build', desc: 'Generate full repositories' },
    { id: 'storyboard', name: 'Storyboard', icon: GridIcon, sector: 'build', desc: 'Pre-visualize concepts' },
    { id: 'video', name: 'Video Studio', icon: VideoIcon, sector: 'build', desc: 'AI generation & analysis' },
    { id: 'deep-research', name: 'Deep Research', icon: GlobeIcon, sector: 'strategize', desc: 'L3 Autonomous expansion', badge: true },
    { id: 'neural-lab', name: 'Neural Lab', icon: KeyIcon, sector: 'strategize', desc: 'Distillation & Prompts' },
    { id: 'research', name: 'Market Intel', icon: EyeIcon, sector: 'strategize', desc: 'Search grounded trends' },
    { id: 'intel', name: 'Prediction', icon: ShieldIcon, sector: 'strategize', desc: 'Viral Sim & Heatmaps' },
    { id: 'war-room', name: 'War Room', icon: MessageSquareIcon, sector: 'strategize', desc: 'Voice AI strategist' },
    { id: 'remote-tools', name: 'AdAlpha 360', icon: SlidersIcon, sector: 'strategize', desc: 'MCP Intel Node', badge: true },
    { id: 'verification', name: 'Model Verify', icon: ShieldIcon, sector: 'analyze', desc: 'AI GSI Verification Suite', badge: true },
    { id: 'analytics', name: 'Performance', icon: BarChartIcon, sector: 'analyze', desc: 'ROAS & CPA tracking' },
    { id: 'connections', name: 'Connections', icon: KeyIcon, sector: 'analyze', desc: 'Manage API Bridges' },
  ];

  const renderTool = () => {
    switch (activeTool) {
      case 'workflow': return <AdWorkflow onNavigate={(id: ToolId) => setActiveTool(id)} />;
      case 'creative-lab': return <CreativeLab />;
      case 'project-architect': return <RepositoryGenerator />;
      case 'video': return <VideoStudio />;
      case 'image': return <ImageSuite />;
      case 'audio': return <AudioSuite />;
      case 'storyboard': return <StoryboardStudio />;
      case 'research': return <AdResearcher />;
      case 'deep-research': return <DeepResearchAgent />;
      case 'intel': return <IntelligenceSuite />;
      case 'war-room': return <Assistant />;
      case 'analytics': return <PerformanceDashboard />;
      case 'neural-lab': return <NeuralLab />;
      case 'remote-tools': return <ToolOrchestrator />;
      case 'connections': return <ConnectionCenter />;
      case 'verification': return <ModelVerifier />;
      default: return <AdWorkflow onNavigate={(id: ToolId) => setActiveTool(id)} />;
    }
  };

  if (hasKey === false) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-[#020617] text-white p-10 text-center animate-fade-in">
              <div className="w-24 h-24 bg-indigo-600/20 rounded-[2rem] border border-indigo-500/40 flex items-center justify-center mb-10 shadow-3xl shadow-indigo-500/20">
                  <KeyIcon className="w-10 h-10 text-indigo-400" />
              </div>
              <h1 className="text-4xl font-black italic tracking-tighter mb-4">GSI_ARCHITECT_LOCK</h1>
              <p className="text-gray-500 max-w-md font-bold uppercase tracking-[0.2em] mb-10 leading-relaxed">
                  Deployment requires a verified Vertex AI API node. Please authorize your project key to initialize the Command Center.
              </p>
              <button 
                  onClick={handleSelectKey}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 px-20 rounded-2xl transition-all shadow-3xl shadow-indigo-500/50 uppercase tracking-[0.3em] text-xs border border-white/10 active:scale-95"
              >
                  Select API Cluster
              </button>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="mt-8 text-[10px] text-gray-700 hover:text-indigo-400 transition-colors uppercase tracking-[0.4em] font-black underline">
                  Node Billing Documentation
              </a>
          </div>
      );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <DeepThinkingToast />
      <aside className="w-72 glass-panel border-r border-white/5 flex flex-col z-50">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-float">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter leading-none italic">PTD<span className="text-indigo-400">.</span>COMMAND</h1>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Ad Intelligence Suite</span>
            </div>
          </div>
        </div>

        <nav className="flex-grow overflow-y-auto px-4 py-2 space-y-8 custom-scrollbar">
          {(['build', 'strategize', 'analyze'] as Sector[]).map(sector => (
            <div key={sector}>
              <h3 className="px-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">{sector}</h3>
              <div className="space-y-1">
                {navItems.filter(item => item.sector === sector).map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTool(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                      activeTool === item.id 
                      ? 'bg-indigo-600/10 text-white shadow-inner border border-white/5' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 transition-transform duration-300 ${activeTool === item.id ? 'text-indigo-400 scale-110' : 'text-gray-500 group-hover:text-indigo-300'}`} />
                    <div className="text-left">
                      <div className="text-sm font-bold leading-none mb-1">{item.name}</div>
                      <div className={`text-[10px] transition-opacity ${activeTool === item.id ? 'text-indigo-300/60' : 'text-gray-600 group-hover:text-gray-500'}`}>{item.desc}</div>
                    </div>
                    {item.badge && activeTool !== item.id && (
                      <div className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </div>
                    )}
                    {activeTool === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></div>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2 mb-1">Live Sync Status</div>
            <StatusIndicator icon={CheckIcon} label="Meta Ads" active={localStorage.getItem('ptd_connections')?.includes('meta') || false} color="green" />
            <StatusIndicator icon={KeyIcon} label="HubSpot" active={localStorage.getItem('ptd_connections')?.includes('hubspot') || false} color="orange" />
            <StatusIndicator icon={GoogleDriveIcon} label="AdAlpha 360" active={true} color="blue" />
          </div>
        </div>
      </aside>

      <main className="flex-grow flex flex-col relative bg-transparent overflow-hidden">
        <header className="h-20 glass-panel border-b border-white/5 px-8 flex items-center justify-between z-40">
          <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              PRO_ARCHITECTURE_LIVE_GCP
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Global ROAS</span>
              <span className="text-xl font-black text-green-400 leading-none">3.8x</span>
            </div>
            <div className="w-px h-8 bg-white/5"></div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Ads</span>
              <span className="text-xl font-black text-white leading-none">14</span>
            </div>
          </div>
        </header>

        <section className="flex-grow overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto animate-fade-in">
            {renderTool()}
          </div>
        </section>

        <footer className="h-10 border-t border-white/5 bg-black/40 flex items-center justify-between px-8 text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] z-40">
          <div className="flex items-center gap-4">
            <span>PTD_PRO_ARCH // SYNC: {new Date().toLocaleTimeString()}</span>
            <span className="text-green-500 font-black flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]"></div>
              AD_ALPHA_360_CONNECTED
            </span>
          </div>
          <div>GEMINI_3_PRO_ACTIVE</div>
        </footer>
      </main>
    </div>
  );
}

const StatusIndicator = ({ icon: Icon, label, active, color }: { icon: any; label: string; active: boolean; color: string }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 transition-all ${active ? 'bg-white/5 text-gray-200' : 'text-gray-600 grayscale opacity-40'}`}>
    <Icon className={`w-3.5 h-3.5 text-${color}-500`} />
    <span className="text-[10px] font-bold tracking-wider">{label}</span>
    <div className={`ml-auto w-1 h-1 rounded-full ${active ? `bg-${color}-500 shadow-[0_0_5px_rgba(0,0,0,0.5)]` : 'bg-gray-800'}`}></div>
  </div>
);