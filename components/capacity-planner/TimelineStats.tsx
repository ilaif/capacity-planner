'use client';

import { TimelineItem } from '@/types/capacity-planner';
import { addWeeks, format } from 'date-fns';
import { CalendarDays, CheckCircle2, Clock, LetterText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface TimelineStatsProps {
  timeline: TimelineItem[];
  startDate: Date;
  configurationName: string;
}

export function TimelineStats({ timeline, startDate, configurationName }: TimelineStatsProps) {
  if (timeline.length === 0) return null;

  const lastEndWeek = Math.max(...timeline.map(t => t.endWeek));
  const completionDate = addWeeks(startDate, lastEndWeek);
  const totalFeatures = timeline.length;
  const totalWeeks = lastEndWeek;

  return (
    <div className="flex items-center gap-6 py-2 text-sm">
      <div className="flex items-center gap-2">
        <LetterText className="h-4 w-4 text-muted-foreground" />
        <div>
          <span className="text-muted-foreground">Name:</span>{' '}
          <span className="font-medium">{configurationName}</span>
        </div>
      </div>

      <Separator orientation="vertical" className="h-4" />

      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <div>
          <span className="text-muted-foreground">Completion:</span>{' '}
          <span className="font-medium">{format(completionDate, 'MMM d, yyyy')}</span>
        </div>
      </div>

      <Separator orientation="vertical" className="h-4" />

      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        <div>
          <span className="text-muted-foreground">Features:</span>{' '}
          <span className="font-medium">{totalFeatures}</span>
        </div>
      </div>

      <Separator orientation="vertical" className="h-4" />

      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <div>
          <span className="text-muted-foreground">Duration:</span>{' '}
          <span className="font-medium">{totalWeeks} weeks</span>
        </div>
      </div>
    </div>
  );
}
