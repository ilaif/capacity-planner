import { PlannerState } from '@/services/stateService';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight } from 'lucide-react';
import { isEqual } from 'date-fns';

interface DiffViewProps {
  currentState: PlannerState;
  savedState: PlannerState;
}

type ChangeType = 'added' | 'removed' | 'modified';

interface Change {
  type: ChangeType;
  field: string;
  old: unknown;
  new: unknown;
}

export function DiffView({ currentState, savedState }: DiffViewProps) {
  const changes: Change[] = [];

  // Compare teams
  Object.entries(currentState.teams || {}).forEach(([team, config]) => {
    if (!savedState.teams?.[team]) {
      changes.push({ type: 'added', field: `Team ${team}`, old: null, new: config });
    } else {
      if (JSON.stringify(config) !== JSON.stringify(savedState.teams[team])) {
        changes.push({
          type: 'modified',
          field: `Team ${team}`,
          old: savedState.teams[team],
          new: config,
        });
      }
    }
  });
  Object.keys(savedState.teams || {}).forEach(team => {
    if (!currentState.teams?.[team]) {
      changes.push({
        type: 'removed',
        field: `Team ${team}`,
        old: savedState.teams[team],
        new: null,
      });
    }
  });

  // Compare features
  currentState.features?.forEach(feature => {
    const savedFeature = savedState.features?.find(f => f.id === feature.id);
    if (!savedFeature) {
      changes.push({ type: 'added', field: `Feature ${feature.name}`, old: null, new: feature });
    } else if (JSON.stringify(feature) !== JSON.stringify(savedFeature)) {
      changes.push({
        type: 'modified',
        field: `Feature ${feature.name}`,
        old: savedFeature,
        new: feature,
      });
    }
  });
  savedState.features?.forEach(feature => {
    const currentFeature = currentState.features?.find(f => f.id === feature.id);
    if (!currentFeature) {
      changes.push({
        type: 'removed',
        field: `Feature ${feature.name}`,
        old: feature,
        new: null,
      });
    }
  });

  if (!isEqual(currentState.startDate, savedState.startDate)) {
    changes.push({
      type: 'modified',
      field: 'startDate',
      old: savedState.startDate,
      new: currentState.startDate,
    });
  }

  // Compare other fields
  ['overheadFactor'].forEach(field => {
    if (currentState[field as keyof PlannerState] !== savedState[field as keyof PlannerState]) {
      changes.push({
        type: 'modified',
        field,
        old: savedState[field as keyof PlannerState],
        new: currentState[field as keyof PlannerState],
      });
    }
  });

  if (changes.length === 0) {
    return <div className="text-muted-foreground">No changes detected</div>;
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {changes.map((change, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  change.type === 'added'
                    ? 'default'
                    : change.type === 'removed'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {change.type}
              </Badge>
              <span className="font-medium">{change.field}</span>
            </div>
            {change.type === 'modified' && (
              <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-start pl-4">
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {JSON.stringify(change.old, null, 2)}
                </div>
                <ArrowRight className="w-4 h-4 mt-2" />
                <div className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(change.new, null, 2)}
                </div>
              </div>
            )}
            {change.type === 'added' && (
              <div className="pl-4 text-sm whitespace-pre-wrap">
                {JSON.stringify(change.new, null, 2)}
              </div>
            )}
            {change.type === 'removed' && (
              <div className="pl-4 text-sm text-muted-foreground whitespace-pre-wrap">
                {JSON.stringify(change.old, null, 2)}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
