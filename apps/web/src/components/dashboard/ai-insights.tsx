'use client';

import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { generateDashboardInsights } from '@/lib/gemini';

interface AIInsightsProps {
  data: {
    revenue: number;
    revenueChange: number;
    totalContacts: number;
    openLeads: number;
    conversionRate: number;
  };
}

export function AIInsights({ data }: AIInsightsProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        setLoading(true);
        setError(null);
        const result = await generateDashboardInsights(data);
        setInsights(result);
      } catch (err) {
        setError('Unable to generate AI insights');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
          <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        </div>
        <p className="text-gray-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
        <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
          Powered by Gemini
        </span>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="flex items-start gap-3 bg-white rounded-lg p-4 border border-purple-100 hover:border-purple-300 transition-colors"
          >
            <div className="mt-0.5">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
