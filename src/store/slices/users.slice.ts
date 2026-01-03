import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../index";
interface ImportPayload {
  campaignId: string; 
  rows: Record<string, string>[];
}

interface ImportResponse {
  totalUsersCreated: number;
  totalUsersFound: number;
  totalCampaignLinks: number;
  totalSessionLinks: number; 
}
const parseCampaignId = (id: string): number => {
  return Number(id.replace("camp-", ""));
};

export const importUsersThunk = createAsyncThunk<
  ImportResponse,
  ImportPayload,
  { rejectValue: string }
>("users/import", async (payload, { rejectWithValue }) => {
  try {
    // 
    // 
    const numericCampaignId = parseCampaignId(payload.campaignId);
    if (isNaN(numericCampaignId)) {
      return rejectWithValue("Invalid Campaign ID format on client.");
    }

    const response = await axios.post<ImportResponse>(
      `/api/import/campaign/${numericCampaignId}`, // ส่ง ID ที่เป็นตัวเลข
      {
        rows: payload.rows,
      }
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to import users"
      );
    }
    return rejectWithValue("Failed to import users");
  }
});

interface UsersState {
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  lastImportStats: ImportResponse | null;
}

const initialState: UsersState = {
  status: "idle",
  error: null,
  lastImportStats: null,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
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

export const { clearImportStatus } = usersSlice.actions;
export { usersSlice };


export const selectUserImportStatus = (state: RootState) =>
  state.users.status;

export const selectUserImportError = (state: RootState) =>
  state.users.error;

export const selectUserImportStats = (state: RootState) =>
  state.users.lastImportStats;

