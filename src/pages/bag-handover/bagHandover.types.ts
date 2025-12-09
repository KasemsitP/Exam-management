// src/pages/bag-handover/bagHandover.types.ts
import type { BagLock } from "@/store/slices/bagHandover.slice";

// ฟอร์ม check-in
export interface CheckoutFormValues {
  sessionId: string;
  bagId: string; // bag_id (PK)
  graderId: string;
  note?: string;
}

// session ที่ใช้ในหน้า
export interface SessionSummary {
  id: number | string;
  label?: string | null;
  title?: string | null;
  examDate: string;
}

// ถุงที่ใช้บนหน้า (ใช้เฉพาะ field ที่หน้า UI ต้องใช้)
export interface BagSummary {
  id: number | string;
  bag_no: number | string;
  sessionId: number | string;
  subjectName?: string | null;
  subjectCode?: string | null;
  sessionLabel?: string | null;
}

// ผู้ตรวจ
export interface GraderSummary {
  account_id: number | string;
  grader_name?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  code?: string | null;
}

// log ส่งมอบ/รับคืนถุง
export interface BagLogRecord {
  id: string | number;
  bagId: number | string;
  action: "CHECK_IN" | "CHECK_OUT" | string;
  graderId?: number | string | null;
  operatorId?: number | string | null;
  timestamp: string;
  note?: string | null;
}

// record คะแนน
export interface GradingRecord {
  slotId: string | number;
  score: number;
  enteredAt: string;
}

export type { BagLock };
