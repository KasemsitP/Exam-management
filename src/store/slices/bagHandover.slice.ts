import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from '../index'; // path ของ RootState ของคุณ

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface GraderHistoryCheckResult {
  graderId: number;
  bagId: number;
  scoredCount: number;
  hasGraded: boolean;
}

// 2. ผลลัพธ์ Progress ของถุง
export interface BagProgressData {
  bagId: number;
  totalItems: number;
  fullyAssigned: number;
  halfAssigned: number;
  unassigned: number;
  status: string; // "EMPTY" | "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
}


export interface BagLock {
  id: string;         // internal id หรือมาจาก backend
  campaignId: string; // camp-1, camp-2, ...
  bagId: number;      // เลขถุง (bag_no)
  graderId: number;
  graderName: string;
  operatorId: number;
  operatorName: string;
  at: string;         // ISO datetime string
}

export type BagActionType = "CHECK_OUT" | "CHECK_IN";

export interface BagLog {
  id: string;         // log id
  campaignId: string; // camp-1
  bagId: number;
  action: BagActionType;
  graderId?: number | null;
  operatorId?: number | null;
  timestamp: string;  // ISO datetime
  note?: string | null;
}

export interface BagHandoverState {
  byCampaign: Record<
    string, // campaignId (camp-1)
    {
      locks: BagLock[];
      logs: BagLog[];
    }
  >;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  currentGraderCheck: GraderHistoryCheckResult | null;
  isCheckingGrader: boolean;

  // เก็บ Progress ของถุง (Cache ตาม bagId)
  bagProgressMap: Record<number, BagProgressData>;
  isFetchingProgress: boolean;
}

export type LocalState = BagHandoverState;

/* -------------------------------------------------------------------------- */
/*  Initial State                                                             */
/* -------------------------------------------------------------------------- */

const initialState: BagHandoverState = {
  byCampaign: {},
  status: "idle",
  error: null,
  currentGraderCheck: null,
  isCheckingGrader: false,
  bagProgressMap: {},
  isFetchingProgress: false,
};

/* -------------------------------------------------------------------------- */
/*  Thunks: Fetch locks + logs                                                */
/* -------------------------------------------------------------------------- */

/**
 * ดึง lock + log ของทั้ง campaign จาก backend
 * GET /api/bag-handover/:campaignId
 */
export const fetchBagHandoverForCampaign = createAsyncThunk<
  { campaignId: string; locks: BagLock[]; logs: BagLog[] },
  { campaignId: string },
  { rejectValue: string }
>("bagHandover/fetchForCampaign", async ({ campaignId }, { rejectWithValue }) => {
  try {
    const res = await axios.get<{
      locks: BagLock[];
      logs: BagLog[];
    }>(`/api/bag-handover/${campaignId}`);

    return {
      campaignId,
      locks: res.data.locks ?? [],
      logs: res.data.logs ?? [],
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(
        (error.response?.data as any)?.message ?? "Failed to fetch bag handover data"
      );
    }
    return rejectWithValue("Failed to fetch bag handover data");
  }
});

/* -------------------------------------------------------------------------- */
/*  Thunks: Check-in / Check-out (ยิง API จริง)                               */
/* -------------------------------------------------------------------------- */

/**
 * ลงทะเบียน “ส่งมอบถุงให้ผู้ตรวจ”
 * POST /api/bag-handover/check-in
 * backend จะ map เป็น action ISSUE → ฝั่ง frontend ถือว่า CHECK_OUT
 */
export const registerBagToGraderThunk = createAsyncThunk<
  // payload ที่จะเอาไป update state ใน fulfilled
  {
    campaignId: string;
    bagId: number;
    graderId: number;
    graderName: string;
    operatorId: number;
    operatorName: string;
    note?: string;
  },
  // input จาก UI
  {
    campaignId: string;   // "camp-1"
    bagId: string;        // จาก select (string)
    graderId: string;     // จาก select (string)
    graderName: string;
    operatorId: number;
    operatorName: string;
    note?: string;
  },
  { rejectValue: string }
>("bagHandover/registerBagToGrader", async (payload, { rejectWithValue }) => {
  try {
    const bagNo = Number(payload.bagId);
    const graderIdNumeric = Number(payload.graderId);
    console.log(payload)

    await axios.post("/api/bag-handover/check-in", {
      campaignId: payload.campaignId,
      bagId: bagNo,
      graderId: graderIdNumeric,
      operatorId: payload.operatorId,
      note: payload.note ?? null,
    });

    return {
      campaignId: payload.campaignId,
      bagId: bagNo,
      graderId: graderIdNumeric,
      graderName: payload.graderName,
      operatorId: payload.operatorId,
      operatorName: payload.operatorName,
      note: payload.note,
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(
        (error.response?.data as any)?.message ?? "Failed to register bag to grader"
      );
    }
    return rejectWithValue("Failed to register bag to grader");
  }
});

/**
 * รับคืนถุงจากผู้ตรวจ
 * POST /api/bag-handover/check-out
 * backend จะ map เป็น action RETURN → ฝั่ง frontend ถือว่า CHECK_IN
 */
export const returnBagThunk = createAsyncThunk<
  { campaignId: string; sessionId: number; bagNo: number; operatorId: number },
  { campaignId: string; sessionId: number; bagNo: number; operatorId: number },
  { rejectValue: string }
>(
  "bagHandover/returnBag",
  async (payload, { rejectWithValue }) => {
    try {
      await axios.post("/api/bag-handover/check-out", {
        campaignId: payload.campaignId,
        sessionId: payload.sessionId,
        bagNo: payload.bagNo,
        operatorId: payload.operatorId,
      });

      return payload;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          (error.response?.data as any)?.message ?? "Failed to return bag"
        );
      }
      return rejectWithValue("Failed to return bag");
    }
  }
);
export const checkGraderHistoryThunk = createAsyncThunk<
  GraderHistoryCheckResult,
  { graderId: number; bagId: number },
  { rejectValue: string }
>("bagHandover/checkGraderHistory", async ({ graderId, bagId }, { rejectWithValue }) => {
  try {
    const res = await axios.get<GraderHistoryCheckResult>(
      `/api/grading-summary/check`,
      { params: { graderId, bagId } }
    );
    console.log(res.data)
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(
        (error.response?.data as any)?.message ?? "Failed to check history"
      );
    }
    return rejectWithValue("Failed to check history");
  }
});

/**
 * ดึง Progress ของถุง (ว่าเหลืออีกกี่ไม้)
 * GET /api/grading-summary/bag-progress/:bagId
 */
export const fetchBagProgressThunk = createAsyncThunk<
  BagProgressData,
  number, // bagId
  { rejectValue: string }
>("bagHandover/fetchBagProgress", async (bagId, { rejectWithValue }) => {
  try {
    const res = await axios.get<BagProgressData>(
      `/api/grading-summary/bag-progress/${bagId}`
    );
    console.log(res.data)
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(
        (error.response?.data as any)?.message ?? "Failed to fetch bag progress"
      );
    }
    return rejectWithValue("Failed to fetch bag progress");
  }
});


/* -------------------------------------------------------------------------- */
/*  Slice (local reducers + extraReducers)                                    */
/* -------------------------------------------------------------------------- */

const bagHandoverSlice = createSlice({
  name: "bagHandover",
  initialState,
  reducers: {
    // **ยังเก็บไว้เผื่ออยากใช้ local-only** แต่ตอนนี้เราจะใช้จาก thunk เป็นหลัก
    bagCheckedOut: (
      state,
      action: PayloadAction<{
        campaignId: string;   // camp-1
        bagId: number;
        graderId: number;
        graderName: string;
        operatorId: number;
        operatorName: string;
        note?: string;
      }>
    ) => {
      const {
        campaignId,
        bagId,
        graderId,
        graderName,
        operatorId,
        operatorName,
        note,
      } = action.payload;

      const campaignKey = campaignId;

      if (!state.byCampaign[campaignKey]) {
        state.byCampaign[campaignKey] = { locks: [], logs: [] };
      }

      const bucket = state.byCampaign[campaignKey];

      // กันถุงซ้ำ: ถ้ามี lock เดิมของ bag นี้อยู่แล้ว ให้ลบทิ้งก่อน
      bucket.locks = bucket.locks.filter((l) => l.bagId !== bagId);

      const nowIso = new Date().toISOString();

      // สร้าง lock ใหม่
      bucket.locks.push({
        id: `lock-${campaignKey}-${bagId}-${nowIso}`,
        campaignId: campaignKey,
        bagId,
        graderId,
        graderName,
        operatorId,
        operatorName,
        at: nowIso,
      });

      // เพิ่ม log CHECK_OUT ไว้หัว list
      bucket.logs.unshift({
        id: `log-${campaignKey}-${bagId}-${nowIso}`,
        campaignId: campaignKey,
        bagId,
        action: "CHECK_OUT",
        graderId,
        operatorId,
        timestamp: nowIso,
        note: note ?? null,
      });
    },

    bagCheckedIn: (
      state,
      action: PayloadAction<{
        campaignId: string; // camp-1
        bagId: number;
        operatorId: number;
      }>
    ) => {
      const { campaignId, bagId, operatorId } = action.payload;
      const campaignKey = campaignId;
      const bucket = state.byCampaign[campaignKey];
      if (!bucket) return;

      const nowIso = new Date().toISOString();

      // เอา lock ออก (ปลดถุง)
      bucket.locks = bucket.locks.filter((l) => l.bagId !== bagId);

      // เพิ่ม log CHECK_IN
      bucket.logs.unshift({
        id: `log-${campaignKey}-${bagId}-${nowIso}`,
        campaignId: campaignKey,
        bagId,
        action: "CHECK_IN",
        graderId: undefined,
        operatorId,
        timestamp: nowIso,
        note: null,
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch ทั้ง campaign
      .addCase(fetchBagHandoverForCampaign.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchBagHandoverForCampaign.fulfilled, (state, action) => {
        const { campaignId, locks, logs } = action.payload;
        const campaignKey = campaignId;
        state.status = "succeeded";
        state.byCampaign[campaignKey] = {
          locks,
          logs,
        };
      })
      .addCase(fetchBagHandoverForCampaign.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to fetch bag handover data";
      })

      // ลงทะเบียนส่งมอบ (check-in API) → ใช้ logic เดียวกับ bagCheckedOut
      .addCase(registerBagToGraderThunk.fulfilled, (state, action) => {
        const {
          campaignId,
          bagId,
          graderId,
          graderName,
          operatorId,
          operatorName,
          note,
        } = action.payload;

        if (!state.byCampaign[campaignId]) {
          state.byCampaign[campaignId] = { locks: [], logs: [] };
        }
        const bucket = state.byCampaign[campaignId];
        const nowIso = new Date().toISOString();

        bucket.locks = bucket.locks.filter((l) => l.bagId !== bagId);
        bucket.locks.push({
          id: `lock-${campaignId}-${bagId}-${nowIso}`,
          campaignId,
          bagId,
          graderId,
          graderName,
          operatorId,
          operatorName,
          at: nowIso,
        });

        bucket.logs.unshift({
          id: `log-${campaignId}-${bagId}-${nowIso}`,
          campaignId,
          bagId,
          action: "CHECK_OUT",
          graderId,
          operatorId,
          timestamp: nowIso,
          note: note ?? null,
        });
      })
      .addCase(registerBagToGraderThunk.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to register bag to grader";
      })

      // รับคืนถุง (check-out API) → ใช้ logic เดียวกับ bagCheckedIn
      .addCase(returnBagThunk.fulfilled, (state, action) => {
        const { campaignId, bagNo, operatorId } = action.payload;
        const bucket = state.byCampaign[campaignId];
        if (!bucket) return;

        const nowIso = new Date().toISOString();

        // ใน state.lock.bagId = bag_no (เพราะเราเลือกใช้เลขถุงเป็นตัวอ้างอิง)
        bucket.locks = bucket.locks.filter(
          (l) => Number(l.bagId) !== Number(bagNo)
        );

        bucket.logs.unshift({
          id: `log-${campaignId}-${bagNo}-${nowIso}`,
          campaignId,
          bagId: bagNo,          // 👈 เก็บ bagNo เป็น bagId ใน log
          action: "CHECK_IN",
          graderId: undefined,
          operatorId,
          timestamp: nowIso,
          note: null,
        });
      })
      .addCase(returnBagThunk.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to return bag";
      })
      .addCase(checkGraderHistoryThunk.pending, (state) => {
        state.isCheckingGrader = true;
        // ล้างค่าเก่าออกก่อนเพื่อให้ UI รู้ว่ากำลังเช็คใหม่
        state.currentGraderCheck = null;
      })
      .addCase(checkGraderHistoryThunk.fulfilled, (state, action) => {
        state.isCheckingGrader = false;
        state.currentGraderCheck = action.payload;
      })
      .addCase(checkGraderHistoryThunk.rejected, (state) => {
        state.isCheckingGrader = false;
        state.currentGraderCheck = null;
      })

      // --- ✅ ส่วนที่เพิ่มใหม่: Bag Progress ---
      .addCase(fetchBagProgressThunk.pending, (state) => {
        state.isFetchingProgress = true;
      })
      .addCase(fetchBagProgressThunk.fulfilled, (state, action) => {
        state.isFetchingProgress = false;
        const data = action.payload;
        // เก็บลง Map โดยใช้ bagId เป็น key
        state.bagProgressMap[data.bagId] = data;
      })
      .addCase(fetchBagProgressThunk.rejected, (state) => {
        state.isFetchingProgress = false;
      });
  },
});

export const {
  bagCheckedOut,
  bagCheckedIn,
} = bagHandoverSlice.actions;

export { bagHandoverSlice };

/* -------------------------------------------------------------------------- */
/*  Selectors                                                                 */
/* -------------------------------------------------------------------------- */

export const selectBagHandoverStatus = (state: { bagHandover: BagHandoverState }) =>
  state.bagHandover.status;

export const selectBagHandoverError = (state: { bagHandover: BagHandoverState }) =>
  state.bagHandover.error;

/**
 * ดึง locks (ถุงที่กำลังถูกผู้ตรวจถืออยู่) สำหรับ campaign หนึ่ง ๆ
 */
export const selectBagLocksForCampaign =
  (campaignId: string | null) =>
    (state: { bagHandover: BagHandoverState }): BagLock[] => {
      if (!campaignId) return [];
      const bucket = state.bagHandover.byCampaign[campaignId];
      return bucket?.locks ?? [];
    };

/**
 * ดึง logs (ประวัติ Check-in / Check-out) สำหรับ campaign
 */
export const selectBagLogsForCampaign =
  (campaignId: string | null) =>
    (state: { bagHandover: BagHandoverState }): BagLog[] => {
      if (!campaignId) return [];
      const bucket = state.bagHandover.byCampaign[campaignId];
      return bucket?.logs ?? [];
    };


export const selectCurrentGraderCheck = (state: { bagHandover: BagHandoverState }) =>
  state.bagHandover.currentGraderCheck;

export const selectIsCheckingGrader = (state: { bagHandover: BagHandoverState }) =>
  state.bagHandover.isCheckingGrader;

/**
 * ดึง Progress ของถุงที่ระบุ (สำหรับแสดงใน Card หรือ Table)
 */
export const selectBagProgress = (bagId: number | string) =>
  (state: { bagHandover: BagHandoverState }) => {
    return state.bagHandover.bagProgressMap[Number(bagId)] || null;
  };