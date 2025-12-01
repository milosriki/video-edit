/**
 * BlueprintGenerator Component
 * Generates 50 ad variations ranked by predicted ROAS
 */

import React, { useState, useEffect } from 'react';
import { titanApi, AdBlueprint } from '../services/titanApi';
import { WandIcon, SparklesIcon, DownloadIcon, ClipboardIcon } from './icons';

interface BlueprintGeneratorProps {
  sourceVideoId?: string;
  initialBrief?: {
    productName: string;
    offer: string;
    targetAvatar: string;
    targetPainPoints?: string[];
    targetDesires?: string[];
    platform?: string;
    tone?: string;
  };
  onBlueprintSelect?: (blueprint: AdBlueprint) => void;
}

const BlueprintCard: React.FC<{
  blueprint: AdBlueprint;
  onSelect?: () => void;
  onCopy?: () => void;
}> = ({ blueprint, onSelect, onCopy }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-gray-800/50 rounded-lg border-2 transition-all hover:border-indigo-500/50 ${
      blueprint.rank && blueprint.rank <= 3 ? 'border-green-500' : 'border-gray-700/50'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {blueprint.rank && blueprint.rank <= 3 && (
              <span className="bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded">
                TOP {blueprint.rank}
              </span>
            )}
            <span className="text-xs text-gray-500">#{blueprint.rank || '?'}</span>
          </div>
          {blueprint.predicted_roas && (
            <span className="text-green-400 font-bold">
              {blueprint.predicted_roas.toFixed(2)}x ROAS
            </span>
          )}
        </div>
        <h4 className="font-bold text-lg">{blueprint.title}</h4>
        <div className="flex flex-wrap gap-1 mt-2">
          <span className="text-xs px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-300">
            {blueprint.hook_type}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-purple-900/50 text-purple-300">
            {blueprint.cta_type}
          </span>
          {blueprint.confidence_score && (
            <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
              {Math.round(blueprint.confidence_score * 100)}% conf
            </span>
          )}
        </div>
      </div>

      {/* Hook */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="text-xs font-semibold text-gray-500 mb-1">HOOK</div>
        <p className="text-indigo-300 font-medium">{blueprint.hook_text}</p>
      </div>

      {/* Scenes (Collapsible) */}
      <div className="p-4 border-b border-gray-700/50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-xs font-semibold text-gray-500">
            {blueprint.scenes.length} SCENES
          </span>
          <span className="text-gray-500">{isExpanded ? '−' : '+'}</span>
        </button>
        
        {isExpanded && (
          <div className="mt-3 space-y-3">
            {blueprint.scenes.map((scene, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {scene.scene_number}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{scene.duration_seconds}s</span>
                    {scene.transition && <span>→ {scene.transition}</span>}
                  </div>
                  <p className="text-gray-300">{scene.visual_description}</p>
                  {scene.audio_description && (
                    <p className="text-gray-500 text-xs mt-1">🔊 {scene.audio_description}</p>
                  )}
                  {scene.text_overlay && (
                    <p className="text-indigo-400 text-xs mt-1">📝 "{scene.text_overlay}"</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="text-xs font-semibold text-gray-500 mb-1">CALL TO ACTION</div>
        <p className="text-green-400 font-medium">{blueprint.cta_text}</p>
      </div>

      {/* Caption & Hashtags */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="text-xs font-semibold text-gray-500 mb-1">CAPTION</div>
        <p className="text-sm text-gray-300">{blueprint.caption}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {blueprint.hashtags.map((tag, i) => (
            <span key={i} className="text-xs text-blue-400">{tag}</span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 flex gap-2">
        <button
          onClick={onSelect}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"
        >
          <WandIcon className="w-4 h-4" />
          Use Blueprint
        </button>
        <button
          onClick={onCopy}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
          title="Copy to clipboard"
        >
          <ClipboardIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export const BlueprintGenerator: React.FC<BlueprintGeneratorProps> = ({
  sourceVideoId,
  initialBrief,
  onBlueprintSelect,
}) => {
  const [blueprints, setBlueprints] = useState<AdBlueprint[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numVariations, setNumVariations] = useState(10);
  
  // Brief form
  const [brief, setBrief] = useState({
    productName: initialBrief?.productName || 'Fitness Program',
    offer: initialBrief?.offer || 'Free Consultation',
    targetAvatar: initialBrief?.targetAvatar || 'dubai_men_40',
    targetPainPoints: initialBrief?.targetPainPoints || ['stress', 'weight gain', 'low energy'],
    targetDesires: initialBrief?.targetDesires || ['confidence', 'performance', 'status'],
    platform: initialBrief?.platform || 'reels',
    tone: initialBrief?.tone || 'direct',
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await titanApi.generateBlueprints({
        productName: brief.productName,
        offer: brief.offer,
        targetAvatar: brief.targetAvatar,
        targetPainPoints: brief.targetPainPoints,
        targetDesires: brief.targetDesires,
        platform: brief.platform,
        tone: brief.tone,
        numVariations,
        sourceVideoId,
      });
      
      setBlueprints(response.blueprints);
    } catch (err) {
      console.error('Generation failed:', err);
      setError('Failed to generate blueprints. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (blueprint: AdBlueprint) => {
    const text = `
${blueprint.title}

HOOK: ${blueprint.hook_text}

SCENES:
${blueprint.scenes.map(s => `${s.scene_number}. ${s.visual_description}`).join('\n')}

CTA: ${blueprint.cta_text}

CAPTION: ${blueprint.caption}
${blueprint.hashtags.join(' ')}
    `.trim();
    
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-purple-400" />
            Blueprint Generator
          </h2>
          <p className="text-gray-400 mt-1">
            Generate {numVariations}+ ad variations ranked by predicted ROAS
          </p>
        </div>
      </div>

      {/* Generation Form */}
      {blueprints.length === 0 && (
        <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-400">Product/Service</label>
              <input
                type="text"
                value={brief.productName}
                onChange={(e) => setBrief({ ...brief, productName: e.target.value })}
                className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-400">Offer</label>
              <input
                type="text"
                value={brief.offer}
                onChange={(e) => setBrief({ ...brief, offer: e.target.value })}
                className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-400">Target Avatar</label>
              <select
                value={brief.targetAvatar}
                onChange={(e) => setBrief({ ...brief, targetAvatar: e.target.value })}
                className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-lg"
              >
                <option value="dubai_men_40">DIFC Daniel (Men 35-55)</option>
                <option value="dubai_women_40">Busy Mona (Women 35-50)</option>
                <option value="abu_dhabi_men_40">Abu Dhabi Pro (Men 40+)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-400">Number of Variations</label>
              <select
                value={numVariations}
                onChange={(e) => setNumVariations(Number(e.target.value))}
                className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-lg"
              >
                <option value={5}>5 variations</option>
                <option value={10}>10 variations</option>
                <option value={25}>25 variations</option>
                <option value={50}>50 variations</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-400">Platform</label>
              <select
                value={brief.platform}
                onChange={(e) => setBrief({ ...brief, platform: e.target.value })}
                className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-lg"
              >
                <option value="reels">Reels (Instagram)</option>
                <option value="shorts">Shorts (YouTube)</option>
                <option value="tiktok">TikTok</option>
                <option value="feed">Feed (Facebook)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-400">Tone</label>
              <select
                value={brief.tone}
                onChange={(e) => setBrief({ ...brief, tone: e.target.value })}
                className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-lg"
              >
                <option value="direct">Direct</option>
                <option value="empathetic">Empathetic</option>
                <option value="authoritative">Authoritative</option>
                <option value="playful">Playful</option>
                <option value="inspirational">Inspirational</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Generating {numVariations} Variations...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Generate {numVariations} Blueprints
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {blueprints.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-gray-400">
              Generated {blueprints.length} blueprints, ranked by predicted ROAS
            </p>
            <button
              onClick={() => setBlueprints([])}
              className="text-gray-500 hover:text-white text-sm"
            >
              Generate New
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blueprints.map((blueprint, i) => (
              <BlueprintCard
                key={blueprint.id || i}
                blueprint={blueprint}
                onSelect={() => onBlueprintSelect?.(blueprint)}
                onCopy={() => handleCopy(blueprint)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BlueprintGenerator;
