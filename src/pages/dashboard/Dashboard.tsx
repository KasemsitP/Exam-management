// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState, ChangeEvent } from "react";
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
import {
  CalendarDays,
  GraduationCap,
  Package,
  ClipboardList,
  AlertTriangle,
  Flag,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import {
  selectCurrentSession,
  sessionSelected,
} from "@/store/slices/sessions.slice";
import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
  selectSubjectsForSession,
} from "@/store/slices/examData.slice";
import { selectDefaultBagCapacity } from "@/store/slices/bags.slice";
import { selectSeatViolations } from "@/store/slices/seats.slice";
import { selectCurrentUser } from "@/store/slices/auth.slice";

const primary = "#0EA5E9";
const muted = "#9AA3AD";
const pieColors = ["#0EA5E9", "#22C55E", "#F97316", "#A855F7", "#EC4899"];

/* ---------- Types ที่ match กับ backend JSON ---------- */

interface ScoreBucketsRaw {
  "0-24": number;
  "25-49": number;
  "50-74": number;
  "75-100": number;
}

interface ScoreDistributionSummary {
  totalUsers: number;
  noScore: number;
  buckets: ScoreBucketsRaw;
}

interface DashboardSummary {
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
  scoreDistribution: ScoreDistributionSummary;
}

interface SessionDashboard {
  sessionId: number;
  sessionCode: string;
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

interface AvgScorePerQuestionApi {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  questionId: number;
  questionNo: number;
  label: string;
  avgScore: number;
}

interface DashboardApiResponse {
  summary: DashboardSummary;
  sessions: Record<string, SessionDashboard>; // Key เป็น String ID
  avgScorePerQuestion: AvgScorePerQuestionApi[];
}

/* ---------- Types ฝั่ง UI ---------- */

interface ScoreBucket {
  rangeLabel: string;
  count: number;
}

interface BagCount {
  sessionId: number;
  sessionLabel: string;
  bagCount: number;
  [key: string]: any; 
}

interface ImportStatusUI {
  sessionId: number;
  sessionCode: string;
  inCampaign: number;
  inSession: number;
  importStatus: "NOT_IMPORTED" | "PARTIAL" | "IMPORTED";
}

interface EncryptedStatusUI {
  sessionId: number;
  sessionCode: string;
  status: "NOT_ENCRYPTED" | "PARTIAL" | "ENCRYPTED_ALL";
  encrypted: number;
  pending: number;
  totalUsersInSession: number;
}

interface QuestionAverage {
  name: string; // เช่น LAW101 ข้อ 1
  average: number;
}

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const currentSession = useAppSelector(selectCurrentSession);
  const sessions = useAppSelector(selectActiveCampaignSessions);
  const subjects = useAppSelector(
    activeCampaign && currentSession
      ? selectSubjectsForSession(activeCampaign.id, currentSession.id)
      : () => []
  );

  const defaultBagCapacity = useAppSelector(selectDefaultBagCapacity);
  const seatViolations = useAppSelector(selectSeatViolations);
  const user = useAppSelector(selectCurrentUser);

  /* ---------- Local state ของ dashboard ---------- */

  const [dashboardData, setDashboardData] =
    useState<DashboardApiResponse | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // ยิง axios ตรง เมื่อ activeCampaign เปลี่ยน
  useEffect(() => {
    if (!activeCampaign?.id) return;

    const fetchDashboard = async () => {
      try {
        setLoadingDashboard(true);
        setDashboardError(null);

        // TODO: เปลี่ยน URL นี้ให้ตรงกับ API จริงของคุณ
        // const res = await axios.get<DashboardApiResponse>(
        //   `/api/keys/dashboard/${Number(activeCampaign.id)}`
        // );

        // --- MOCK DATA FOR DEMO PURPOSE (ใช้ข้อมูล JSON ที่ให้มา) ---
        const mockResponse: DashboardApiResponse = {
          summary: {
            campaignId: 1,
            sessionCount: 2,
            subjectCount: 2,
            graders: {
              total: 11,
              withLogin: 11,
            },
            keys: {
              total: 2,
              active: 2,
            },
            scoreDistribution: {
              totalUsers: 12,
              noScore: 11,
              buckets: {
                "0-24": 0,
                "25-49": 0,
                "50-74": 0,
                "75-100": 1,
              },
            },
          },
          sessions: {
            "10": {
              sessionId: 10,
              sessionCode: "2025A-D1",
              bags: {
                total: 3,
                capacity: 62,
              },
              users: {
                inCampaign: 12,
                inSession: 12,
              },
              importStatus: "IMPORTED",
              encryption: {
                status: "ENCRYPTED_ALL",
                encrypted: 12,
                pending: 0,
              },
            },
            "11": {
              sessionId: 11,
              sessionCode: "2025A-D2",
              bags: {
                total: 2,
                capacity: 31,
              },
              users: {
                inCampaign: 12,
                inSession: 12,
              },
              importStatus: "IMPORTED",
              encryption: {
                status: "ENCRYPTED_ALL",
                encrypted: 12,
                pending: 0,
              },
            },
          },
          avgScorePerQuestion: [],
        };

        // Simulate delay
        setTimeout(() => {
          setDashboardData(mockResponse);
          setLoadingDashboard(false);
        }, 500);
        // --- END MOCK ---
      } catch (err: any) {
        console.error("Fetch dashboard error:", err);
        setDashboardError("โหลดข้อมูลแดชบอร์ดไม่สำเร็จ");
        setDashboardData(null);
        setLoadingDashboard(false);
      }
    };

    fetchDashboard();
  }, [activeCampaign?.id]);

  /* ---------- LOGGING SECTION (Log ทุกค่าที่ได้มา) ---------- */
  useEffect(() => {
    if (dashboardData) {
      console.group("📊 Dashboard Data Loaded");
      console.log("1. Full Response Object:", dashboardData);
      console.log("2. Summary:", dashboardData.summary);
      console.log("   - Score Distribution:", dashboardData.summary.scoreDistribution);
      console.log("3. Sessions (Object Keys):", Object.keys(dashboardData.sessions));
      console.log("   - Sessions (Array Values):", Object.values(dashboardData.sessions));
      console.log("4. Avg Score Per Question:", dashboardData.avgScorePerQuestion);
      console.groupEnd();
    }
  }, [dashboardData]);

  /* ---------- แปลงข้อมูลจาก dashboardData ---------- */

  const totalUsersInCampaign = useMemo(() => {
    if (!dashboardData) return 0;
    return dashboardData.summary.scoreDistribution.totalUsers ?? 0;
  }, [dashboardData]);

  const graderCount = useMemo(() => {
    if (!dashboardData) return 0;
    return dashboardData.summary.graders.total ?? 0;
  }, [dashboardData]);

  const keyCount = useMemo(() => {
    if (!dashboardData) return 0;
    return dashboardData.summary.keys.total ?? 0;
  }, [dashboardData]);

  const scoreBuckets: ScoreBucket[] = useMemo(() => {
    if (!dashboardData) return [];
    const sd = dashboardData.summary.scoreDistribution;
    const buckets = [
      { rangeLabel: "0–24", count: sd.buckets["0-24"] ?? 0 },
      { rangeLabel: "25–49", count: sd.buckets["25-49"] ?? 0 },
      { rangeLabel: "50–74", count: sd.buckets["50-74"] ?? 0 },
      { rangeLabel: "75–100", count: sd.buckets["75-100"] ?? 0 },
      { rangeLabel: "ไม่มีคะแนน", count: sd.noScore ?? 0 },
    ];
    // Log bucket calculation
    console.log("📈 Calculated Score Buckets for Chart:", buckets);
    return buckets;
  }, [dashboardData]);

  const bagCounts: BagCount[] = useMemo(() => {
    if (!dashboardData) return [];
    const bags = Object.values(dashboardData.sessions).map((s) => ({
      sessionId: s.sessionId,
      sessionLabel: s.sessionCode,
      bagCount: s.bags.total ?? 0,
    }));
    console.log("👜 Calculated Bag Counts for Pie Chart:", bags);
    return bags;
  }, [dashboardData]);

  const importStatusList: ImportStatusUI[] = useMemo(() => {
    if (!dashboardData) return [];
    return Object.values(dashboardData.sessions).map((s) => ({
      sessionId: s.sessionId,
      sessionCode: s.sessionCode,
      inCampaign: s.users.inCampaign,
      inSession: s.users.inSession,
      importStatus: s.importStatus,
    }));
  }, [dashboardData]);

  const encryptedStatusList: EncryptedStatusUI[] = useMemo(() => {
    if (!dashboardData) return [];
    return Object.values(dashboardData.sessions).map((s) => ({
      sessionId: s.sessionId,
      sessionCode: s.sessionCode,
      status: s.encryption.status,
      encrypted: s.encryption.encrypted,
      pending: s.encryption.pending,
      totalUsersInSession: s.users.inSession,
    }));
  }, [dashboardData]);

  const questionAverages: QuestionAverage[] = useMemo(() => {
    if (!dashboardData || !dashboardData.avgScorePerQuestion) return [];
    const avgs = dashboardData.avgScorePerQuestion.map((q) => ({
      name: `${q.subjectCode} ข้อ ${q.questionNo}`,
      average: q.avgScore ?? 0,
    }));
    console.log("📝 Calculated Question Averages:", avgs);
    return avgs;
  }, [dashboardData]);

  // รวมถุงใน campaign
  const totalBagsInCampaign = useMemo(
    () => bagCounts.reduce((sum, b) => sum + b.bagCount, 0),
    [bagCounts]
  );

  // TODO: ไว้ต่อกับ grading slice จริงทีหลัง
  const gradingQueue: any[] = [];

  // ธงคัดกรองคะแนน (ใช้ logic เดิม - แต่ข้อมูลยังไม่มีใน JSON นี้)
  const discrepancyFlags = useMemo(() => {
    type Q = {
      no?: number;
      number?: number;
      scoreA?: number;
      scoreB?: number;
      grader1?: number;
      grader2?: number;
      firstScore?: number;
      secondScore?: number;
    };

    const THRESHOLD = 4;
    const flags: { bookletSerial: string; questionNo: number; diff: number }[] =
      [];

    gradingQueue.forEach((job: any) => {
      const serial =
        job.bookletSerial ?? job.serial ?? String(job.id ?? "N/A");
      const questions: Q[] = job.questions ?? [];

      questions.forEach((q) => {
        const questionNo = q.no ?? q.number ?? 0;
        const s1 =
          q.scoreA ??
          q.grader1 ??
          q.firstScore ??
          undefined;
        const s2 =
          q.scoreB ??
          q.grader2 ??
          q.secondScore ??
          undefined;

        if (typeof s1 === "number" && typeof s2 === "number") {
          const diff = Math.abs(s1 - s2);
          if (diff > THRESHOLD) {
            flags.push({
              bookletSerial: String(serial),
              questionNo,
              diff,
            });
          }
        }
      });
    });

    return flags;
  }, [gradingQueue]);

  const handleSessionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const sessionId = e.target.value;
    const selectedSession = sessions.find(
      (s: any) => String(s.id) === sessionId
    );
    if (selectedSession) {
      dispatch(sessionSelected(selectedSession.id));
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="card border-0 shadow-sm">
        <div className="card-body d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
          <div>
            <div className="text-uppercase small text-muted mb-1">
              แดชบอร์ดการจัดสอบ
            </div>
            <h2 className="h4 mb-1">
              {currentSession?.label ?? "ยังไม่มีรอบสอบที่เลือก"}
            </h2>
            <div className="small text-muted">
              {user?.name ?? "ผู้ใช้ทั่วไป"} | บทบาท:{" "}
              {(user?.roles ?? ["viewer"]).join(", ")}
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              style={{ width: "200px" }}
              value={currentSession?.id ?? ""}
              onChange={handleSessionChange}
            >
              <option value="">-- เลือกรอบสอบ --</option>
              {sessions.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>

            <span className="badge text-bg-light d-inline-flex align-items-center gap-1">
              <CalendarDays size={14} />
              {currentSession?.examDate
                ? new Date(currentSession.examDate).toLocaleDateString(
                    "th-TH",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )
                : "ยังไม่กำหนดวันที่"}
            </span>
            <span className="badge text-bg-light d-inline-flex align-items-center gap-1">
              <GraduationCap size={14} />
              {subjects.length} รายวิชา
            </span>
            <span className="badge text-bg-light d-inline-flex align-items-center gap-1">
              <Package size={14} />
              ความจุถุงมาตรฐาน {defaultBagCapacity} เล่ม
            </span>
          </div>
        </div>
      </div>

      {/* Loading / Error state */}
      {loadingDashboard && (
        <div className="alert alert-info py-2 mb-0">
          กำลังโหลดข้อมูลแดชบอร์ด...
        </div>
      )}
      {dashboardError && (
        <div className="alert alert-danger py-2 mb-0">{dashboardError}</div>
      )}

      {/* Stat cards */}
      <section className="row g-3">
        {/* จำนวนรอบสอบ */}
        <div className="col-lg-3 col-sm-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">จำนวนรอบสอบ</div>
              <div className="h3 mb-1">
                {dashboardData?.summary.sessionCount ?? sessions.length}
              </div>
              <div className="small text-muted">
                แคมเปญนี้มีกำหนด{" "}
                {dashboardData?.summary.sessionCount ?? sessions.length}{" "}
                รอบเพื่อบริหารสนามสอบทั้งหมด
              </div>
            </div>
          </div>
        </div>

        {/* รายวิชาที่จัดสอบ */}
       <div className="col-lg-3 col-sm-6">
          <div className="card shadow-sm h-100">
            {/* เพิ่ม d-flex flex-column เพื่อจัดระยะห่างข้างใน */}
            <div className="card-body d-flex flex-column">
              <div className="text-muted small">รายวิชาที่จัดสอบ</div>
              <div className="h3 mb-1">{subjects.length}</div>

              {/* --- ส่วนที่เพิ่มใหม่: รายการวิชา --- */}
              <div 
                className="my-2 pe-1 overflow-y-auto custom-scrollbar" 
                style={{ maxHeight: '80px' }} // กำหนดความสูงเพื่อให้ scroll ได้ถ้าวิชาเยอะ
              >
                {subjects.length > 0 ? (
                  subjects.map((s: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="d-flex align-items-center justify-content-between small border-bottom border-light py-1"
                    >
                      {/* ตรวจสอบ Property ชื่อวิชา/รหัสวิชา ให้ตรงกับ Store ของคุณ */}
                      <span className="fw-medium text-primary" style={{ fontSize: '0.85rem' }}>
                        {s.code || s.subjectCode || "CODE"}
                      </span>
                      <span className="text-muted text-truncate ms-2" style={{ maxWidth: '120px' }} title={s.name}>
                        {s.name || s.subjectName || "ชื่อวิชา"}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-muted small fst-italic">- ยังไม่มีข้อมูลรายวิชา -</span>
                )}
              </div>
              {/* ---------------------------------- */}

              {/* ย้ายสรุปชุดคำถามไปไว้ด้านล่างสุด */}
              <div className="small text-muted mt-auto pt-1 border-top">
                รวม{" "}
                {subjects.reduce(
                  (t, s: any) => t + (s.questions ?? 0),
                  0
                )}{" "}
                ชุดคำถาม
              </div>
            </div>
          </div>
               </div>

        {/* จำนวนผู้เข้าสอบรวมทั้ง campaign */}
        <div className="col-lg-3 col-sm-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">
                จำนวนผู้เข้าสอบในแคมเปญนี้
              </div>
              <div className="h3 mb-1">{totalUsersInCampaign ?? 0}</div>
              <div className="small text-muted">
                รวมผู้เข้าสอบทั้งหมดในแคมเปญ {activeCampaign?.name ?? ""}
              </div>
            </div>
          </div>
        </div>

        {/* ผู้ตรวจ & คีย์ */}
        <div className="col-lg-3 col-sm-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">
                ผู้ตรวจ 
              </div>
              <div className="h3 mb-1">
                {graderCount} 
              </div>
              <div className="small text-muted">
                ผู้ตรวจทั้งหมดภายในรอบสอบนี้
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">
                จำนวณคีย์เข้ารหัส
              </div>
              <div className="h3 mb-1">
                {keyCount} 
              </div>
              <div className="small text-muted">
                คีย์เข้ารหัสถายในรอบสอบนี้
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Charts (Score distribution + Bag per session) */}
      <section className="row g-3">
        {/* ช่วงคะแนน */}
        <div className="col-lg-8">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white">
              <h6 className="mb-0">ช่วงคะแนน</h6>
              <small className="text-muted">
                แจกแจงจำนวนผู้เข้าสอบในแต่ละช่วงคะแนน
              </small>
            </div>
            <div className="card-body" style={{ height: 300 }}>
              {!dashboardData || scoreBuckets.length === 0 ? (
                <p className="text-muted small mb-0 d-flex align-items-center justify-content-center h-100">
                  ยังไม่มีข้อมูลคะแนนสำหรับสร้างกราฟ
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreBuckets}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      strokeOpacity={0.2}
                    />
                    <XAxis dataKey="rangeLabel" stroke={muted} />
                    <YAxis stroke={muted} allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name="จำนวนผู้เข้าสอบ"
                      fill={primary}
                      radius={[6, 6, 0, 0]}
                      barSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ถุงข้อสอบตามรอบสอบ */}
        <div className="col-lg-4 d-flex flex-column gap-3">
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h6 className="mb-0">ถุงข้อสอบตามรอบสอบ</h6>
              <small className="text-muted">
                จำนวนถุงในแต่ละ session (รวมทั้งหมด {totalBagsInCampaign}{" "}
                ถุง)
              </small>
            </div>
            <div className="card-body" style={{ height: 260 }}>
              {bagCounts.length === 0 ? (
                <p className="text-muted small mb-0 d-flex align-items-center justify-content-center h-100">
                  ยังไม่มีข้อมูลถุงข้อสอบ
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bagCounts}
                      dataKey="bagCount"
                      nameKey="sessionLabel"
                      cx="50%"
                      cy="45%"
                      outerRadius={70}
                      label
                    >
                      {bagCounts.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* สรุปสถานะการนำเข้า & เข้ารหัส */}
          <div className="card shadow-sm">
            <div className="card-body small">
              <div className="fw-semibold mb-1">
                สถานะการนำเข้า & เข้ารหัส
              </div>

              {/* แสดง campaign ปัจจุบัน */}
              <div className="mb-2 text-muted">
                แคมเปญ:{" "}
                {activeCampaign
                  ? `${
                      activeCampaign.code ??
                      `camp-${activeCampaign.id}`
                    } — ${activeCampaign.name ?? ""}`
                  : "ยังไม่ได้เลือกแคมเปญ"}
              </div>

              {/* นำเข้าผู้เข้าสอบ */}
              <div className="mb-2">
                <div className="fw-semibold">
                  การนำเข้าผู้เข้าสอบตามรอบสอบ
                </div>
                {importStatusList.length === 0 ? (
                  <div className="text-muted">
                    ยังไม่มีข้อมูลการนำเข้าผู้เข้าสอบในแคมเปญนี้
                  </div>
                ) : (
                  <div className="mb-0 ps-3">
                    {importStatusList.map((s) => {
                      let label = "";
                      let colorClass = "text-muted";
                      if (s.importStatus === "IMPORTED") {
                        label = "นำเข้าครบแล้ว";
                        colorClass = "text-success";
                      } else if (s.importStatus === "PARTIAL") {
                        label = "นำเข้าบางส่วน";
                        colorClass = "text-warning";
                      } else {
                        label = "ยังไม่ได้นำเข้า";
                        colorClass = "text-secondary";
                      }
                      return (
                        <div key={s.sessionId}>
                          <span className="fw-medium">{s.sessionCode}</span>:{" "}
                          {s.inSession}/{s.inCampaign} คน —{" "}
                          <span className={colorClass}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <hr className="my-2" />

              {/* สถานะการเข้ารหัส */}
              <div className="mb-2">
                <div className="fw-semibold">
                  สถานะการเข้ารหัส QR ตามรอบสอบ
                </div>
                {encryptedStatusList.length === 0 ? (
                  <div className="text-muted">
                    ยังไม่มีข้อมูลการเข้ารหัสในแคมเปญนี้
                  </div>
                ) : (
                  <div className="mb-0 ps-3">
                    {encryptedStatusList.map((s) => {
                      let label = "";
                      let colorClass = "text-muted";

                      if (s.status === "ENCRYPTED_ALL") {
                        label = "เข้ารหัสครบทุกคนแล้ว";
                        colorClass = "text-success";
                      } else if (s.status === "PARTIAL") {
                        label = `เข้ารหัสแล้ว ${s.encrypted}/${s.totalUsersInSession} คน (ค้าง ${s.pending})`;
                        colorClass = "text-warning";
                      } else {
                        label = "ยังไม่เข้ารหัส";
                        colorClass = "text-secondary";
                      }
                      return (
                        <div key={`enc-${s.sessionId}`}>
                          <span className="fw-medium">{s.sessionCode}</span>:{" "}
                          <span className={colorClass}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom section: คะแนนเฉลี่ยต่อหัวข้อ + Alerts */}
      <section className="row g-3">
        <div className="col-lg-8">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white">
              <h6 className="mb-0">คะแนนเฉลี่ยในแต่ละหัวข้อ</h6>
              <small className="text-muted">
                ค่าคะแนนเฉลี่ย (รวมผู้ตรวจ 2 คนแล้วหาร 2 จาก backend)
              </small>
            </div>
            <div className="card-body" style={{ height: 300 }}>
              {questionAverages.length === 0 ? (
                <p className="text-muted small mb-0 d-flex align-items-center justify-content-center h-100">
                  ยังไม่มีข้อมูลคะแนนหัวข้อสำหรับสร้างกราฟ
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={questionAverages}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      strokeOpacity={0.2}
                    />
                    <XAxis dataKey="name" stroke={muted} />
                    <YAxis
                      stroke={muted}
                      domain={[0, 100]}
                      label={{
                        value: "คะแนน",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="average"
                      name="คะแนนเฉลี่ย"
                      fill={primary}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4 d-flex flex-column gap-3">
          {/* งานตรวจล่าสุด */}
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white d-flex align-items-center justify-content-between">
              <div>
                <h6 className="mb-0">งานตรวจล่าสุด</h6>
                <small className="text-muted">ติดตามสถานะคิวปัจจุบัน</small>
              </div>
              <span className="badge text-bg-secondary d-inline-flex align-items-center gap-1">
                <ClipboardList size={14} />
              </span>
            </div>

            <div className="card-body d-flex flex-column gap-2 small text-muted">
              <div className="text-muted text-center py-4">
                ยังไม่ได้ผูกข้อมูลคิวตรวจ (Mock Grading Queue)
              </div>
            </div>
          </div>

          {/* แจ้งเตือนการจัดที่นั่ง */}
          {seatViolations.length > 0 && (
            <div
              className="card shadow-sm border-warning-subtle"
              style={{ background: "rgba(255,193,7,.15)" }}
            >
              <div className="card-header bg-white d-flex align-items-center gap-2">
                <AlertTriangle size={16} className="text-warning" />
                <div>
                  <h6 className="mb-0">ข้อมูลที่ต้องตรวจสอบ</h6>
                  <small className="text-warning">
                    ระบบพบการแจ้งเตือน {seatViolations.length}{" "}
                    รายการจากการจัดที่นั่ง
                  </small>
                </div>
              </div>
              <div className="card-body d-flex flex-column gap-2 small">
                {seatViolations.map((violation) => (
                  <div
                    key={violation.message}
                    className="border rounded px-2 py-2 bg-warning bg-opacity-10"
                  >
                    {violation.message}
                  </div>
                ))}
                <button className="btn btn-outline-warning btn-sm mt-1">
                  ดูรายละเอียดการจัดที่นั่ง
                </button>
              </div>
            </div>
          )}

          {/* ธงคัดกรองคะแนน */}
          {discrepancyFlags.length > 0 && (
            <div
              className="card shadow-sm border-danger-subtle"
              style={{ background: "rgba(220,53,69,.08)" }}
            >
              <div className="card-header bg-white d-flex align-items-center gap-2">
                <Flag size={16} className="text-danger" />
                <div>
                  <h6 className="mb-0">ธงคัดกรองคะแนน</h6>
                  <small className="text-danger">
                    พบความแตกต่างของคะแนนระหว่างผู้ตรวจเกิน 4 คะแนน จำนวน{" "}
                    {discrepancyFlags.length} รายการ
                  </small>
                </div>
              </div>
              <div className="card-body d-flex flex-column gap-2 small">
                {discrepancyFlags.slice(0, 6).map((f, idx) => (
                  <div
                    key={`${f.bookletSerial}-${f.questionNo}-${idx}`}
                    className="border rounded px-2 py-2 bg-danger bg-opacity-10"
                  >
                    เล่ม {f.bookletSerial} ข้อ {f.questionNo} ต่างกัน{" "}
                    {f.diff} คะแนน {f.diff > 4 && "(เกิน 4 คะแนน)"}
                  </div>
                ))}
                {discrepancyFlags.length > 6 && (
                  <div className="text-muted small">
                    …และอีก {discrepancyFlags.length - 6} รายการ
                  </div>
                )}
                <button className="btn btn-outline-danger btn-sm mt-1">
                  เปิดหน้าคัดกรอง/เทียบคะแนน
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}