// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import type { PieLabelRenderProps } from "recharts";
import axios from "axios";
import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, GraduationCap, Package, Users, BookOpen } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import { selectDefaultBagCapacity, selectBagsForCampaign, fetchBagsForCampaignThunk } from "@/store/slices/bags.slice";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import { useDispatch } from "react-redux";
import { ShowIfCan } from "@/components/auth/ShowIfCan";


/* -----------------------------------------
   ✅ Muted / Neutral theme (ไม่ฉูดฉาด)
------------------------------------------ */
const primary = "#334155"; // slate-700
const muted = "#64748B"; // slate-500
const grid = "#E2E8F0"; // slate-200
const surface = "#FFFFFF";
const surfaceSoft = "#F8FAFC"; // slate-50
const border = "#E2E8F0"; // slate-200
const pieColors = [
  "#3B82F6", // น้ำเงินสด (Blue)
  "#22C55E", // เขียวสด (Green)
  "#F59E0B", // เหลือง/ส้ม (Amber)
  "#EF4444", // แดงสด (Red)
  "#8B5CF6", // ม่วงสด (Violet)
];


/* ---------- 1. Types ที่ตรงกับ API Response จริง ---------- */

// จาก JSON ที่คุณให้มา
// {
//   "summary": {...},
//   "sessions": {...},
//   "avgScorePerQuestion": []
// }
const MOCK_SCORE_DISTRIBUTION: ScoreDistributionAPI = {
  totalUsers: 1105,
  noScore: 0,
  buckets: [
    { label: "1-5", count: 12 },     // โดดซ้าย
    { label: "6-10", count: 8 },
    { label: "11-15", count: 22 },   // spike
    { label: "16-20", count: 18 },
    { label: "21-25", count: 45 },
    { label: "26-30", count: 38 },   // ดรอปนิด
    { label: "31-35", count: 72 },
    { label: "36-40", count: 60 },   // ลดแบบไม่เนียน
    { label: "41-45", count: 98 },
    { label: "46-50", count: 110 },
    { label: "51-55", count: 95 },   // ยุบลง
    { label: "56-60", count: 130 },  // spike กลาง
    { label: "61-65", count: 102 },
    { label: "66-70", count: 115 },  // โดดอีกที
    { label: "71-75", count: 88 },
    { label: "76-80", count: 93 },   // เด้งขึ้นนิด
    { label: "81-85", count: 65 },
    { label: "86-90", count: 58 },
    { label: "91-95", count: 52 },
    { label: "96-100", count: 34 },
    { label: "101-105", count: 40 }, // spike ขวากลาง
    { label: "106-110", count: 18 },
    { label: "111-115", count: 26 }, // เด้งอีกที
    { label: "116-120", count: 9 },
    { label: "121-125", count: 14 }, // ขวาโดด
    { label: "126-130", count: 4 },
    { label: "131-135", count: 7 },  // spike เล็ก
    { label: "136-140", count: 2 },
    { label: "141-145", count: 5 },  // ขวาปลายโดด
    { label: "146-150", count: 1 },
    { label: "151-155", count: 1 },
    { label: "156-160", count: 1 },
    { label: "161-165", count: 1 },
    { label: "166-170", count: 1 },
  ]

};



interface ScoreBucket {
  label: string; // "0-4", "5-9", ...
  count: number;
}

interface ScoreDistributionAPI {
  totalUsers: number;
  noScore: number;
  buckets: ScoreBucket[];
}

interface SummaryAPI {
  campaignId: number;
  sessionCount: number;
  subjectCount: number;
  graders: {
    total: number;
    withLogin: number;
  };
  keys: {
    total: number;
    active: number;
  };
  scoreDistribution: ScoreDistributionAPI;
}

interface SessionAPI {
  sessionId: number;
  sessionCode: string;
  subject_name: string;
  bags: {
    total: number;
    capacity: number;
  };
  users: {
    inCampaign: number;
    inSession: number;
  };
  importStatus: "NOT_IMPORTED" | "PARTIAL" | "IMPORTED";
  encryption: {
    status: "NOT_ENCRYPTED" | "PARTIAL" | "ENCRYPTED_ALL";
    encrypted: number;
    pending: number;
  };
}
interface SubjectQuestion {
  id: number;
  questionNo: number;
  label: string;
  maxScore: string; // หรือ number ถ้า backend ส่งมาเป็น number จริง ๆ
}

interface SubjectDetail {
  subjectId: number;
  code: string;
  name: string;
  questions: SubjectQuestion[];
}
interface SubjectQuestionApi {
  id: number;
  questionNo: number;
  label: string;
  maxScore: string; // หรือ number ถ้า backend แปลงมาแล้ว
}

interface SubjectQuestionsApi {
  subjectId: number;
  code: string;
  name: string;
  questions: SubjectQuestionApi[];
}

interface RawStatusItem {
  session_id: number;
  subject_id: number;
  booklet_count: number;
  question_count: number;
  expected_slots: number;
  actual_slots: number;
  assigned_slots: string;
  completed_slots: string;
  disputed_slots: string;
  pending_slots: string;
  missing_slots: number;
  question_count_sq: number;
  question_count_ss: number;
  mismatch_question_count: number;
}
interface RawBookletsBySessionItem {
  session_id: number;
  session_code: string;
  count: number
  subject_name: string
}
interface SeatAssignmentStatus {
  room_code: string;
  count_user: number;
  capacity: number;

}


interface DashboardApiResponse {
  summary: SummaryAPI;
  sessions: Record<string, SessionAPI>;
  avgScorePerQuestion: any[];
  subjectQuestions?: Record<string, SubjectQuestionsApi>;
  rawStatus?: RawStatusItem[];
  rawDisputedQuestions?: number;
  rawBookletsCount?: number;
  rawBookletsBySession?: RawBookletsBySessionItem[];
  seatAssignmentStatus?: SeatAssignmentStatus[];
}

/* ---------- Types ฝั่ง UI (สำหรับกราฟและการแสดงผล) ---------- */

interface BagCount {
  sessionId: number;
  sessionLabel: string;
  bagCount: number;
  [key: string]: any; // ให้ recharts พอใจ
}

interface ImportStatusUI {
  sessionId: number;
  sessionCode: string;
  subject_name: string
  inCampaign: number;
  inSession: number;
  importStatus: "NOT_IMPORTED" | "PARTIAL" | "IMPORTED";
}

interface EncryptedStatusUI {
  sessionId: number;
  sessionCode: string;
  subject_name: string;
  status: "NOT_ENCRYPTED" | "PARTIAL" | "ENCRYPTED_ALL";
  encrypted: number;
  pending: number;
  totalUsersInSession: number;
}


type Tone = "neutral" | "good" | "warn";

const badgeStyle = (tone: Tone): React.CSSProperties => {
  if (tone === "good")
    return {
      background: "#D1FAE5",
      color: "#065F46",
      border: "1px solid #10B981",
    };
  if (tone === "warn")
    return {
      background: "#FEF3C7",
      color: "#92400E",
      border: "1px solid #F59E0B",
    };
  return {
    background: "#F8FAFC",
    color: "#475569",
    border: "1px solid #E2E8F0",
  };
};

export default function Dashboard() {
  const dispatch = useAppDispatch()
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const defaultBagCapacity = useAppSelector(selectDefaultBagCapacity);
  const user = useAppSelector(selectCurrentUser);


  const bags = useAppSelector(selectBagsForCampaign(activeCampaign?.id))

  /* ---------- Local state ---------- */
  const [dashboardData, setDashboardData] = useState<DashboardApiResponse | null>(
    null
  );
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [scoreChartData, setScoreChartData] = useState<
    { range: string; count: number }[]
  >([]);


  useEffect(() => {

    console.log(bags)
  }, [])
  useEffect(() => {
    if (!activeCampaign?.id) return;

    let interval: NodeJS.Timeout;
    let isFetching = false;



    const fetchDashboard = async () => {
      try {
        if (isFetching) return;
        isFetching = true;

        setLoadingDashboard(true);
        setDashboardError(null);

        dispatch(fetchBagsForCampaignThunk(activeCampaign.id));

        const res = await axios.get(
          `/api/dashboard/campaign/${activeCampaign.id}`
        );

        setDashboardData(res.data);
      } catch (err) {
        setDashboardError("โหลดข้อมูลแดชบอร์ดไม่สำเร็จ");
        setDashboardData(null);
      } finally {
        isFetching = false;
        setLoadingDashboard(false);
      }
    };

    // ยิงครั้งแรกทันที
    fetchDashboard();

    // ยิงซ้ำทุก 1 นาที
    interval = setInterval(() => {
      fetchDashboard();
    }, 60000); // 60000 ms = 1 นาที

    // cleanup ตอน unmount
    return () => clearInterval(interval);
  }, [activeCampaign?.id]);
  const USE_MOCK_SCORE = false; // <-- เปลี่ยนเป็น false ตอนอยากกลับไปใช้ของจริง

  const calculateUsers = dashboardData?.seatAssignmentStatus?.reduce((sum, s) => sum + s.count_user, 0) ?? 0;

  useEffect(() => {
    if (USE_MOCK_SCORE) {
      const chartData = buildScoreChartData(MOCK_SCORE_DISTRIBUTION);
      setScoreChartData(chartData);
      return;
    }

    if (!dashboardData?.summary?.scoreDistribution) return;

    const chartData = buildScoreChartData(
      dashboardData.summary.scoreDistribution
    );
    setScoreChartData(chartData);
  }, [dashboardData]);


  // 1) กำหนดช่วงทั้งหมดที่อยากให้แสดง 1–150 (ก้าวละ 5 คะแนน)
  const ALL_SCORE_BUCKETS: string[] = [];
  for (let start = 1; start <= 170; start += 5) {
    const end = start + 4;
    ALL_SCORE_BUCKETS.push(`${start}-${end}`); // "1-5", "6-10", ..., "146-150"
  }

  // ....

  const buildScoreChartData = (scoreDistribution: ScoreDistributionAPI) => {
    if (!scoreDistribution) return [];

    const { buckets, noScore } = scoreDistribution;

    // map label -> count (ดึงจาก backend)
    const bucketMap = new Map<string, number>();
    for (const b of buckets ?? []) {
      bucketMap.set(b.label, Number(b.count ?? 0));
    }

    // สร้างข้อมูลสำหรับทุกช่วง 1–150
    const bucketData = ALL_SCORE_BUCKETS.map((label) => ({
      range: label,
      count: bucketMap.get(label) ?? 0, // ถ้าไม่มีใน backend ให้เป็น 0
    }));

    // แถมแท่ง "ยังไม่มีคะแนน" อีกช่อง
    bucketData.push({
      range: "ยังไม่มีคะแนน",
      count: Number(noScore ?? 0),
    });

    return bucketData;
  };



  /* ---------- Derived Data (แปลง API -> UI) ---------- */

  // 1) Import status จาก sessions
  const importStatusList: ImportStatusUI[] = useMemo(() => {
    if (!dashboardData?.sessions) return [];
    return Object.values(dashboardData.sessions).map((s) => ({
      sessionId: s.sessionId,
      sessionCode: s.sessionCode,
      inCampaign: s.users.inCampaign,
      inSession: s.users.inSession,
      importStatus: s.importStatus,
      subject_name: s.subject_name
    }));
  }, [dashboardData]);

  // 2) Encryption จาก sessions
  const encryptedStatusList: EncryptedStatusUI[] = useMemo(() => {
    if (!dashboardData?.sessions) return [];
    return Object.values(dashboardData.sessions).map((s) => ({
      sessionId: s.sessionId,
      sessionCode: s.sessionCode,
      status: s.encryption.status,
      encrypted: s.encryption.encrypted,
      pending: s.encryption.pending,
      // ใช้จำนวนผู้เข้าสอบใน session เป็นตัวหาร
      totalUsersInSession: s.users.inSession,
      subject_name: s.subject_name
    }));
  }, [dashboardData]);

  // 3) จำนวนรอบสอบ
  const sessionCount = useMemo(() => {
    if (!dashboardData) return 0;
    if (dashboardData.summary?.sessionCount != null) {
      return dashboardData.summary.sessionCount;
    }
    return Object.keys(dashboardData.sessions ?? {}).length;
  }, [dashboardData]);

  // 4) จำนวนวิชา
  const subjectCount = dashboardData?.summary?.subjectCount ?? 0;

  // 5) จำนวนผู้เข้าสอบรวมทั้ง campaign (ใช้จาก summary โดยตรงจะไม่ซ้ำคน)
  const totalUsersInCampaign = useMemo(() => {
    if (!dashboardData?.sessions) return 0;

    const sessionsArr = Object.values(dashboardData.sessions);

    // เผื่ออนาคตบาง session หลุดข้อมูล ใช้ค่ามากสุดกันพลาด
    return sessionsArr.reduce(
      (max, s) => Math.max(max, s.users.inCampaign),
      0
    );
  }, [dashboardData]);

  // 6) จำนวนถุงรวมทั้ง campaign
  const totalBags = useMemo(() => {
    if (!dashboardData?.sessions) return 0;
    return Object.values(dashboardData.sessions).reduce(
      (sum, s) => sum + (s.bags?.total ?? 0),
      0
    );
  }, [dashboardData]);

  // 7) ผู้ตรวจ / keys จาก summary
  const gradersCount = dashboardData?.summary?.graders?.total ?? 0;
  const keysCount = dashboardData?.summary?.keys?.total ?? 0;

  // 8) สำหรับ PieChart ถุงตามรอบสอบ (ใช้ใน card ท้ายไฟล์)
  const bagCounts: BagCount[] = useMemo(() => {
    if (!dashboardData?.sessions) return [];
    return Object.values(dashboardData.sessions).map((s) => ({
      sessionId: s.sessionId,
      sessionLabel: s.sessionCode,
      sessionFullLabel: `${s.sessionCode} (${s.subject_name ?? "-"})`,
      bagCount: s.bags.total,
      //  subject_name: s.subject_name
    }));
  }, [dashboardData]);

  const subjectQuestionList = useMemo(() => {
    if (!dashboardData?.subjectQuestions) return [];

    // map: ชื่อวิชา -> list ของ sessionCode
    const sessionsBySubjectName: Record<string, string[]> = {};

    if (dashboardData.sessions) {
      Object.values(dashboardData.sessions).forEach((s) => {
        if (!s.subject_name) return;

        // กรณีที่ subject_name อนาคตอาจเป็นหลายวิชา แล้วใช้ GROUP_CONCAT
        const names = String(s.subject_name)
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean);

        names.forEach((name) => {
          if (!sessionsBySubjectName[name]) {
            sessionsBySubjectName[name] = [];
          }
          sessionsBySubjectName[name].push(s.sessionCode);
        });
      });
    }

    // คืน array ของวิชา + sessionCodes
    return Object.values(dashboardData.subjectQuestions).map((subj) => ({
      subjectId: subj.subjectId,
      code: subj.code,
      name: subj.name,
      questions: subj.questions,
      // จำนวนหัวข้อ
      questionCount: subj.questions.length,
      // คะแนนเต็มรวมทั้งวิชา
      totalMaxScore: subj.questions.reduce(
        (sum, q) => sum + Number(q.maxScore ?? 0),
        0
      ),
      // รอบสอบที่วิชานี้ไปอยู่
      sessionCodes: sessionsBySubjectName[subj.name] ?? [],
    }));
  }, [dashboardData?.subjectQuestions, dashboardData?.sessions]);


  // 2) ใช้ทั้ง subjectQuestions + sessions เพื่อทำข้อความสรุป
  const subjectNamesSummary = useMemo(() => {
    if (!dashboardData?.subjectQuestions || !dashboardData?.sessions) return "";

    // สร้าง map: subject_name → [sessionCode...]
    const sessionCodesBySubjectName: Record<string, string[]> = {};

    Object.values(dashboardData.sessions).forEach((s) => {
      if (!s.subject_name) return;
      if (!sessionCodesBySubjectName[s.subject_name]) {
        sessionCodesBySubjectName[s.subject_name] = [];
      }
      sessionCodesBySubjectName[s.subject_name].push(s.sessionCode);
    });

    // จาก subjectQuestions มาต่อ string
    const subjects = Object.values(dashboardData.subjectQuestions).map((s) => {
      const sessionsForSubject = sessionCodesBySubjectName[s.name] ?? [];
      const sessionText =
        sessionsForSubject.length > 0
          ? ` (สอบใน ${sessionsForSubject.join(", ")})`
          : "";

      // ตัวอย่าง: "LAWENG - กฎหมายพิเศษและภาษาอังกฤษ (สอบใน วันที่ 1)"
      return `${s.code} - ${s.name}${sessionText}`;
    });

    if (subjects.length === 0) return "";
    if (subjects.length <= 2) return subjects.join(" • ");

    return `${subjects.slice(0, 2).join(" • ")} + อีก ${subjects.length - 2} วิชา`;
  }, [dashboardData]);


  const renderLabel = (props: PieLabelRenderProps) => {
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      value,
    } = props;

    // Guard type ให้เป็น number เท่านั้น
    if (
      typeof cx !== "number" ||
      typeof cy !== "number" ||
      typeof midAngle !== "number" ||
      typeof innerRadius !== "number" ||
      typeof outerRadius !== "number" ||
      typeof value !== "number"
    ) {
      return null;
    }

    // คำนวณ % สำหรับแสดงบน label
    const total = bagCounts.reduce((sum, b) => sum + b.bagCount, 0);
    const percent = total > 0 ? ((value / total) * 100).toFixed(0) : "0";

    // วาง label ด้านนอก pie
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 22;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={13}
        fontWeight={700}
        fill="#334155"
        pointerEvents="none"
      >
        {value} ({percent}%)
      </text>
    );
  };
  // รายวิชาทั้งหมดจาก subjectQuestion

  const sessionsBySubjectName = useMemo(() => {
    if (!dashboardData?.sessions) return {} as Record<string, string[]>;

    const map: Record<string, string[]> = {};

    Object.values(dashboardData.sessions).forEach((sess) => {
      if (!sess.subject_name) return;

      if (!map[sess.subject_name]) {
        map[sess.subject_name] = [];
      }
      map[sess.subject_name].push(sess.sessionCode);  // เช่น "วันที่ 1", "วันที่ 2"
    });

    return map;
  }, [dashboardData?.sessions]);
  const subjectList = useMemo(() => {
    if (!dashboardData?.subjectQuestions) return [];

    return Object.values(dashboardData.subjectQuestions).map((subj) => {
      // หา session ของวิชานี้จากชื่อวิชา
      const sessionCodes = sessionsBySubjectName[subj.name] ?? [];

      return {
        subjectId: subj.subjectId,
        code: subj.code,
        name: subj.name,
        questionCount: subj.questions.length,
        totalMaxScore: subj.questions.reduce(
          (sum, q) => sum + Number(q.maxScore ?? 0),
          0
        ),
        sessions: sessionCodes,          // <= เพิ่ม field นี้
      };
    });
  }, [dashboardData?.subjectQuestions, sessionsBySubjectName]);


  /* ---------- Render ---------- */

  return (
    <ShowIfCan permission="dashboard" fallback={<div className="p-4 alert alert-warning">คุณไม่มีสิทธิ์เข้าถึงแดชบอร์ดนี้</div>}>
      <div className="container-fluid px-3 px-sm-4 py-3 gap-4 d-flex flex-column">
        {/* Header */}
        <div className="card border-0 shadow-sm" style={{ background: surface, borderBottom: "4px solid #3B82F6" }}>
          <div className="card-body p-3 p-md-4">
            <div className="d-flex align-items-start gap-2 gap-md-3">
              <div className="flex-grow-1">
                <div className="text-uppercase small fw-semibold mb-1" style={{ color: muted }}>
                  Dashboard
                </div>
                <h2 className="h5 h-md-4 mb-1 text-dark">
                  {activeCampaign ? `${activeCampaign.name}` : "ยังไม่ได้เลือกแคมเปญ"}
                </h2>
              </div>
            </div>
          </div>
        </div>


        <>
          {dashboardError && (
            <div className="alert alert-danger shadow-sm border-0">{dashboardError}</div>
          )}

          {/* Stat Cards */}
          <section className="d-flex flex-wrap gap-3 gap-md-4">
            {/* Sessions */}
            <div style={{ flex: "1 1 calc(20% - 0.75rem)", minWidth: 160 }}>
              <div className="card shadow-sm h-100" style={{ borderLeft: "4px solid #3B82F6", borderTop: "3px solid #3B82F6", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(59,130,246,0.15)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}>
                <div className="card-body p-3 p-sm-4">
                  <div className="d-flex justify-content-between align-items-start mb-2 mb-sm-3">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted, fontSize: "0.8rem" }}>
                      จำนวนรายวิชาที่สอบทั้งหมด
                    </div>
                    <CalendarDays size={18} className="opacity-75 d-none d-sm-block" style={{ color: muted }} />
                  </div>
                  <div className="h2 h-sm-3 mb-1 mb-sm-2 fw-bold" style={{ color: "#0F172A" }}>
                    {sessionCount}
                  </div>
                  <div className="small d-none d-sm-block" style={{ color: muted }}>
                    วิชา
                  </div>
                </div>
              </div>
            </div>

            {/* Subjects */}
            <div style={{ flex: "1 1 calc(20% - 0.75rem)", minWidth: 160 }}>
              <div className="card shadow-sm h-100" style={{ borderLeft: "4px solid #22C55E", borderTop: "3px solid #22C55E", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(34,197,94,0.15)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}>
                <div className="card-body p-3 p-sm-4">
                  <div className="d-flex justify-content-between align-items-start mb-2 mb-sm-3">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted, fontSize: "0.8rem" }}>
                      รายวิชาที่สอบทั้งหมด
                    </div>
                    <GraduationCap size={18} className="opacity-75 d-none d-sm-block" style={{ color: muted }} />
                  </div>

                  {subjectList.length > 0 && (
                    <ul className="list-unstyled mb-0 text-dark small" style={{ fontSize: "0.85rem" }}>
                      {subjectList.slice(0, 2).map((subj) => (
                        <li key={subj.subjectId} className="fw-bold text-truncate">
                          {subj.name}
                        </li>
                      ))}

                      {subjectList.length > 2 && (
                        <li className="fst-italic text-muted">
                          + อีก {subjectList.length - 2} วิชา
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Total Users */}
            <div style={{ flex: "1 1 calc(20% - 0.75rem)", minWidth: 160 }}>
              <div className="card shadow-sm h-100" style={{ borderLeft: "4px solid #F59E0B", borderTop: "3px solid #F59E0B", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(245,158,11,0.15)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}>
                <div className="card-body p-3 p-sm-4">
                  <div className="d-flex justify-content-between align-items-start mb-2 mb-sm-3">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted, fontSize: "0.8rem" }}>
                      ผู้เข้าสอบภายในรอบสอบนี้
                    </div>
                    <Users size={18} className="opacity-75 d-none d-sm-block" style={{ color: muted }} />
                  </div>
                  <div className="h2 h-sm-3 mb-1 mb-sm-2 fw-bold" style={{ color: "#0F172A" }}>
                    {totalUsersInCampaign.toLocaleString()}
                  </div>
                  <div className="small d-none d-sm-block" style={{ color: muted }}>
                    คน
                  </div>
                </div>
              </div>
            </div>
            <div style={{ flex: "1 1 calc(20% - 0.75rem)", minWidth: 160 }}>
              <div className="card shadow-sm h-100" style={{ borderLeft: "4px solid #8B5CF6", borderTop: "3px solid #8B5CF6", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(139,92,246,0.15)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}>
                <div className="card-body p-3 p-sm-4">
                  <div className="d-flex justify-content-between align-items-start mb-2 mb-sm-3">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted, fontSize: "0.8rem" }}>
                      จำนวนถุงข้อสอบทั้งหมด
                    </div>
                    <Package size={18} className="opacity-75 d-none d-sm-block" style={{ color: muted }} />
                  </div>
                  <div className="h2 h-sm-3 mb-1 mb-sm-2 fw-bold" style={{ color: "#0F172A" }}>
                    {totalBags}
                  </div>
                  <div className="small d-none d-sm-block" style={{ color: muted }}>
                    ถุง {/* ถุง (ความจุ {defaultBagCapacity}) */}
                  </div>
                </div>
              </div>
            </div>


            {/* Total Booklets */}
            <div style={{ flex: "1 1 calc(20% - 0.75rem)", minWidth: 160 }}>
              <div className="card shadow-sm h-100" style={{ borderLeft: "4px solid #EF4444", borderTop: "3px solid #EF4444", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(239,68,68,0.15)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}>
                <div className="card-body p-3 p-sm-4">
                  <div className="d-flex justify-content-between align-items-start mb-2 mb-sm-3">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted, fontSize: "0.8rem" }}>
                      จำนวนสมุดข้อสอบทั้งหมด
                    </div>
                    <BookOpen size={18} className="opacity-75 d-none d-sm-block" style={{ color: muted }} />
                  </div>
                  <div className="h2 h-sm-3 mb-1 mb-sm-2 fw-bold" style={{ color: "#0F172A" }}>
                    {dashboardData?.rawBookletsCount?.toLocaleString() ?? 0}
                  </div>
                  <div className="small d-none d-sm-block" style={{ color: muted }}>
                    เล่ม
                  </div>
                </div>
              </div>
            </div>

            {/* Bags */}    <div style={{ flex: "1 1 calc(20% - 0.75rem)", minWidth: 160 }}>
              <div className="card shadow-sm h-100" style={{ borderLeft: "4px solid #0EA5E9", borderTop: "3px solid #0EA5E9", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(14,165,233,0.15)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}>
                <div className="card-body p-3 p-sm-4">
                  <div className="d-flex justify-content-between align-items-start mb-2 mb-sm-3">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted, fontSize: "0.8rem" }}>
                      จำนวนผู้เข้าสอบที่ถูกจัดสรรที่นั่งแล้ว
                    </div>
                    <Package size={18} className="opacity-75 d-none d-sm-block" style={{ color: muted }} />
                  </div>
                  <div className="h2 h-sm-3 mb-1 mb-sm-2 fw-bold" style={{ color: "#0F172A" }}>
                    {calculateUsers.toLocaleString()}
                  </div>
                  <div className="small d-none d-sm-block" style={{ color: muted }}>
                    คน {/* ถุง (ความจุ {defaultBagCapacity}) */}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Charts */}
          <section className="row g-3 g-md-4">
            {/* Score Distribution */}
            <div className="col-lg-7">
              <div className="card shadow-sm h-100" style={{ background: surface, borderTop: "3px solid #3B82F6" }}>
                <div className="card-header bg-white py-3 py-sm-4">
                  <h6 className="mb-1 fw-bold">ช่วงคะแนนรวม</h6>
                  <small className="d-none d-sm-block" style={{ color: muted }}>
                    กราฟแสดงช่วงคะแนนรวมทั้งหมดทุกวิชา
                  </small>
                </div>
                <div className="card-body p-3 p-sm-4" style={{ minHeight: 300 }}>
                  <div className="h-100 d-flex align-items-center justify-content-center rounded">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={scoreChartData}>
                        <XAxis
                          dataKey="range"
                          tick={{ fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip formatter={(value) => [`${value} คน`, "จำนวน"]} />
                        <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Bags by Session */}
            <div className="col-lg-5">
              <div className="d-flex flex-column gap-3 gap-md-4 h-100">
                <div style={{ background: surface }}>
                  {bagCounts.length > 0 && (
                    <div className="card shadow-sm" style={{ background: surface, borderTop: "3px solid #8B5CF6" }}>
                      <div className="card-header bg-white py-3 py-sm-4">
                        <h6 className="mb-0 fw-bold">จำนวนถุงข้อสอบในแต่ละวิชา</h6>
                      </div>
                      <div className="card-body p-3 p-sm-4" style={{ minHeight: 420 }}>
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={bagCounts}
                              dataKey="bagCount"
                              nameKey="sessionLabel"
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={75}
                              paddingAngle={3}
                              label={renderLabel}
                              labelLine={{ stroke: "#94A3B8", strokeWidth: 1 }}
                            >
                              {bagCounts.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={pieColors[index % pieColors.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number, name: string) => {
                                const item = bagCounts.find((b) => b.sessionLabel === name);
                                return [`${value} ถุง`, item?.sessionFullLabel ?? name];
                              }}
                              contentStyle={{
                                background: "#FFFFFF",
                                border: `1px solid ${border}`,
                                borderRadius: 10,
                                boxShadow: "0 6px 20px rgba(15, 69, 195, 0.08)",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>

                        {/* Custom Legend */}
                        <div className="mt-3 d-flex flex-column gap-2">
                          {bagCounts.map((item, index) => (
                            <div key={item.sessionId} className="d-flex align-items-start gap-2">
                              <span
                                className="rounded-circle flex-shrink-0 mt-1"
                                style={{
                                  width: 10,
                                  height: 10,
                                  backgroundColor: pieColors[index % pieColors.length],
                                  display: "inline-block",
                                }}
                              />
                              <div className="small" style={{ color: "#334155", lineHeight: 1.3 }}>
                                <span className="fw-semibold">{item.sessionLabel}</span>
                                {" "}
                                <span className="text-muted">
                                  ({(item as any).sessionFullLabel?.replace(`${item.sessionLabel} `, "") ?? ""})
                                </span>
                                <span className="ms-1 fw-bold" style={{ color: pieColors[index % pieColors.length] }}>
                                  {item.bagCount} ถุง
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary box */}
                <div className="card shadow-sm" style={{ background: surface, borderTop: "3px solid #10B981" }}>
                  <div className="card-body p-2 p-sm-3">
                    <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2">
                      <div>
                        <div className="fw-bold mb-1 small" style={{ color: primary }}>
                          ผู้ตรวจ
                        </div>
                        <div className="h6 h-sm-5 mb-0" style={{ color: "#0F172A" }}>
                          {gradersCount} คน
                        </div>
                      </div>
                      <div className="text-start text-sm-end">
                        <div className="fw-bold mb-1 small" style={{ color: primary }}>
                          คีย์สำหรับการเข้ารหัส
                        </div>
                        <div className="h6 h-sm-5 mb-0" style={{ color: "#0F172A" }}>
                          {keysCount} คีย์
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="card shadow-sm" style={{ background: surface, borderLeft: "3px solid #F59E0B" }}>
                <div className="card-header bg-white py-2 py-sm-3">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                    <h6 className="mb-0 fw-bold small">หัวข้อสอบในแต่ละวิชา</h6>
                    <span
                      className="badge rounded-pill fw-semibold text-nowrap"
                      style={badgeStyle("neutral")}
                    >
                      โครงสร้างข้อสอบ
                    </span>
                  </div>
                </div>

                <div
                  className="card-body p-2 p-sm-3"
                  style={{ maxHeight: 360, overflowY: "auto" }}
                >
                  {subjectQuestionList.length === 0 && (
                    <div className="text-muted small">
                      ยังไม่มีการกำหนดหัวข้อในรายวิชา
                    </div>
                  )}

                  {subjectQuestionList.map((subj) => {
                    return (
                      <div
                        key={subj.subjectId}
                        className="mb-3 pb-2 border-bottom"
                        style={{ borderColor: "#E2E8F0" }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-semibold" style={{ color: "#0F172A" }}>
                              {subj.name}
                            </div>
                            <small>
                              รหัสวิชา: {subj.code}
                            </small>

                            {/* จำนวนหัวข้อ + คะแนนเต็มรวม */}
                            <div className="small" style={{ color: muted }}>
                              {subj.questionCount} หัวข้อ | คะแนนเต็มรวม{" "}
                              {subj.totalMaxScore}
                            </div>

                            {/* ⬇⬇ แสดงรอบสอบที่วิชานี้เปิดสอบ ⬇⬇ */}
                            {subj.sessionCodes && subj.sessionCodes.length > 0 && (
                              <div className="small" style={{ color: muted }}>
                                ลำดับวันสอบ:{" "}
                                {subj.sessionCodes.join(" • ")}
                                {/* เช่น "วันที่ 1 • วันที่ 2" */}
                              </div>
                            )}
                          </div>
                        </div>

                        <ul className="small mt-2 mb-0" style={{ color: "#475569" }}>
                          {subj.questions.map((q) => (
                            <li
                              key={q.id}
                              className="d-flex justify-content-between align-items-center mb-1"
                            >
                              <span>
                                ข้อ {q.questionNo}: {q.label}
                              </span>
                              <span className="text-muted">
                                {Number(q.maxScore).toLocaleString()} คะแนน
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}

                </div>
              </div>
            </div>

            {/* Grading Status Table */}
            {dashboardData?.rawStatus && dashboardData.rawStatus.length > 0 && (
              <div className="col-12">
                <div className="card shadow-sm" style={{ background: surface, borderLeft: "3px solid #0EA5E9" }}>
                  <div className="card-header bg-white py-2 py-sm-3">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                      <h6 className="mb-0 fw-bold small">สถานะการตรวจข้อสอบ</h6>
                      <span
                        className="badge rounded-pill fw-semibold text-nowrap"
                        style={badgeStyle("neutral")}
                      >
                        รายละเอียด
                      </span>
                    </div>
                  </div>

                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-sm table-hover align-middle mb-0" style={{ tableLayout: "fixed", width: "100%" }}>
                        <thead style={{ background: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                          <tr>
                            <th className="px-3 py-2 small fw-semibold" style={{ color: primary, width: "25%" }}>รอบสอบ/วิชา</th>
                            <th className="px-2 py-2 small fw-semibold text-center" style={{ color: primary, width: "10%" }}>ผู้สอบ</th>
                            <th className="px-2 py-2 small fw-semibold text-center" style={{ color: primary, width: "10%" }}>ข้อ</th>
                            <th className="px-2 py-2 small fw-semibold text-center" style={{ color: primary, width: "15%" }}>ช่องตรวจคะแนนทั้งหมด</th>
                            {/* <th className="px-2 py-2 small fw-semibold text-center" style={{ color: primary, width: "15%" }}>ช่องตรวจคะแนนปัจจุบัน</th> */}
                            <th className="px-2 py-2 small fw-semibold text-center" style={{ color: primary, width: "25%" }}>เสร็จ</th>
                            {/* <th className="px-2 py-2 small fw-semibold text-center" style={{ color: primary }}>คะแนนห่างเกิน 4</th>
                            <th className="px-2 py-2 small fw-semibold text-center" style={{ color: primary }}>Pending</th>
                            <th className="px-2 py-2 small fw-semibold text-center" style={{ color: primary }}>สถานะ</th> */}
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.rawStatus.map((item, idx) => {
                            const session = Object.values(dashboardData.sessions || {}).find(
                              (s) => s.sessionId === item.session_id
                            );
                            const subject = Object.values(dashboardData.subjectQuestions || {}).find(
                              (s) => s.subjectId === item.subject_id
                            );

                            const isComplete = item.missing_slots === 0 && item.mismatch_question_count === 0;
                            const hasIssues = item.missing_slots > 0 || item.mismatch_question_count > 0;
                            const progressPercent = item.expected_slots > 0
                              ? Math.round((Number(item.completed_slots) / item.expected_slots) * 100)
                              : 0;

                            return (
                              <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                <td className="px-3 py-3">
                                  <div className="fw-semibold small" style={{ color: "#0F172A" }}>
                                    {session?.sessionCode || `Session ${item.session_id}`}
                                  </div>
                                  <div className="small text-muted text-truncate" style={{ maxWidth: "200px" }} title={subject?.name}>
                                    {subject?.name || `Subject ${item.subject_id}`}
                                  </div>
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <span className="badge bg-light text-dark border small">
                                    {item.booklet_count}
                                  </span>
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <span className="badge bg-light text-dark border small">
                                    {item.question_count}
                                  </span>
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <div className="small fw-semibold" style={{ color: item.actual_slots === item.expected_slots ? "#059669" : "#DC2626" }}>
                                    {/* {item.actual_slots}/{item.expected_slots} */}
                                    {item.expected_slots}
                                  </div>
                                </td>
                                {/* <td className="px-2 py-3 text-center">
                                  <span className={`badge ${item.actual_slots === item.expected_slots ? "bg-success-subtle text-success border border-success" : "bg-danger-subtle text-danger border border-danger"} small`}>
                                    {item.actual_slots}
                                  </span>
                                </td> */}
                                <td className="px-2 py-3 text-center">
                                  <div className="small fw-semibold mb-1" style={{ color: "#0891B2" }}>
                                    {item.completed_slots}/{item.expected_slots}
                                  </div>
                                  <div className="progress" style={{ height: "6px" }}>
                                    <div
                                      className="progress-bar bg-info"
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                  <div className="small text-muted mt-1" style={{ fontSize: "0.7rem" }}>
                                    {progressPercent}%
                                  </div>
                                </td>
                                {/* <td className="px-2 py-2 text-center">
                                  <span className={`badge ${Number(item.disputed_slots) > 0 ? "bg-warning" : "bg-light border"} small`}>
                                    {item.disputed_slots}
                                  </span>
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <span className={`badge ${Number(item.pending_slots) > 0 ? "bg-warning" : "bg-light border"} small`}>
                                    {item.pending_slots}
                                  </span>
                                </td> */}
                                {/* <td className="px-2 py-2 text-center">
                                  {isComplete ? (
                                    <span className="badge bg-success-subtle text-success border border-success small">
                                      ✓ ปกติ
                                    </span>
                                  ) : hasIssues ? (
                                    <span className="badge bg-danger-subtle text-danger border border-danger small">
                                      ⚠ ผิดปกติ
                                    </span>
                                  ) : (
                                    <span className="badge bg-light text-dark border small">
                                      กำลังดำเนินการ
                                    </span>
                                  )}
                                </td> */}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Legend */}
                    <div className="p-2 p-sm-3 border-top" style={{ background: "#FAFAFA" }}>
                      {/* <div className="row g-2 small text-muted">
                        <div className="col-6 col-md-3">
                          <strong>Slots:</strong> จำนวน slot ที่สร้าง/ต้องการ
                        </div>
                        <div className="col-6 col-md-3">
                          <strong>แจกงาน:</strong> จำนวน slot ที่แจกให้ผู้ตรวจ
                        </div>
                        <div className="col-6 col-md-3">
                          <strong>Dispute:</strong> ข้อที่มีการโต้แย้งคะแนน
                        </div>
                        <div className="col-6 col-md-3">
                          <strong>Pending:</strong> ข้อที่รอ finalize
                        </div>
                      </div> */}
                      {dashboardData.rawDisputedQuestions != null && (
                        <div className="mt-2 pt-2 border-top">
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning">
                            <strong>คำถามที่คะแนนห่างเกิน 4 ทั้งหมด:</strong> {dashboardData.rawDisputedQuestions} ข้อ
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Operational Status (Lists) */}
          <section className="row g-3 g-md-4">
            {/* Import */}
            <div className="col-lg-6">
              <div className="card shadow-sm h-100" style={{ background: surface, borderLeft: "3px solid #F59E0B" }}>
                <div className="card-header bg-white py-3 py-sm-4">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                    <h6 className="mb-0 fw-bold">สถานะการนำเข้าข้อมูล</h6>
                    <span
                      className="badge rounded-pill fw-semibold text-nowrap"
                      style={badgeStyle("neutral")}
                    >
                      รายวิชา
                    </span>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="list-group list-group-flush">
                    {importStatusList.map((s) => {
                      let tone: Tone = "neutral";
                      let textStatus = "รอการนำเข้า";

                      if (s.importStatus === "IMPORTED") {
                        tone = "good";
                        textStatus = "เรียบร้อย";
                      } else if (s.importStatus === "PARTIAL") {
                        tone = "warn";
                        textStatus = "บางส่วน";
                      }

                      return (
                        <div
                          key={s.sessionId}
                          className="list-group-item d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between py-2 py-sm-3 gap-2"
                        >
                          <div className="flex-grow-1">
                            <div className="fw-medium text-dark small">{s.sessionCode} {s.subject_name}</div>
                            <div className="small text-nowrap" style={{ color: muted, fontSize: "0.75rem" }}>
                              ผู้เข้าสอบ: {s.inSession} / {s.inCampaign} คน
                            </div>
                          </div>
                          <span
                            className="badge rounded-pill fw-semibold text-nowrap flex-shrink-0"
                            style={badgeStyle(tone)}
                          >
                            {textStatus}
                          </span>
                        </div>
                      );
                    })}

                    {importStatusList.length === 0 && (
                      <div className="p-4 text-center" style={{ color: muted }}>
                        ไม่มีข้อมูลรอบสอบ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>


            {/* Encryption */}
            <div className="col-lg-6">
              <div className="card shadow-sm h-100" style={{ background: surface, borderLeft: "3px solid #8B5CF6" }}>
                <div className="card-header bg-white py-3 py-sm-4">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                    <h6 className="mb-0 fw-bold">สถานะการเข้ารหัสข้อมูลเพื่อสร้างคิวอาร์โค้ด</h6>
                    <span
                      className="badge rounded-pill fw-semibold text-nowrap"
                      style={badgeStyle("neutral")}
                    >
                      รายวิชา
                    </span>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="list-group list-group-flush">
                    {encryptedStatusList.map((s) => {
                      let tone: Tone = "neutral";
                      let textStatus = "ยังไม่ทำ";

                      if (s.status === "ENCRYPTED_ALL") {
                        tone = "good";
                        textStatus = "เรียบร้อย";
                      } else if (s.status === "PARTIAL") {
                        tone = "warn";
                        textStatus = `ค้าง ${s.pending}`;
                      }

                      return (
                        <div
                          key={s.sessionId}
                          className="list-group-item d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between py-2 py-sm-3 gap-2"
                        >
                          <div className="flex-grow-1">
                            <div className="fw-medium text-dark small">{s.sessionCode} {s.subject_name}</div>
                            <div className="small text-nowrap" style={{ color: muted, fontSize: "0.75rem" }}>
                              เข้ารหัสแล้ว: {s.encrypted} / {s.totalUsersInSession} คน
                            </div>
                          </div>
                          <span
                            className="badge rounded-pill fw-semibold text-nowrap flex-shrink-0"
                            style={badgeStyle(tone)}
                          >
                            {textStatus}
                          </span>
                        </div>
                      );
                    })}

                    {encryptedStatusList.length === 0 && (
                      <div className="p-4 text-center" style={{ color: muted }}>
                        ไม่มีข้อมูลรอบสอบ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-sm h-100" style={{ background: surface, borderLeft: "3px solid #22C55E" }}>
                <div className="card-header bg-white py-3 py-sm-4">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                    <h6 className="mb-0 fw-bold">สถานะการจัดสรรที่นั่งสอบ</h6>
                    <span
                      className="badge rounded-pill fw-semibold text-nowrap"
                      style={badgeStyle("neutral")}
                    >
                      ห้องสอบ
                    </span>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="list-group  list-group-flush">
                    {dashboardData?.seatAssignmentStatus && dashboardData.seatAssignmentStatus.length > 0 ? (
                      dashboardData.seatAssignmentStatus.map((item, idx) => {
                        const occupancyPercent = item.capacity > 0
                          ? Math.round((item.count_user / item.capacity) * 100)
                          : 0;
                        const tone: Tone = item.count_user === item.capacity ? "good" : item.count_user > 0 ? "neutral" : "neutral";

                        return (
                          <div
                            key={idx}
                            className="list-group-item list-group-item border-bottom  d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between py-2 py-sm-3 gap-2"
                          >
                            <div className="flex-grow-1">
                              <div className="fw-medium text-dark small">{item.room_code}</div>
                              <div className="small text-nowrap" style={{ color: muted, fontSize: "0.75rem" }}>
                                จัดสรรที่นั่งผู้เข้าสอบแล้ว: {item.count_user} / {item.capacity} คน
                              </div>
                            </div>
                            <span
                              className="badge rounded-pill fw-semibold text-nowrap flex-shrink-0"
                              style={badgeStyle(tone)}
                            >
                              {occupancyPercent}%
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center" style={{ color: muted }}>
                        ไม่มีข้อมูลการจัดสรรที่นั่งสอบ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card shadow-sm h-100" style={{ background: surface, borderLeft: "3px solid #EF4444" }}>
                <div className="card-header bg-white py-3 py-sm-4">
                  <div className="d-flex flex-column  flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                    <h6 className="mb-0 fw-bold">สถานะการนำเส่งเล่มข้อสอบ (ลงถุง)</h6>
                    <span
                      className="badge rounded-pill fw-semibold text-nowrap"
                      style={badgeStyle("neutral")}
                    >
                      จำนวนสมุดข้อสอบ
                    </span>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="list-group list-group-flush">
                    {dashboardData?.rawBookletsBySession && dashboardData.rawBookletsBySession.length > 0 ? (
                      dashboardData.rawBookletsBySession.map((item) => {
                        return (
                          <div
                            key={item.session_id}
                            className="list-group-item d-flex flex-column list-group-item border-bottom d-flex  flex-sm-row align-items-start align-items-sm-center justify-content-between py-2 py-sm-3 gap-2"
                          >
                            <div className="flex-grow-1">
                              <div className="fw-medium text-dark small">{item.session_code} {item.subject_name}</div>
                              {/* <div className="small text-nowrap" style={{ color: muted, fontSize: "0.75rem" }}>
                                จำนวนสมุดที่ส่ง: {item.count}
                              </div> */}
                            </div>
                            <span
                              className=" rounded-pill fw-semibold text-nowrap flex-shrink-0"

                            >
                              {item.count} เล่ม
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center" style={{ color: muted }}>
                        ไม่มีข้อมูลการนำเส่ง
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>


          </section>

          {/* PieChart ตามรอบสอบ (UI เดิมที่มีอยู่แล้ว) */}
          {/* {bagCounts.length > 0 && (
            <div className="card shadow-sm" style={{ background: surface }}>
              <div className="card-header bg-white py-3">
                <h6 className="mb-0 fw-bold">สัดส่วนถุงข้อสอบแบ่งตามวันที่สอบ</h6>
              </div>
              <div className="card-body" style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bagCounts}
                      dataKey="bagCount"
                      nameKey="sessionLabel"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {bagCounts.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#FFFFFF",
                        border: `1px solid ${border}`,
                        borderRadius: 10,
                        boxShadow: "0 6px 20px rgba(15, 23, 42, 0.08)",
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )} */}
        </>

      </div>
    </ShowIfCan>
  );
}
