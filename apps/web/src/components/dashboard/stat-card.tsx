'use client';

import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useEffect, useState } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  colorClass: string;
  sparklineData?: number[];
  description?: string;
}

export function StatCard({ title, value, change, icon: Icon, colorClass, sparklineData, description }: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);
  const isPositive = change !== undefined && change >= 0;
  
  // Extract numeric value for animation
  const numericValue = typeof value === 'string' 
    ? parseFloat(value.replace(/[^0-9.]/g, '')) 
    : value;

  useEffect(() => {
    setIsVisible(true);
    
    // Animate count-up for numbers
    if (!isNaN(numericValue)) {
      const duration = 1000;
      const steps = 30;
      const increment = numericValue / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setAnimatedValue(numericValue);
          clearInterval(timer);
        } else {
          setAnimatedValue(Math.floor(current));
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
  }, [numericValue]);

  return (
    <div 
      className={cn(
        "group relative rounded-2xl border border-border bg-white p-6 shadow-premium-sm hover:shadow-premium-md transition-all duration-300 overflow-hidden cursor-pointer",
        isVisible && "animate-scale-in"
      )}
      style={{ backgroundColor: '#FFFFFF' }}
    >
      {/* Gradient overlay on hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl",
        colorClass.includes('success') && "bg-gradient-to-br from-success/5 to-success/10",
        colorClass.includes('blue') && "bg-gradient-to-br from-blue-500/5 to-blue-600/10",
        colorClass.includes('purple') && "bg-gradient-to-br from-purple-500/5 to-purple-600/10",
        colorClass.includes('indigo') && "bg-gradient-to-br from-indigo-500/5 to-indigo-600/10",
        colorClass.includes('primary') && "bg-gradient-to-br from-primary/5 to-accent/10"
      )} />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
            colorClass
          )}>
            <Icon className="h-5 w-5" />
          </div>
          
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-300",
              isPositive 
                ? "bg-success/10 text-success group-hover:bg-success/20" 
                : "bg-destructive/10 text-destructive group-hover:bg-destructive/20"
            )}>
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {formatPercent(Math.abs(change))}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1">
          <div className="text-3xl font-bold text-foreground tabular-nums transition-all duration-300 group-hover:text-primary">
            {typeof value === 'string' ? value : animatedValue.toLocaleString()}
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            {title}
          </div>
          {description && (
            <div className="text-xs text-muted-foreground/70 mt-1">
              {description}
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4 h-12 flex items-end gap-1">
            {sparklineData.map((value, i) => {
              const height = (value / Math.max(...sparklineData)) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary/60 group-hover:from-primary/60 group-hover:to-primary transition-all duration-300"
                  style={{ 
                    height: `${height}%`,
                    animationDelay: `${i * 30}ms`
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Bottom accent line */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transition-all duration-300",
          "bg-gradient-to-r opacity-0 group-hover:opacity-100",
          colorClass.includes('success') && "from-success to-emerald-600",
          colorClass.includes('blue') && "from-blue-500 to-blue-600",
          colorClass.includes('purple') && "from-purple-500 to-purple-600",
          colorClass.includes('indigo') && "from-indigo-500 to-indigo-600",
          colorClass.includes('primary') && "from-primary to-accent"
        )} />
      </div>
    </div>
  );
}
