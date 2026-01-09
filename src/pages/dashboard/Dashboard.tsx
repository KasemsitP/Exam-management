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
import { CalendarDays, GraduationCap, Package, Users } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import { selectDefaultBagCapacity, selectBagsForCampaign, fetchBagsForCampaignThunk } from "@/store/slices/bags.slice";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import { useDispatch } from "react-redux";

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

interface ScoreDistributionAPI {
  totalUsers: number;
  noScore: number;
  buckets: {
    "0-24": number;
    "25-49": number;
    "50-74": number;
    "75-100": number;
  };
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

interface DashboardApiResponse {
  summary: SummaryAPI;
  sessions: Record<string, SessionAPI>;
  avgScorePerQuestion: any[];
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


type Tone = "neutral" | "good" | "warn";

const badgeStyle = (tone: Tone): React.CSSProperties => {
  if (tone === "good")
    return {
      background: "#F1F5F9",
      color: "#0F172A",
      border: "1px solid #CBD5E1",
    };
  if (tone === "warn")
    return {
      background: "#F8FAFC",
      color: "#334155",
      border: "1px solid #CBD5E1",
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

    const fetchDashboard = async () => {
      try {
        setLoadingDashboard(true);
        setDashboardError(null);

        dispatch(fetchBagsForCampaignThunk(activeCampaign.id))

        const res = await axios.get<DashboardApiResponse>(
          `http://localhost:8000/api/dashboard/campaign/${activeCampaign.id}`
        );

        console.log("Dashboard API:", res.data);
        setDashboardData(res.data);
      } catch (err: any) {
        console.error("Fetch dashboard error:", err);
        setDashboardError("โหลดข้อมูลแดชบอร์ดไม่สำเร็จ หรือเชื่อมต่อ Server ไม่ได้");
        setDashboardData(null);
      } finally {
        setLoadingDashboard(false);
      }
    };

    fetchDashboard();
  }, [activeCampaign?.id]);

  useEffect(() => {
    if (!dashboardData?.summary?.scoreDistribution) return;

    const chartData = buildScoreChartData(
      dashboardData.summary.scoreDistribution
    );
    console.log("Score Chart Data:", chartData);

    setScoreChartData(chartData);
  }, [dashboardData]);


  const buildScoreChartData = (scoreDistribution: any) => {
    if (!scoreDistribution) return [];

    const { buckets, noScore } = scoreDistribution;

    const bucketData = Object.entries(buckets).map(([range, count]) => ({
      range,
      count: Number(count),
    }));

    bucketData.push({
      range: "ยังไม่มีคะแนน",
      count: Number(noScore),
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
  const totalUsersInCampaign = dashboardData?.summary?.scoreDistribution
    ?.totalUsers ?? 0;

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
      bagCount: s.bags.total,
    }));
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

    const radius = innerRadius + (outerRadius - innerRadius) / 2;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
        fill="#fff"
        pointerEvents="none"
      >
        {value}
      </text>
    );
  };

  /* ---------- Render ---------- */

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="card border-0 shadow-sm" style={{ background: surface }}>
        <div className="card-body p-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div>
              <div className="text-uppercase small fw-semibold mb-1" style={{ color: muted }}>
                Dashboard
              </div>
              <h2 className="h4 mb-1  text-dark">
                {activeCampaign ? `${activeCampaign.name}` : "ยังไม่ได้เลือกแคมเปญ"}
              </h2>
              <div className="d-flex align-items-center gap-2 small" style={{ color: muted }}>
                <span>
                  Login โดย: {user?.name ?? "Guest"} ({user?.roles?.join(", ")})
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex flex-column align-items-md-end gap-2"></div>
        </div>
      </div>

      {/* Loading State */}
      {loadingDashboard ? (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="spinner-border mb-3" style={{ color: primary }} role="status"></div>
          <div style={{ color: muted }}>กำลังโหลดข้อมูลจาก Server...</div>
        </div>
      ) : (
        <>
          {dashboardError && (
            <div className="alert alert-danger shadow-sm border-0">{dashboardError}</div>
          )}

          {/* Stat Cards */}
          <section className="row g-3">
            {/* Sessions */}
            <div className="col-lg-3 col-sm-6">
              <div
                className="card shadow-sm h-100 border-start "
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted }}>
                      รอบสอบทั้งหมด
                    </div>
                    <CalendarDays size={18} className="opacity-75" style={{ color: muted }} />
                  </div>
                  <div className="h2 mb-1 fw-bold" style={{ color: "#0F172A" }}>
                    {sessionCount}
                  </div>
                  <div className="small" style={{ color: muted }}>
                    รอบการจัดสอบในแคมเปญนี้
                  </div>
                </div>
              </div>
            </div>

            {/* Subjects */}  {/* border-4 กรอบใหญ่ขึ้น */}
            <div className="col-lg-3 col-sm-6">
              <div
                className="card shadow-sm h-100 border-start "
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted }}>
                      รายวิชา
                    </div>
                    <GraduationCap size={18} className="opacity-75" style={{ color: muted }} />
                  </div>
                  <div className="h2 mb-1 fw-bold" style={{ color: "#0F172A" }}>
                    {subjectCount}
                  </div>
                  <div className="small" style={{ color: muted }}>
                    วิชาที่เปิดสอบทั้งหมด
                  </div>
                </div>
              </div>
            </div>

            {/* Total Users */}
            <div className="col-lg-3 col-sm-6">
              <div
                className="card shadow-sm h-100 border-start"
                style={{ borderLeftColor: "#CBD5E1" }}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted }}>
                      ผู้เข้าสอบ
                    </div>
                    <Users size={18} className="opacity-75" style={{ color: muted }} />
                  </div>
                  <div className="h2 mb-1 fw-bold" style={{ color: "#0F172A" }}>
                    {totalUsersInCampaign.toLocaleString()}
                  </div>
                  <div className="small" style={{ color: muted }}>
                    คน (จากสรุป Score Distribution)
                  </div>
                </div>
              </div>
            </div>

            {/* Bags */}
            <div className="col-lg-3 col-sm-6">
              <div
                className="card shadow-sm h-100 border-start "
                style={{ borderLeftColor: "#CBD5E1" }}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted }}>
                      ถุงข้อสอบ
                    </div>
                    <Package size={18} className="opacity-75" style={{ color: muted }} />
                  </div>
                  <div className="h2 mb-1 fw-bold" style={{ color: "#0F172A" }}>
                    {totalBags}
                  </div>
                  <div className="small" style={{ color: muted }}>
                    ถุง (ความจุมาตรฐาน {defaultBagCapacity})
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Charts (ยังเป็น placeholder ตาม UI เดิม) */}
          <section className="row g-3">
            {/* Score Distribution placeholder */}
            <div className="col-lg-8">
              <div className="card shadow-sm h-100" style={{ background: surface }}>
                <div className="card-header bg-white py-3">
                  <h6 className="mb-0 fw-bold">ช่วงคะแนนรวม</h6>
                  <small style={{ color: muted }}>
                    กราฟแสดงการกระจายตัวของคะแนน
                  </small>
                </div>
                <div className="card-body" style={{ height: 320 }}>
                  <div
                    className="h-100 d-flex align-items-center justify-content-center rounded"
                    style={{
                      color: muted,
                      background: surfaceSoft,
                      border: `1px dashed ${border}`,
                    }}
                  >
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={scoreChartData}>
                        <XAxis dataKey="range" />
                        <YAxis allowDecimals={false} />
                        <Tooltip formatter={(value) => [`${value} คน`, "จำนวน"]} />
                        <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Bags by Session placeholder */}
            <div className="col-lg-4">
              <div className="d-flex flex-column gap-3 h-100">
                <div className="" style={{ background: surface }}>
                  {bagCounts.length > 0 && (
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
                              label={renderLabel}
                              labelLine={false}
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
                                boxShadow: "0 6px 20px rgba(15, 69, 195, 0.08)",
                              }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary box - muted */}
                <div className="card shadow-sm border-0" style={{ background: surfaceSoft }}>
                  <div className="card-body d-flex align-items-center justify-content-between">
                    <div>
                      <div className="fw-bold mb-1" style={{ color: primary }}>
                        ผู้ตรวจ
                      </div>
                      <div className="h5 mb-0" style={{ color: "#0F172A" }}>
                        {gradersCount} คน
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold mb-1" style={{ color: primary }}>
                        Keys
                      </div>
                      <div className="h5 mb-0" style={{ color: "#0F172A" }}>
                        {keysCount} ชุด
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Operational Status (Lists) */}
          <section className="row g-3">
            {/* Import */}
            <div className="col-lg-6">
              <div className="card shadow-sm h-100" style={{ background: surface }}>
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold">สถานะการนำเข้าข้อมูล (Import)</h6>
                  <span
                    className="badge rounded-pill fw-semibold"
                    style={badgeStyle("neutral")}
                  >
                    ราย Session
                  </span>
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
                          className="list-group-item d-flex align-items-center justify-content-between py-3"
                        >
                          <div>
                            <div className="fw-medium text-dark">{s.sessionCode}</div>
                            <div className="small" style={{ color: muted }}>
                              ผู้เข้าสอบ: {s.inSession} / {s.inCampaign} คน
                            </div>
                          </div>
                          <span
                            className="badge rounded-pill fw-semibold"
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
              <div className="card shadow-sm h-100" style={{ background: surface }}>
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold">สถานะการเข้ารหัส (Encryption)</h6>
                  <span
                    className="badge rounded-pill fw-semibold"
                    style={badgeStyle("neutral")}
                  >
                    ราย Session
                  </span>
                </div>
                <div className="card-body p-0">
                  <div className="list-group list-group-flush">
                    {encryptedStatusList.map((s) => {
                      let tone: Tone = "neutral";
                      let textStatus = "ยังไม่ทำ";

                      if (s.status === "ENCRYPTED_ALL") {
                        tone = "good";
                        textStatus = "ครบถ้วน";
                      } else if (s.status === "PARTIAL") {
                        tone = "warn";
                        textStatus = `ค้าง ${s.pending}`;
                      }

                      return (
                        <div
                          key={s.sessionId}
                          className="list-group-item d-flex align-items-center justify-content-between py-3"
                        >
                          <div>
                            <div className="fw-medium text-dark">{s.sessionCode} </div>
                            <div className="small" style={{ color: muted }}>
                              เข้ารหัสแล้ว: {s.encrypted} / {s.totalUsersInSession} คน
                            </div>
                          </div>
                          <span
                            className="badge rounded-pill fw-semibold"
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
      )}
    </div>
  );
}
