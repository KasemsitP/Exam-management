import { useMemo, useState } from "react";
import { AlertCircle, BarChart2, FileSpreadsheet, ListOrdered } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useAppSelector } from "@/store/hook";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import React from "react";
import { selectScriptsByBag } from "@/store/slices/scoreReview.slice";

type ViewMode = "overview" | "details";

const FLAG_THRESHOLD = 4;

const BAG_OPTIONS = [
  { id: "BAG001", label: "BAG001 - รอบจำลอง 1" },
  { id: "BAG002", label: "BAG002 - รอบจำลอง 2" },
  { id: "BAG003", label: "BAG003 - รอบจำลอง 3" },
];

const formatScore = (value: number) => value.toFixed(2);

export default function ScoreReviewPage() {
  const { toast } = useToast();
  const activeCampaign = useAppSelector(selectActiveCampaign);

  const [bagId, setBagId] = useState(BAG_OPTIONS[0]?.id ?? "");
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [searchTerm, setSearchTerm] = useState("");

  const scripts = useAppSelector(selectScriptsByBag(bagId));

  const filteredScripts = useMemo(() => {
    if (!searchTerm.trim()) return scripts;
    const term = searchTerm.trim().toLowerCase();
    return scripts.filter((script) => script.examCode.toLowerCase().includes(term));
  }, [scripts, searchTerm]);

  const summary = useMemo(() => {
    const totalScripts = scripts.length;
    const totalQuestions = totalScripts * 10;
    const sumAverage = scripts.reduce(
      (sum, script) => sum + script.questions.reduce((inner, q) => inner + q.average, 0),
      0
    );
    const averagePerQuestion = totalQuestions > 0 ? Number((sumAverage / totalQuestions).toFixed(2)) : 0;
    const flaggedCount = scripts.reduce(
      (count, script) =>
        count + script.questions.filter((q) => Math.abs(q.scoreA - q.scoreB) >= FLAG_THRESHOLD).length,
      0
    );
    const totalAveragePerScript = scripts.length ? Number((sumAverage / scripts.length).toFixed(2)) : 0;
    return { totalScripts, averagePerQuestion, flaggedCount, totalAveragePerScript };
  }, [scripts]);

  const detailRows = useMemo(
    () =>
      scripts.flatMap((script) =>
        script.questions.map((q) => {
          const diff = Math.abs(q.scoreA - q.scoreB);
          return {
            examCode: script.examCode,
            questionNo: q.questionNo,
            graderA: q.graderA,
            graderB: q.graderB,
            scoreA: q.scoreA,
            scoreB: q.scoreB,
            average: q.average,
            diff,
          };
        })
      ),
    [scripts]
  );

  const handleExport = () => {
    if (!scripts.length) {
      toast({ title: "ไม่มีข้อมูลสำหรับส่งออก", variant: "destructive" });
      return;
    }
    const header = ["examCode", ...Array.from({ length: 10 }, (_, i) => `Q${i + 1}Average`), "TotalAverage"];
    const rows = scripts.map((script) => {
      const questionAverages = script.questions.map((q) => q.average.toFixed(2));
      const total = script.questions.reduce((s, q) => s + q.average, 0);
      return [script.examCode, ...questionAverages, total.toFixed(2)];
    });
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bagId}-score-review.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

const renderOverviewTable = () => (
  <div className="table-responsive border rounded-3">
    <table className="table align-middle mb-0">
      <thead className="table-light text-muted small text-uppercase">
        {/* แถวหัวตารางหลัก: ข้อ 1-10 กิน 3 คอลัมน์ต่อข้อ */}
        <tr>
          <th
            className="bg-light"
            style={{ position: "sticky", left: 0, zIndex: 2 }}
            rowSpan={2}
          >
            รหัสสอบ
          </th>

          {Array.from({ length: 10 }, (_, idx) => (
            <th key={idx} colSpan={3} className="text-center">
              ข้อ {idx + 1}
            </th>
          ))}

          <th rowSpan={2}>คะแนนรวม (ผลรวมค่าเฉลี่ย)</th>
        </tr>

        {/* แถวหัวตารางย่อย: คะแนน1 / คะแนน2 / ผลต่าง */}
        <tr>
          {Array.from({ length: 10 }, (_, idx) => (
            <React.Fragment key={`sub-${idx}`}>
              <th className="text-end">คะแนน 1</th>
              <th className="text-end">คะแนน 2</th>
              <th className="text-end">ผลต่าง</th>
            </React.Fragment>
          ))}
        </tr>
      </thead>

      <tbody>
        {filteredScripts.map((script) => {
          const total = script.questions.reduce((sum, q) => sum + q.average, 0);

          return (
            <tr key={script.examCode}>
              <td
                className="fw-semibold bg-white"
                style={{ position: "sticky", left: 0, zIndex: 1 }}
              >
                {script.examCode}
              </td>

              {script.questions.map((q) => {
                const diff = Math.abs(q.scoreA - q.scoreB);
                const flagged = diff >= FLAG_THRESHOLD;

                return (
                  <React.Fragment key={`${script.examCode}-${q.questionNo}`}>
                    {/* คะแนน 1 */}
                    <td className="text-end">{formatScore(q.scoreA)}</td>

                    {/* คะแนน 2 */}
                    <td className="text-end">{formatScore(q.scoreB)}</td>

                    {/* ✅ ผลต่าง (อยู่ขวาของคะแนน 2) */}
                    <td className="text-end">
                      {flagged ? (
                        <span className="badge text-bg-danger rounded-pill px-2 py-1">
                          {formatScore(diff)}
                        </span>
                      ) : (
                        formatScore(diff)
                      )}
                    </td>
                  </React.Fragment>
                );
              })}

              <td className="fw-semibold">{formatScore(total)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);


  const renderDetailsTable = () => (
    <div className="table-responsive border rounded-3">
      <table className="table align-middle mb-0">
        <thead className="table-light text-muted small text-uppercase">
          <tr>
            <th>รหัสสอบ</th>
            <th className="text-center">ข้อที่</th>
            <th>ผู้ตรวจ A</th>
            <th className="text-end">คะแนน A</th>
            <th>ผู้ตรวจ B</th>
            <th className="text-end">คะแนน B</th>
            <th className="text-end">ค่าเฉลี่ย</th>
            <th className="text-end">ส่วนต่าง</th>
          </tr>
        </thead>
        <tbody>
          {detailRows.map((row, idx) => {
            const flagged = row.diff >= FLAG_THRESHOLD;
            return (
              <tr key={`${row.examCode}-${row.questionNo}-${idx}`}>
                <td className="fw-medium">{row.examCode}</td>
                <td className="text-center text-muted">{row.questionNo}</td>
                <td>{row.graderA}</td>
                <td className="text-end">{formatScore(row.scoreA)}</td>
                <td>{row.graderB}</td>
                <td className="text-end">{formatScore(row.scoreB)}</td>
                <td className="text-end fw-semibold">{formatScore(row.average)}</td>
                <td className="text-end">
                  {flagged ? (
                    <span className="badge text-bg-danger rounded-pill px-2 py-1">
                      {formatScore(row.diff)}
                    </span>
                  ) : (
                    formatScore(row.diff)
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <ShowIfCan permission="view_reports">
      <div className="container px-4 py-4 py-md-5">
        {/* Header */}
        <div
          className="d-flex flex-column flex-md-row gap-3 justify-content-between align-items-start border rounded-3 p-4 shadow-sm"
          style={{
            background:
              "linear-gradient(90deg, rgba(59,130,246,0.08) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,1) 100%)",
          }}
        >
          <div>
            <p className="text-uppercase small text-muted mb-1">สรุปคะแนน</p>
            <h1 className="h4 fw-semibold mb-1">ตรวจสอบคะแนนตามถุงข้อสอบ</h1>
            {activeCampaign && (
              <p className="small text-muted mb-0">
                แคมเปญ: <span className="fw-medium text-body">{activeCampaign.name}</span>
              </p>
            )}
          </div>

          <div className="d-flex flex-wrap gap-2">
            {/* select bag */}
            <select
              className="form-select"
              style={{ minWidth: 220 }}
              value={bagId}
              onChange={(e) => setBagId(e.target.value)}
            >
              {BAG_OPTIONS.map((bag) => (
                <option key={bag.id} value={bag.id}>
                  {bag.label}
                </option>
              ))}
            </select>

            {/* search */}
            <input
              className="form-control"
              style={{ minWidth: 160 }}
              placeholder="ค้นหารหัสสอบ"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* view mode */}
            <select
              className="form-select"
              style={{ minWidth: 200 }}
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
            >
              <option value="overview">ภาพรวม (ตามรหัสสอบ)</option>
              <option value="details">รายละเอียด (ตามผู้ตรวจ)</option>
            </select>

            {/* export */}
            <button className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" onClick={handleExport}>
              <FileSpreadsheet size={16} />
              ส่งออก CSV
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="row g-3 mt-3">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card h-100">
              <div className="card-body">
                <div className="small text-muted mb-1">จำนวนชุดข้อสอบในถุง</div>
                <div className="h3 fw-semibold mb-0">{summary.totalScripts}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card h-100">
              <div className="card-body">
                <div className="small text-muted mb-1">คะแนนเฉลี่ยต่อข้อ</div>
                <div className="h3 fw-semibold mb-0">{formatScore(summary.averagePerQuestion)}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card h-100">
              <div className="card-body">
                <div className="small text-muted mb-1">
                  {`คู่ที่ต้องตรวจสอบ (ส่วนต่าง >= ${FLAG_THRESHOLD})`}
                </div>
                <div className="h3 fw-semibold mb-0">{summary.flaggedCount}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card h-100">
              <div className="card-body">
                <div className="small text-muted mb-1">คะแนนรวมเฉลี่ยต่อชุด</div>
                <div className="h3 fw-semibold mb-0">{formatScore(summary.totalAveragePerScript)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Table card */}
        <div className="card mt-3">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              {viewMode === "overview" ? (
                <ListOrdered className="text-primary" size={18} />
              ) : (
                <BarChart2 className="text-primary" size={18} />
              )}
              <span className="fw-semibold">
                {viewMode === "overview" ? "คะแนนตามรหัสสอบ" : "คะแนนตามผู้ตรวจ"}
              </span>
            </div>
            <span className="badge text-bg-light">{bagId}</span>
          </div>
          <div className="card-body">
            {viewMode === "overview" ? renderOverviewTable() : renderDetailsTable()}

            {!scripts.length && (
              <div className="alert alert-secondary d-flex align-items-center gap-2 mt-3 mb-0" role="alert">
                <AlertCircle size={18} />
                <div>ยังไม่มีข้อมูลสำหรับถุงนี้</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ShowIfCan>
  );
}
