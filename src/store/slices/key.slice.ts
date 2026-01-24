import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../index";


export interface CampaignKey {
  id: number;
  campaign_id: number;
  account_id: number;
  full_name:string;
  key: string;
  algor?: string;
  iv: string;
  active: number;   
  order_num: number; 
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

export const fetchKeysForCampaignByManager = createAsyncThunk<
  CampaignKey[],
  { campaignId: number, AccountId: number },
  { rejectValue: string }
>(
  "keyManagementManagers/fetchKeys",
  async ({ campaignId, AccountId }, { rejectWithValue }) => {
    console.log(campaignId, AccountId)
    try {
      const response = await axios.get<CampaignKey[]>(
        `/api/keys/campaign/${campaignId}/${AccountId}`
      );
      console.log(response.data)
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
  { campaignId: number; key: string; account_id : number  , order_num: number },
  { rejectValue: string }
>(
  "keyManagement/saveNewKey",
  async ({ campaignId, key, account_id, order_num }, { rejectWithValue }) => {
    try {
      console.log("TEST KEY " , campaignId, key, account_id, order_num)
      const response = await axios.post<CampaignKey>(
        "/api/keys",
        { campaignId, key , account_id, order_num }
      );
      return response.data;
    } catch (error: unknown) {
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
      return rejectWithValue("Failed to delete key");
    }
  }
);


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


export const runBulkEncryptionForSession = createAsyncThunk<
  BulkEncryptionResponse,
  BulkEncryptionPayload,
  { rejectValue: string }
>(
  "keyManagement/runBulkEncryption",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.post<BulkEncryptionResponse>(
        "/api/keys/encrypt-session-bulk",
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


const initialState: KeyManagementState = {
  status: "idle",
  keys: [],
  error: null,
  prerequisites: null,
  officialCiphertext: null,
  lastBulkEncryptionStats: null,
  encryptionStatus: "idle",
};

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
      .addCase(fetchKeysForCampaignByManager.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.keys = [];
      })
      .addCase(fetchKeysForCampaignByManager.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.keys = action.payload;
      })
      .addCase(fetchKeysForCampaignByManager.rejected, (state, action) => {
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

      .addCase(checkEncryptionPrerequisites.pending, (state) => {
        state.prerequisites = null;
      })
      .addCase(checkEncryptionPrerequisites.fulfilled, (state, action) => {
        state.prerequisites = action.payload;
      })

      .addCase(runBulkEncryptionForSession.pending, (state) => {
        state.encryptionStatus = "loading";
        state.lastBulkEncryptionStats = null;
      })
      .addCase(runBulkEncryptionForSession.fulfilled, (state, action) => {
        state.encryptionStatus = "succeeded";
        state.lastBulkEncryptionStats = action.payload;
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
