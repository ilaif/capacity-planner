'use client';

import { TeamSizeVariationsProps } from './types';
import { VariationForm } from './variations/VariationForm';
import { VariationList } from './variations/VariationList';

export function TeamSizeVariations({
  teams,
  startDate,
  onVariationAdd,
  onVariationRemove,
  onVariationEdit,
}: TeamSizeVariationsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Size Variations</h4>
        <VariationForm teams={teams} startDate={startDate} onAdd={onVariationAdd} />
      </div>

      <div>
        <VariationList
          teams={teams}
          startDate={startDate}
          onEdit={onVariationEdit}
          onRemove={onVariationRemove}
        />
      </div>
    </div>
  );
}
