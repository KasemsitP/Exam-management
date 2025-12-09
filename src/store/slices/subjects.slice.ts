// src/store/slices/subjects.slice.ts
import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../index";

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
  selectedId: number | null;
  nextId: number; // auto-id ฝั่ง frontend
}

/* --------------------------- Initial State ------------------------- */

const initialState: SubjectsState = {
  items: [],
  selectedId: null,
  nextId: 1,
};

/* ------------------------------ Slice ------------------------------ */

const subjectsSlice = createSlice({
  name: "subjects",
  initialState,
  reducers: {
    // สร้างวิชาใหม่ (พร้อมเลือกวิชานั้นให้เลย)
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

    clearQuestionsForSubject(state, action: PayloadAction<{ subjectId: number }>) {
      const { subjectId } = action.payload;
      const subject = state.items.find((s) => s.id === subjectId);
      if (subject) subject.questions = [];
    },
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

export {subjectsSlice}
