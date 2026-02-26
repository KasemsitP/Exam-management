import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../index";
import { clear } from "console";
import { logout } from "./auth.slice";

export interface PayloadScore {
  qrPayload: string;
  campaignId: number;
  graderId: number;
  slotId: number;
  question_no: number;
  score: number;
}
export interface PayloadSlot {
  qrPayload: string;
  campaignId: number;
  graderId: number;
  questionNo: number;
}


interface GradingState {
  loading: boolean;
  error: string | null;
  lastScore: { slotId: number; score: number } | null;

  verifying: boolean;
  lastSlotId: number | null;
  bagNo: number | null;
  records: GradingRecord[];
}

const initialState: GradingState = {
  loading: false,
  error: null,
  lastScore: null,
  verifying: false,
  lastSlotId: null,
  bagNo: null,
  records: [],
};
export interface GradingRecord {
  random_num: number;
  slotId: number;
  score: number;
  enteredAt: string;
  qr_payload: string
}

export const verifyAndAllocateThunk = createAsyncThunk<
  { slotId: number, bagNo: number },
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
        qr_payload: r.qr_payload,
        enteredAt: new Date(r.enteredAT).toLocaleString("th-TH", {
          timeZone: "Asia/Bangkok",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        random_num: r.random_num,
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
    clearGradingState: (state) => {
      state.loading = false;
      state.error = null;
      state.lastScore = null;
      state.verifying = false;
      state.lastSlotId = null;
      state.bagNo = null;
      state.records = [];
    }
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
        state.bagNo = action.payload.bagNo;
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
      })
      .addCase(logout.pending, (state) => {
        state.records = [];
        state.loading = false;
        state.error = null;
        state.lastScore = null;
        state.verifying = false;
        state.lastSlotId = null;
        state.bagNo = null;
      });

  },
});

export const { clearGradingError, clearGradingState } = gradingSlice.actions;


export const selectGradingState = (state: RootState) => state.grading;


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

export const selectBagNo = createSelector(
  [selectGradingState],
  (gradingState) => gradingState.bagNo
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