import { useMemo, useRef, useState } from "react";
import { Scanner, boundingBox } from "@yudiel/react-qr-scanner";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  KeyRound,
  Scan,
  Timer,
  UserRound,
  Camera,
  Pause,
  Play,
  RotateCcw,
  Keyboard,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAppSelector } from "@/store/hook";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import { selectGradersForCampaign } from "@/store/slices/graders.slice";
import { ShowIfCan } from "@/components/auth/ShowIfCan";

const ROOM_PASSWORD = "5556";

interface RecordedScore {
  time: string;
  userId: string;
  grader: string;
  score: number;
}

export default function GradingStationPage() {
  const { toast } = useToast();
  const user = useAppSelector(selectCurrentUser);
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const graders = useAppSelector(
    selectGradersForCampaign(activeCampaign?.id ?? null)
  );

  const graderProfile = useMemo(() => {
    if (!user) {
      return {
        id: "mock-grader",
        campaignId: activeCampaign?.id ?? "camp-y68-t2",
        code: "TCH001",
        firstName: "ผู้ตรวจ",
        lastName: "ทดสอบ",
        username: "demo-grader",
        password: "pass1234",
        subjects: [
          {
            sessionId: "sess-y68-t2-d1",
            sessionLabel: "Y68-T2-D1 - สนามหลัก",
            subjectId: "sub-law101-d1",
            subjectName: "กฎหมายแพ่ง 1",
            questionRange: "1-120",
          },
        ],
      };
    }
    return (
      graders.find((g) => g.username === user.username) ?? {
        id: "mock-grader",
        campaignId: activeCampaign?.id ?? "camp-y68-t2",
        code: "TCH001",
        firstName: "ผู้ตรวจ",
        lastName: "ทดสอบ",
        username: user.username,
        password: user.password ?? "grader123",
        subjects: [
          {
            sessionId: "sess-y68-t2-d1",
            sessionLabel: "Y68-T2-D1 - สนามหลัก",
            subjectId: "sub-law101-d1",
            subjectName: "กฎหมายแพ่ง 1",
            questionRange: "1-120",
          },
        ],
      }
    );
  }, [graders, user, activeCampaign]);

  const assignedSubject = graderProfile?.subjects[0];

  /* ---------------------- สถานะ/ฟังก์ชันควบคุมสแกนเนอร์ ---------------------- */
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [pauseAfterSuccess, setPauseAfterSuccess] = useState(true);
  const [pause, setPause] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cooldownMs, setCooldownMs] = useState(1200);
  const lastScanRef = useRef<number>(0);
  const [manualPayload, setManualPayload] = useState("");
  const canScan = useMemo(() => scannerEnabled && !pause, [scannerEnabled, pause]);

  /* --------------------------- สถานะการให้คะแนน --------------------------- */
  const [scanData, setScanData] = useState<string | null>("");
  const [score, setScore] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [recent, setRecent] = useState<RecordedScore[]>([]);

  // const [roomCodeInput, setRoomCodeInput] = useState("");
  // const [isUnlocked, setIsUnlocked] = useState(false);
  // const handleUnlock = () => { ... }

  const handleScan = async (value: string) => {
    const now = Date.now();
    if (!canScan) return;
    if (now - lastScanRef.current < cooldownMs) return; // กันยิงรัว
    lastScanRef.current = now;

    setScannerEnabled(false);
    setPause(true);

    setScanData(value ?? null);
    toast({
      title: "สแกนสำเร็จ",
      description: `พบรหัสผู้เข้าสอบ: ${value ?? "ไม่ระบุ"}`,
    });

    if (pauseAfterSuccess) {
      // ให้กรอกคะแนน/บันทึกก่อน แล้วค่อยเริ่มกล้องใหม่หลังบันทึก
      return;
    }
    // ไม่พัก -> เปิดกล้องต่ออัตโนมัติ
    setTimeout(() => {
      setPause(false);
      setScannerEnabled(true);
    }, cooldownMs);
  };

  const handleClear = () => {
    setManualPayload("");
    setScanData(null);
    setPause(false);
    setScannerEnabled(true);
  };

  const verifyManualPayload = async () => {
    const value = manualPayload.trim();
    if (!value) {
      toast({
        title: "ไม่มีข้อมูล",
        description: "กรุณาวาง/พิมพ์ QR payload ก่อน",
        variant: "destructive",
      });
      return;
    }
    setScannerEnabled(false);
    setPause(true);
    await handleScan(value);
  };

  const handleConfirmScore = () => {
    if (!scanData || !score) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณาสแกน QR และกรอกคะแนนก่อน",
        variant: "destructive",
      });
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleSaveScore = () => {
    if (!scanData || !graderProfile || !score) return;
    const record: RecordedScore = {
      time: new Date().toLocaleTimeString("th-TH"),
      userId: scanData ?? "-",
      grader: graderProfile.code,
      score: Number(score),
    };
    setRecent((prev) => [record, ...prev].slice(0, 6));
    setScanData(null);
    setScore("");
    setIsConfirmOpen(false);
    toast({ title: "บันทึกคะแนนแล้ว" });

    // เปิดกล้องต่อหลังบันทึกถ้าเคยพักไว้
    if (pauseAfterSuccess) {
      setPause(false);
      setScannerEnabled(true);
    }
  };

  // Bootstrap modal backdrop helper
  const renderBackdrop = (open: boolean) =>
    open ? <div className="modal-backdrop show" /> : null;

  const renderNoProfile = () => (
    <div className="card border-dashed">
      <div className="card-header bg-white">
        <h6 className="mb-0 d-flex align-items-center gap-2">
          <AlertCircle className="text-primary" size={18} />
          ไม่พบโปรไฟล์ผู้ตรวจข้อสอบ
        </h6>
      </div>
      <div className="card-body text-muted small">
        โปรดตรวจสอบสิทธิ์ผู้ใช้หรือกำหนดผู้ตรวจสำหรับแคมเปญนี้ก่อนเริ่มใช้งาน
      </div>
    </div>
  );

  return (
    <ShowIfCan permission="grade_exams">
      <div className="container-fluid px-3 px-sm-4 py-4">
        {/* Header */}
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <h1 className="h4 mb-2">สถานีตรวจคะแนน (สแกน QR + บันทึกคะแนน)</h1>
            <div className="text-muted small mb-2">
              สำหรับผู้ตรวจคะแนน ใช้สแกน QR ของผู้เข้าสอบแล้วบันทึกคะแนน
            </div>

            {graderProfile ? (
              <div className="d-flex flex-wrap gap-2 small">
                <span className="badge text-bg-light d-inline-flex align-items-center gap-1 text-capitalize">
                  <UserRound size={14} />{" "}
                  {`${graderProfile.firstName} ${graderProfile.lastName}`}
                </span>
                <span className="badge text-bg-light d-inline-flex align-items-center gap-1">
                  <ClipboardList size={14} />{" "}
                  {assignedSubject?.subjectName ?? "ยังไม่ระบุวิชา"}
                </span>
                <span className="badge text-bg-light d-inline-flex align-items-center gap-1">
                  <KeyRound size={14} /> เซสชัน: {assignedSubject?.sessionLabel ?? "-"}
                </span>
              </div>
            ) : (
              <div className="small text-danger">
                ไม่พบข้อมูลผู้ตรวจ โปรดติดต่อผู้ดูแลระบบ
              </div>
            )}
          </div>
        </div>

        {!graderProfile ? (
          renderNoProfile()
        ) : (
          <div className="row g-4 mt-1">
            {/* Left: Scanner & Form */}
            <div className="col-lg-7">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Scan className="text-primary" size={18} />
                    <span className="fw-semibold">สแกน & บันทึกคะแนน</span>
                  </div>

                  {/* สถานะกล้อง */}
                  <div className="small text-muted">
                    สถานะกล้อง:{" "}
                    <span
                      className={`badge ${
                        !scannerEnabled
                          ? "bg-secondary"
                          : pause
                          ? "bg-warning"
                          : "bg-success"
                      }`}
                    >
                      {!scannerEnabled ? "หยุดอยู่" : pause ? "พักอยู่" : "พร้อม"}
                    </span>
                  </div>
                </div>

                {/* Controls (เหมือน ProctorScanPage) */}
                <div className="px-3 pt-2 d-flex flex-wrap align-items-center gap-2">
                  <div className="form-check me-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="pauseAfterSuccess"
                      checked={pauseAfterSuccess}
                      onChange={(e) => setPauseAfterSuccess(e.target.checked)}
                    />
                    <label className="form-check-label small" htmlFor="pauseAfterSuccess">
                      พักกล้องเมื่อสแกนสำเร็จ
                    </label>
                  </div>

                  <select
                    className="form-select form-select-sm"
                    style={{ width: 130 }}
                    value={cooldownMs}
                    onChange={(e) => setCooldownMs(Number(e.target.value))}
                    title="Cooldown ป้องกันสแกนซ้ำ"
                  >
                    <option value={800}>Cooldown: 0.8s</option>
                    <option value={1200}>Cooldown: 1.2s</option>
                    <option value={1600}>Cooldown: 1.6s</option>
                    <option value={2000}>Cooldown: 2.0s</option>
                  </select>

                  <button
                    className={`btn btn-${scannerEnabled ? "outline-secondary" : "success"} btn-sm d-inline-flex align-items-center gap-1`}
                    onClick={() => {
                      const next = !scannerEnabled;
                      setScannerEnabled(next);
                      setPause(!next ? true : false);
                    }}
                    title={scannerEnabled ? "หยุดกล้อง" : "เริ่มกล้อง"}
                  >
                    {scannerEnabled ? <Pause size={16} /> : <Play size={16} />}
                    {scannerEnabled ? "หยุด" : "เริ่ม"}
                  </button>

                  <button
                    className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                    onClick={() =>
                      setFacingMode((m) => (m === "environment" ? "user" : "environment"))
                    }
                    title="สลับกล้อง"
                  >
                    <Camera size={16} /> สลับ
                  </button>

                  <button
                    className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                    onClick={handleClear}
                    title="ล้างผลลัพธ์"
                  >
                    <RotateCcw size={16} /> ล้าง
                  </button>
                </div>

                {/* Ribbon แจ้งรหัสล่าสุด */}
                <div className="px-3 pt-2">
                  {scanData ? (
                    <div className="alert alert-success py-2 d-flex align-items-center gap-2 mb-0">
                      <CheckCircle2 size={16} />
                      <span className="small">รหัสผู้เข้าสอบล่าสุด: {scanData}</span>
                    </div>
                  ) : (
                    <div className="alert alert-secondary py-2 d-flex align-items-center gap-2 mb-0">
                      <span className="small">ยังไม่ได้สแกน — โปรดสแกนก่อนบันทึกคะแนน</span>
                    </div>
                  )}
                </div>

                <div className="card-body">
                  {/* Scanner */}
                  <div
                    className="rounded overflow-hidden border bg-black mb-2 position-relative"
                    style={{ minHeight: 220 }}
                  >
                    {/* กรณีปิดกล้อง */}
                    {!scannerEnabled && (
                      <div
                        className="d-flex flex-column justify-content-center align-items-center text-muted py-5"
                        style={{ minHeight: 220 }}
                      >
                        <Pause className="mb-2" />
                        <div>กล้องถูกหยุดอยู่ — กด “เริ่ม” เพื่อใช้งาน</div>
                      </div>
                    )}

                    {/* กรณีเปิดกล้อง */}
                    {scannerEnabled && (
                      <>
                        <Scanner
                          formats={["qr_code", "micro_qr_code", "rm_qr_code"]}
                          onScan={(codes) => {
                            if (!codes?.length) return;
                            handleScan(codes[0].rawValue);
                          }}
                          onError={(e) => console.warn("scanner error:", e)}
                          constraints={{ facingMode }}
                          styles={{ container: { width: "100%" }, video: { width: "100%" } }}
                          components={{
                            onOff: true,
                            torch: true,
                            zoom: true,
                            finder: true,
                            tracker: boundingBox,
                          }}
                          allowMultiple={false}
                          scanDelay={cooldownMs}
                          paused={pause}
                        />

                        {/* พักชั่วคราว overlay */}
                        {pause && (
                          <div
                            className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center"
                            style={{ background: "rgba(0,0,0,0.45)" }}
                          >
                            <Pause className="mb-2 text-white" />
                            <div className="text-white text-center px-3">
                              กำลังพักกล้องชั่วคราว
                              <div className="small text-white-50">กด “เริ่ม” เพื่อกลับไปสแกนต่อ</div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Manual input */}
                  <div className="mt-3">
                    <label className="form-label small d-flex align-items-center gap-2">
                      <Keyboard size={16} /> กรอก/วาง QR Payload (สำรอง)
                    </label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        placeholder="วางสตริงจาก QR ที่นี่…"
                        value={manualPayload}
                        onChange={(e) => setManualPayload(e.target.value)}
                      />
                      <button className="btn btn-outline-primary" onClick={verifyManualPayload}>
                        ตรวจสอบ
                      </button>
                    </div>
                    <div className="form-text">
                      ใช้เมื่อกล้องอ่านไม่ติด หรือรับข้อมูลจากช่องทางอื่น (เช่น เจ้าหน้าที่กรอกแทน)
                    </div>
                  </div>

                  {/* Score form */}
                  <div className="row g-3 mt-3">
                    <div className="col-md-6">
                      <label className="form-label">คะแนน</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="เช่น 4.5"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-3">
                    <button
                      className="btn btn-primary d-inline-flex align-items-center gap-2"
                      onClick={handleConfirmScore}
                    >
                      <CheckCircle2 size={16} /> บันทึกคะแนน
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setScanData(null);
                        setScore("");
                      }}
                    >
                      ล้างข้อมูล
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Recent */}
            <div className="col-lg-5">
              <div className="card shadow-sm">
                <div className="card-header bg-white d-flex align-items-center gap-2">
                  <Timer className="text-primary" size={16} />
                  <h6 className="mb-0">รายการล่าสุด</h6>
                </div>
                <div className="card-body">
                  {recent.length === 0 ? (
                    <div className="text-muted small">
                      ยังไม่มีรายการบันทึกคะแนน จะแสดงที่นี่หลังจากบันทึกสำเร็จ
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>เวลา</th>
                            <th>รหัสผู้เข้าสอบ</th>
                            <th className="text-end">คะแนน</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recent.map((r, idx) => (
                            <tr key={`${r.userId}-${idx}`}>
                              <td>{r.time}</td>
                              <td>{r.userId}</td>
                              <td className="text-end fw-semibold">{r.score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {renderBackdrop(isConfirmOpen)}
        <div
          className={`modal ${isConfirmOpen ? "show" : ""}`}
          style={{ display: isConfirmOpen ? "block" : "none" }}
          role="dialog"
          aria-modal={isConfirmOpen}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title d-flex align-items-center gap-2">
                  <AlertCircle className="text-primary" size={18} />
                  ยืนยันการบันทึกคะแนน
                </h6>
                <button
                  className="btn-close"
                  onClick={() => setIsConfirmOpen(false)}
                />
              </div>
              <div className="modal-body small text-muted">
                <p>
                  รหัสผู้เข้าสอบ:{" "}
                  <span className="text-body">{scanData ?? "-"}</span>
                </p>
                <p>
                  คะแนน: <span className="text-body">{score || "-"}</span>
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setIsConfirmOpen(false)}
                >
                  ยกเลิก
                </button>
                <button className="btn btn-primary" onClick={handleSaveScore}>
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* /Confirm Modal */}
      </div>
    </ShowIfCan>
  );
}
