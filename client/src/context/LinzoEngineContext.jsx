import React, { createContext, useContext, useReducer } from 'react';

const LinzoEngineContext = createContext(null);

const initialState = {
  activeSessionId: null,
  pipelineState: 'IDLE',
  version: 0,
  timelineHistory: [],
  participantProfiles: {},
  lastEvent: null
};

function engineReducer(state, action) {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, activeSessionId: action.payload };
    case 'UPDATE_PIPELINE':
      return { ...state, pipelineState: action.payload };
    case 'COMMIT_EVENT':
      return {
        ...state,
        version: action.payload.version || state.version + 1,
        lastEvent: action.payload.event,
        timelineHistory: [...state.timelineHistory.slice(-49), action.payload.event]
      };
    case 'SET_PARTICIPANT_PROFILE':
      return {
        ...state,
        participantProfiles: {
          ...state.participantProfiles,
          [action.payload.participantId]: action.payload.profile
        }
      };
    case 'RESET_ENGINE':
      return initialState;
    default:
      return state;
  }
}

export function LinzoEngineProvider({ children }) {
  const [state, dispatch] = useReducer(engineReducer, initialState);

  return (
    <LinzoEngineContext.Provider value={{ state, dispatch }}>
      {children}
    </LinzoEngineContext.Provider>
  );
}

export function useLinzoEngineContext() {
  const context = useContext(LinzoEngineContext);
  if (!context) {
    throw new Error('useLinzoEngineContext must be used within a LinzoEngineProvider');
  }
  return context;
}
