'use client';

import { TeamConfig } from '@/types/capacity-planner';
import { TeamSizeVariation } from '../types';
import { VariationItem } from './VariationItem';

type VariationListProps = {
  teams: Record<string, TeamConfig>;
  startDate: Date;
  onEdit: (team: string, week: number, size: number) => void;
  onRemove: (team: string, week: number) => void;
};

export function VariationList({ teams, startDate, onEdit, onRemove }: VariationListProps) {
  const getVariations = () => {
    const variations: TeamSizeVariation[] = [];
    Object.entries(teams).forEach(([team, config]) => {
      const sizes = config.sizes;
      for (let i = 1; i < sizes.length; i++) {
        const size = sizes[i];
        variations.push({ team, week: size.week, size: size.size });
      }
    });
    return variations.sort((a, b) => a.week - b.week);
  };

  const variations = getVariations();

  if (variations.length === 0) {
    return <p className="text-xs text-gray-500">No variations</p>;
  }

  return (
    <div className="grid grid-cols-4 gap-1">
      {variations.map(variation => (
        <VariationItem
          key={`${variation.team}-${variation.week}`}
          variation={variation}
          startDate={startDate}
          onEdit={onEdit}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
