import React, { useState } from 'react';
import { WandIcon, VideoIcon, ImageIcon, HeadphonesIcon, MessageSquareIcon, GridIcon } from './icons';
import AdWorkflow from './AdWorkflow';
import VideoStudio from './VideoGenerator';
import ImageSuite from './ImageSuite';
import AudioSuite from './AudioSuite';
import Assistant from './Assistant';
import StoryboardStudio from './StoryboardStudio';

const tools = [
  { id: 'workflow', name: 'Ad Workflow', icon: WandIcon, description: 'Analyze videos & generate ad blueprints.' },
  { id: 'storyboard', name: 'Storyboard Studio', icon: GridIcon, description: 'Generate a visual storyboard from text.' },
  { id: 'video', name: 'Video Studio', icon: VideoIcon, description: 'Generate & understand videos.' },
  { id: 'image', name: 'Image Studio', icon: ImageIcon, description: 'Generate, edit, and analyze images.' },
  { id: 'audio', name: 'Audio Studio', icon: HeadphonesIcon, description: 'Create voiceovers and transcribe audio.' },
  { id: 'assistant', name: 'AI Assistant', icon: MessageSquareIcon, description: 'Chat with your AI ad strategist.' },
];

const ToolButton: React.FC<{
  tool: typeof tools[0];
  isActive: boolean;
  onClick: () => void;
}> = ({ tool, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full text-left p-3 rounded-lg transition-colors ${
            isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'
        }`}
        aria-label={tool.name}
    >
        <tool.icon className="w-6 h-6 mr-4 flex-shrink-0"/>
        <span className="font-semibold">{tool.name}</span>
    </button>
);


export const CreatorDashboard: React.FC = () => {
    const [activeTool, setActiveTool] = useState('workflow');

    const renderActiveTool = () => {
        switch (activeTool) {
            case 'workflow': return <AdWorkflow />;
            case 'storyboard': return <StoryboardStudio />;
            case 'video': return <VideoStudio />;
            case 'image': return <ImageSuite />;
            case 'audio': return <AudioSuite />;
            case 'assistant': return <Assistant />;
            default: return <AdWorkflow />;
        }
    }
    
    return (
        <div className="flex flex-col md:flex-row gap-0 md:gap-8 min-h-[60vh]">
            <aside className="w-full md:w-64 flex-shrink-0 bg-gray-900/30 p-4 rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
                <h2 className="text-lg font-bold mb-4 text-gray-300 px-2">AI Tools</h2>
                <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2">
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
            <main className="flex-grow p-6 sm:p-8">
                {renderActiveTool()}
            </main>
        </div>
    );
};
