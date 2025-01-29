/**
 * @jest-environment jsdom
 */

import { encodeState, decodeState, PlannerState } from '../stateService';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

// Mock lz-string
jest.mock('lz-string', () => ({
  compressToEncodedURIComponent: jest.fn(str => str),
  decompressFromEncodedURIComponent: jest.fn(str => str),
}));

describe('stateService', () => {
  beforeEach(() => {
    // Clear localStorage and URL before each test
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    // Reset mocks
    (compressToEncodedURIComponent as jest.Mock).mockClear();
    (decompressFromEncodedURIComponent as jest.Mock).mockClear();
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
      teams: { 'Team A': { sizes: [{ week: 0, size: 2 }], teamLoad: 1 } },
      overheadFactor: 1.2,
      startDate: new Date(),
    };

    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).toEqual(state);
  });

  it('should handle empty state', () => {
    const state: PlannerState = {
      features: [],
      teams: { 'Team A': { sizes: [{ week: 0, size: 2 }], teamLoad: 1 } },
      overheadFactor: 1,
      startDate: new Date(),
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
      teams: { 'Team A': { sizes: [{ week: 0, size: 2 }], teamLoad: 1 } },
      overheadFactor: 1.5,
      startDate: new Date(),
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
      teams: { 'Team A': { sizes: [{ week: 0, size: 2 }], teamLoad: 1 } },
      overheadFactor: 1.2,
      startDate: new Date(),
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
      teams: {
        'Team A': {
          sizes: [
            { week: 0, size: 2 },
            { week: 1, size: 3 },
            { week: 2, size: 4 },
          ],
          teamLoad: 1,
        },
      },
      overheadFactor: 1.2,
      startDate: new Date(),
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
      teams: {
        'Team B': {
          sizes: [{ week: 0, size: 3 }],
          teamLoad: 1,
        },
      },
      overheadFactor: 1.2,
      startDate: new Date(),
    };

    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).toEqual(state);
  });

  it('should use lz-string for compression', () => {
    const state: PlannerState = {
      features: [],
      teams: { 'Team A': { sizes: [{ week: 0, size: 2 }], teamLoad: 1 } },
      overheadFactor: 1,
      startDate: new Date(),
    };

    encodeState(state);
    expect(compressToEncodedURIComponent).toHaveBeenCalledWith(JSON.stringify(state));

    const encoded = encodeState(state);
    decodeState(encoded);
    expect(decompressFromEncodedURIComponent).toHaveBeenCalledWith(encoded);
  });

  it('should handle compression failure gracefully', () => {
    (compressToEncodedURIComponent as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Compression failed');
    });

    const state: PlannerState = {
      features: [],
      teams: {},
      overheadFactor: 1,
      startDate: new Date(),
    };

    expect(() => encodeState(state)).toThrow();
  });

  it('should handle decompression failure gracefully', () => {
    (decompressFromEncodedURIComponent as jest.Mock).mockImplementationOnce(() => null);

    const result = decodeState('invalid-compressed-string');
    expect(result).toBeNull();
  });
});
