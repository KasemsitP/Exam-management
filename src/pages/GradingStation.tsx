import { useMemo, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
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

interface ParsedPayload {
  campaignName?: string;
  sessionName?: string;
  userId?: string;
  raw: string;
}

interface RecordedScore {
  time: string;
  userId: string;
  question: string;
  grader: string;
  score: number;
}

const parseQrPayload = (payload: string): ParsedPayload => {
  const result: ParsedPayload = { raw: payload };
  payload.split("|").forEach((chunk) => {
    const [key, value] = chunk.split(":");
    if (!key || value === undefined) return;
    const normalized = key.trim().toUpperCase();
    const trimmed = value.trim();
    if (normalized === "STD") result.userId = trimmed;
    if (normalized === "COURSE") result.campaignName = trimmed;
    if (normalized === "SES") result.sessionName = trimmed;
  });
  return result;
};

const buildQuestionOptions = (range?: string) => {
  if (!range) return [];
  if (range.includes("-")) {
    const [start, end] = range.split("-").map((part) => parseInt(part.trim(), 10));
    if (!Number.isFinite(start) || !Number.isFinite(end)) return [];
    const values: string[] = [];
    for (let i = start; i <= end; i += 1) values.push(String(i));
    return values;
  }
  return range
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export default function GradingStationPage() {
  const { toast } = useToast();
  const user = useAppSelector(selectCurrentUser);
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const graders = useAppSelector(selectGradersForCampaign(activeCampaign?.id ?? null));

  const graderProfile = useMemo(() => {
    if (!user) {
      return {
        id: "mock-grader",
        campaignId: activeCampaign?.id ?? "camp-y68-t2",
        code: "TCH001",
        firstName: "???????",
        lastName: "?????",
        username: "demo-grader",
        password: "pass1234",
        subjects: [
          {
            sessionId: "sess-y68-t2-d1",
            sessionLabel: "Y68-T2-D1 - Main Site",
            subjectId: "sub-law101-d1",
            subjectName: "Civil Law I",
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
        firstName: "???????",
        lastName: "?????",
        username: user.username,
        password: user.password ?? "grader123",
        subjects: [
          {
            sessionId: "sess-y68-t2-d1",
            sessionLabel: "Y68-T2-D1 - Main Site",
            subjectId: "sub-law101-d1",
            subjectName: "Civil Law I",
            questionRange: "1-120",
          },
        ],
      }
    );
  }, [graders, user, activeCampaign]);

  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [scanData, setScanData] = useState<ParsedPayload | null>(null);
  const [questionNo, setQuestionNo] = useState("");
  const [score, setScore] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [recent, setRecent] = useState<RecordedScore[]>([]);

  const assignedSubject = graderProfile?.subjects[0];
  const questionOptions = useMemo(() => {
    const range = assignedSubject?.questionRange || "1-120";
    return buildQuestionOptions(range);
  }, [assignedSubject?.questionRange]);

  const handleUnlock = () => {
    if (roomCodeInput.trim() === ROOM_PASSWORD) {
      setIsUnlocked(true);
      toast({ title: "??????????????????" });
    } else {
      toast({
        title: "??????????????????",
        description: "???????????????????????????????????????",
        variant: "destructive",
      });
    }
  };

  const handleScan = (results: { rawValue: string }[]) => {
    if (!isUnlocked) return;
    const first = results?.[0]?.rawValue;
    if (!first) return;
    const parsed = parseQrPayload(first);
    setScanData(parsed);
    if (questionOptions.length > 0) setQuestionNo(questionOptions[0]);
    toast({ title: "??????????", description: `??????????????: ${parsed.userId ?? "???????"}` });
  };

  const handleConfirmScore = () => {
    if (!scanData || !questionNo || !score) {
      toast({
        title: "????????????????",
        description: "???????? QR ?????????????????????",
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
      userId: scanData.userId ?? "-",
      question: questionNo || "-",
      grader: graderProfile.code,
      score: Number(score),
    };
    setRecent((prev) => [record, ...prev].slice(0, 6));
    setScanData(null);
    setQuestionNo("");
    setScore("");
    setIsConfirmOpen(false);
    toast({ title: "???????????????" });
  };

  // Bootstrap modal backdrop helper
  const renderBackdrop = (open: boolean) => (open ? <div className="modal-backdrop show" /> : null);

  const renderNoProfile = () => (
    <div className="card border-dashed">
      <div className="card-header bg-white">
        <h6 className="mb-0 d-flex align-items-center gap-2">
          <AlertCircle className="text-primary" size={18} />
          ???????????????????????
        </h6>
      </div>
      <div className="card-body text-muted small">
        ???????????????????????????????????????? ???????????????????????????????????????????????????
      </div>
    </div>
  );

  return (
    <ShowIfCan permission="grade_exams">
      <div className="container-fluid px-3 px-sm-4 py-4">
        {/* Header */}
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <h1 className="h4 mb-2">????????? (???? QR + ??????????)</h1>
            <div className="text-muted small mb-2">
              ?????????????????????? ????????? ?????????????????? ??????????????
            </div>

            {graderProfile ? (
              <div className="d-flex flex-wrap gap-2 small">
                <span className="badge text-bg-light d-inline-flex align-items-center gap-1 text-capitalize">
                  <UserRound size={14} /> {`${graderProfile.firstName} ${graderProfile.lastName}`}
                </span>
                <span className="badge text-bg-light d-inline-flex align-items-center gap-1">
                  <ClipboardList size={14} /> {assignedSubject?.subjectName ?? "????????????????????"}
                </span>
                <span className="badge text-bg-light d-inline-flex align-items-center gap-1">
                  <KeyRound size={14} /> ???????: {assignedSubject?.sessionLabel ?? "-"}
                </span>
              </div>
            ) : (
              <div className="small text-danger">???????????????????????? ?????????????????????????????????</div>
            )}
          </div>
        </div>

        {!graderProfile ? (
          renderNoProfile()
        ) : !isUnlocked ? (
          <div className="card border border-primary-subtle bg-primary-subtle">
            <div className="card-header bg-white d-flex align-items-center gap-2">
              <KeyRound className="text-primary" size={18} />
              <h6 className="mb-0">????????????????????????</h6>
            </div>
            <div className="card-body">
              <div className="text-muted small mb-2">
                ???????????????????????????????????????????????????????????????????
              </div>
              <div className="d-flex gap-2" style={{ maxWidth: 420 }}>
                <input
                  type="password"
                  className="form-control"
                  placeholder="???????????"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value)}
                />
                <button className="btn btn-primary" onClick={handleUnlock}>??????</button>
              </div>
            </div>
          </div>
        ) : null}

        {graderProfile && isUnlocked && (
          <div className="row g-4 mt-1">
            {/* Left: Scanner & Form */}
            <div className="col-lg-7">
              <div className="card shadow-sm">
                <div className="card-header bg-white">
                  <h6 className="mb-0">??????????? & ?????????</h6>
                </div>
                <div className="card-body">
                  {/* Scanner */}
                  <label className="form-label d-flex align-items-center gap-2">
                    <Scan className="text-primary" size={16} />
                    ???? QR ??????????
                  </label>
                  <div className="rounded overflow-hidden border bg-black mb-2">
                    <Scanner
                      onScan={handleScan}
                      onError={(error) => console.warn("scanner error", error)}
                      constraints={{ facingMode: "environment" }}
                      styles={{ container: { width: "100%" }, video: { width: "100%" } }}
                    />
                  </div>

                  {scanData ? (
                    <div className="border rounded p-2 bg-light small mb-3">
                      <span className="badge text-bg-light me-2">???? {scanData.userId ?? "-"}</span>
                      <span className="badge text-bg-light me-2">????: {scanData.campaignName ?? "-"}</span>
                      <span className="badge text-bg-light">??????: {scanData.sessionName ?? "-"}</span>
                    </div>
                  ) : (
                    <div className="small text-muted mb-3">???? QR ????????????????????????????????????</div>
                  )}

                  {/* Form */}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">??????????</label>
                      {questionOptions.length > 0 ? (
                        <select
                          className="form-select"
                          value={questionNo}
                          onChange={(e) => setQuestionNo(e.target.value)}
                        >
                          <option value="" disabled>????????</option>
                          {questionOptions.map((opt) => (
                            <option key={opt} value={opt}>?????? {opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="form-control"
                          placeholder="??????????????"
                          value={questionNo}
                          onChange={(e) => setQuestionNo(e.target.value)}
                        />
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">???????????</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="???? 4.5"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        min={0}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">???????? (?????)</label>
                      <input className="form-control" placeholder="????????: ?????????????" />
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={handleConfirmScore}>
                      <CheckCircle2 size={16} /> ???????????
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => { setScanData(null); setQuestionNo(""); setScore(""); }}
                    >
                      ??????????
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
                  <h6 className="mb-0">????????????</h6>
                </div>
                <div className="card-body">
                  {recent.length === 0 ? (
                    <div className="text-muted small">
                      ?????????????????????? ????????????????????????
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>????</th>
                            <th>???????</th>
                            <th>???</th>
                            <th className="text-end">?????</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recent.map((r, idx) => (
                            <tr key={`${r.userId}-${idx}`}>
                              <td>{r.time}</td>
                              <td>{r.userId}</td>
                              <td>{r.question}</td>
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
                  ?????????????????
                </h6>
                <button className="btn-close" onClick={() => setIsConfirmOpen(false)} />
              </div>
              <div className="modal-body small text-muted">
                <p>??????????????: <span className="text-body">{scanData?.userId ?? "-"}</span></p>
                <p>??????????: <span className="text-body">{questionNo || "-"}</span></p>
                <p>???????????: <span className="text-body">{score || "-"}</span></p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setIsConfirmOpen(false)}>
                  ??????
                </button>
                <button className="btn btn-primary" onClick={handleSaveScore}>
                  ??????
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
