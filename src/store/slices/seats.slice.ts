import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
// (Interfaces นี้จะถูกสร้างใน lib/seatViolations.ts)
import { AllocationWithSeatCode } from "@/lib/seatviloation";
import { Violation } from "@/lib/seatviloation";

// (ใช้ LocalRootState)
type LocalRootState = {
  seats: SeatsState;
};

// ------------------------------
// Interfaces
// ------------------------------
export interface SeatAllocationMeta {
  allocating: boolean;
  exporting: boolean;
  lastSeed: number | null;
}

export interface SeatsState {
  assignments: AllocationWithSeatCode[]; // (ใช้ Type ใหม่)
  violations: Violation[];
  meta: SeatAllocationMeta;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: SeatsState = {
  assignments: [],
  violations: [],
  meta: {
    allocating: false,
    exporting: false,
    lastSeed: null,
  },
  status: "idle",
  error: null,
};

// ------------------------------
// Thunks (API Calls)
// ------------------------------

// ⭐️ (FIX 1) (GET /api/seats/campaign/:campaignId)
export const fetchSeatAllocationThunk = createAsyncThunk<
  { assignments: AllocationWithSeatCode[]; violations: Violation[] },
  string, // (campaignId: "camp-1")
  { rejectValue: string }
>(
  "seats/fetchAllocation",
  async (campaignId, { rejectWithValue }) => {
    try {
      // (แปลง "camp-1" -> 1)
      const campaignIdNumeric = parseInt(campaignId.replace("camp-", ""));
      if (isNaN(campaignIdNumeric)) throw new Error("Invalid Campaign ID Format");
      
      const response = await axios.get(`/api/seats/campaign/${campaignIdNumeric}`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message ?? "Fetch failed");
      }
      return rejectWithValue("Fetch failed");
    }
  }
);

// ⭐️ (FIX 2) (POST /api/seats/allocate-campaign)
export const saveSeatAllocationThunk = createAsyncThunk<
  { assignments: AllocationWithSeatCode[]; violations: Violation[] },
  { campaignId: string; assignments: AllocationWithSeatCode[] }, // (⭐️ รับ campaignId: "camp-1")
  { rejectValue: string }
>(
  "seats/saveAllocation",
  async (payload, { rejectWithValue }) => {
    try {
      // (แปลง "camp-1" -> 1)
      const campaignIdNumeric = parseInt(payload.campaignId.replace("camp-", ""));
      if (isNaN(campaignIdNumeric)) throw new Error("Invalid Campaign ID Format");

      // (ส่ง Payload ที่แปลง ID แล้วไปที่ API)
      const apiPayload = {
        campaignId: campaignIdNumeric,
        assignments: payload.assignments
      };
      
      const response = await axios.post(`/api/seats/allocate-campaign`, apiPayload);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message ?? "Save failed");
      }
      return rejectWithValue("Save failed");
    }
  }
);


// ------------------------------
// Slice
// ------------------------------
const seatsSlice = createSlice({
  name: "seats",
  initialState,
  reducers: {
    seatAllocationStarted: (state, action: PayloadAction<{ seed: number }>) => {
      state.meta.allocating = true;
      state.meta.lastSeed = action.payload.seed;
      state.assignments = [];
      state.violations = [];
    },
    seatAllocationFinished: (state, action: PayloadAction<{ assignments: AllocationWithSeatCode[]; violations: Violation[] }>) => {
      state.meta.allocating = false;
      state.assignments = action.payload.assignments;
      state.violations = action.payload.violations;
    },
    seatAssignmentsCleared: (state) => {
      state.assignments = [];
      state.violations = [];
      state.meta.lastSeed = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // (Fetch)
      .addCase(fetchSeatAllocationThunk.pending, (state) => {
        state.status = "loading";
        state.meta.allocating = true;
      })
      .addCase(fetchSeatAllocationThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.meta.allocating = false;
        state.assignments = action.payload.assignments;
        state.violations = action.payload.violations;
      })
      .addCase(fetchSeatAllocationThunk.rejected, (state) => {
        state.status = "idle";
        state.meta.allocating = false;
        state.assignments = [];
        state.violations = [];
      })
      // (Save)
      .addCase(saveSeatAllocationThunk.pending, (state) => {
        state.status = "loading";
        state.meta.allocating = true;
      })
      .addCase(saveSeatAllocationThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.meta.allocating = false;
        state.assignments = action.payload.assignments;
        state.violations = action.payload.violations;
      })
      .addCase(saveSeatAllocationThunk.rejected, (state, action) => {
        state.status = "failed";
        state.meta.allocating = false;
        state.error = action.payload ?? "Failed to save";
      });
  },
});

export const {
  seatAllocationStarted,
  seatAllocationFinished,
  seatAssignmentsCleared,
} = seatsSlice.actions;

// ------------------------------
// Selectors
// ------------------------------
export const selectSeatsSlice = (state: LocalRootState) => state.seats;
export const selectSeatAssignments = (state: LocalRootState) => state.seats.assignments;
export const selectSeatViolations = (state: LocalRootState) => state.seats.violations;
export const selectSeatAllocationMeta = (state: LocalRootState) => state.seats.meta;

export {seatsSlice}