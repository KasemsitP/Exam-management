import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../index";

// (ใช้ { keyManagement: KeyManagementState } เพื่อหลีกเลี่ยง Circular Import)
type LocalRootState = { keyManagement: KeyManagementState };

// --- 1. Interfaces ---

export interface CampaignKey {
  id: number;
  campaign_id: number;
  key: string;
  iv: string;
  algor: string;
  created_at: string;
}

export interface PrerequisiteStatus {
  hasTwoKeys: boolean;
  hasImportedUsers: boolean;
}
export interface EncryptionPayload {
  campaignId: number;
  sessionId: number;
  userCode: string;
}
export interface EncryptionResponse {
  ciphertext: string;
}
export interface BulkEncryptionPayload {
  campaignId: number;
  sessionId: number;
}
export interface BulkEncryptionResponse {
  usersEncrypted: number;
}

export interface KeyManagementState {
  status: "idle" | "loading" | "succeeded" | "failed";
  keys: CampaignKey[];
  error: string | null;
  prerequisites: PrerequisiteStatus | null;
  officialCiphertext: string | null;
  lastBulkEncryptionStats: BulkEncryptionResponse | null; 
  encryptionStatus: "idle" | "loading" | "succeeded" | "failed";
}

// --- 2. Thunks (เรียก API) ---

// (fetchKeysForCampaign, saveNewKey, deleteKey - สมมติว่ามีอยู่)
export const fetchKeysForCampaign = createAsyncThunk<
  CampaignKey[],
  number,
  { rejectValue: string }
>(
  "keyManagement/fetchKeys",
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await axios.get<CampaignKey[]>(
        `/api/keys/campaign/${campaignId}`
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ?? "Failed to fetch keys"
        );
      }
      return rejectWithValue("Failed to fetch keys");
    }
  }
);
export const saveNewKey = createAsyncThunk<
  CampaignKey,
  { campaignId: number; key: string },
  { rejectValue: string }
>(
  "keyManagement/saveNewKey",
  async ({ campaignId, key }, { rejectWithValue }) => {
    try {
      const response = await axios.post<CampaignKey>(
        "/api/keys",
        { campaignId, key }
      );
      return response.data;
    } catch (error: unknown) {
      // ... (error handling)
      return rejectWithValue("Failed to save key");
    }
  }
);
export const deleteKey = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>(
  "keyManagement/deleteKey",
  async (keyId, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/keys/${keyId}`);
      return keyId;
    } catch (error: unknown) {
      // ... (error handling)
      return rejectWithValue("Failed to delete key");
    }
  }
);

/**
 * [GET] ตรวจสอบเงื่อนไข (คีย์ครบ 2, Import แล้ว)
 */
export const checkEncryptionPrerequisites = createAsyncThunk<
  PrerequisiteStatus,
  number,
  { rejectValue: string }
>(
  "keyManagement/checkPrerequisites",
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await axios.get<PrerequisiteStatus>(
        `/api/keys/prerequisites/${campaignId}`
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ?? "Failed to check status"
        );
      }
      return rejectWithValue("Failed to check status");
    }
  }
);

/**
 * [ ⭐️ นี่คือ Thunk ที่คุณถามถึง ⭐️ ]
 * [POST] สั่งให้ Server เข้ารหัส
 */
export const runBulkEncryptionForSession = createAsyncThunk<
  BulkEncryptionResponse,
  BulkEncryptionPayload,
  { rejectValue: string }
>(
  "keyManagement/runBulkEncryption", // 👈 (เปลี่ยนชื่อ)
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.post<BulkEncryptionResponse>(
        "/api/keys/encrypt-session-bulk", // 👈 (Endpoint ใหม่)
        payload
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.message ?? "Bulk Encryption failed"
        );
      }
      return rejectWithValue("Bulk Encryption failed");
    }
  }
);

// --- 3. State ---
const initialState: KeyManagementState = {
  status: "idle",
  keys: [],
  error: null,
  prerequisites: null,
  officialCiphertext: null,
  lastBulkEncryptionStats: null, // 👈 (แก้)
  encryptionStatus: "idle",
};

// --- 4. Slice ---
const keyManagementSlice = createSlice({
  name: "keyManagement",
  initialState,
  reducers: {
    clearActiveKeys: (state) => {
      state.keys = [];
      state.status = "idle";
      state.error = null;
      state.prerequisites = null;
      state.officialCiphertext = null;
      state.encryptionStatus = "idle";
    },
    clearEncryptionResult: (state) => {
      state.officialCiphertext = null;
      state.encryptionStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      // (Fetch, Save, Delete Keys - ... )
      .addCase(fetchKeysForCampaign.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.keys = [];
      })
      .addCase(fetchKeysForCampaign.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.keys = action.payload;
      })
      .addCase(fetchKeysForCampaign.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to fetch keys";
      })
      .addCase(saveNewKey.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.keys.push(action.payload);
      })
      .addCase(deleteKey.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.keys = state.keys.filter((key) => key.id !== action.payload);
      })

      // (Check Prerequisites)
      .addCase(checkEncryptionPrerequisites.pending, (state) => {
        state.prerequisites = null;
      })
      .addCase(checkEncryptionPrerequisites.fulfilled, (state, action) => {
        state.prerequisites = action.payload;
      })
      
      // [ ⭐️ นี่คือการอัปเดต State ⭐️ ]
      // (Run Encryption)
      .addCase(runBulkEncryptionForSession.pending, (state) => {
        state.encryptionStatus = "loading";
        state.lastBulkEncryptionStats = null;
      })
      .addCase(runBulkEncryptionForSession.fulfilled, (state, action) => {
        state.encryptionStatus = "succeeded";
        state.lastBulkEncryptionStats = action.payload; // 👈 (เก็บ Stats)
      })
      .addCase(runBulkEncryptionForSession.rejected, (state, action) => {
        state.encryptionStatus = "failed";
        state.error = action.payload ?? "Encryption failed";
      });
  },
});

export const { clearActiveKeys, clearEncryptionResult } =
  keyManagementSlice.actions;
export { keyManagementSlice };

// --- 5. Selectors ---
// --- 5. Selectors ---
// ใช้ RootState จาก store โดยตรง

export const selectKeyManagementStatus = (state: RootState) =>
  state.keyManagement.status;

export const selectAllActiveKeys = (state: RootState) =>
  state.keyManagement.keys;

export const selectKeyManagementError = (state: RootState) =>
  state.keyManagement.error;

export const selectPrerequisites = (state: RootState) =>
  state.keyManagement.prerequisites;

export const selectEncryptionStatus = (state: RootState) =>
  state.keyManagement.encryptionStatus;

export const selectLastBulkEncryptionStats = (state: RootState) =>
  state.keyManagement.lastBulkEncryptionStats;
