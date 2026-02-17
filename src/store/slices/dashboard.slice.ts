// dashboard.slice.ts
import { RootState } from "../index";
import axios from "axios";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

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
  encrypted_users: number | string; // API อาจส่ง string
  pending_users: number | string; // API อาจส่ง string
  encryption_status: "NOT_ENCRYPTED" | "PARTIAL" | "ENCRYPTED_ALL";
}

export interface SubjectLite {
  subject_id: number;
  subject_code: string;
  subject_name: string;
}

export interface SubjectQuestionRow {
  campaign_id: number;
  // ✅ เพิ่มจาก backend: session + เวลา
  session_id: number;
  exam_date: string; // ISO
  start_at: string; // ISO
  end_at: string; // ISO

  subject_id: number;
  subject_code: string;
  subject_name: string;

  subject_question_id: number;
  question_no: number;
  question_label: string;
  max_score: number | string; // API ส่ง "5.00"
}

// ✅ shape ของ “sessions” ที่ได้จาก backend
export type SessionRow = {
  session_id: number;
  session_code: string;
  exam_date: string; // ISO
  start_at: string; // ISO
  end_at: string; // ISO
};

export interface KeyStatus {
  key1_status: boolean;
  key2_status: boolean;
}

/* ---------- Grouped model (ใช้ทำ UI ง่าย) ---------- */

export interface SubjectQuestionsGrouped {
  subject_id: number;
  subject_code: string;
  subject_name: string;

  // ✅ optional: เอา session มาแปะไว้ด้วยได้ ถ้าคุณอยากใช้ใน UI ต่อ
  // session_id?: number;
  // session_code?: string;
  // exam_date?: string;
  // start_at?: string;
  // end_at?: string;

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
  sessions: SessionRow[]; // ✅ เปลี่ยนจาก sessionDates เป็น sessions ให้ตรง backend
  keyStatus: KeyStatus;
}

/* ---------------- Helpers ---------------- */

function toNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function groupSubjectsQuestions(
  rows: SubjectQuestionRow[]
): Record<number, SubjectQuestionsGrouped> {
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

/* ---------------- Thunk ---------------- */

export const fetchDashboardStatus = createAsyncThunk<
  {
    importStatus: ImportStatus[];
    encryptedStatus: Array<
      Omit<EncryptedStatus, "encrypted_users" | "pending_users"> & {
        encrypted_users: number;
        pending_users: number;
      }
    >;
    subjects: SubjectLite[];
    subjectsQuestions: SubjectQuestionRow[];
    subjectQuestionsGrouped: Record<number, SubjectQuestionsGrouped>;
    sessions: SessionRow[]; // ✅ ใช้ sessions ให้ตรงกัน
    keyStatus: KeyStatus | null;
  },
  number,
  { rejectValue: string }
>("dashboard/fetchStatus", async (campaignId, { rejectWithValue }) => {
  try {
    const res = await axios.get<DashboardApiResponse>(
      `/api/keys/dashboard/${campaignId}`
    );

    const encryptedStatusNormalized = (res.data.encryptedStatus ?? []).map(
      (x) => ({
        ...x,
        encrypted_users: toNumber(x.encrypted_users, 0),
        pending_users: toNumber(x.pending_users, 0),
      })
    );

    const subjectQuestionsGrouped = groupSubjectsQuestions(
      res.data.subjectsQuestions ?? []
    );

    return {
      importStatus: res.data.importStatus ?? [],
      encryptedStatus: encryptedStatusNormalized,
      subjects: res.data.subjects ?? [],
      subjectsQuestions: res.data.subjectsQuestions ?? [],
      subjectQuestionsGrouped,
      sessions: res.data.sessions ?? [], // ✅ จาก backend
      keyStatus: res.data.keyStatus ?? null,
    };
  } catch (e) {
    return rejectWithValue("โหลดสถานะ dashboard ไม่สำเร็จ");
  }
});

/* ---------------- Slice ---------------- */

export interface DashboardState {
  status: "idle" | "loading" | "succeeded" | "failed";
  importStatus: ImportStatus[];
  encryptedStatus: Array<
    Omit<EncryptedStatus, "encrypted_users" | "pending_users"> & {
      encrypted_users: number;
      pending_users: number;
    }
  >;
  subjects: SubjectLite[];
  subjectsQuestions: SubjectQuestionRow[];
  subjectQuestionsGrouped: Record<number, SubjectQuestionsGrouped>;
  sessions: SessionRow[]; // ✅ ใช้ sessions
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
  sessions: [],
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
      state.sessions = [];
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
        state.sessions = action.payload.sessions;
        state.keyStatus = action.payload.keyStatus;
       //console.log("Dashboard data loaded:", state.keyStatus)
      })
      .addCase(fetchDashboardStatus.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "โหลดข้อมูลไม่สำเร็จ";
      });
  },
});

export const { clearDashboard } = dashboardSlice.actions;
export { dashboardSlice };

/* ---------------- Selectors ---------------- */

export const selectDashboardStatus = (state: RootState) => state.dashboard.status;
export const selectDashboardError = (state: RootState) => state.dashboard.error;

export const selectImportStatus = (state: RootState) => state.dashboard.importStatus;
export const selectEncryptedStatus = (state: RootState) => state.dashboard.encryptedStatus;

export const selectSubjects = (state: RootState) => state.dashboard.subjects;

// ✅ เอาไป map ทำ UI แบบ “หัวข้อสอบในแต่ละวิชา”
export const selectSubjectQuestionsGrouped = (state: RootState) =>
  state.dashboard.subjectQuestionsGrouped;

// ✅ ชื่อใหม่ที่ตรง backend
export const selectSessions = (state: RootState) => state.dashboard.sessions;

// ✅ alias กันโค้ดเก่าพัง (ถ้าคุณยังเรียก selectSessionDates อยู่)
export const selectSession = (state: RootState) => state.dashboard.sessions;

export const selectKeyStatus = (state: RootState) => state.dashboard.keyStatus;
