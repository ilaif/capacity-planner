'use client';

import { logger } from '@/services/loggerService';
import { usePlannerStore } from '@/store/plannerStore';
import { AddTeamForm } from './team-configuration/AddTeamForm';
import { TeamCard } from './team-configuration/TeamCard';
import { TeamSizeVariations } from './team-configuration/TeamSizeVariations';
import { TeamSizeChart } from './TeamSizeChart';

export function TeamConfiguration() {
  const { planState, setTeams, setFeatures } = usePlannerStore();
  const { teams, features, startDate } = planState;

  const handleTeamAdd = (teamName: string) => {
    if (teamName && !teams[teamName]) {
      logger.info(`Adding team: ${teamName}`);
      setTeams({
        ...teams,
        [teamName]: { sizes: [{ week: 0, size: 1 }], teamLoad: 1, description: '' },
      });
      // Update all existing features to include the new team
      setFeatures(
        features.map(feature => ({
          ...feature,
          requirements: {
            ...feature.requirements,
            [teamName]: { weeks: 0, parallel: 1 },
          },
        }))
      );
    }
  };

  const handleTeamRemove = (teamName: string) => {
    logger.info(`Removing team: ${teamName}`);
    const newTeams = { ...teams };
    delete newTeams[teamName];
    setTeams(newTeams);

    setFeatures(
      features.map(feature => {
        const newRequirements = { ...feature.requirements };
        delete newRequirements[teamName];
        return { ...feature, requirements: newRequirements };
      })
    );
  };

  const handleTeamRename = (oldName: string, newName: string) => {
    if (oldName && newName && !teams[newName] && oldName !== newName) {
      logger.info(`Renaming team from ${oldName} to ${newName}`);
      const newTeams = { ...teams };
      newTeams[newName] = newTeams[oldName];
      delete newTeams[oldName];
      setTeams(newTeams);

      setFeatures(
        features.map(feature => {
          const newRequirements = { ...feature.requirements };
          if (newRequirements[oldName]) {
            newRequirements[newName] = newRequirements[oldName];
            delete newRequirements[oldName];
          }
          return { ...feature, requirements: newRequirements };
        })
      );
    }
  };

  const handleTeamSizeChange = (team: string, value: number) => {
    const currentTeam = teams[team];
    const currentSize = currentTeam.sizes;
    const newSizes = [...currentSize];
    newSizes[0] = { week: 0, size: value };

    setTeams({
      ...teams,
      [team]: {
        ...currentTeam,
        sizes: newSizes,
      },
    });
  };

  const handleWipLimitChange = (team: string, value: number) => {
    setTeams({
      ...teams,
      [team]: {
        ...teams[team],
        teamLoad: value,
      },
    });
  };

  const handleDescriptionChange = (team: string, description: string) => {
    logger.info(`Updating description for team ${team}`);
    setTeams({
      ...teams,
      [team]: {
        ...teams[team],
        description,
      },
    });
  };

  const handleVariationAdd = (variation: { team: string; week: number; size: number }) => {
    logger.info(
      `Adding size variation for team ${variation.team} at week ${variation.week} with size ${variation.size}`
    );
    const currentTeam = teams[variation.team];
    const currentSizes = currentTeam.sizes;
    let newSizes = [...currentSizes];
    newSizes = newSizes.filter(size => size.week !== variation.week);
    newSizes.push({ week: variation.week, size: variation.size });
    newSizes.sort((a, b) => a.week - b.week);

    setTeams({
      ...teams,
      [variation.team]: {
        ...currentTeam,
        sizes: newSizes,
      },
    });
  };

  const handleVariationRemove = (team: string, week: number) => {
    const currentTeam = teams[team];
    const currentSizes = currentTeam.sizes;
    const newSizes = currentSizes.filter(size => size.week !== week);

    setTeams({
      ...teams,
      [team]: {
        ...currentTeam,
        sizes: newSizes,
      },
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <AddTeamForm onAddTeam={handleTeamAdd} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(teams).map(([team, config]) => (
          <TeamCard
            key={team}
            teamName={team}
            config={config}
            onTeamRemove={handleTeamRemove}
            onTeamRename={handleTeamRename}
            onTeamSizeChange={handleTeamSizeChange}
            onWipLimitChange={handleWipLimitChange}
            onDescriptionChange={handleDescriptionChange}
          />
        ))}
      </div>

      <div className="border-t pt-2">
        <TeamSizeVariations
          teams={teams}
          startDate={startDate}
          onVariationAdd={handleVariationAdd}
          onVariationRemove={handleVariationRemove}
          onVariationEdit={(team, week, size) => handleVariationAdd({ team, week, size })}
        />
      </div>

      <TeamSizeChart teams={teams} />
    </div>
  );
}
