'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, Check } from 'lucide-react';
import { InteractiveDashboard } from './interactive-dashboard';

interface CinematicHeroProps {
  onDemoClick?: () => void;
}

export function CinematicHero({ onDemoClick }: CinematicHeroProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative pt-20 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center overflow-hidden">
      {/* Content Container */}
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Left: Hero Content */}
          <div className="space-y-5 sm:space-y-6 lg:space-y-8 relative z-10">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 backdrop-blur-sm">
              <div className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-primary" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-primary tracking-wide">
                THE MODERN CRM FOR GROWING TEAMS
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
              <span className="text-white">
                Turn customer relationships
              </span>
              <br />
              <span className="relative inline-block mt-2">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  into momentum.
                </span>
                {/* Underline accent */}
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-transparent rounded-full" />
              </span>
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-300 leading-relaxed max-w-xl">
              NexaCRM helps growing teams manage leads, nurture conversations, track deals through your sales pipeline, and build lasting customer relationships—all from one powerful, intelligent dashboard.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/register"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group relative inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-primary to-accent rounded-xl shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-[1.02] overflow-hidden min-h-[48px] touch-manipulation"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#4338CA] to-[#7C3AED] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>

              {onDemoClick && (
                <button
                  onClick={onDemoClick}
                  className="group inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-white bg-white/5 hover:bg-white/10 rounded-xl border-2 border-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] min-h-[48px] touch-manipulation"
                >
                  <div className="flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                    <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5" />
                  </div>
                  Watch Demo
                </button>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-x-6 sm:gap-x-8 gap-y-3 sm:gap-y-4 pt-3 sm:pt-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                <span>Setup in 2 minutes</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Right: Product Visual - Hidden on small mobile, simplified on tablet */}
          <div className="relative lg:scale-110 transform perspective-1000 hidden sm:block">
            <InteractiveDashboard />
            
            {/* Floating accent elements */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl animate-float" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-2xl animate-float-delayed" />
          </div>
          
          {/* Mobile: Show simplified preview card instead of full dashboard */}
          <div className="sm:hidden relative bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-white font-bold text-xs">N</span>
                </div>
                <span className="text-white font-semibold text-sm">Dashboard Preview</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-success">
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                <span>Live</span>
              </div>
            </div>
            
            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Revenue', value: '$125K', change: '+12%' },
                { label: 'Leads', value: '2,543', change: '+8%' },
                { label: 'Pipeline', value: '$1.2M', change: '+14%' },
                { label: 'Win Rate', value: '35%', change: '+4%' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="text-[9px] text-slate-400 uppercase tracking-wide mb-1">{stat.label}</div>
                  <div className="text-sm font-bold text-white">{stat.value}</div>
                  <div className="text-[10px] text-success">{stat.change}</div>
                </div>
              ))}
            </div>
            
            {/* Mini chart placeholder */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-[10px] text-slate-400 mb-2">Revenue Trend</div>
              <div className="h-16 flex items-end gap-1">
                {[45, 52, 48, 58, 65, 70, 68, 75].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-primary/50 to-primary/20 rounded-t transition-all"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative depth elements */}
      <div className="absolute top-1/3 left-0 w-1 h-32 bg-gradient-to-b from-transparent via-primary/30 to-transparent hidden lg:block" />
      <div className="absolute bottom-1/3 right-0 w-1 h-32 bg-gradient-to-b from-transparent via-accent/30 to-transparent hidden lg:block" />
    </section>
  );
}
