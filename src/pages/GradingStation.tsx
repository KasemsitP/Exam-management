import { useMemo, useState } from "react";
import { Scanner ,  boundingBox } from "@yudiel/react-qr-scanner";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  KeyRound,
  Scan,
  Timer,
  UserRound,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAppSelector } from "@/store/hook";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import { selectGradersForCampaign } from "@/store/slices/graders.slice";
import { ShowIfCan } from "@/components/auth/ShowIfCan";

const ROOM_PASSWORD = "5556";

// interface ParsedPayload {
//   campaignName?: string;
//   sessionName?: string;
//   userId?: string;
//   raw: string;
// }

interface RecordedScore {
  time: string;
  userId: string;
  grader: string;
  score: number;
}

// const parseQrPayload = (payload: string): ParsedPayload => {
//   const result: ParsedPayload = { raw: payload };
//   payload.split("|").forEach((chunk) => {
//     const [key, value] = chunk.split(":");
//     if (!key || value === undefined) return;
//     const normalized = key.trim().toUpperCase();
//     const trimmed = value.trim();
//     if (normalized === "STD") result.userId = trimmed;
//     if (normalized === "COURSE") result.campaignName = trimmed;
//     if (normalized === "SES") result.sessionName = trimmed;
//   });
//   return result;
// };

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

  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pause, setPause] = useState(false);
  const [scanData, setScanData] = useState<string>("");
  const [score, setScore] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [recent, setRecent] = useState<RecordedScore[]>([]);

  const assignedSubject = graderProfile?.subjects[0];

  // const handleUnlock = () => {
  //   if (roomCodeInput.trim() === ROOM_PASSWORD) {
  //     setIsUnlocked(true);
  //     toast({ title: "ปลดล็อกสถานีตรวจแล้ว" });
  //   } else {
  //     toast({
  //       title: "รหัสห้องไม่ถูกต้อง",
  //       description: "โปรดตรวจสอบรหัสอีกครั้ง",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const handleScan = (result: string) => {
    setPause(true);
    setScanData(result)
    toast({
      title: "สแกนสำเร็จ",
      description: `พบรหัสผู้เข้าสอบ: ${result ?? "ไม่ระบุ"}`,
    });
    setPause(false)
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



        {graderProfile && (
          <div className="row g-4 mt-1">
            {/* Left: Scanner & Form */}
            <div className="col-lg-7">
              <div className="card shadow-sm">
                <div className="card-header bg-white">
                  <h6 className="mb-0">สแกน & บันทึกคะแนน</h6>
                </div>
                <div className="card-body">
                  {/* Scanner */}
                  <label className="form-label d-flex align-items-center gap-2">
                    <Scan className="text-primary" size={16} />
                    สแกน QR ของผู้เข้าสอบ
                  </label>
                  <div className="rounded overflow-hidden border bg-black mb-2">
                    <Scanner
                      formats={["qr_code",
                        "micro_qr_code",
                        "rm_qr_code",]}
                      onScan={(detectedCodes) => {
                        if (detectedCodes.length > 0) {
                          handleScan(detectedCodes[0].rawValue);
                        }
                      }}
                      onError={(error) => console.warn("scanner error", error)}
                      constraints={{ facingMode: "environment" }}
                      styles={{
                        container: { width: "100%" },
                        video: { width: "100%" },
                      }}
                      components={{
                        onOff: true,
                        torch: true,
                        zoom: true,
                        finder: true,
                        tracker: boundingBox,
                      }}
                      allowMultiple={false}
                      scanDelay={2000}
                      paused={pause}
                    />
                  </div>

                  {scanData ? (
                    <div className="border rounded p-2 bg-light small mb-3">
                      <span className="badge text-bg-light me-2">
                        รหัสผู้เข้าสอบ {scanData ?? "-"}
                      </span>
                      {/* <span className="badge text-bg-light me-2">
                        แคมเปญ: {scanData.campaignName ?? "-"}
                      </span>
                      <span className="badge text-bg-light">
                        เซสชัน: {scanData.sessionName ?? "-"}
                      </span> */}
                    </div>
                  ) : (
                    <div className="small text-muted mb-3">
                      ยังไม่ได้สแกน QR — โปรดสแกนก่อนบันทึกคะแนน
                    </div>
                  )}

                  {/* Form (เอาหน้า/ช่องกรอก "เลขข้อ" ออกแล้ว) */}
                  <div className="row g-3">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="คะแนน"
                      value={scanData}
                      disabled
                      min={0}
                    />
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

                    {/*    <div className="col-12">
                      <label className="form-label">หมายเหตุ (ถ้ามี)</label>
                      <input
                        className="form-control"
                        placeholder="เช่น ตรวจซ้ำ, ข้ามบางข้อ เป็นต้น"
                      />
                    </div>*/}
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
