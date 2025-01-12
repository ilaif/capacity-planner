/**
 * @jest-environment jsdom
 */

import { encodeState, decodeState, PlannerState } from '../stateService';

describe('stateService', () => {
  beforeEach(() => {
    // Clear localStorage and URL before each test
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('should encode and decode state correctly', () => {
    const state: PlannerState = {
      features: [
        {
          id: 1,
          name: 'Feature 1',
          requirements: {
            'Team A': { weeks: 2, parallel: 1 },
          },
        },
      ],
      teams: { 'Team A': { size: [2], wipLimit: 1 } },
      overheadFactor: 1.2,
    };

    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).toEqual(state);
  });

  it('should handle empty state', () => {
    const state: PlannerState = {
      features: [],
      teams: { 'Team A': { size: [2], wipLimit: 1 } },
      overheadFactor: 1,
    };

    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).toEqual(state);
  });

  it('should handle complex state', () => {
    const state: PlannerState = {
      features: [
        {
          id: 1,
          name: 'Feature 1',
          requirements: {
            'Team A': { weeks: 2, parallel: 1 },
          },
        },
      ],
      teams: { 'Team A': { size: [2], wipLimit: 1 } },
      overheadFactor: 1.5,
    };

    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).toEqual(state);
  });

  it('should handle state with multiple features and teams', () => {
    const state: PlannerState = {
      features: [
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
      ],
      teams: { 'Team A': { size: [2], wipLimit: 1 } },
      overheadFactor: 1.2,
    };

    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).toEqual(state);
  });

  it('should handle state with team size variations', () => {
    const state: PlannerState = {
      features: [
        {
          id: 1,
          name: 'Feature 1',
          requirements: {
            'Team A': { weeks: 2, parallel: 1 },
          },
        },
      ],
      teams: { 'Team A': { size: [2, 3, 4], wipLimit: 1 } },
      overheadFactor: 1.2,
    };

    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).toEqual(state);
  });

  it('should handle state with different team names', () => {
    const state: PlannerState = {
      features: [
        {
          id: 1,
          name: 'Feature 1',
          requirements: {
            'Team B': { weeks: 3, parallel: 2 },
          },
        },
      ],
      teams: { 'Team B': { size: [3], wipLimit: 1 } },
      overheadFactor: 1.2,
    };

    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).toEqual(state);
  });
});
