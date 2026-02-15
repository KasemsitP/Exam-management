// dashboard.slice.ts
import { RootState } from "../index";
import axios from "axios";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

/* ---------------- API Types ---------------- */

export interface ImportStatus {
  campaign_id: number;
  session_id: number;
  session_code: string;
  subject_name: string;
  users_in_campaign: number;
  users_in_session: number;
  import_status: "NOT_IMPORTED" | "PARTIAL" | "IMPORTED";
}

export interface EncryptedStatus {
  campaign_id: number;
  session_id: number;
  session_code: string;
  total_users_in_session: number;
  encrypted_users: number | string; // API ส่ง string มา
  pending_users: number | string;   // API ส่ง string มา
  encryption_status: "NOT_ENCRYPTED" | "PARTIAL" | "ENCRYPTED_ALL";
}

export interface SubjectLite {
  subject_id: number;
  subject_code: string;
  subject_name: string;
}

export interface SubjectQuestionRow {
  campaign_id: number;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  subject_question_id: number;
  question_no: number;
  question_label: string;
  max_score: number | string; // API ส่ง "5.00"
}

export interface SessionDateRow {
  exam_date: string; // ISO
  start_at: string;  // ISO
  end_at: string;    // ISO
}

export interface KeyStatus {
  key1_status: boolean;
  key2_status: boolean;
}

/* ---------- Grouped model (ใช้ทำ UI ง่าย) ---------- */

export interface SubjectQuestionsGrouped {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  questions: Array<{
    id: number;
    questionNo: number;
    label: string;
    maxScore: number;
  }>;
}

/* ---------------- API Response ---------------- */

export interface DashboardApiResponse {
  importStatus: ImportStatus[];
  encryptedStatus: EncryptedStatus[];
  subjects: SubjectLite[];
  subjectsQuestions: SubjectQuestionRow[];
  sessionDates: SessionDateRow[];
  keyStatus: KeyStatus;
}

function toNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function groupSubjectsQuestions(rows: SubjectQuestionRow[]): Record<number, SubjectQuestionsGrouped> {
  const map: Record<number, SubjectQuestionsGrouped> = {};

  for (const r of rows ?? []) {
    if (!map[r.subject_id]) {
      map[r.subject_id] = {
        subject_id: r.subject_id,
        subject_code: r.subject_code,
        subject_name: r.subject_name,
        questions: [],
      };
    }

    map[r.subject_id].questions.push({
      id: r.subject_question_id,
      questionNo: r.question_no,
      label: r.question_label,
      maxScore: toNumber(r.max_score, 0),
    });
  }

  // sort ข้อให้เรียง
  Object.values(map).forEach((s) => {
    s.questions.sort((a, b) => a.questionNo - b.questionNo);
  });

  return map;
}
export const fetchDashboardStatus = createAsyncThunk<
  {
    importStatus: ImportStatus[];
    encryptedStatus: Array<Omit<EncryptedStatus, "encrypted_users" | "pending_users"> & {
      encrypted_users: number;
      pending_users: number;
    }>;
    subjects: SubjectLite[];
    subjectsQuestions: SubjectQuestionRow[];
    subjectQuestionsGrouped: Record<number, SubjectQuestionsGrouped>;
    sessionDates: SessionDateRow[];
    keyStatus: KeyStatus | null;
  },
  number,
  { rejectValue: string }
>("dashboard/fetchStatus", async (campaignId, { rejectWithValue }) => {
  try {
    const res = await axios.get<DashboardApiResponse>(`/api/keys/dashboard/${campaignId}`);

    // normalize encryptedStatus number/string -> number
    const encryptedStatusNormalized = (res.data.encryptedStatus ?? []).map((x) => ({
      ...x,
      encrypted_users: toNumber(x.encrypted_users, 0),
      pending_users: toNumber(x.pending_users, 0),
    }));

    const subjectQuestionsGrouped = groupSubjectsQuestions(res.data.subjectsQuestions ?? []);

    return {
      importStatus: res.data.importStatus ?? [],
      encryptedStatus: encryptedStatusNormalized,
      subjects: res.data.subjects ?? [],
      subjectsQuestions: res.data.subjectsQuestions ?? [],
      subjectQuestionsGrouped,
      sessionDates: res.data.sessionDates ?? [],
      keyStatus: res.data.keyStatus ?? null,
    };
  } catch (e) {
    return rejectWithValue("โหลดสถานะ dashboard ไม่สำเร็จ");
  }
});

export interface DashboardState {
  status: "idle" | "loading" | "succeeded" | "failed";
  importStatus: ImportStatus[];
  encryptedStatus: Array<Omit<EncryptedStatus, "encrypted_users" | "pending_users"> & {
    encrypted_users: number;
    pending_users: number;
  }>;
  subjects: SubjectLite[];
  subjectsQuestions: SubjectQuestionRow[];
  subjectQuestionsGrouped: Record<number, SubjectQuestionsGrouped>;
  sessionDates: SessionDateRow[];
  keyStatus: KeyStatus | null;
  error: string | null;
}

const initialState: DashboardState = {
  status: "idle",
  importStatus: [],
  encryptedStatus: [],
  subjects: [],
  subjectsQuestions: [],
  subjectQuestionsGrouped: {},
  sessionDates: [],
  keyStatus: null,
  error: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboard: (state) => {
      state.status = "idle";
      state.importStatus = [];
      state.encryptedStatus = [];
      state.subjects = [];
      state.subjectsQuestions = [];
      state.subjectQuestionsGrouped = {};
      state.sessionDates = [];
      state.keyStatus = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStatus.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDashboardStatus.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.importStatus = action.payload.importStatus;
        state.encryptedStatus = action.payload.encryptedStatus;
        state.subjects = action.payload.subjects;
        state.subjectsQuestions = action.payload.subjectsQuestions;
        state.subjectQuestionsGrouped = action.payload.subjectQuestionsGrouped;
        state.sessionDates = action.payload.sessionDates;
        state.keyStatus = action.payload.keyStatus;
      })
      .addCase(fetchDashboardStatus.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "โหลดข้อมูลไม่สำเร็จ";
      });
  },
});

export const { clearDashboard } = dashboardSlice.actions;
export {dashboardSlice}

/* ---------------- Selectors ---------------- */

export const selectDashboardStatus = (state: RootState) => state.dashboard.status;
export const selectDashboardError = (state: RootState) => state.dashboard.error;

export const selectImportStatus = (state: RootState) => state.dashboard.importStatus;
export const selectEncryptedStatus = (state: RootState) => state.dashboard.encryptedStatus;

export const selectSubjects = (state: RootState) => state.dashboard.subjects;

// ✅ เอาไป map ทำ UI แบบ “หัวข้อสอบในแต่ละวิชา”
export const selectSubjectQuestionsGrouped = (state: RootState) =>
  state.dashboard.subjectQuestionsGrouped;

export const selectSessionDates = (state: RootState) => state.dashboard.sessionDates;
export const selectKeyStatus = (state: RootState) => state.dashboard.keyStatus;

