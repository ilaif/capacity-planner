/**
 * @jest-environment jsdom
 */

import {
  loadFromLocalStorage,
  saveToLocalStorage,
  loadFromURL,
  updateURL,
  getInitialState,
  DEFAULT_STATE,
  QUERY_PARAM_KEY,
} from '../stateService';
import { PlannerState } from '@/services/stateService';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key],
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock history
let historyMock: { replaceState: jest.Mock };

// Type for mutable location properties
type MutableLocationProps = Pick<
  Location,
  'href' | 'search' | 'pathname' | 'hash' | 'host' | 'hostname' | 'port' | 'protocol'
>;

describe('stateService', () => {
  beforeEach(() => {
    // Setup mocks
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Reset URL by deleting and redefining location
    const locationProps: MutableLocationProps = {
      href: 'http://localhost:3000',
      search: '',
      pathname: '/',
      hash: '',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      protocol: 'http:',
    };

    Object.defineProperty(window, 'location', {
      writable: true,
      value: new Proxy(locationProps, {
        get: (target, prop: keyof MutableLocationProps) => target[prop],
        set: (target, prop: keyof MutableLocationProps, value) => {
          target[prop] = value;
          return true;
        },
      }),
    });

    // Reset history mock
    historyMock = {
      replaceState: jest.fn(),
    };
    Object.defineProperty(window, 'history', { value: historyMock });

    localStorageMock.clear();
    historyMock.replaceState.mockClear();
  });

  describe('loadFromLocalStorage', () => {
    it('should load state from localStorage', () => {
      const testState: PlannerState = {
        features: [{ id: 1, name: 'Test Feature', requirements: {} }],
        teams: { 'Team A': 2 },
        overheadFactor: 1.5,
      };

      localStorageMock.setItem('capacity-planner-features', JSON.stringify(testState.features));
      localStorageMock.setItem('capacity-planner-teams', JSON.stringify(testState.teams));
      localStorageMock.setItem('capacity-planner-overhead', testState.overheadFactor.toString());

      const loadedState = loadFromLocalStorage();
      expect(loadedState).toEqual(testState);
    });

    it('should return default state when localStorage is empty', () => {
      const loadedState = loadFromLocalStorage();
      expect(loadedState).toEqual(DEFAULT_STATE);
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorageMock.setItem('capacity-planner-features', 'invalid-json');
      const loadedState = loadFromLocalStorage();
      expect(loadedState).toEqual(DEFAULT_STATE);
    });
  });

  describe('saveToLocalStorage', () => {
    it('should save state to localStorage', () => {
      const testState: PlannerState = {
        features: [{ id: 1, name: 'Test Feature', requirements: {} }],
        teams: { 'Team A': 2 },
        overheadFactor: 1.5,
      };

      saveToLocalStorage(testState);

      expect(JSON.parse(localStorageMock.getItem('capacity-planner-features')!)).toEqual(
        testState.features
      );
      expect(JSON.parse(localStorageMock.getItem('capacity-planner-teams')!)).toEqual(
        testState.teams
      );
      expect(parseFloat(localStorageMock.getItem('capacity-planner-overhead')!)).toBe(
        testState.overheadFactor
      );
    });
  });

  describe('loadFromURL', () => {
    it('should load state from URL', () => {
      const testState: PlannerState = {
        features: [{ id: 1, name: 'Test Feature', requirements: {} }],
        teams: { 'Team A': 2 },
        overheadFactor: 1.5,
      };

      const encodedState = btoa(JSON.stringify(testState));
      window.location.search = `?${QUERY_PARAM_KEY}=${encodedState}`;

      const loadedState = loadFromURL();
      expect(loadedState).toEqual(testState);
    });

    it('should return null when URL has no state parameter', () => {
      window.location.search = '';
      const loadedState = loadFromURL();
      expect(loadedState).toBeNull();
    });

    it('should return null for invalid encoded state', () => {
      window.location.search = `?${QUERY_PARAM_KEY}=invalid-base64`;
      const loadedState = loadFromURL();
      expect(loadedState).toBeNull();
    });
  });

  describe('updateURL', () => {
    it('should update URL with encoded state', () => {
      const testState: PlannerState = {
        features: [{ id: 1, name: 'Test Feature', requirements: {} }],
        teams: { 'Team A': 2 },
        overheadFactor: 1.5,
      };

      updateURL(testState);

      expect(historyMock.replaceState).toHaveBeenCalled();
      const newUrl = new URL(historyMock.replaceState.mock.calls[0][2]);
      const encodedState = newUrl.searchParams.get(QUERY_PARAM_KEY);
      const decodedState = JSON.parse(atob(encodedState!));
      expect(decodedState).toEqual(testState);
    });
  });

  describe('getInitialState', () => {
    it('should prefer URL state over localStorage state', () => {
      const urlState: PlannerState = {
        features: [{ id: 1, name: 'URL Feature', requirements: {} }],
        teams: { 'Team A': 2 },
        overheadFactor: 1.5,
      };

      const localStorageState: PlannerState = {
        features: [{ id: 1, name: 'LocalStorage Feature', requirements: {} }],
        teams: { 'Team B': 3 },
        overheadFactor: 1.2,
      };

      const encodedState = btoa(JSON.stringify(urlState));
      window.location.search = `?${QUERY_PARAM_KEY}=${encodedState}`;

      localStorageMock.setItem(
        'capacity-planner-features',
        JSON.stringify(localStorageState.features)
      );
      localStorageMock.setItem('capacity-planner-teams', JSON.stringify(localStorageState.teams));
      localStorageMock.setItem(
        'capacity-planner-overhead',
        localStorageState.overheadFactor.toString()
      );

      const initialState = getInitialState();
      expect(initialState).toEqual(urlState);
    });

    it('should return default state when no stored state exists', () => {
      window.location.search = '';
      localStorageMock.clear();

      const initialState = getInitialState();
      expect(initialState).toEqual(DEFAULT_STATE);
    });
  });
});
