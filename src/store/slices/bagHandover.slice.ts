import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";

export type BagHandoverAction = "CHECK_OUT" | "CHECK_IN";

export interface BagHandoverLog {
  id: string;
  campaignId: string;
  bagId: string;
  graderId: string;
  operatorId: string;
  action: BagHandoverAction;
  note?: string;
  timestamp: string;
}

export interface BagLock {
  bagId: string;
  campaignId: string;
  graderId: string;
  graderName: string;
  operatorId: string;
  operatorName: string;
  at: string;
}

interface BagHandoverState {
  logs: BagHandoverLog[];
  locks: Record<string, BagLock>;
}

const initialState: BagHandoverState = {
  logs: [
    {
      id: nanoid(6),
      campaignId: "camp-y68-t2",
      bagId: "BAG-Y68-D1-01",
      graderId: "grad-001",
      operatorId: "acct-ops-01",
      action: "CHECK_OUT",
      timestamp: new Date().toISOString(),
      note: "Issued to lead grader for opening session.",
    },
  ],
  locks: {
    "camp-y68-t2::BAG-Y68-D1-01": {
      bagId: "BAG-Y68-D1-01",
      campaignId: "camp-y68-t2",
      graderId: "grad-001",
      graderName: "Anuwat Chairat",
      operatorId: "acct-ops-01",
      operatorName: "Somchai Prasert",
      at: new Date().toISOString(),
    },
  },
};

const keyOf = (campaignId: string, bagId: string) => `${campaignId}::${bagId}`;

const bagHandoverSlice = createSlice({
  name: "bagHandover",
  initialState,
  reducers: {
    bagCheckedOut: (
      state,
      action: PayloadAction<{
        campaignId: string;
        bagId: string;
        graderId: string;
        graderName: string;
        operatorId: string;
        operatorName: string;
        note?: string;
        timestamp?: string;
      }>
    ) => {
      const { campaignId, bagId } = action.payload;
      const key = keyOf(campaignId, bagId);
      if (state.locks[key]) return;
      const timestamp = action.payload.timestamp ?? new Date().toISOString();
      state.locks[key] = {
        bagId,
        campaignId,
        graderId: action.payload.graderId,
        graderName: action.payload.graderName,
        operatorId: action.payload.operatorId,
        operatorName: action.payload.operatorName,
        at: timestamp,
      };
      state.logs.unshift({
        id: nanoid(8),
        campaignId,
        bagId,
        graderId: action.payload.graderId,
        operatorId: action.payload.operatorId,
        action: "CHECK_OUT",
        note: action.payload.note,
        timestamp,
      });
    },
    bagCheckedIn: (
      state,
      action: PayloadAction<{
        campaignId: string;
        bagId: string;
        operatorId: string;
        operatorName: string;
        note?: string;
        timestamp?: string;
      }>
    ) => {
      const { campaignId, bagId } = action.payload;
      const key = keyOf(campaignId, bagId);
      const lock = state.locks[key];
      if (!lock) return;
      const timestamp = action.payload.timestamp ?? new Date().toISOString();
      delete state.locks[key];
      state.logs.unshift({
        id: nanoid(8),
        campaignId,
        bagId,
        graderId: lock.graderId,
        operatorId: action.payload.operatorId,
        action: "CHECK_IN",
        note: action.payload.note,
        timestamp,
      });
    },
  },
});

export const { bagCheckedIn, bagCheckedOut } = bagHandoverSlice.actions;
export { bagHandoverSlice };

export const selectBagLocksForCampaign =
  (campaignId: string | null) =>
  (state: { bagHandover: BagHandoverState }): BagLock[] => {
    if (!campaignId) return [];
    return Object.values(state.bagHandover.locks).filter((lock) => lock.campaignId === campaignId);
  };

export const selectBagLock =
  (campaignId: string | null, bagId: string | null) =>
  (state: { bagHandover: BagHandoverState }): BagLock | null => {
    if (!campaignId || !bagId) return null;
    return state.bagHandover.locks[keyOf(campaignId, bagId)] ?? null;
  };

export const selectBagLogsForCampaign =
  (campaignId: string | null) =>
  (state: { bagHandover: BagHandoverState }): BagHandoverLog[] => {
    if (!campaignId) return [];
    return state.bagHandover.logs.filter((log) => log.campaignId === campaignId);
  };
