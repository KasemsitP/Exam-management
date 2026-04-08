// bag-handover/types.ts

export interface BagScoreBagSummary {
  bagId: number;
  bagNo: number;
  campaignId: number;
  sessionId: number;
  sessionLabel: string;
  subjectId: number;
  subjectName: string;
  status: string;
  scannedCount: number;
}

export interface BagQuestionScoreRow {
  questionNo: number;
  label: string;
  category: string | null;
  grader1Score: number | null;
  grader1Name: string | null;
  grader2Score: number | null;
  grader2Name: string | null;
  finalScore: number | null;
}

export interface BagBookletScore {
  bookletId: number;
  random_num : number;
  examCode: string;
  candidateName: string | null;
  questionCount: number;
  questions: BagQuestionScoreRow[];
}

export interface BagScoresApiResponse {
  bagId: number;
  subjectId: number;
  questionCount: number;
  booklets: BagBookletScore[];
}

export interface ScoreChangeLog {
  bag: number;
  booklet: number;
  subject: string;
  subject_name: string;
  question: number;
  grader1: string;
  score1: string;
  grader2: string;
  score2: string;
  changed_by: string;
  changed_time: string;
  total_scorerow: string;
}
