import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";

export interface Subject {
  id: string;
  code: string;
  name: string;
  owner: string;
  sessionId: string;
  candidateCount: number;
  updatedAt: string;
}

interface SubjectsState {
  list: Subject[];
  importStatus: "idle" | "importing" | "success" | "error";
  importError?: string;
}

const initialState: SubjectsState = {
  list: [
    {
      id: "sub-law101-summary",
      code: "LAW101",
      name: "Civil Law I",
      owner: "Exam Committee",
      sessionId: "sess-y68-t2-d1",
      candidateCount: 420,
      updatedAt: "2025-04-20T09:00:00+07:00",
    },
    {
      id: "sub-law215-summary",
      code: "LAW215",
      name: "Civil Procedure",
      owner: "Exam Committee",
      sessionId: "sess-y68-t2-d1",
      candidateCount: 420,
      updatedAt: "2025-04-20T09:15:00+07:00",
    },
    {
      id: "sub-law205-summary",
      code: "LAW205",
      name: "Criminal Procedure",
      owner: "Exam Committee",
      sessionId: "sess-y68-t2-d2",
      candidateCount: 415,
      updatedAt: "2025-04-21T09:00:00+07:00",
    },
    {
      id: "sub-law320-summary",
      code: "LAW320",
      name: "International Law",
      owner: "Exam Committee",
      sessionId: "sess-y68-t2-d2",
      candidateCount: 410,
      updatedAt: "2025-04-21T09:15:00+07:00",
    },
  ],
  importStatus: "idle",
};

const subjectsSlice = createSlice({
  name: "subjects",
  initialState,
  reducers: {
    subjectAdded: {
      prepare: (payload: Omit<Subject, "id" | "updatedAt"> & { updatedAt?: string }) => ({
        payload: {
          ...payload,
          id: `sub-${nanoid(6)}`,
          updatedAt: payload.updatedAt ?? new Date().toISOString(),
        },
      }),
      reducer: (state, action: PayloadAction<Subject>) => {
        state.list.unshift(action.payload);
      },
    },
    subjectUpdated: (state, action: PayloadAction<Subject>) => {
      const index = state.list.findIndex((subject) => subject.id === action.payload.id);
      if (index >= 0) {
        state.list[index] = action.payload;
      }
    },
    subjectRemoved: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter((subject) => subject.id !== action.payload);
    },
    subjectsImported: (state, action: PayloadAction<Subject[]>) => {
      state.list = [...action.payload, ...state.list];
      state.importStatus = "success";
      state.importError = undefined;
    },
    subjectsImportStarted: (state) => {
      state.importStatus = "importing";
      state.importError = undefined;
    },
    subjectsImportFailed: (state, action: PayloadAction<string>) => {
      state.importStatus = "error";
      state.importError = action.payload;
    },
    subjectsImportReset: (state) => {
      state.importStatus = "idle";
      state.importError = undefined;
    },
  },
});

export const {
  subjectAdded,
  subjectRemoved,
  subjectsImported,
  subjectsImportFailed,
  subjectsImportReset,
  subjectsImportStarted,
  subjectUpdated,
} = subjectsSlice.actions;

export { subjectsSlice };

export const selectSubjects = (state: { subjects: SubjectsState }) => state.subjects.list;
export const selectSubjectsBySession =
  (sessionId: string | null) => (state: { subjects: SubjectsState }) =>
    sessionId ? state.subjects.list.filter((subject) => subject.sessionId === sessionId) : [];
export const selectSubjectsImportStatus = (state: { subjects: SubjectsState }) =>
  state.subjects.importStatus;
export const selectSubjectsImportError = (state: { subjects: SubjectsState }) =>
  state.subjects.importError;
