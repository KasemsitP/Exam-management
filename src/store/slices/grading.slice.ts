import { createAsyncThunk, createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";

export type GradingStatus = "queued" | "grading" | "graded";

export interface GradingQueueItem {
  id: string;
  bagId: string;
  bookletSerial: string;
  candidateName: string;
  status: GradingStatus;
  score?: number;
  graderId?: string;
}

export interface GradingMetrics {
  gradedCount: number;
  queuedCount: number;
  averageScore: number;
  turnaroundMinutes: number;
}

interface GradingState {
  queue: GradingQueueItem[];
  activeEntryId: string | null;
  metrics: GradingMetrics;
  claiming: boolean;
  submitting: boolean;
}

const initialQueue: GradingQueueItem[] = [
  {
    id: "grade-001",
    bagId: "BAG-Y68-D1-01",
    bookletSerial: "LAW101-0002",
    candidateName: "Busaba L.",
    status: "queued",
  },
  {
    id: "grade-002",
    bagId: "BAG-Y68-D1-01",
    bookletSerial: "LAW101-0003",
    candidateName: "Ekachai T.",
    status: "queued",
  },
  {
    id: "grade-003",
    bagId: "BAG-Y68-D1-01",
    bookletSerial: "LAW101-0004",
    candidateName: "Fahkrada U.",
    status: "queued",
  },
];

const initialState: GradingState = {
  queue: initialQueue,
  activeEntryId: null,
  metrics: {
    gradedCount: 12,
    queuedCount: initialQueue.length,
    averageScore: 72,
    turnaroundMinutes: 18,
  },
  claiming: false,
  submitting: false,
};

export const submitGradingScore = createAsyncThunk<
  { entryId: string; score: number; graderId: string },
  { entryId: string; score: number; graderId: string }
>("grading/submitScore", async ({ entryId, score, graderId }) => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return { entryId, score, graderId };
});

const gradingSlice = createSlice({
  name: "grading",
  initialState,
  reducers: {
    gradingQueueEnqueued: {
      prepare: (payload: Omit<GradingQueueItem, "id" | "status">) => ({
        payload: {
          ...payload,
          id: nanoid(8),
          status: "queued" as GradingStatus,
        },
      }),
      reducer: (state, action: PayloadAction<GradingQueueItem>) => {
        state.queue.push(action.payload);
        state.metrics.queuedCount = state.queue.filter((item) => item.status === "queued").length;
      },
    },
    gradingSlotClaimed: (state, action: PayloadAction<{ entryId?: string }>) => {
      const targetId = action.payload.entryId;
      const entry =
        state.queue.find((item) => item.id === targetId && item.status === "queued") ??
        state.queue.find((item) => item.status === "queued");
      if (!entry) return;
      entry.status = "grading";
      state.activeEntryId = entry.id;
    },
    gradingSlotReleased: (state) => {
      if (!state.activeEntryId) return;
      const entry = state.queue.find((item) => item.id === state.activeEntryId);
      if (entry && entry.status === "grading") {
        entry.status = "queued";
      }
      state.activeEntryId = null;
    },
    gradingScoreCleared: (state) => {
      if (!state.activeEntryId) return;
      const entry = state.queue.find((item) => item.id === state.activeEntryId);
      if (entry) {
        entry.score = undefined;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitGradingScore.pending, (state) => {
        state.submitting = true;
      })
      .addCase(submitGradingScore.fulfilled, (state, action) => {
        state.submitting = false;
        const entry = state.queue.find((item) => item.id === action.payload.entryId);
        if (!entry) return;
        entry.status = "graded";
        entry.score = action.payload.score;
        entry.graderId = action.payload.graderId;
        if (state.activeEntryId === entry.id) {
          state.activeEntryId = null;
        }
        const graded = state.queue.filter((item) => item.status === "graded");
        const average =
          graded.reduce((total, item) => total + (item.score ?? 0), 0) /
          (graded.length || 1);
        state.metrics.gradedCount = graded.length;
        state.metrics.averageScore = Math.round(average * 10) / 10;
        state.metrics.queuedCount = state.queue.filter((item) => item.status !== "graded").length;
        state.metrics.turnaroundMinutes = Math.max(8, 20 - graded.length);
      })
      .addCase(submitGradingScore.rejected, (state) => {
        state.submitting = false;
      });
  },
});

export const {
  gradingQueueEnqueued,
  gradingScoreCleared,
  gradingSlotClaimed,
  gradingSlotReleased,
} = gradingSlice.actions;

export { gradingSlice };

export const selectGradingQueue = (state: { grading: GradingState }) => state.grading.queue;
export const selectActiveGradingEntry = (state: { grading: GradingState }) =>
  state.grading.queue.find((item) => item.id === state.grading.activeEntryId) ?? null;
export const selectGradingMetrics = (state: { grading: GradingState }) => state.grading.metrics;
export const selectGradingSubmissionState = (state: { grading: GradingState }) => ({
  submitting: state.grading.submitting,
  activeEntryId: state.grading.activeEntryId,
});
