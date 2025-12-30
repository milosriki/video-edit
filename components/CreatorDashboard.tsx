
import React, { useState } from 'react';
import { WandIcon, VideoIcon, ImageIcon, HeadphonesIcon, MessageSquareIcon, GridIcon, SparklesIcon, EyeIcon } from './icons';
import AdWorkflow from './AdWorkflow';
import VideoStudio from './VideoGenerator';
import ImageSuite from './ImageSuite';
import AudioSuite from './AudioSuite';
import Assistant from './Assistant';
import StoryboardStudio from './StoryboardStudio';
import AdResearcher from './AdResearcher';

const tools = [
  { id: 'workflow', name: 'Ad Workflow', icon: WandIcon, description: 'Analyze & remix winning ads.' },
  { id: 'research', name: 'Ad Researcher', icon: EyeIcon, description: 'Search-powered trend analysis.' },
  { id: 'assistant', name: 'War Room', icon: MessageSquareIcon, description: 'Live voice ad strategist.' },
  { id: 'storyboard', name: 'Storyboard', icon: GridIcon, description: 'Visual visual sequence generator.' },
  { id: 'video', name: 'Video Studio', icon: VideoIcon, description: 'Generate & understand videos.' },
  { id: 'image', name: 'Image Studio', icon: ImageIcon, description: 'Generate, edit, and analyze images.' },
];

const ToolButton: React.FC<{
  tool: typeof tools[0];
  isActive: boolean;
  onClick: () => void;
}> = ({ tool, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full text-left p-3.5 rounded-xl transition-all ${
            isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:bg-gray-800/80 hover:text-gray-200'
        }`}
        aria-label={tool.name}
    >
        <tool.icon className={`w-5 h-5 mr-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-indigo-400/70'}`}/>
        <div className="flex flex-col">
            <span className="font-bold text-sm">{tool.name}</span>
            <span className={`text-[10px] ${isActive ? 'text-indigo-200' : 'text-gray-500'}`}>{tool.description}</span>
        </div>
    </button>
);

export const CreatorDashboard: React.FC = () => {
    const [activeTool, setActiveTool] = useState('workflow');

    const renderActiveTool = () => {
        switch (activeTool) {
            case 'workflow': return <AdWorkflow />;
            case 'research': return <AdResearcher />;
            case 'video': return <VideoStudio />;
            case 'image': return <ImageSuite />;
            case 'audio': return <AudioSuite />;
            case 'assistant': return <Assistant />;
            case 'storyboard': return <StoryboardStudio />;
            default: return <AdWorkflow />;
        }
    }
    
    return (
        <div className="flex flex-col md:flex-row gap-0 md:gap-8 min-h-[70vh]">
            <aside className="w-full md:w-72 flex-shrink-0 bg-gray-900/40 p-5 rounded-3xl border border-gray-800/50">
                <div className="flex items-center gap-2 mb-8 px-2">
                    <SparklesIcon className="w-6 h-6 text-indigo-400" />
                    <h2 className="text-xl font-black text-white tracking-tighter italic">PTD.CREATOR</h2>
                </div>
                <nav className="flex flex-row md:flex-col gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {tools.map(tool => (
                        <ToolButton 
                            key={tool.id} 
                            tool={tool}
                            isActive={activeTool === tool.id} 
                            onClick={() => setActiveTool(tool.id)}
                        />
                    ))}
                </nav>
            </aside>
            <main className="flex-grow p-0 md:p-2">
                <div className="h-full bg-gray-900/20 rounded-3xl border border-gray-800/30 overflow-hidden">
                    {renderActiveTool()}
                </div>
            </main>
        </div>
    );
};
