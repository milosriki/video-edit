
import React, { useState } from 'react';
import { replicateCreativeDNA, generateImage } from '../services/geminiService';
import { WinningCreative, CreativeVariation } from '../types';
import { formatErrorMessage } from '../utils/error';
import { SparklesIcon, ImageIcon, WandIcon, FilmIcon, UploadIcon, CheckIcon, ShieldIcon } from './icons';

const CreativeLab: React.FC = () => {
  const [winner, setWinner] = useState<WinningCreative | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setWinner({ file, previewUrl, variations: [] });
    }
  };

  const handleAnalyzeAndReplicate = async () => {
    if (!winner) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await replicateCreativeDNA(winner.file);
      setWinner({ ...winner, analysis: result.analysis, variations: result.variations.map(v => ({ ...v, status: 'pending' })) });
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const generateVariation = async (variationId: string) => {
    if (!winner) return;
    const variation = winner.variations.find(v => v.id === variationId);
    if (!variation) return;

    setWinner({
      ...winner,
      variations: winner.variations.map(v => v.id === variationId ? { ...v, status: 'generating' } : v)
    });

    try {
      if (variation.type === 'image') {
        const imageUrl = await generateImage(variation.prompt, '1:1');
        setWinner({
          ...winner,
          variations: winner.variations.map(v => v.id === variationId ? { ...v, status: 'done', generatedUrl: imageUrl } : v)
        });
      } else {
        // Mocking Veo generation for the demo environment to ensure stability
        await new Promise(r => setTimeout(r, 4000));
        setWinner(prev => prev ? {
          ...prev,
          variations: prev.variations.map(v => v.id === variationId ? { ...v, status: 'done', generatedUrl: 'https://placehold.co/400x400/0f172a/6366f1?text=VEO+MASTER+RENDER' } : v)
        } : null);
      }
    } catch (err) {
      setWinner({
        ...winner,
        variations: winner.variations.map(v => v.id === variationId ? { ...v, status: 'error' } : v)
      });
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black gradient-text tracking-tighter italic">Creative DNA Replicator</h2>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.3em] mt-2">Iterate Winning Patterns with Multimodal Intelligence</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-indigo-600/10 border border-indigo-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
                <ShieldIcon className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Vertex AI Builder Mode</span>
            </div>
        </div>
      </header>

      {!winner ? (
        <div className="glass-panel p-20 rounded-[3rem] border-dashed border-2 border-white/10 flex flex-col items-center justify-center bg-indigo-500/[0.02]">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-8 border border-indigo-500/20">
            <UploadIcon className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-2xl font-black text-white mb-3 tracking-tighter">Initialize Creative Replication</h3>
          <p className="text-gray-500 text-sm max-w-sm text-center mb-10 font-bold uppercase tracking-widest leading-relaxed">
            Upload a high-performing static or video frame. Gemini 3.0 will deconstruct the conversion triggers.
          </p>
          <label className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 px-16 rounded-2xl cursor-pointer transition-all shadow-2xl shadow-indigo-500/30 ring-1 ring-white/10">
            LOAD WINNING ASSET
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-[2rem] border-white/5 overflow-hidden">
              <img src={winner.previewUrl} className="w-full h-auto rounded-2xl border border-white/10 mb-6 shadow-2xl" />
              <button 
                onClick={handleAnalyzeAndReplicate}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 border border-white/10"
              >
                {isLoading ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div> : <WandIcon className="w-5 h-5" />}
                EXTRACT & REPLICATE DNA
              </button>
            </div>

            {winner.analysis && (
              <div className="glass-panel p-8 rounded-[2rem] border-white/5 space-y-4 bg-indigo-600/[0.03]">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    PATTERN RECOGNITION ENGINE
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed italic">"{winner.analysis}"</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 space-y-8">
            {winner.variations.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                {winner.variations.map(variation => (
                  <div key={variation.id} className="glass-panel p-6 rounded-[2.5rem] border-white/5 flex flex-col space-y-6 bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {variation.type === 'image' ? <ImageIcon className="w-4 h-4 text-indigo-400" /> : <FilmIcon className="w-4 h-4 text-purple-400" />}
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{variation.type.toUpperCase()} MUTATION</span>
                      </div>
                      <div className="text-[8px] bg-white/5 px-2 py-0.5 rounded-full text-gray-600 font-mono">NEURAL_ID: {variation.id}</div>
                    </div>

                    <div className="aspect-square bg-black/40 rounded-3xl overflow-hidden border border-white/5 relative flex items-center justify-center group shadow-inner">
                      {variation.generatedUrl ? (
                        <img src={variation.generatedUrl} className="w-full h-full object-cover animate-fade-in" />
                      ) : (
                        <div className="p-8 text-center space-y-4">
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter leading-relaxed">Reasoning: "{variation.reasoning}"</p>
                          {variation.status === 'pending' && (
                            <button 
                              onClick={() => generateVariation(variation.id)}
                              className="mx-auto w-14 h-14 bg-indigo-600/10 rounded-full flex items-center justify-center text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/20 shadow-lg"
                            >
                              <SparklesIcon className="w-7 h-7" />
                            </button>
                          )}
                          {variation.status === 'generating' && (
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin w-10 h-10 border-4 border-indigo-400/20 border-t-indigo-500 rounded-full"></div>
                                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest animate-pulse">Rendering Mutation</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                      <p className="text-[11px] text-gray-400 font-medium italic">Prompt: "{variation.prompt}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-900/50 border border-red-700/50 rounded-2xl text-red-300 font-bold animate-shake">
          System Collision: {error}
        </div>
      )}
    </div>
  );
};

export default CreativeLab;
