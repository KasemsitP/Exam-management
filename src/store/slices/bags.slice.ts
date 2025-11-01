import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";
import { campaignRemoved } from "./examData.slice";

export type BagStatus = "draft" | "ready" | "incomplete";

export interface ExamBag {
  id: string;
  campaignId: string;
  sessionId: string;
  sessionLabel: string;
  subjectCode?: string;
  subjectName?: string;
  capacity: number;
  scanned: string[];
  status: BagStatus;
  createdAt: string;
}

interface BagsState {
  defaultCapacity: number;
  byCampaign: Record<string, ExamBag[]>;
}

const initialState: BagsState = {
  defaultCapacity: 30,
  byCampaign: {
    "camp-y68-t2": [
      {
        id: "BAG-Y68-D1-01",
        campaignId: "camp-y68-t2",
        sessionId: "sess-y68-t2-d1",
        sessionLabel: "Y68-T2-D1 - Main Site",
        subjectCode: "LAW101",
        subjectName: "Civil Law I",
        capacity: 30,
        scanned: ["LAW101-0001", "LAW101-0002", "LAW101-0003", "LAW101-0004"],
        status: "draft",
        createdAt: new Date().toISOString(),
      },
      {
        id: "BAG-Y68-D1-02",
        campaignId: "camp-y68-t2",
        sessionId: "sess-y68-t2-d1",
        sessionLabel: "Y68-T2-D1 - Main Site",
        subjectCode: "LAW215",
        subjectName: "Civil Procedure",
        capacity: 30,
        scanned: ["LAW215-0121", "LAW215-0122", "LAW215-0123"],
        status: "draft",
        createdAt: new Date().toISOString(),
      },
      {
        id: "BAG-Y68-D2-01",
        campaignId: "camp-y68-t2",
        sessionId: "sess-y68-t2-d2",
        sessionLabel: "Y68-T2-D2 - Main Site",
        subjectCode: "LAW205",
        subjectName: "Criminal Procedure",
        capacity: 30,
        scanned: ["LAW205-0001", "LAW205-0002", "LAW205-0003", "LAW205-0004"],
        status: "draft",
        createdAt: new Date().toISOString(),
      },
    ],
  },
};

const findBag = (state: BagsState, campaignId: string, bagId: string) => {
  return state.byCampaign[campaignId]?.find((bag) => bag.id === bagId) ?? null;
};

const bagsSlice = createSlice({
  name: "bags",
  initialState,
  reducers: {
    bagCreated: {
      prepare: (
        payload: {
          campaignId: string;
          sessionId: string;
          sessionLabel: string;
          subjectCode?: string;
          subjectName?: string;
          capacity?: number;
          bagLabel?: string;
        }
      ) => {
        const bagLabel =
          payload.bagLabel ??
          `BAG-${payload.sessionLabel.replace(/\s+/g, "-").toUpperCase()}-${nanoid(3).toUpperCase()}`;
        return {
          payload: {
            id: bagLabel,
            campaignId: payload.campaignId,
            sessionId: payload.sessionId,
            sessionLabel: payload.sessionLabel,
            subjectCode: payload.subjectCode,
            subjectName: payload.subjectName,
            capacity: payload.capacity ?? initialState.defaultCapacity,
          },
        };
      },
      reducer: (state, action: PayloadAction<Omit<ExamBag, "status" | "scanned" | "createdAt">>) => {
        const campaignBags = state.byCampaign[action.payload.campaignId] ?? [];
        const exists = campaignBags.some((bag) => bag.id === action.payload.id);
        if (exists) {
          return;
        }
        state.byCampaign[action.payload.campaignId] = [
          ...campaignBags,
          {
            ...action.payload,
            status: "draft",
            scanned: [],
            createdAt: new Date().toISOString(),
          },
        ];
      },
    },
    bagRemoved: (state, action: PayloadAction<{ campaignId: string; bagId: string }>) => {
      const campaignBags = state.byCampaign[action.payload.campaignId];
      if (!campaignBags) return;
      state.byCampaign[action.payload.campaignId] = campaignBags.filter(
        (bag) => bag.id !== action.payload.bagId
      );
    },
    bagScanAdded: (
      state,
      action: PayloadAction<{ campaignId: string; bagId: string; code: string }>
    ) => {
      const target = findBag(state, action.payload.campaignId, action.payload.bagId);
      if (!target) return;
      const code = action.payload.code.trim();
      if (!code || target.scanned.includes(code) || target.scanned.length >= target.capacity) return;
      target.scanned = [...target.scanned, code];
    },
    bagScanRemoved: (
      state,
      action: PayloadAction<{ campaignId: string; bagId: string; code: string }>
    ) => {
      const target = findBag(state, action.payload.campaignId, action.payload.bagId);
      if (!target) return;
      target.scanned = target.scanned.filter((item) => item !== action.payload.code);
      if (target.scanned.length < target.capacity && target.status === "ready") {
        target.status = "incomplete";
      }
    },
    bagScansCleared: (state, action: PayloadAction<{ campaignId: string; bagId: string }>) => {
      const target = findBag(state, action.payload.campaignId, action.payload.bagId);
      if (!target) return;
      target.scanned = [];
      target.status = "draft";
    },
    bagFinalized: (
      state,
      action: PayloadAction<{ campaignId: string; bagId: string; allowIncomplete?: boolean }>
    ) => {
      const target = findBag(state, action.payload.campaignId, action.payload.bagId);
      if (!target) return;
      const isComplete = target.scanned.length >= target.capacity;
      if (!isComplete && !action.payload.allowIncomplete) {
        return;
      }
      target.status = isComplete ? "ready" : "incomplete";
    },
    bagCapacityUpdated: (
      state,
      action: PayloadAction<{ campaignId: string; bagId: string; capacity: number }>
    ) => {
      const target = findBag(state, action.payload.campaignId, action.payload.bagId);
      if (!target) return;
      target.capacity = Math.max(1, action.payload.capacity);
      if (target.scanned.length > target.capacity) {
        target.scanned = target.scanned.slice(0, target.capacity);
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(campaignRemoved, (state, action) => {
      delete state.byCampaign[action.payload];
    });
  },
});

export const {
  bagCapacityUpdated,
  bagCreated,
  bagFinalized,
  bagRemoved,
  bagScanAdded,
  bagScanRemoved,
  bagScansCleared,
} = bagsSlice.actions;

export { bagsSlice };

export const selectBagsForCampaign =
  (campaignId: string | null) =>
  (state: { bags: BagsState }): ExamBag[] =>
    campaignId ? state.bags.byCampaign[campaignId] ?? [] : [];

export const selectBagById =
  (campaignId: string, bagId: string) =>
  (state: { bags: BagsState }) =>
    findBag(state.bags, campaignId, bagId);

export const selectBagStatsForCampaign =
  (campaignId: string | null) =>
  (state: { bags: BagsState }) => {
    if (!campaignId) {
      return { total: 0, completed: 0, inProgress: 0 };
    }
    const list = state.bags.byCampaign[campaignId] ?? [];
    const total = list.length;
    const completed = list.filter((bag) => bag.status === "ready").length;
    const inProgress = list.filter((bag) => bag.status !== "ready").length;
    return { total, completed, inProgress };
  };

export const selectDefaultBagCapacity = (state: { bags: BagsState }) => state.bags.defaultCapacity;
