import { calculateTimeline } from '../timelineService';
import { Feature, Teams } from '@/types/capacity-planner';

describe('timelineService', () => {
  describe('calculateTimeline', () => {
    it('should calculate timeline with single feature and team', () => {
      const features: Feature[] = [
        {
          id: 1,
          name: 'Feature 1',
          requirements: {
            'Team A': { weeks: 4, parallel: 2 },
          },
        },
      ];

      const teams: Teams = {
        'Team A': 3, // Team of 3 people
      };

      const timeline = calculateTimeline(features, teams, 1.0);

      expect(timeline).toHaveLength(1);
      expect(timeline[0]).toEqual({
        feature: 'Feature 1',
        startWeek: 0,
        endWeek: 2,
        assignments: {
          'Team A': { weeks: 4, parallel: 2 },
        },
      });
    });

    it('should apply overhead factor correctly', () => {
      const features: Feature[] = [
        {
          id: 1,
          name: 'Feature 1',
          requirements: {
            'Team A': { weeks: 4, parallel: 1 },
          },
        },
      ];

      const teams: Teams = {
        'Team A': 2,
      };

      const timeline = calculateTimeline(features, teams, 1.5); // 50% overhead

      expect(timeline).toHaveLength(1);
      expect(timeline[0].endWeek! - timeline[0].startWeek).toBe(6); // 4 weeks * 1.5 = 6 weeks
    });

    it('should handle multiple features with dependencies', () => {
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
            'Team A': { weeks: 3, parallel: 2 },
          },
        },
      ];

      const teams: Teams = {
        'Team A': 2,
      };

      const timeline = calculateTimeline(features, teams, 1.0);

      expect(timeline).toHaveLength(2);
      expect(timeline[0].startWeek).toBe(0);
      expect(timeline[1].startWeek).toBe(2); // Should start after Feature 1
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
        'Team A': [2, 3, 4, 4], // Variable team size over weeks
      };

      const timeline = calculateTimeline(features, teams, 1.0);

      expect(timeline).toHaveLength(1);
      expect(timeline[0].startWeek).toBe(0);
      expect(timeline[0].endWeek).toBe(5);
    });

    it('should handle multiple teams working in parallel', () => {
      const features: Feature[] = [
        {
          id: 1,
          name: 'Feature 1',
          requirements: {
            'Team A': { weeks: 4, parallel: 2 },
            'Team B': { weeks: 3, parallel: 1 },
          },
        },
      ];

      const teams: Teams = {
        'Team A': 3,
        'Team B': 2,
      };

      const timeline = calculateTimeline(features, teams, 1.0);

      expect(timeline).toHaveLength(1);
      expect(timeline[0].endWeek).toBe(3); // Team B cannot parallelize more than 1 and has 3 weeks of work
      expect(timeline[0].assignments).toHaveProperty('Team A');
      expect(timeline[0].assignments).toHaveProperty('Team B');
    });

    it('should handle insufficient team capacity', () => {
      const features: Feature[] = [
        {
          id: 1,
          name: 'Feature 1',
          requirements: {
            'Team A': { weeks: 4, parallel: 3 },
          },
        },
      ];

      const teams: Teams = {
        'Team A': 2, // Only 2 people available, but need 3
      };

      const timeline = calculateTimeline(features, teams, 1.0);

      // Feature should be scheduled at a later time when capacity becomes available
      expect(timeline).toHaveLength(0);
    });

    it('should handle empty features array', () => {
      const features: Feature[] = [];
      const teams: Teams = {
        'Team A': 2,
      };

      const timeline = calculateTimeline(features, teams, 1.0);

      expect(timeline).toHaveLength(0);
    });

    it('should handle empty teams object', () => {
      const features: Feature[] = [
        {
          id: 1,
          name: 'Feature 1',
          requirements: {},
        },
      ];

      const teams: Teams = {};

      const timeline = calculateTimeline(features, teams, 1.0);

      expect(timeline).toHaveLength(1);
      expect(timeline[0].endWeek).toBe(0);
    });
  });
});
