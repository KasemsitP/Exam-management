import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

import { AllocationWithSeatCode } from "@/lib/seatviloation";
import { Violation } from "@/lib/seatviloation";


type LocalRootState = {
  seats: SeatsState;
};




export interface SeatAllocationMeta {
  allocating: boolean;
  exporting: boolean;
  lastSeed: number | null;
}

export interface SeatsState {
  assignments: AllocationWithSeatCode[]; 
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






export const fetchSeatAllocationThunk = createAsyncThunk<
  { assignments: AllocationWithSeatCode[]; violations: Violation[] },
  string, 
  { rejectValue: string }
>(
  "seats/fetchAllocation",
  async (campaignId, { rejectWithValue }) => {
    try {
      
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


export const saveSeatAllocationThunk = createAsyncThunk<
  { assignments: AllocationWithSeatCode[]; violations: Violation[] },
  { campaignId: string; assignments: AllocationWithSeatCode[] }, 
  { rejectValue: string }
>(
  "seats/saveAllocation",
  async (payload, { rejectWithValue }) => {
    try {
      
      const campaignIdNumeric = parseInt(payload.campaignId.replace("camp-", ""));
      if (isNaN(campaignIdNumeric)) throw new Error("Invalid Campaign ID Format");

      
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




export const selectSeatsSlice = (state: LocalRootState) => state.seats;
export const selectSeatAssignments = (state: LocalRootState) => state.seats.assignments;
export const selectSeatViolations = (state: LocalRootState) => state.seats.violations;
export const selectSeatAllocationMeta = (state: LocalRootState) => state.seats.meta;

export {seatsSlice}