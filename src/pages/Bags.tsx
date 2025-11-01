import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Scanner,
  boundingBox,
} from "@yudiel/react-qr-scanner";
import { AlertTriangle, CheckCircle2, QrCode, Search, Trash2, Plus, X } from "lucide-react";

// คงของเดิมที่เป็น business logic / auth / store
import { useToast } from "@/components/ui/use-toast";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import {
  bagCreated,
  bagFinalized,
  bagRemoved,
  bagScanAdded,
  bagScanRemoved,
  bagScansCleared,
  bagCapacityUpdated,
  selectBagsForCampaign,
  selectBagById,
  selectDefaultBagCapacity,
  selectBagStatsForCampaign,
} from "@/store/slices/bags.slice";

interface CreateBagForm {
  bagId: string;
  sessionId: string;
  subjectId?: string;
  capacity: number;
}

const STATUS_STYLE: Record<
  "draft" | "ready" | "incomplete",
  { badge: string; label: string }
> = {
  draft: { badge: "text-bg-primary", label: "รอประกอบ" },
  ready: { badge: "text-bg-success", label: "พร้อมใช้งาน" },
  incomplete: { badge: "text-bg-warning", label: "ไม่ครบ 30" },
};

export default function BagsPage() {
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const bags = useAppSelector(selectBagsForCampaign(activeCampaign?.id ?? null));
  const bagStats = useAppSelector(selectBagStatsForCampaign(activeCampaign?.id ?? null));
  const defaultCapacity = useAppSelector(selectDefaultBagCapacity);
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const sessions = useMemo(() => activeCampaign?.sessions ?? [], [activeCampaign]);

  const [searchText, setSearchText] = useState("");
  const [composeBagId, setComposeBagId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const deviceId: string | undefined = undefined;

  const createForm = useForm<CreateBagForm>();
  const watchSessionId = createForm.watch("sessionId");

  useEffect(() => {
    if (!createDialogOpen) return;
    const defaultSessionId = sessions[0]?.id ?? "";
    const defaultSubjectId = sessions[0]?.subjects[0]?.id;
    createForm.reset({
      bagId: `BAG-${String((bags.length ?? 0) + 1).padStart(3, "0")}`,
      sessionId: defaultSessionId,
      subjectId: defaultSubjectId,
      capacity: defaultCapacity,
    });
  }, [createDialogOpen, sessions, createForm, bags.length, defaultCapacity]);

  useEffect(() => {
    if (!watchSessionId) return;
    const session = sessions.find((item) => item.id === watchSessionId);
    if (!session) return;
    const currentSubject = createForm.getValues("subjectId");
    if (!currentSubject || !session.subjects.some((s) => s.id === currentSubject)) {
      createForm.setValue("subjectId", session.subjects[0]?.id);
    }
  }, [watchSessionId, sessions, createForm]);

  const composeBag = useAppSelector((state) =>
    composeBagId && activeCampaign ? selectBagById(activeCampaign.id, composeBagId)(state) : null
  );

  const availableSubjects = useMemo(() => {
    if (!watchSessionId) return [];
    return sessions.find((session) => session.id === watchSessionId)?.subjects ?? [];
  }, [sessions, watchSessionId]);

  const filteredBags = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return bags;
    return bags.filter((bag) => {
      const subjectText = `${bag.subjectCode ?? ""} ${bag.subjectName ?? ""}`.toLowerCase();
      return (
        bag.id.toLowerCase().includes(term) ||
        bag.sessionLabel.toLowerCase().includes(term) ||
        subjectText.includes(term)
      );
    });
  }, [bags, searchText]);

  const handleCreateBag = createForm.handleSubmit((values) => {
    if (!activeCampaign) {
      toast({ title: "กรุณาเลือกสนามสอบ", description: "ไม่พบสนามสอบที่ใช้งานอยู่", variant: "destructive" });
      return;
    }
    if (!values.sessionId) {
      toast({ title: "ต้องเลือกรอบสอบ", description: "กรุณาเลือกรอบสอบก่อนสร้างถุงข้อสอบ", variant: "destructive" });
      return;
    }
    const session = sessions.find((item) => item.id === values.sessionId);
    const subject = session?.subjects.find((item) => item.id === values.subjectId);

    dispatch(
      bagCreated({
        campaignId: activeCampaign.id,
        sessionId: values.sessionId,
        sessionLabel: session?.label ?? "ไม่ระบุรอบสอบ",
        subjectCode: subject?.code,
        subjectName: subject?.name,
        bagLabel: values.bagId,
        capacity: values.capacity,
      })
    );

    setCreateDialogOpen(false);
    setComposeBagId(values.bagId);
    toast({ title: "สร้างถุงข้อสอบแล้ว", description: `รหัส ${values.bagId}` });
  });

  const handleScan = async (data: string) => {
    setScannerEnabled(true);
    try {
      const response = await fetch(`your-api-url?code=${encodeURIComponent(data)}`);
      const result = await response.json();
      if (response.ok && result.success) {
        alert("Success! Welcome to the conference.");
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setScannerEnabled(false);
    }
  };

  const handleManualAdd = () => {
    if (!composeBag || !activeCampaign) return;
    const value = manualCode.trim();
    if (!value) return;
    dispatch(bagScanAdded({ campaignId: activeCampaign.id, bagId: composeBag.id, code: value }));
    setManualCode("");
  };

  const handleFinalize = () => {
    if (!composeBag || !activeCampaign) return;
    const isComplete = composeBag.scanned.length >= composeBag.capacity;
    if (!isComplete) {
      const ok = window.confirm(
        `สแกนครบแล้ว ${composeBag.scanned.length}/${composeBag.capacity} เล่ม ต้องการยืนยันถุงไม่ครบหรือไม่?`
      );
      if (!ok) return;
    }
    dispatch(
      bagFinalized({
        campaignId: activeCampaign.id,
        bagId: composeBag.id,
        allowIncomplete: !isComplete,
      })
    );
    toast({
      title: "บันทึกถุงข้อสอบแล้ว",
      description: isComplete ? "ถุงครบตามจำนวน" : "ถุงถูกบันทึกแม้ยังไม่ครบ 30 เล่ม",
    });
    setComposeBagId(null);
  };

  const handleRemoveCode = (code: string) => {
    if (!composeBag || !activeCampaign) return;
    dispatch(bagScanRemoved({ campaignId: activeCampaign.id, bagId: composeBag.id, code }));
  };

  const handleClearCodes = () => {
    if (!composeBag || !activeCampaign) return;
    const ok = window.confirm("ลบรายการสแกนทั้งหมดหรือไม่?");
    if (!ok) return;
    dispatch(bagScansCleared({ campaignId: activeCampaign.id, bagId: composeBag.id }));
  };

  const handleDeleteBag = (bagId: string) => {
    if (!activeCampaign) return;
    if (!window.confirm(`ลบถุง ${bagId} หรือไม่?`)) return;
    dispatch(bagRemoved({ campaignId: activeCampaign.id, bagId }));
    toast({ title: "ลบถุงแล้ว", description: bagId, variant: "destructive" });
  };

  const handleCapacityChange = (value: number) => {
    if (!composeBag || !activeCampaign) return;
    dispatch(bagCapacityUpdated({ campaignId: activeCampaign.id, bagId: composeBag.id, capacity: value }));
  };

  // helper สำหรับ modal bootstrap (ควบคุม class ด้วย state)
  const renderBackdrop = (open: boolean) =>
    open ? <div className="modal-backdrop show" style={{ zIndex: 1050 }} /> : null;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Card */}
      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <h5 className="mb-1">จัดการถุงข้อสอบ</h5>
              <small className="text-muted">
                สแกนและประกอบถุงข้อสอบทีละ 30 เล่มให้ครบถ้วน ภายใต้สนามสอบเดียวกัน
              </small>
            </div>

            <div className="d-flex align-items-center flex-wrap gap-2">
              <span className="badge text-bg-secondary d-inline-flex align-items-center gap-1">
                <QrCode size={14} /> ทั้งหมด {bagStats.total}
              </span>
              <span className="badge text-bg-success d-inline-flex align-items-center gap-1">
                <CheckCircle2 size={14} /> พร้อมใช้ {bagStats.completed}
              </span>
              <span className="badge text-bg-warning d-inline-flex align-items-center gap-1">
                <AlertTriangle size={14} /> ระหว่างทำ {bagStats.inProgress}
              </span>
            </div>
          </div>
        </div>

        <div className="card-body d-flex flex-column flex-md-row gap-2 align-items-md-end justify-content-between">
          <div className="w-100 d-flex align-items-center gap-2">
            <label htmlFor="bag-search" className="visually-hidden">ค้นหา</label>
            <div className="position-relative flex-fill">
              <Search className="position-absolute" size={16} style={{ left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                id="bag-search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="ค้นหาเลขถุง รอบสอบ หรือวิชา"
                className="form-control ps-5"
              />
            </div>
          </div>

          <ShowIfCan permission="manage_bags">
            <button
              className="btn btn-primary d-inline-flex align-items-center gap-2"
              onClick={() => setCreateDialogOpen(true)}
              disabled={!activeCampaign}
            >
              <Plus size={16} /> สร้างถุงข้อสอบ
            </button>
          </ShowIfCan>
        </div>
      </div>

      {/* Table Card */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-uppercase small">
                <tr>
                  <th>Bag</th>
                  <th>รอบสอบ</th>
                  <th>วิชา</th>
                  <th className="text-center">จำนวนเล่ม</th>
                  <th className="text-center">สแกนแล้ว</th>
                  <th className="text-center">สถานะ</th>
                  <th className="text-end">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredBags.map((bag) => (
                  <tr key={bag.id} className="text-sm">
                    <td className="fw-semibold">{bag.id}</td>
                    <td>{bag.sessionLabel}</td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="fw-medium">{bag.subjectCode ?? "-"}</span>
                        <span className="small text-muted">{bag.subjectName ?? "ไม่ระบุวิชา"}</span>
                      </div>
                    </td>
                    <td className="text-center">{bag.capacity}</td>
                    <td className="text-center">{bag.scanned.length}</td>
                    <td className="text-center">
                      <span className={`badge ${STATUS_STYLE[bag.status].badge}`}>
                        {STATUS_STYLE[bag.status].label}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                          onClick={() => setComposeBagId(bag.id)}
                        >
                          <QrCode size={14} /> จัดถุง
                        </button>
                        <ShowIfCan permission="manage_bags">
                          <button
                            className="btn btn-link text-danger p-2"
                            onClick={() => handleDeleteBag(bag.id)}
                            title="ลบถุง"
                          >
                            <Trash2 size={16} />
                          </button>
                        </ShowIfCan>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBags.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      ยังไม่มีถุงข้อสอบสำหรับสนามสอบนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Bag Modal */}
      {renderBackdrop(createDialogOpen)}
      <div
        className={`modal ${createDialogOpen ? "show" : ""}`}
        style={{ display: createDialogOpen ? "block" : "none" }}
        aria-modal={createDialogOpen}
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title">สร้างถุงข้อสอบ</h6>
              <button type="button" className="btn-close" onClick={() => setCreateDialogOpen(false)} />
            </div>

            <form onSubmit={handleCreateBag}>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="bag-id" className="form-label">Bag ID</label>
                  <input id="bag-id" className="form-control" {...createForm.register("bagId", { required: true })} />
                </div>

                <div className="mb-3">
                  <label htmlFor="bag-session" className="form-label">เลือกรอบสอบ</label>
                  <select
                    id="bag-session"
                    className="form-select"
                    {...createForm.register("sessionId", { required: true })}
                  >
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.label} · {new Date(session.examDate).toLocaleDateString("th-TH")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="bag-subject" className="form-label">วิชาที่บรรจุ</label>
                  <select
                    id="bag-subject"
                    className="form-select"
                    {...createForm.register("subjectId")}
                  >
                    {availableSubjects.length === 0 && <option value="">ไม่มีวิชา</option>}
                    {availableSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.code} · {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label htmlFor="bag-capacity" className="form-label">จำนวนเล่มต่อถุง</label>
                  <input
                    id="bag-capacity"
                    type="number"
                    min={1}
                    className="form-control"
                    {...createForm.register("capacity", { valueAsNumber: true, required: true })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setCreateDialogOpen(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">สร้างถุง</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Compose Bag Modal */}
      {renderBackdrop(!!composeBag)}
      <div
        className={`modal ${composeBag ? "show" : ""}`}
        style={{ display: composeBag ? "block" : "none" }}
        aria-modal={!!composeBag}
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content">
            {composeBag && (
              <>
                <div className="modal-header">
                  <h6 className="modal-title">
                    ประกอบถุง : {composeBag.id}{" "}
                    <span className="fw-normal text-muted">
                      ({composeBag.scanned.length}/{composeBag.capacity})
                    </span>
                  </h6>
                  <button type="button" className="btn-close" onClick={() => setComposeBagId(null)} />
                </div>

                <div className="modal-body">
                  <div className="row g-3">
                    {/* Left: Scanned list */}
                    <div className="col-lg-7">
                      <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white">
                          <h6 className="mb-1">รายการสแกนแล้ว</h6>
                          <small className="text-muted">
                            วิชา {composeBag.subjectCode ?? "-"} · {composeBag.subjectName ?? "ไม่ระบุ"} · รอบ {composeBag.sessionLabel}
                          </small>
                        </div>
                        <div className="card-body">
                          <div className="d-flex align-items-center justify-content-between small text-muted mb-2">
                            <span>จำนวนที่ต้องการ</span>
                            <div className="d-flex align-items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                value={composeBag.capacity}
                                onChange={(e) => handleCapacityChange(Number(e.target.value))}
                                className="form-control form-control-sm text-end"
                                style={{ width: 90 }}
                              />
                              <span>เล่ม</span>
                            </div>
                          </div>

                          <div className="border rounded overflow-auto" style={{ maxHeight: 240 }}>
                            <ul className="list-group list-group-flush">
                              {composeBag.scanned.map((code) => (
                                <li key={code} className="list-group-item d-flex align-items-center justify-content-between">
                                  <span className="fw-medium">{code}</span>
                                  <button
                                    className="btn btn-link text-danger p-1"
                                    onClick={() => handleRemoveCode(code)}
                                    title="ลบ"
                                  >
                                    <X size={16} />
                                  </button>
                                </li>
                              ))}
                              {composeBag.scanned.length === 0 && (
                                <li className="list-group-item text-center text-muted">ยังไม่มีการสแกน QR Code</li>
                              )}
                            </ul>
                          </div>

                          <div className="d-flex justify-content-between small mt-2">
                            <span className="text-muted">ครบ 30 เล่มหรือไม่</span>
                            <span className={composeBag.scanned.length >= composeBag.capacity ? "text-success" : "text-warning"}>
                              {composeBag.scanned.length >= composeBag.capacity ? "ครบแล้ว" : "ยังไม่ครบ"}
                            </span>
                          </div>

                          <div className="d-flex justify-content-end mt-2">
                            <button className="btn btn-link" onClick={handleClearCodes}>ล้างทั้งหมด</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Scanner & manual add */}
                    <div className="col-lg-5">
                      <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white">
                          <h6 className="mb-1">สแกนเพิ่ม</h6>
                          <small className="text-muted">ใช้กล้องโทรศัพท์สแกนหรือคีย์รหัสเอง</small>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <label className="form-label small text-uppercase text-muted">สแกนด้วยกล้อง</label>
                            <div className="rounded border bg-black overflow-hidden">
                              {scannerEnabled ? (
                                <Scanner
                                  formats={["qr_code"]}
                                  constraints={{ deviceId }}
                                  onScan={(detected) => detected?.[0]?.rawValue && handleScan(detected[0].rawValue)}
                                  onError={(error) => console.log(`onError: ${error}`)}
                                  styles={{ container: { height: "400px", width: "100%" } }}
                                  components={{ onOff: true, torch: true, zoom: true, finder: true, tracker: boundingBox }}
                                  allowMultiple={true}
                                  scanDelay={2000}
                                />
                              ) : (
                                <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 192 }}>
                                  รีเซ็ตกล้อง...
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mb-2">
                            <label className="form-label small text-uppercase text-muted">เพิ่มรหัสด้วยตนเอง</label>
                            <div className="d-flex gap-2">
                              <input
                                className="form-control"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="กรอก QR code"
                              />
                              <button className="btn btn-outline-secondary" onClick={handleManualAdd}>เพิ่ม</button>
                            </div>
                          </div>

                          {composeBag.scanned.length < composeBag.capacity && (
                            <div className="alert alert-warning py-2 small mb-0">
                              ยังขาด {composeBag.capacity - composeBag.scanned.length} เล่ม
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={() => setComposeBagId(null)}>ยกเลิก</button>
                  <button className="btn btn-primary" onClick={handleFinalize}>บันทึกถุงข้อสอบ</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
