import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

export interface ImportedUser {
  id: string;
  campaignId: string;
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  row: Record<string, string>;
}

export interface UserSessionLink {
  userId: string;
  sessionId: string;
}

interface ImportPayload {
  campaignId: string;
  sessionId?: string | null;
  rows: Record<string, string>[];
}

interface ImportResponse {
  totalUsersCreated: number;
  totalUsersFound: number;
  totalCampaignLinks: number;
  totalSessionLinks: number;
}

export const importUsersThunk = createAsyncThunk<
  ImportResponse,
  ImportPayload,
  { rejectValue: string }
>("users/import", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.post<ImportResponse>(`/api/import/campaign/${payload.campaignId}`, {
      rows: payload.rows,
      sessionId: payload.sessionId ?? undefined,
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.message ?? "Failed to import users");
    }
    return rejectWithValue("Failed to import users");
  }
});

interface UsersState {
  byCampaign: Record<
    string,
    {
      users: ImportedUser[];
      userSessions: UserSessionLink[];
    }
  >;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  lastImportStats: ImportResponse | null;
}

const initialState: UsersState = {
  byCampaign: {},
  status: "idle",
  error: null,
  lastImportStats: null,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    usersImported: (
      state,
      action: PayloadAction<{ campaignId: string; sessionId?: string | null; rows: Record<string, string>[] }>
    ) => {
      const { campaignId, sessionId, rows } = action.payload;
      if (!rows.length) return;
      if (!state.byCampaign[campaignId]) {
        state.byCampaign[campaignId] = { users: [], userSessions: [] };
      }
      const bucket = state.byCampaign[campaignId];
      rows.forEach((row, index) => {
        const id = `usr-${campaignId}-${Date.now()}-${index}`;
        const user: ImportedUser = {
          id,
          campaignId,
          firstName: row.firstName ?? row["ชื่อ"] ?? row["name"] ?? row["Name"],
          lastName: row.lastName ?? row["นามสกุล"] ?? row["surname"] ?? row["Surname"],
          nationalId:
            row.nationalId ??
            row["เลขบัตรประชาชน"] ??
            row["citizenId"] ??
            row["CitizenID"],
          row,
        };
        bucket.users.push(user);
        if (sessionId) {
          bucket.userSessions.push({ userId: id, sessionId });
        }
      });
    },
    usersClearedForCampaign: (state, action: PayloadAction<{ campaignId: string }>) => {
      delete state.byCampaign[action.payload.campaignId];
    },
    clearImportStatus: (state) => {
      state.status = "idle";
      state.error = null;
      state.lastImportStats = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(importUsersThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(importUsersThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.lastImportStats = action.payload;
      })
      .addCase(importUsersThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Import failed";
      });
  },
});

export const { usersImported, usersClearedForCampaign, clearImportStatus } = usersSlice.actions;
export { usersSlice };

export const selectUsersForCampaign = (campaignId: string | null) => (state: { users: UsersState }): ImportedUser[] =>
  campaignId ? state.users.byCampaign[campaignId]?.users ?? [] : [];

export const selectUserSessionsForCampaign = (campaignId: string | null) =>
  (state: { users: UsersState }): UserSessionLink[] =>
    campaignId ? state.users.byCampaign[campaignId]?.userSessions ?? [] : [];

export const selectImportedSummary = (campaignId: string | null) => (state: { users: UsersState }) => {
  if (!campaignId) {
    return { totalUsers: 0, totalAssignments: 0 };
  }
  const bucket = state.users.byCampaign[campaignId];
  if (!bucket) {
    return { totalUsers: 0, totalAssignments: 0 };
  }
  return {
    totalUsers: bucket.users.length,
    totalAssignments: bucket.userSessions.length,
  };
};

export const selectUserImportStatus = (state: { users: UsersState }) => state.users.status;
export const selectUserImportError = (state: { users: UsersState }) => state.users.error;
export const selectUserImportStats = (state: { users: UsersState }) => state.users.lastImportStats;
