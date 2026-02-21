// src/pages/grading/recheck/types.ts
export interface DisputedQuestionDto {
  bookletId: number;
  subjectId: number;
  questionNo: number;

  bagId: number | null;
  bagNo: number | null;

  subjectCode: string;
  subjectName: string;
  questionLabel: string | null;

  slotId1: number;
  slotId2: number;
  score1: number;
  score2: number;
  diff: number;

  graderId1: number;
  graderId2: number;
  graderName1: string;
  graderName2: string;

  random_num: string;

  // เพิ่มตรงนี้
  lastEnteredAt?: string | null; // หรือ Date ก็ได้แล้วแต่ backend ส่งอะไรมา
}
