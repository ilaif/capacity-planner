import { calculateTimeline } from '../timelineService';
import { Feature, Teams } from '@/types/capacity-planner';

describe('timelineService', () => {
  it('should calculate timeline correctly for a single feature', () => {
    const features: Feature[] = [
      {
        id: 1,
        name: 'Feature 1',
        requirements: {
          'Team A': { weeks: 2, parallel: 1 },
        },
      },
    ];

    const teams: Teams = {
      'Team A': { size: [3], wipLimit: 1 }, // Team of 3 people
    };

    const timeline = calculateTimeline(features, teams, 1);
    expect(timeline).toHaveLength(1);
    expect(timeline[0]).toEqual({
      feature: 'Feature 1',
      startWeek: 0,
      endWeek: 2,
      assignments: {
        'Team A': { weeks: 2, parallel: 1 },
      },
    });
  });

  it('should handle multiple features', () => {
    const features: Feature[] = [
      {
        id: 1,
        name: 'Feature 1',
        requirements: {
          'Team A': { weeks: 2, parallel: 1 },
        },
      },
      {
        id: 2,
        name: 'Feature 2',
        requirements: {
          'Team A': { weeks: 3, parallel: 1 },
        },
      },
    ];

    const teams: Teams = {
      'Team A': { size: [2], wipLimit: 2 },
    };

    const timeline = calculateTimeline(features, teams, 1);
    expect(timeline).toHaveLength(2);
    expect(timeline[0].startWeek).toBe(0);
    expect(timeline[1].startWeek).toBe(0); // Can start at the same time due to WIP limit of 2
  });

  it('should handle overhead factor', () => {
    const features: Feature[] = [
      {
        id: 1,
        name: 'Feature 1',
        requirements: {
          'Team A': { weeks: 2, parallel: 1 },
        },
      },
    ];

    const teams: Teams = {
      'Team A': { size: [2], wipLimit: 1 },
    };

    const timeline = calculateTimeline(features, teams, 1.5);
    expect(timeline).toHaveLength(1);
    expect(timeline[0].endWeek! - timeline[0].startWeek).toBe(3); // 2 weeks * 1.5 = 3 weeks
  });

  it('should handle variable team sizes', () => {
    const features: Feature[] = [
      {
        id: 1,
        name: 'Feature 1',
        requirements: {
          'Team A': { weeks: 9, parallel: 2 },
        },
      },
    ];

    const teams: Teams = {
      'Team A': { size: [2, 3, 4, 4], wipLimit: 1 }, // Variable team size over weeks
    };

    const timeline = calculateTimeline(features, teams, 1);
    expect(timeline).toHaveLength(1);
    expect(timeline[0].startWeek).toBe(0); // Should start at week 1 when team size becomes 3;
    expect(timeline[0].endWeek).toBe(5);
  });

  it('should handle multiple teams', () => {
    const features: Feature[] = [
      {
        id: 1,
        name: 'Feature 1',
        requirements: {
          'Team A': { weeks: 2, parallel: 1 },
          'Team B': { weeks: 3, parallel: 1 },
        },
      },
    ];

    const teams: Teams = {
      'Team A': { size: [3], wipLimit: 1 },
      'Team B': { size: [2], wipLimit: 1 },
    };

    const timeline = calculateTimeline(features, teams, 1);
    expect(timeline).toHaveLength(1);
    expect(timeline[0].endWeek).toBe(3); // Should be determined by Team B's longer duration
  });

  it('should handle insufficient team size', () => {
    const features: Feature[] = [
      {
        id: 1,
        name: 'Feature 1',
        requirements: {
          'Team A': { weeks: 2, parallel: 3 }, // Requires 3 people in parallel
        },
      },
    ];

    const teams: Teams = {
      'Team A': { size: [2], wipLimit: 1 }, // Only 2 people available, but need 3
    };

    const timeline = calculateTimeline(features, teams, 1);
    expect(timeline).toHaveLength(0); // Should not be able to schedule
  });

  it('should handle WIP limits', () => {
    const features: Feature[] = [
      {
        id: 1,
        name: 'Feature 1',
        requirements: {
          'Team A': { weeks: 4, parallel: 1 },
        },
      },
      {
        id: 2,
        name: 'Feature 2',
        requirements: {
          'Team A': { weeks: 4, parallel: 1 },
        },
      },
    ];

    const teams: Teams = {
      'Team A': { size: [2], wipLimit: 1 }, // Can only work on one feature at a time
    };

    const timeline = calculateTimeline(features, teams, 1);
    expect(timeline).toHaveLength(2);
    expect(timeline[1].startWeek).toBeGreaterThanOrEqual(timeline[0].endWeek || 0);
  });
});
