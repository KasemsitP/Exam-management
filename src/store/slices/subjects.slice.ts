// src/store/slices/subjects.slice.ts
import { createSlice, nanoid, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../index";
import axios from "axios";

/* ------------------------------ Types ------------------------------ */

export interface SubjectQuestion {
  id: string;          // key ใน React
  questionNo: number;  // เลขข้อ 1,2,3,...
  label: string;       // ชื่อหัวข้อ เช่น "กฎหมายรัฐธรรมนูญ"
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  questions: SubjectQuestion[];
}

interface SubjectsState {
  items: Subject[];
  sessionQuestions: Record<number, SubjectQuestion[]>;
  selectedId: number | null;
  nextId: number;
  loading: boolean;
  error: string | null;
}
/* --------------------------- Initial State ------------------------- */

const initialState: SubjectsState = {
  items: [],
  selectedId: null,
  sessionQuestions: {},
  nextId: 1,
  loading: false,
  error: null,
};

/* --------------------------- Thunks -------------------------------- */

export const fetchSubjectsThunk = createAsyncThunk<
  Subject[],
  void,
  { rejectValue: string }
>("subjects/fetch", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get<Subject[]>("/api/subjects");
    //console.log(response.data)
    return response.data;
  } catch (error: unknown) {
    return rejectWithValue("Failed to fetch subjects");
  }
});

export const fetchSubjectsQuestionThunk = createAsyncThunk<
  any[],
  { session_id: number, camapign_id: number },
  { rejectValue: string }
>("subjects/fetchSubjectsQuestionThunk", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.get<Subject[]>(`/api/subjects/${payload.session_id}/${payload.camapign_id}`);
    //console.log(response.data)
    return response.data;
  } catch (error: unknown) {
    return rejectWithValue("Failed to fetch subjects");
  }
});




// สร้างวิชาใหม่ + (optional) questions ไปพร้อมกัน
export const createSubjectThunk = createAsyncThunk<
  Subject,
  { code: string; name: string; questions?: { questionNo: number; label: string }[] },
  { rejectValue: string }
>("subjects/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.post<Subject>("/api/subjects", payload);
    return response.data;
  } catch (error: unknown) {
    return rejectWithValue("Failed to create subject");
  }
});

// แก้ไขวิชา (code + name) — ยังไม่ยุ่งกับ questions
export const updateSubjectThunk = createAsyncThunk<
  Subject,
  { id: number; code: string; name: string },
  { rejectValue: string }
>("subjects/update", async ({ id, code, name }, { rejectWithValue }) => {
  try {
    const response = await axios.put<Subject>(`/api/subjects/${id}`, {
      code,
      name,
    });
    return response.data;
  } catch (error: unknown) {
    return rejectWithValue("Failed to update subject");
  }
});

// ลบวิชา
export const deleteSubjectThunk = createAsyncThunk<
  number, // คืน id ที่ลบสำเร็จ
  { id: number },
  { rejectValue: string }
>("subjects/delete", async ({ id }, { rejectWithValue }) => {
  try {
    await axios.delete(`/api/subjects/${id}`);
    return id;
  } catch (error: unknown) {
    return rejectWithValue("Failed to delete subject");
  }
});
export const addQuestionToSubjectThunk = createAsyncThunk<
  Subject,
  { subjectId: number; label: string; questionNo: number },
  { rejectValue: string }
>(
  "subjects/addQuestionToSubject",
  async ({ subjectId, label, questionNo }, { rejectWithValue }) => {
    try {
      console.log(questionNo)
      const { data } = await axios.post<Subject>(
        `/api/subjects/${subjectId}/questions`,
        { label, questionNo }
      );
      return data;
    } catch (err) {
      return rejectWithValue("Failed to add question");
    }
  }
);


export const deleteQuestionFromSubjectThunk = createAsyncThunk<
  Subject,
  { subjectId: number; questionId: string },
  { rejectValue: string }
>(
  "subjects/deleteQuestionFromSubject",
  async ({ subjectId, questionId }, { rejectWithValue }) => {
    try {
      const res = await axios.delete<Subject>(
        `/api/subjects/${subjectId}/questions/${Number(questionId)}`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue("Failed to delete question");
    }
  }
);

const subjectsSlice = createSlice({
  name: "subjects",
  initialState,
  reducers: {
    // สร้างวิชาใหม่ (ฝั่ง client อย่างเดียว)
    createSubject(
      state,
      action: PayloadAction<{ code: string; name: string }>
    ) {
      const { code, name } = action.payload;
      const id = state.nextId;

      const newSubject: Subject = {
        id,
        code,
        name,
        questions: [],
      };

      state.items.push(newSubject);
      state.nextId += 1;
      state.selectedId = id;
    },

    setSelectedSubjectId(state, action: PayloadAction<number | null>) {
      state.selectedId = action.payload;
    },

    updateSubject(
      state,
      action: PayloadAction<{ id: number; code: string; name: string }>
    ) {
      const { id, code, name } = action.payload;
      const subject = state.items.find((s) => s.id === id);
      if (subject) {
        subject.code = code;
        subject.name = name;
      }
    },

    deleteSubject(state, action: PayloadAction<{ id: number }>) {
      const { id } = action.payload;
      state.items = state.items.filter((s) => s.id !== id);
      if (state.selectedId === id) {
        state.selectedId = state.items.length ? state.items[0].id : null;
      }
    },

    // ------------------- จัดการ "ข้อ" ภายในวิชา -------------------

    addQuestion(state, action: PayloadAction<{ subjectId: number }>) {
      const { subjectId } = action.payload;
      const subject = state.items.find((s) => s.id === subjectId);
      if (!subject) return;

      const nextNo = subject.questions.length + 1;

      subject.questions.push({
        id: nanoid(),
        questionNo: nextNo,
        label: "",
      });
    },

    updateQuestionLabel(
      state,
      action: PayloadAction<{
        subjectId: number;
        questionId: string;
        label: string;
      }>
    ) {
      const { subjectId, questionId, label } = action.payload;
      const subject = state.items.find((s) => s.id === subjectId);
      if (!subject) return;

      const q = subject.questions.find((q) => q.id === questionId);
      if (q) q.label = label;
    },

    removeQuestion(
      state,
      action: PayloadAction<{ subjectId: number; questionId: string }>
    ) {
      const { subjectId, questionId } = action.payload;
      const subject = state.items.find((s) => s.id === subjectId);
      if (!subject) return;

      subject.questions = subject.questions
        .filter((q) => q.id !== questionId)
        .map((q, index) => ({
          ...q,
          questionNo: index + 1,
        }));
    },

    clearQuestionsForSubject(
      state,
      action: PayloadAction<{ subjectId: number }>
    ) {
      const { subjectId } = action.payload;
      const subject = state.items.find((s) => s.id === subjectId);
      if (subject) subject.questions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubjectsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubjectsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;

        state.selectedId = action.payload.length ? action.payload[0].id : null;
        state.nextId = action.payload.length
          ? Math.max(...action.payload.map((s) => s.id)) + 1
          : 1;
      })
      .addCase(fetchSubjectsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch subjects";
      });

    // ---------------- createSubjectThunk ----------------
    builder
      .addCase(createSubjectThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubjectThunk.fulfilled, (state, action) => {
        state.loading = false;
        const subject = action.payload;
        state.items.push(subject);
        state.selectedId = subject.id;
        state.nextId = Math.max(state.nextId, subject.id + 1);
      })
      .addCase(createSubjectThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to create subject";
      });

    // ---------------- updateSubjectThunk ----------------
    builder
      .addCase(updateSubjectThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSubjectThunk.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const idx = state.items.findIndex((s) => s.id === updated.id);
        if (idx !== -1) {
          state.items[idx] = updated;
        }
      })
      .addCase(updateSubjectThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to update subject";
      });

    // ---------------- deleteSubjectThunk ----------------
    builder
      .addCase(deleteSubjectThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSubjectThunk.fulfilled, (state, action) => {
        state.loading = false;
        const id = action.payload;
        state.items = state.items.filter((s) => s.id !== id);
        if (state.selectedId === id) {
          state.selectedId = state.items.length ? state.items[0].id : null;
        }
      })
      .addCase(deleteSubjectThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to delete subject";
      })
      .addCase(addQuestionToSubjectThunk.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const idx = state.items.findIndex((s) => s.id === updated.id);
        if (idx !== -1) {
          state.items[idx] = updated;
        }
      })
      .addCase(fetchSubjectsQuestionThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubjectsQuestionThunk.fulfilled, (state, action) => {
        state.loading = false;

        // reset ก่อนทุกครั้ง (เปลี่ยน session)
        state.sessionQuestions = {};

        action.payload.forEach((q) => {
          if (!state.sessionQuestions[q.subject_id]) {
            state.sessionQuestions[q.subject_id] = [];
          }

          state.sessionQuestions[q.subject_id].push({
            id: String(q.subject_question_id),
            questionNo: q.question_no,
            label: q.question_name,
          });
        });

        // sort ข้อ
        Object.values(state.sessionQuestions).forEach((list) => {
          list.sort((a, b) => a.questionNo - b.questionNo);
        });
      })
      .addCase(fetchSubjectsQuestionThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch subject questions";
      });
  },
});

/* ---------------------------- Actions ----------------------------- */

export const {
  createSubject,
  setSelectedSubjectId,
  updateSubject,
  deleteSubject,
  addQuestion,
  updateQuestionLabel,
  removeQuestion,
  clearQuestionsForSubject,

} = subjectsSlice.actions;

/* --------------------------- Selectors ---------------------------- */

export const selectSubjectsSlice = (state: RootState) => state.subjects;

export const selectAllSubjects = (state: RootState) => state.subjects.items;

export const selectSelectedSubjectId = (state: RootState) =>
  state.subjects.selectedId;

export const selectSubjectById = (state: RootState, id: number) =>
  state.subjects.items.find((s) => s.id === id) || null;

export const selectQuestionsForSubject = (state: RootState, id: number) => {
  const s = state.subjects.items.find((x) => x.id === id);
  return s ? s.questions : [];
};
export const selectSubjectsLoading = (state: RootState) => state.subjects.loading;
export const selectSubjectsError = (state: RootState) => state.subjects.error;

export const selectQuestionsBySubjectId =
  (subjectId: number) =>
  (state: RootState) =>
    state.subjects.sessionQuestions[subjectId] ?? [];


export { subjectsSlice };
