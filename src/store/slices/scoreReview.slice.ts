import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface QuestionScore {
  questionNo: number;
  graderA: string;
  graderB: string;
  scoreA: number;
  scoreB: number;
  average: number;
}

export interface ScriptScore {
  campaignId: string;
  bagId: string;
  examCode: string;
  questions: QuestionScore[];
}

interface ScoreReviewState {
  byBag: Record<string, ScriptScore[]>;
}

const buildMockData = (bagId: string, from: number, to: number): ScriptScore[] => {
  const scripts: ScriptScore[] = [];
  for (let exam = from; exam <= to; exam += 1) {
    const questions: QuestionScore[] = [];
    for (let q = 1; q <= 10; q += 1) {
      const graderA = `TCH${(q * 3).toString().padStart(3, "0")}`;
      const graderB = `TCH${(q * 3 + 1).toString().padStart(3, "0")}`;
      const scoreA = Number((Math.random() * 5).toFixed(2));
      const scoreB = Number((Math.random() * 5).toFixed(2));
      const average = Number(((scoreA + scoreB) / 2).toFixed(2));
      questions.push({
        questionNo: q,
        graderA,
        graderB,
        scoreA,
        scoreB,
        average,
      });
    }
    scripts.push({
      campaignId: "camp-y68-t2",
      bagId,
      examCode: `${exam}`,
      questions,
    });
  }
  return scripts;
};

const initialState: ScoreReviewState = {
  byBag: {
    "BAG-Y68-D1-01": buildMockData("BAG-Y68-D1-01", 41001, 41030),
    "BAG-Y68-D1-02": buildMockData("BAG-Y68-D1-02", 42001, 42030),
    "BAG-Y68-D2-01": buildMockData("BAG-Y68-D2-01", 43001, 43030),
  },
};

const scoreReviewSlice = createSlice({
  name: "scoreReview",
  initialState,
  reducers: {
    scriptScoresLoaded: (
      state,
      action: PayloadAction<{ bagId: string; scores: ScriptScore[] }>
    ) => {
      state.byBag[action.payload.bagId] = action.payload.scores;
    },
  },
});

export const { scriptScoresLoaded } = scoreReviewSlice.actions;

export { scoreReviewSlice };

export const selectScriptsByBag =
  (bagId: string | null) =>
  (state: { scoreReview: ScoreReviewState }): ScriptScore[] =>
    bagId ? state.scoreReview.byBag[bagId] ?? [] : [];
