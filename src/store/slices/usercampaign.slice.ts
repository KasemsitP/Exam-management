import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// (Interface นี้ต้องตรงกับ 'user_campaigns' + JOINs)
export interface UserCampaign {
  id: number; // (user_campaign_id)
  user_id: number;
  campaign_id: number;
  family_group_id: number | null;
  // (ข้อมูลที่นั่งที่อาจถูก "ยัด" ไว้)
  room_code: string | null; 
  seat_code: string | null;
  assigned: boolean;
}

interface UserCampaignsState {
  userCampaigns: Record<string, UserCampaign>; // (เก็บตาม ID)
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: UserCampaignsState = {
  userCampaigns: {},
  status: "idle",
  error: null,
};

// (GET /api/user-campaigns/campaign/:campaignId)
export const fetchUserCampaignsThunk = createAsyncThunk<
  UserCampaign[],
  string, // (campaignId)
  { rejectValue: string }
>(
  "userCampaigns/fetch",
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/user-campaigns/campaign/${campaignId}`);
      return response.data as UserCampaign[];
    } catch (error: unknown) {
      // ... (Error handling)
      return rejectWithValue("Failed to fetch User Campaigns");
    }
  }
);

const userCampaignsSlice = createSlice({
  name: "userCampaigns",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserCampaignsThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUserCampaignsThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        const newMap: Record<string, UserCampaign> = {};
        action.payload.forEach(uc => {
          newMap[uc.id] = uc;
        });
        state.userCampaigns = newMap;
      })
      .addCase(fetchUserCampaignsThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed";
      });
  },
});

// (Selectors)
type LocalRootState = {
  userCampaigns: UserCampaignsState;
};
export const selectAllUserCampaigns = (state: LocalRootState) => 
  Object.values(state.userCampaigns.userCampaigns);

export const selectUserCampaignsForCampaign = (campaignId: string | null) => (state: LocalRootState) => {
  if (!campaignId) return [];
  // (FIXME: Logic นี้ควร Filter ด้วย campaignId จริงๆ)
  return Object.values(state.userCampaigns.userCampaigns);
};

export {userCampaignsSlice}