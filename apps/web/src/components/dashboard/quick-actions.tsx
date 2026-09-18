'use client';

import { useState } from 'react';
import { Plus, X, Users, Briefcase, CheckSquare, Calendar, Upload, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

interface QuickAction {
  icon: typeof Users;
  label: string;
  description: string;
  colorClass: string;
  onClick: () => void;
}

export function QuickActions() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  // TODO: Wire these to actual modal components when modals are implemented
  // For now, navigate to appropriate pages
  const actions: QuickAction[] = [
    {
      icon: Users,
      label: 'New Contact',
      description: 'Add a person to your CRM',
      colorClass: 'from-chart-2/10 to-chart-2/5',
      onClick: () => { router.push('/contacts'); setIsOpen(false); }
    },
    {
      icon: Briefcase,
      label: 'Create Deal',
      description: 'Start tracking a new deal',
      colorClass: 'from-chart-3/10 to-chart-3/5',
      onClick: () => { router.push('/deals'); setIsOpen(false); }
    },
    {
      icon: CheckSquare,
      label: 'Add Task',
      description: 'Create a new task',
      colorClass: 'from-chart-5/10 to-chart-5/5',
      onClick: () => { router.push('/tasks'); setIsOpen(false); }
    },
    {
      icon: Calendar,
      label: 'Schedule Meeting',
      description: 'Book a meeting slot',
      colorClass: 'from-chart-4/10 to-chart-4/5',
      onClick: () => { router.push('/calendar'); setIsOpen(false); }
    },
    {
      icon: Upload,
      label: 'Import Leads',
      description: 'Upload CSV file',
      colorClass: 'from-chart-6/10 to-chart-6/5',
      onClick: () => { router.push('/leads'); setIsOpen(false); }
    },
    {
      icon: MessageSquare,
      label: 'Send Message',
      description: 'Contact via WhatsApp',
      colorClass: 'from-chart-1/10 to-chart-1/5',
      onClick: () => { router.push('/inbox'); setIsOpen(false); }
    }
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-8 right-8 z-50 h-14 w-14 rounded-full shadow-premium-xl transition-all duration-300",
          isOpen 
            ? "bg-destructive hover:bg-destructive/90 rotate-45" 
            : "bg-gradient-to-r from-primary to-accent hover:scale-110 hover:shadow-premium-2xl"
        )}
        aria-label="Quick actions"
      >
        <div className="flex items-center justify-center">
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Plus className="h-6 w-6 text-white" />
          )}
        </div>
        
        {/* Pulse ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        )}
      </button>

      {/* Action Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Actions Grid */}
          <div className="fixed bottom-28 right-8 z-50 grid grid-cols-2 gap-4 w-[480px] animate-scale-in">
            {actions.map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-premium-xl",
                    "bg-gradient-to-br border-2 border-border hover:border-primary/20",
                    action.colorClass
                  )}
                  style={{
                    animation: 'scale-in 0.3s ease-out',
                    animationDelay: `${i * 50}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    {/* Label */}
                    <h3 className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {action.label}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  
                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
