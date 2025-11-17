import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../index";

export interface Payload {
  qrPayload: string;
  campaignId: number;
  subjectId: number;
  sessionId: number;
  graderId: number;
  questionNo: number;
  score: number;
}
export interface PayloadSlot {
  qrPayload: string;
  campaignId: number;
  subjectId: number;
  sessionId: number;
  graderId: number;
  questionNo: number;
}
interface GradingState {
  loading: boolean;
  error: string | null;
  lastScore: {
    slotId: string;
    score: number;
  } | null;
}

interface GradingState {
  loading: boolean;
  error: string | null;
  lastScore: { slotId: string; score: number } | null;

  verifying: boolean;
  lastSlotId: string | null;
}

const initialState: GradingState = {
  loading: false,
  error: null,
  lastScore: null,
  verifying: false,
  lastSlotId: null,
};

export const verifyAndAllocateThunk = createAsyncThunk<
  { slotId: string },
  PayloadSlot,
  { rejectValue: string }
>(
  "grading/verifyAndAllocatepayload",
  async (payload, { rejectWithValue }) => {
    console.log("Payload in Thunk:", payload);
    try {
      const res = await axios.post("/api/gradingslots/verify", payload);
      console.log("Response from verify API:", res.data);
      return res.data; 
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "ไม่สามารถสร้าง Slot การตรวจได้"
      );
    }
  }
);
export const submitScoreThunk = createAsyncThunk<
  { slotId: string; score: number }, // <-- ประเภทค่าที่คืนมา (Fulfilled)
  Payload,                 // <-- ประเภทค่าที่ส่งไป (Payload)
  { rejectValue: string }            // <-- ประเภทค่าที่ Reject
>(
  "grading/submitScore",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.post("/grading/submit-score", payload);
      return response.data; // (Backend ควรคืน { slotId: ..., score: ... })
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "ไม่สามารถบันทึกคะแนนได้"
      );
    }
  }
);

// 4. Slice (เหมือนเดิม)
const gradingSlice = createSlice({
  name: "grading",
  initialState,
  reducers: {
    clearGradingError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(verifyAndAllocateThunk.pending, (state) => {
        state.verifying = true;
        state.error = null;
      })
      .addCase(verifyAndAllocateThunk.fulfilled, (state, action) => {
        state.verifying = false;
        state.lastSlotId = action.payload.slotId;
      })
      .addCase(verifyAndAllocateThunk.rejected, (state, action) => {
        state.verifying = false;
        state.error = action.payload as string;
      })
      .addCase(submitScoreThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitScoreThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.lastScore = action.payload;
      })
      .addCase(submitScoreThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearGradingError } = gradingSlice.actions;

// 5. Selectors (แก้ไขตามที่คุณขอ โดยใช้ createSelector)

// (1) Base Selector: ดึง "LocalState" (GradingState) จาก "RootState"
export const selectGradingState = (state: RootState) => state.grading;

// (2) Derived Selectors: 
//     (Selectors พวกนี้จะรับ LocalState (GradingState) จาก Base Selector)

export const selectIsGradingLoading = createSelector(
  [selectGradingState], // (Input selector)
  (gradingState) => gradingState.loading // (Combiner)
);

export const selectGradingError = createSelector(
  [selectGradingState], // (Input selector)
  (gradingState) => gradingState.error // (Combiner)
);

export const selectLastScore = createSelector(
  [selectGradingState],
  (gradingState) => gradingState.lastScore
);


export { gradingSlice };