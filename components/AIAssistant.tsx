/**
 * AIAssistant Component (Enhanced with Memory)
 * Conversational AI with persistent memory and proactive intelligence
 */

import React, { useState, useRef, useEffect } from 'react';
import { titanApi, ChatMessage, ChatResponse, ProactiveInsight } from '../services/titanApi';
import { SendIcon, SparklesIcon, MessageSquareIcon } from './icons';
import ProactiveInsights from './ProactiveInsights';

interface AIAssistantProps {
  videoId?: string;
  videoAnalysis?: any;
  onSuggestedAction?: (action: string) => void;
}

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] p-4 rounded-2xl ${
        isUser 
          ? 'bg-indigo-600 rounded-br-none' 
          : 'bg-gray-700 rounded-bl-none'
      }`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
            <SparklesIcon className="w-3 h-3" />
            TITAN AI
          </div>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.timestamp && (
          <div className="text-xs text-gray-400 mt-2 text-right">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

const SuggestedAction: React.FC<{ 
  action: string; 
  onClick: () => void;
}> = ({ action, onClick }) => (
  <button
    onClick={onClick}
    className="text-sm px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-full text-indigo-300 transition-colors"
  >
    {action}
  </button>
);

const InsightBadge: React.FC<{ insight: ProactiveInsight }> = ({ insight }) => {
  const getIcon = () => {
    switch (insight.insight_type) {
      case 'performance': return '📊';
      case 'optimization': return '⚡';
      case 'trend': return '📈';
      case 'warning': return '⚠️';
      default: return '💡';
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm bg-gray-700/50 rounded-lg p-2">
      <span>{getIcon()}</span>
      <span className="text-gray-300">{insight.title}</span>
    </div>
  );
};

export const AIAssistant: React.FC<AIAssistantProps> = ({
  videoId,
  videoAnalysis,
  onSuggestedAction,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [showInsights, setShowInsights] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Generate conversation ID
    setConversationId(`conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: videoId 
        ? `I'm ready to discuss this video. I can see the analysis and help you optimize it, generate new blueprints, or answer any questions about its performance potential.`
        : `Hi! I'm TITAN, your AI ad strategist. I have access to $2M worth of historical campaign data. How can I help you create better ads today?`,
    };
    setMessages([welcomeMessage]);
    
    // Set initial suggested actions
    setSuggestedActions(videoId 
      ? ['What makes this hook effective?', 'How can I improve the CTA?', 'Generate 10 variations']
      : ['What patterns work best?', 'Show me top hooks', 'Analyze a video']
    );
  }, [videoId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setSuggestedActions([]);

    try {
      const response = await titanApi.chat(
        userMessage.content,
        conversationId,
        videoId,
        { video_analysis: videoAnalysis }
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSuggestedActions(response.suggested_actions);
      setInsights(response.insights);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleActionClick = (action: string) => {
    setInput(action);
    onSuggestedAction?.(action);
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
              <MessageSquareIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold">TITAN AI Assistant</h3>
              <p className="text-xs text-gray-400">
                {videoId ? `Discussing: ${videoId.slice(0, 20)}...` : 'General Strategy Mode'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInsights(!showInsights)}
            className={`p-2 rounded-lg transition-colors ${
              showInsights ? 'bg-purple-600' : 'bg-gray-700'
            }`}
            title="Toggle Proactive Insights"
          >
            <SparklesIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${showInsights ? 'w-2/3' : 'w-full'}`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 rounded-2xl rounded-bl-none p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Insights from Response */}
          {insights.length > 0 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {insights.slice(0, 2).map((insight, i) => (
                  <InsightBadge key={i} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {/* Suggested Actions */}
          {suggestedActions.length > 0 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {suggestedActions.map((action, i) => (
                  <SuggestedAction 
                    key={i} 
                    action={action}
                    onClick={() => handleActionClick(action)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your ads, patterns, or strategy..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:opacity-50 p-3 rounded-xl transition-colors"
              >
                <SendIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Proactive Insights Panel */}
        {showInsights && (
          <div className="w-1/3 border-l border-gray-700 overflow-y-auto">
            <ProactiveInsights 
              onInsightClick={(insight) => handleQuickQuestion(insight.action || insight.description)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
