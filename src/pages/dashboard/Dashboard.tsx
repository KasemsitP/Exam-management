import { useMemo, ChangeEvent } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  CalendarDays,
  GraduationCap,
  Package,
  ClipboardList,
  AlertTriangle,
  Users,
  Target,
  TrendingUp,
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
import {
  selectBagStatsForCampaign,
  selectDefaultBagCapacity,
} from "@/store/slices/bags.slice";
import { selectSeatViolations } from "@/store/slices/seats.slice";
import { selectCurrentUser } from "@/store/slices/auth.slice";

const weeklyGradingData = [
  { name: "จันทร์", graded: 120, pending: 80 },
  { name: "อังคาร", graded: 150, pending: 60 },
  { name: "พุธ", graded: 170, pending: 55 },
  { name: "พฤหัส", graded: 190, pending: 45 },
  { name: "ศุกร์", graded: 210, pending: 35 },
];

// ตัวอย่างสถานะการประมวลผล (เอาไปผูกจริงกับ Redux ทีหลังได้)
const processingStatusData = [
  { name: "ตรวจเสร็จแล้ว", value: 320 },
  { name: "กำลังตรวจ", value: 120 },
  { name: "รอคิว", value: 80 },
];

// สีกราฟ/พายชาร์ต
const primary = "#0EA5E9";
const muted = "#9AA3AD";
const pieColors = ["#0EA5E9", "#22C55E", "#F97316"];

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
  const bagStats = useAppSelector(
    selectBagStatsForCampaign(activeCampaign?.id ?? null)
  );
  const defaultBagCapacity = useAppSelector(selectDefaultBagCapacity);
  const seatViolations = useAppSelector(selectSeatViolations);
  const user = useAppSelector(selectCurrentUser);

  // TODO: เอาไปผูกกับ grading slice จริง เช่น selectGradingQueue
  const gradingQueue: any[] = [];

  const subjectScoreData = useMemo(() => {
    if (!subjects.length) {
      return [
        { name: "MTH101", average: 74, target: 80 },
        { name: "PHY201", average: 69, target: 80 },
        { name: "CHE110", average: 77, target: 80 },
      ];
    }
    return subjects.map((subject, index) => ({
      name: subject.code ?? `SUB-${index + 1}`,
      average: 68 + ((index * 7) % 18),
      target: 80,
    }));
  }, [subjects]);

  // ⭐️ ธงคัดกรองคะแนน (ต่างกัน > 4 คะแนน)
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
              questionNo: questionNo,
              diff,
            });
          }
        }
      });
    });

    return flags;
  }, [gradingQueue]);

  // ถ้าจะเอาไปไฮไลต์ใน "งานตรวจล่าสุด" ก็ใช้ set นี้ได้
  const flaggedSerials = useMemo(() => {
    const s = new Set<string>();
    discrepancyFlags.forEach((f) => s.add(f.bookletSerial));
    return s;
  }, [discrepancyFlags]);

  const handleSessionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const sessionId = e.target.value;
    const selectedSession = sessions.find((s: any) => s.id === sessionId);
    if (selectedSession) {
      dispatch(sessionSelected(sessionId));
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
                ? new Date(
                    currentSession.examDate
                  ).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
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

      {/* Stat cards */}
      <section className="row g-3">
        <div className="col-lg-3 col-sm-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="text-muted small">จำนวนรอบสอบ</div>
              <div className="h3 mb-1">{sessions.length}</div>
              <div className="small text-muted">
                แคมเปญนี้มีกำหนด {sessions.length} รอบเพื่อบริหารสนามสอบทั้งหมด
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-sm-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="text-muted small">รายวิชาที่จัดสอบ</div>
              <div className="h3 mb-1">{subjects.length}</div>
              <div className="small text-muted">
                รวม{" "}
                {subjects.reduce(
                  (t, s: any) => t + (s.questions ?? 0),
                  0
                )}{" "}
                ชุดคำถามในรอบปัจจุบัน
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-sm-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="text-muted small">คะแนนเฉลี่ยล่าสุด</div>
              {/* TODO: ต่อกับ metric จริง */}
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-sm-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="text-muted small">เวลาตอบสนองเฉลี่ย</div>
              <div className="small text-muted">
                เวลาจากรับงานจนบันทึกผลตรวจล่าสุด
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="row g-3">
        <div className="col-lg-8">
          <div className="cardенным shadow-sm h-100">
            <div className="card-header bg-white">
              <h6 className="mb-0">จำนวนงานตรวจรายวัน</h6>
              <small className="text-muted">
                เปรียบเทียบงานตรวจเสร็จกับงานที่ยังรอคิวในแต่ละวัน
              </small>
            </div>
            <div className="card-body" style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyGradingData}>
                  <defs>
                    <linearGradient id="graded" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={primary}
                        stopOpacity={0.6}
                      />
                      <stop
                        offset="95%"
                        stopColor={primary}
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="pending" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={muted}
                        stopOpacity={0.5}
                      />
                      <stop
                        offset="95%"
                        stopColor={muted}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="name" stroke={muted} />
                  <YAxis stroke={muted} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="graded"
                    stroke={primary}
                    fill="url(#graded)"
                  />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    stroke={muted}
                    fill="url(#pending)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-4 d-flex flex-column gap-3">
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h6 className="mb-0">สถานะการประมวลผล</h6>
              <small className="text-muted">
                งานตรวจที่เสร็จแล้ว กำลังตรวจ และรอคิว
              </small>
            </div>
            <div className="card-body" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processingStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={70}
                    label
                  >
                    {processingStatusData.map((_, index) => (
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
            </div>
          </div>
        </div>
      </section>

      {/* Bottom section */}
      <section className="row g-3">
        <div className="col-lg-8">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white">
              <h6 className="mb-0">สรุปคะแนนเฉลี่ยตามรายวิชา</h6>
              <small className="text-muted">
                เปรียบเทียบคะแนนจริงกับค่าเป้าหมาย
              </small>
            </div>
            <div className="card-body" style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectScoreData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="name" stroke={muted} />
                  <YAxis stroke={muted} domain={[60, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="average"
                    name="คะแนนเฉลี่ย"
                    fill="#0EA5E9"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="target"
                    name="เป้าหมาย"
                    fill="#A855F7"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-4 d-flex flex-column gap-3">
          {/* งานตรวจล่าสุด (ไว้ต่อข้อมูลจริงทีหลัง) */}
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white d-flex align-items-center justify-content-between">
              <div>
                <h6 className="mb-0">งานตรวจล่าสุด</h6>
                <small className="text-muted">
                  ติดตามสถานะคิวปัจจุบัน
                </small>
              </div>
              <span className="badge text-bg-secondary d-inline-flex align-items-center gap-1">
                <ClipboardList size={14} />
              </span>
            </div>

            <div className="card-body d-flex flex-column gap-2 small text-muted">
              {/* TODO: แสดงรายการงานตรวจล่าสุด + ใช้ flaggedSerials ทำ highlight */}
              <div className="text-muted">
                ยังไม่ได้ผูกข้อมูลคิวตรวจ — ไว้ต่อกับ grading slice ทีหลัง
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
                    ระบบพบการแจ้งเตือน {seatViolations.length} รายการจากการจัดที่นั่ง
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

          {/* ⭐️ กล่องธงคัดกรองคะแนน */}
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
                    {f.diff} คะแนน{" "}
                    {f.diff > 4 && "(เกิน 4 คะแนน)"}
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
