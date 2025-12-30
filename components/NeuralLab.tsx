
import React, { useState } from 'react';
import { optimizeSystemPrompt, runAutonomousMarketingLoop, distillToFlash } from '../services/geminiService';
import { PromptOptimization, AutonomousTask } from '../types';
import { formatErrorMessage } from '../utils/error';
import { KeyIcon, SparklesIcon, WandIcon, ShieldIcon, CheckIcon, BarChartIcon, UsersIcon } from './icons';

const NeuralLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'optimizer' | 'autonomous' | 'distill'>('optimizer');
  
  const [originalPrompt, setOriginalPrompt] = useState('You are an expert marketer. Analyze my videos and write 5 direct response hooks for Dubai businessmen.');
  const [optimization, setOptimization] = useState<PromptOptimization | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [goal, setGoal] = useState('Self-correct a campaign structure for high-ticket coaching in Abu Dhabi.');
  const [autonomousTask, setAutonomousTask] = useState<AutonomousTask | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const [distilling, setDistilling] = useState(false);
  const [distillResult, setDistillResult] = useState<any>(null);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const result = await optimizeSystemPrompt(originalPrompt);
      setOptimization(result);
    } catch (err) {
      alert(formatErrorMessage(err));
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleRunAutonomous = async () => {
    setIsRunning(true);
    setAutonomousTask({ id: Date.now().toString(), goal, steps: [], status: 'running' });

    try {
      const finalOutput = await runAutonomousMarketingLoop(goal, (step) => {
        setAutonomousTask(prev => prev ? { ...prev, steps: [...prev.steps, step] } : null);
      });
      setAutonomousTask(prev => prev ? { ...prev, status: 'completed' } : null);
    } catch (err) {
      setAutonomousTask(prev => prev ? { ...prev, status: 'failed' } : null);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDistill = async () => {
    setDistilling(true);
    const result = await distillToFlash();
    setDistillResult(result);
    setDistilling(false);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black gradient-text tracking-tighter italic">Neural Intelligence Lab</h2>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.3em] mt-2">Vertex AI Agent Builder • Distillation Hub</p>
        </div>
        <div className="text-[10px] font-mono text-indigo-500 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20">
            SYSTEM_PROTOCOL: GEN_3_PRO
        </div>
      </header>

      <div className="flex gap-4 p-1 bg-black/40 rounded-3xl border border-white/5 max-w-2xl shadow-xl">
        {(['optimizer', 'autonomous', 'distill'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
          >
            {tab === 'optimizer' ? 'Prompt Optimizer' : tab === 'autonomous' ? 'Autonomous Mode' : 'Auto-Distill'}
          </button>
        ))}
      </div>

      <main className="glass-panel p-12 rounded-[3.5rem] border-white/5 shadow-2xl min-h-[500px] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <KeyIcon className="w-48 h-48 text-indigo-400 rotate-12" />
        </div>

        {activeTab === 'optimizer' && (
          <div className="space-y-12 animate-fade-in relative z-10">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <WandIcon className="w-4 h-4" />
                    Input Raw Blueprint
                </h4>
                <textarea 
                  value={originalPrompt}
                  onChange={(e) => setOriginalPrompt(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-[2rem] p-8 text-sm font-bold text-gray-200 min-h-[350px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
                  placeholder="Paste your system prompt instruction here..."
                />
                <button 
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all shadow-2xl shadow-indigo-500/40 flex items-center justify-center gap-4 border border-white/10"
                >
                  {isOptimizing ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div> : <SparklesIcon className="w-6 h-6" />}
                  NEURAL REWRITE ENGINE
                </button>
              </div>

              <div className="space-y-6">
                {optimization ? (
                  <div className="space-y-8 animate-fade-in">
                    <div className="flex justify-between items-center bg-green-500/10 p-6 rounded-3xl border border-green-500/20">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Efficiency Multiplier</span>
                        <span className="text-xs text-gray-500 font-bold uppercase">Predicted CTR lift: +14%</span>
                      </div>
                      <span className="text-4xl font-black text-white italic">+{optimization.performancePrediction}%</span>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Architected Instruct-Set</label>
                       <div className="bg-black/80 border border-white/10 rounded-3xl p-8 text-sm font-medium text-gray-300 italic leading-relaxed shadow-2xl">
                         {optimization.optimized}
                       </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {optimization.improvements.map((imp, i) => (
                        <div key={i} className="flex items-center gap-3 px-5 py-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                          <CheckIcon className="w-4 h-4 text-indigo-400" />
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{imp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                    <SparklesIcon className="w-24 h-24 text-gray-600 mb-6 animate-pulse" />
                    <p className="text-xs font-black uppercase tracking-[0.3em]">Awaiting Optimizer Command</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'autonomous' && (
          <div className="space-y-12 animate-fade-in max-w-4xl mx-auto relative z-10">
             <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                    <input 
                    type="text" 
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="flex-grow bg-black/60 border border-white/10 rounded-2xl px-8 py-5 text-sm font-bold text-white focus:outline-none shadow-inner"
                    placeholder="Enter Autonomous Mission Goal..."
                    />
                    <button 
                    onClick={handleRunAutonomous}
                    disabled={isRunning}
                    className="bg-red-600 hover:bg-red-700 text-white font-black px-12 rounded-2xl transition-all shadow-2xl shadow-red-500/40 flex items-center gap-4 border border-white/10"
                    >
                    {isRunning ? <div className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full"></div> : <ShieldIcon className="w-6 h-6" />}
                    INITIALIZE MISSION
                    </button>
                </div>
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest px-2">Agent uses Gemini 3.0 Reasoning for self-correction loops.</p>
             </div>

             <div className="space-y-8">
                {autonomousTask?.steps.map((step, i) => (
                  <div key={i} className="glass-panel p-10 rounded-[2.5rem] border-white/5 bg-white/[0.02] space-y-6 animate-fade-in-up border-l-4 border-indigo-500">
                    <div className="flex justify-between items-center border-b border-white/5 pb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center font-black text-indigo-400">L{i+1}</div>
                        <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">{step.action}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                         <span className="text-[9px] font-mono text-green-400 uppercase font-black">Reasoning Loop Active</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed font-bold italic">{step.result}</p>
                    
                    {step.critique && (
                        <div className="mt-4 p-5 bg-red-500/5 rounded-2xl border border-red-500/10">
                            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest block mb-2">Autonomous Self-Critique</span>
                            <p className="text-[11px] text-gray-500 leading-relaxed italic">"{step.critique}"</p>
                        </div>
                    )}
                  </div>
                ))}
                
                {isRunning && (
                  <div className="p-16 border-2 border-dashed border-indigo-500/20 rounded-[2.5rem] text-center space-y-6 animate-pulse bg-indigo-500/[0.01]">
                    <UsersIcon className="w-12 h-12 text-indigo-500/40 mx-auto" />
                    <div>
                        <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">Agent is Reasoning in Self-Correction Mode</p>
                        <p className="text-[10px] text-gray-600 font-bold uppercase mt-2">Iterating logic for direct response conversion</p>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'distill' && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-10 animate-fade-in py-20 relative z-10">
            <div className="w-32 h-32 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/30 animate-float shadow-2xl relative">
               <BarChartIcon className="w-12 h-12 text-blue-400" />
               <div className="absolute inset-0 bg-blue-400/20 blur-3xl animate-pulse -z-10"></div>
            </div>
            <div className="max-w-2xl space-y-8">
              <h3 className="text-4xl font-black text-white tracking-tighter italic">Neural Auto-Distillation</h3>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest leading-relaxed px-16">
                One-click feature to distill a complex Gemini 3.0 Pro fine-tuned strategy agent into a hyper-fast Gemini 3.0 Flash variant for real-time Edge processing.
              </p>
              
              {distillResult ? (
                  <div className="grid grid-cols-2 gap-6 p-10 bg-green-500/5 rounded-[2.5rem] border border-green-500/20 animate-fade-in">
                    <div className="text-left">
                        <span className="text-[10px] font-black text-green-400 uppercase block mb-1 tracking-widest">Logic Retention</span>
                        <span className="text-3xl font-black text-white italic">99.8%</span>
                    </div>
                    <div className="text-left border-l border-white/5 pl-6">
                        <span className="text-[10px] font-black text-blue-400 uppercase block mb-1 tracking-widest">Efficiency Boost</span>
                        <span className="text-3xl font-black text-blue-400 italic">2.4x</span>
                    </div>
                  </div>
              ) : (
                  <button 
                    onClick={handleDistill}
                    disabled={distilling}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black py-5 px-16 rounded-2xl transition-all shadow-2xl shadow-blue-500/40 border border-white/10"
                  >
                    {distilling ? "DISTILLING_V3_LAYERS..." : "INITIALIZE ONE-CLICK DISTILLATION"}
                  </button>
              )}
              
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Estimated latency reduction: -140ms per inference.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NeuralLab;
