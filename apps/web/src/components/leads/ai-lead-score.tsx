'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Target, Lightbulb } from 'lucide-react';
import { analyzeLeadQuality } from '@/lib/gemini';

interface AILeadScoreProps {
  lead: {
    name: string;
    email?: string;
    phone?: string;
    messages?: string[];
    interactions?: number;
  };
}

export function AILeadScore({ lead }: AILeadScoreProps) {
  const [analysis, setAnalysis] = useState<{
    score: number;
    reasoning: string;
    suggestions: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function analyzeLead() {
      try {
        setLoading(true);
        const result = await analyzeLeadQuality(lead);
        setAnalysis(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    analyzeLead();
  }, [lead]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
          <span className="text-sm font-medium text-gray-900">Analyzing lead quality...</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full animate-pulse" />
      </div>
    );
  }

  if (!analysis) return null;

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return 'High Quality';
    if (score >= 50) return 'Medium Quality';
    return 'Needs Nurturing';
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-600" />
          <h4 className="text-sm font-semibold text-gray-900">AI Lead Score</h4>
        </div>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
          Gemini AI
        </span>
      </div>

      {/* Score Display */}
      <div className={`rounded-lg p-4 mb-4 border ${getScoreColor(analysis.score)}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{analysis.score}</div>
            <div className="text-sm font-medium mt-1">{getScoreLabel(analysis.score)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-600 mb-1">Score out of 100</div>
            <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-current transition-all"
                style={{ width: `${analysis.score}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 leading-relaxed">{analysis.reasoning}</p>
      </div>

      {/* Suggestions */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="h-4 w-4 text-purple-600" />
          <h5 className="text-sm font-semibold text-gray-900">Suggestions</h5>
        </div>
        <ul className="space-y-2">
          {analysis.suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
