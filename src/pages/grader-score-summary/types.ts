export interface GradedBagSummary {
  bagId: number;
  bagNo: number;
  subjectCode: string;
  subjectName: string;
  questionNo: number;
  questionLabel: string | null;
  graderId: number;
  graderName: string;
  totalScored: number;
  confirmedAt: string | null;
}
