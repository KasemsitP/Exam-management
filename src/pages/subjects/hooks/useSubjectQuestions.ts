// src/hooks/useSubjectQuestions.ts
import { useAppDispatch, useAppSelector } from "@/store/hook";
import {
  selectAllSubjects,
  selectSelectedSubjectId,
  selectQuestionsForSubject,
  setSelectedSubjectId,
  createSubject,
  addQuestion,
  updateQuestionLabel,
  removeQuestion,
} from "@/store/slices/subjects.slice";

export function useSubjectQuestions() {
  const dispatch = useAppDispatch();

  const subjects = useAppSelector(selectAllSubjects);
  const selectedSubjectId = useAppSelector(selectSelectedSubjectId);

  const questionsForSelectedSubject = useAppSelector((state) =>
    selectedSubjectId
      ? selectQuestionsForSubject(state, selectedSubjectId)
      : []
  );

  const handleChangeSubject = (subjectId: number) => {
    dispatch(setSelectedSubjectId(subjectId));
  };

  const createSubjectAndSelect = (code: string, name: string) => {
    if (!code.trim() || !name.trim()) return;
    dispatch(createSubject({ code: code.trim(), name: name.trim() }));
    // selectedId จะถูก set ใน reducer ให้แล้ว
  };

  const addQuestionForSelected = () => {
    if (!selectedSubjectId) return;
    dispatch(addQuestion({ subjectId: selectedSubjectId }));
  };

  const updateQuestionLabelForSelected = (questionId: string, label: string) => {
    if (!selectedSubjectId) return;
    dispatch(
      updateQuestionLabel({
        subjectId: selectedSubjectId,
        questionId,
        label,
      })
    );
  };

  const removeQuestionForSelected = (questionId: string) => {
    if (!selectedSubjectId) return;
    dispatch(removeQuestion({ subjectId: selectedSubjectId, questionId }));
  };

  return {
    subjects,
    selectedSubjectId,
    questionsForSelectedSubject,
    handleChangeSubject,
    createSubjectAndSelect,
    addQuestionForSelected,
    updateQuestionLabelForSelected,
    removeQuestionForSelected,
  };
}
