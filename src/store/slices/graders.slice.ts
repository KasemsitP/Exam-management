import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";

export interface Grader {
  id: string;
  campaignId: string;
  code: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  subjects: {
    sessionId: string;
    sessionLabel: string;
    subjectId: string;
    subjectName: string;
    questionRange: string;
  }[];
  notes?: string;
}

interface GradersState {
  byCampaign: Record<string, Grader[]>;
}

const initialState: GradersState = {
  byCampaign: {
    "camp-y68-t2": [
      {
        id: "grad-001",
        campaignId: "camp-y68-t2",
        code: "TCH001",
        firstName: "Anuwat",
        lastName: "Chairat",
        username: "grader01",
        password: "pass1234",
        subjects: [
          {
            sessionId: "sess-y68-t2-d1",
            sessionLabel: "Y68-T2-D1 - Main Site",
            subjectId: "sub-law101-d1",
            subjectName: "Civil Law I",
            questionRange: "1-120",
          },
        ],
      },
      {
        id: "grad-002",
        campaignId: "camp-y68-t2",
        code: "TCH002",
        firstName: "Benjarong",
        lastName: "Kiatkarn",
        username: "grader02",
        password: "pass1234",
        subjects: [
          {
            sessionId: "sess-y68-t2-d1",
            sessionLabel: "Y68-T2-D1 - Main Site",
            subjectId: "sub-law215-d1",
            subjectName: "Civil Procedure",
            questionRange: "121-240",
          },
        ],
      },
      {
        id: "grad-003",
        campaignId: "camp-y68-t2",
        code: "TCH003",
        firstName: "Chalerm",
        lastName: "Sutthipong",
        username: "grader03",
        password: "pass1234",
        subjects: [
          {
            sessionId: "sess-y68-t2-d2",
            sessionLabel: "Y68-T2-D2 - Main Site",
            subjectId: "sub-law205-d2",
            subjectName: "Criminal Procedure",
            questionRange: "1-120",
          },
          {
            sessionId: "sess-y68-t2-d2",
            sessionLabel: "Y68-T2-D2 - Main Site",
            subjectId: "sub-law320-d2",
            subjectName: "International Law",
            questionRange: "121-220",
          },
        ],
        notes: "Handles afternoon dispute resolution queue.",
      },
    ],
  },
};

const gradersSlice = createSlice({
  name: "graders",
  initialState,
  reducers: {
    graderAdded: (state, action: PayloadAction<Omit<Grader, "id">>) => {
      const grader: Grader = { ...action.payload, id: nanoid(8) };
      const list = state.byCampaign[grader.campaignId] ?? [];
      list.push(grader);
      state.byCampaign[grader.campaignId] = list;
    },
    graderUpdated: (state, action: PayloadAction<Grader>) => {
      const list = state.byCampaign[action.payload.campaignId];
      if (!list) return;
      const index = list.findIndex((grader) => grader.id === action.payload.id);
      if (index >= 0) list[index] = action.payload;
    },
    graderRemoved: (
      state,
      action: PayloadAction<{ campaignId: string; graderId: string }>
    ) => {
      const list = state.byCampaign[action.payload.campaignId];
      if (!list) return;
      state.byCampaign[action.payload.campaignId] = list.filter(
        (grader) => grader.id !== action.payload.graderId
      );
    },
  },
});

export const { graderAdded, graderRemoved, graderUpdated } = gradersSlice.actions;
export { gradersSlice };

export const selectGradersForCampaign =
  (campaignId: string | null) =>
  (state: { graders: GradersState }): Grader[] =>
    campaignId ? state.graders.byCampaign[campaignId] ?? [] : [];
