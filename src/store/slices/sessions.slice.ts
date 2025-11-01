import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { campaignSelected, selectActiveCampaign } from "./examData.slice";

interface SessionsState {
  currentSessionId: string | null;
}

const initialState: SessionsState = {
  currentSessionId: null,
};

const sessionsSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    sessionSelected: (state, action: PayloadAction<string | null>) => {
      state.currentSessionId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(campaignSelected, (state, action) => {
      if (!action.payload) {
        state.currentSessionId = null;
      }
    });
  },
});

export const { sessionSelected } = sessionsSlice.actions;
export { sessionsSlice };

export const selectCurrentSessionId = (state: { sessions: SessionsState }) =>
  state.sessions.currentSessionId;

export const selectCurrentSession = (state: { sessions: SessionsState }) => {
  const activeCampaign = selectActiveCampaign(state as never);
  if (!activeCampaign) return null;
  const sessionId = state.sessions.currentSessionId ?? activeCampaign.sessions[0]?.id ?? null;
  return activeCampaign.sessions.find((session) => session.id === sessionId) ?? null;
};
