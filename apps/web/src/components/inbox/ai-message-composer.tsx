'use client';

import { useState } from 'react';
import { Sparkles, Wand2, RefreshCw } from 'lucide-react';
import { generateMessageSuggestion } from '@/lib/gemini';

interface AIMessageComposerProps {
  contactName: string;
  previousMessages?: string[];
  onSuggestionSelect: (message: string) => void;
}

export function AIMessageComposer({ 
  contactName, 
  previousMessages = [], 
  onSuggestionSelect 
}: AIMessageComposerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState<'follow-up' | 'introduction' | 'proposal' | 'closing'>('follow-up');

  const purposes = [
    { value: 'follow-up' as const, label: 'Follow-up', icon: '📞' },
    { value: 'introduction' as const, label: 'Introduction', icon: '👋' },
    { value: 'proposal' as const, label: 'Proposal', icon: '📋' },
    { value: 'closing' as const, label: 'Closing', icon: '🎯' },
  ];

  const generateSuggestion = async () => {
    try {
      setLoading(true);
      const result = await generateMessageSuggestion({
        contactName,
        previousMessages,
        purpose: selectedPurpose,
      });
      setSuggestion(result);
    } catch (error) {
      console.error(error);
      setSuggestion('Unable to generate suggestion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseSuggestion = () => {
    onSuggestionSelect(suggestion);
    setIsOpen(false);
    setSuggestion('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
      >
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">AI Compose</span>
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-600" />
          <h4 className="text-sm font-semibold text-gray-900">AI Message Composer</h4>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ✕
        </button>
      </div>

      {/* Purpose Selection */}
      <div className="mb-4">
        <label className="text-xs font-medium text-gray-700 mb-2 block">Message Type</label>
        <div className="grid grid-cols-2 gap-2">
          {purposes.map((purpose) => (
            <button
              key={purpose.value}
              onClick={() => setSelectedPurpose(purpose.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                selectedPurpose === purpose.value
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
              }`}
            >
              <span>{purpose.icon}</span>
              <span>{purpose.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateSuggestion}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {loading ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Generating...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Generate Message</span>
          </>
        )}
      </button>

      {/* Suggestion Display */}
      {suggestion && (
        <div className="space-y-3">
          <div className="bg-white rounded-lg border border-purple-200 p-4">
            <div className="flex items-start gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
              <span className="text-xs font-medium text-purple-700">AI Suggestion</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {suggestion}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleUseSuggestion}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Use This Message
            </button>
            <button
              onClick={generateSuggestion}
              disabled={loading}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
