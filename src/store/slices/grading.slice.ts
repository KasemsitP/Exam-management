import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../index";

export interface PayloadScore {
  qrPayload: string;
  campaignId: number;
  subjectId: number;
  sessionId: number;
  graderId: number;
  slotId: number;
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
  lastScore: { slotId: number; score: number } | null;

  verifying: boolean;
  lastSlotId: number | null;
  records: GradingRecord[];
}

const initialState: GradingState = {
  loading: false,
  error: null,
  lastScore: null,
  verifying: false,
  lastSlotId: null,
  records: [],
};
export interface GradingRecord {
  slotId: number;
  score: number;
  enteredAt: string;
}

export const verifyAndAllocateThunk = createAsyncThunk<
  { slotId: number },
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
  { slotId: number; score: number }, // <-- ประเภทค่าที่คืนมา (Fulfilled)
  PayloadScore,                 // <-- ประเภทค่าที่ส่งไป (Payload)
  { rejectValue: string }            // <-- ประเภทค่าที่ Reject
>(
  "grading/submitScore",
  async (payload, { rejectWithValue }) => {
    try {
      console.log("Submitting Score with Payload:", payload)
      const response = await axios.post("/api/gradingscore/submit", payload);
      return response.data; // (Backend ควรคืน { slotId: ..., score: ... })
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "ไม่สามารถบันทึกคะแนนได้"
      );
    }
  }
);
export const fetchRecordThunk = createAsyncThunk<
  GradingRecord[], // ข้อมูลที่คืนจาก backend
  number,          // graderId เป็น payload
  { rejectValue: string }
>(
  "grading/fetchRecord",
  async (graderId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/gradingscore/record/${graderId}`);
      console.log(res.data)
      const records: GradingRecord[] = res.data.map((r: any) => ({
        slotId: r.slot_id,
        score: r.score,
        enteredAt: new Date(r.entered_at).toLocaleString("th-TH", {
          timeZone: "Asia/Bangkok",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      }));

      return records;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "ไม่สามารถดึงประวัติคะแนนได้"
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
      })
      .addCase(fetchRecordThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecordThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchRecordThunk.rejected, (state, action) => {
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
export const selectLastSlotId = createSelector(
  [selectGradingState],
  (gradingState) => gradingState.lastSlotId
);

export const selectIsVerifyingSlot = createSelector(
  [selectGradingState],
  (gradingState) => gradingState.verifying
);

export const selectGradingRecords = createSelector(
  [selectGradingState],
  (gradingState) => gradingState.records
);


export { gradingSlice };