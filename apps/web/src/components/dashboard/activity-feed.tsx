'use client';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/cn';
import { 
  MessageSquare, 
  UserPlus, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Mail,
  Phone,
  FileText
} from 'lucide-react';

interface ActivityItem {
  actor: string;
  type: string;
  at: string | Date;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const activityConfig: Record<string, {
  icon: typeof MessageSquare;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  'NEW_LEAD': {
    icon: UserPlus,
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10',
    borderColor: 'border-chart-2/20',
    label: 'New Lead'
  },
  'DEAL_CREATED': {
    icon: Briefcase,
    color: 'text-chart-3',
    bgColor: 'bg-chart-3/10',
    borderColor: 'border-chart-3/20',
    label: 'Deal Created'
  },
  'DEAL_WON': {
    icon: CheckCircle2,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/20',
    label: 'Deal Won'
  },
  'MESSAGE_SENT': {
    icon: MessageSquare,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    label: 'Message Sent'
  },
  'EMAIL_SENT': {
    icon: Mail,
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10',
    borderColor: 'border-chart-4/20',
    label: 'Email Sent'
  },
  'CALL_COMPLETED': {
    icon: Phone,
    color: 'text-chart-5',
    bgColor: 'bg-chart-5/10',
    borderColor: 'border-chart-5/20',
    label: 'Call Completed'
  },
  'TASK_COMPLETED': {
    icon: CheckCircle2,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/20',
    label: 'Task Done'
  },
  'PROPOSAL_SENT': {
    icon: FileText,
    color: 'text-chart-6',
    bgColor: 'bg-chart-6/10',
    borderColor: 'border-chart-6/20',
    label: 'Proposal Sent'
  }
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <Clock className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No recent activity</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Activity will appear here</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Timeline line */}
      <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-border via-border/50 to-transparent" />
      
      {activities.slice(0, 8).map((item, i) => {
        const config = activityConfig[item.type] || activityConfig['MESSAGE_SENT'];
        const Icon = config.icon;
        const nameParts = item.actor.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts[1] || '';

        return (
          <div 
            key={i} 
            className="relative pl-14 pb-6 last:pb-0 group"
            style={{
              animation: 'fade-in-up 0.3s ease-out',
              animationDelay: `${i * 50}ms`,
              animationFillMode: 'both'
            }}
          >
            {/* Timeline dot with icon */}
            <div className={cn(
              "absolute left-0 top-0 h-10 w-10 rounded-xl border-2 flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg",
              config.bgColor,
              config.borderColor,
              config.color
            )}>
              <Icon className="h-4 w-4" />
            </div>

            {/* Content card */}
            <div className="rounded-xl border border-border bg-card/50 p-4 shadow-premium-xs hover:shadow-premium-sm hover:border-border/80 transition-all duration-200 cursor-pointer">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar 
                    firstName={firstName} 
                    lastName={lastName} 
                    size="xs"
                    className="ring-2 ring-background"
                  />
                  <span className="font-semibold text-sm text-foreground truncate">
                    {item.actor}
                  </span>
                </div>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 flex-shrink-0",
                    config.bgColor,
                    config.color,
                    config.borderColor,
                    "border"
                  )}
                >
                  {config.label}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {item.type.toLowerCase().replace(/_/g, ' ')}
              </p>
              
              <div className="flex items-center gap-1.5 mt-2">
                <Clock className="h-3 w-3 text-muted-foreground/70" />
                <span className="text-xs text-muted-foreground/70">
                  {formatRelative(item.at)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
