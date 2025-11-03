import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";


export interface UserSessionData {
  user_session_id: number;
  user_id: number;
  userCode: string;
  firstName: string;
  lastName: string;
  roomName: string | null; 
  qr_payload: string | null; 
}

export interface UserSessionsState {
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  userSessions: UserSessionData[];
}


export const fetchUserSessionsForSession = createAsyncThunk<
  UserSessionData[],
  number,
  { rejectValue: string }
>(
  "userSessions/fetchForSession",
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await axios.get<UserSessionData[]>(
        `/api/user-sessions/session/${sessionId}`
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ?? "Failed to fetch user sessions"
        );
      }
      return rejectWithValue("Failed to fetch user sessions");
    }
  }
);

// 3. State
const initialState: UserSessionsState = {
  status: "idle",
  error: null,
  userSessions: [],
};

// 4. Slice
const userSessionsSlice = createSlice({
  name: "userSessions",
  initialState,
  reducers: {
    clearUserSessions: (state) => {
      state.userSessions = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserSessionsForSession.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.userSessions = [];
      })
      .addCase(fetchUserSessionsForSession.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.userSessions = action.payload;
      })
      .addCase(fetchUserSessionsForSession.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to fetch user sessions";
      });
  },
});

export const { clearUserSessions } = userSessionsSlice.actions;
export { userSessionsSlice };

// 5. Selectors
export const selectAllUserSessions = (state: { userSessions: UserSessionsState }) =>
  state.userSessions.userSessions;
export const selectUserSessionsStatus = (state: { userSessions: UserSessionsState }) =>
  state.userSessions.status;
