'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AddTeamFormProps } from './types';

export function AddTeamForm({ onAddTeam }: AddTeamFormProps) {
  const [newTeamName, setNewTeamName] = useState<string>('');

  const handleSubmit = () => {
    if (newTeamName.trim()) {
      onAddTeam(newTeamName.trim());
      setNewTeamName('');
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={newTeamName}
        onChange={e => setNewTeamName(e.target.value)}
        placeholder="New team name"
        className="h-8 w-40"
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />
      <Button onClick={handleSubmit} size="sm" className="h-8">
        <Plus />
      </Button>
    </div>
  );
}
