import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Scanner, boundingBox } from "@yudiel/react-qr-scanner";
import {
  AlertTriangle,
  CheckCircle2,
  QrCode,
  Search,
  Trash2,
  Plus,
  X,
  Loader2,
  DatabaseZap,
} from "lucide-react";

// business logic / auth / store
import { useToast } from "@/components/ui/use-toast";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { selectActiveCampaign, selectActiveCampaignSessions } from "@/store/slices/examData.slice";

// bags slice (actions + thunks + selectors)
import {
  bagFinalized, // (ยังเผื่อไว้สำหรับ client-side fallback)
  bagRemoved,
  bagScanAdded,
  bagScanRemoved,
  bagScansCleared,
  bagCapacityUpdated,
  selectBagsForCampaign,
  selectBagById,
  selectDefaultBagCapacity,
  selectBagStatsForCampaign,
  bulkCreateBagsThunk,
  finalizeAndLinkBagThunk,
  selectBagsSlice,
} from "@/store/slices/bags.slice";

// ------------------------------
// Form types
// ------------------------------
interface CreateBagForm {
  prefix: string;
  count: number;
  sessionId: string;
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
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const activeCampaign = useAppSelector(selectActiveCampaign);
  const sessions = useAppSelector(selectActiveCampaignSessions);
  const bags = useAppSelector(selectBagsForCampaign(activeCampaign?.id ?? null));
  const bagStats = useAppSelector(selectBagStatsForCampaign(activeCampaign?.id ?? null));
  const defaultCapacity = useAppSelector(selectDefaultBagCapacity);
  const { status: bagStatus } = useAppSelector(selectBagsSlice);

  const [searchText, setSearchText] = useState("");
  const [composeBagId, setComposeBagId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const deviceId: string | undefined = undefined;

  const createForm = useForm<CreateBagForm>();

  // Reset ค่าเริ่มต้นตอนเปิด modal
  useEffect(() => {
    if (!createDialogOpen) return;
    const defaultSessionId = sessions?.[0]?.id ?? "";
    createForm.reset({
      prefix: "BAG-",
      count: 120,
      sessionId: defaultSessionId,
      capacity: defaultCapacity,
    });
  }, [createDialogOpen, sessions, createForm, defaultCapacity]);

  const composeBag = useAppSelector((state) =>
    composeBagId && activeCampaign
      ? selectBagById(activeCampaign.id, composeBagId)(state)
      : null
  );

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

  // ------------------------------
  // Bulk Create
  // ------------------------------
  const handleBulkCreateBags = createForm.handleSubmit(async (values) => {
    if (!activeCampaign) {
      toast({ title: "กรุณาเลือกสนามสอบ", variant: "destructive" });
      return;
    }
    if (!values.sessionId) {
      toast({ title: "ต้องเลือกรอบสอบ", variant: "destructive" });
      return;
    }
    const session = sessions.find((s: any) => s.id === values.sessionId);

    const payload = {
      campaignId: activeCampaign.id,
      sessionId: values.sessionId,
      sessionLabel: session?.label ?? "ไม่ระบุรอบสอบ",
      prefix: values.prefix,
      count: values.count,
      capacity: values.capacity,
      subjectCode: session?.subjects?.[0]?.code ?? "MIXED",
      subjectName: session?.subjects?.[0]?.name ?? "คละวิชา",
    };

    await dispatch(bulkCreateBagsThunk(payload)).unwrap();

    setCreateDialogOpen(false);
    toast({
      title: "สร้างถุงข้อสอบ (Bulk) สำเร็จ",
      description: `สร้าง ${values.count} ถุง (Prefix: ${values.prefix})`,
    });
  });

  // ------------------------------
  // Scan (QR Payload)
  // ------------------------------
  const handleScan = (data: string) => {
    if (!composeBag || !activeCampaign || !scannerEnabled) return;

    // กันสแกนซ้ำ
    if (composeBag.scanned.includes(data)) {
      toast({
        title: "สแกนซ้ำ",
        description: "QR Code นี้ถูกสแกนในถุงแล้ว",
        variant: "destructive",
      });
      return;
    }

    dispatch(
      bagScanAdded({ campaignId: activeCampaign.id, bagId: composeBag.id, code: data })
    );
    setManualCode("");

    // รีเฟรชกล้องเล็กน้อย
    setScannerEnabled(false);
    setTimeout(() => setScannerEnabled(true), 500);
  };

  const handleManualAdd = () => {
    const v = manualCode.trim();
    if (!v) return;
    handleScan(v);
  };

  // ------------------------------
  // Finalize (ส่งไป backend เพื่อ link)
  // ------------------------------
  const handleFinalizeAndLink = async () => {
    if (!composeBag || !activeCampaign) return;
    const isComplete = composeBag.scanned.length >= composeBag.capacity;

    if (!isComplete) {
      toast({
        title: "ถุงยังไม่ครบ",
        description: `สแกน ${composeBag.scanned.length}/${composeBag.capacity} เล่ม`,
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await dispatch(
        finalizeAndLinkBagThunk({
          campaignId: activeCampaign.id,
          bagId: composeBag.id,
          scannedCodes: composeBag.scanned,
        })
      ).unwrap();

      toast({
        title: "บันทึกและเชื่อมโยงข้อมูลสำเร็จ",
        description: `ถุง ${composeBag.id} บันทึกสมุด ${result.bookletsCreated} เล่ม`,
      });
      setComposeBagId(null);
    } catch (error: any) {
      console.error("Finalize Error:", error);
      toast({
        title: "Finalize ล้มเหลว",
        description: error?.message ?? "ไม่สามารถเชื่อมโยงข้อมูลกับ Backend ได้",
        variant: "destructive",
      });
    }
  };

  // ------------------------------
  // Misc actions
  // ------------------------------
  const handleRemoveCode = (code: string) => {
    if (!composeBag || !activeCampaign) return;
    dispatch(
      bagScanRemoved({ campaignId: activeCampaign.id, bagId: composeBag.id, code })
    );
  };

  const handleClearCodes = () => {
    if (!composeBag || !activeCampaign) return;
    if (window.confirm("ลบรายการสแกนทั้งหมดหรือไม่?")) {
      dispatch(bagScansCleared({ campaignId: activeCampaign.id, bagId: composeBag.id }));
    }
  };

  const handleDeleteBag = (bagId: string) => {
    if (!activeCampaign) return;
    if (window.confirm(`ลบถุง ${bagId} หรือไม่?`)) {
      dispatch(bagRemoved({ campaignId: activeCampaign.id, bagId }));
      toast({ title: "ลบถุงแล้ว", description: bagId, variant: "destructive" });
    }
  };

  const handleCapacityChange = (value: number) => {
    if (!composeBag || !activeCampaign) return;
    if (Number.isNaN(value) || value < 1) return;
    dispatch(
      bagCapacityUpdated({
        campaignId: activeCampaign.id,
        bagId: composeBag.id,
        capacity: value,
      })
    );
  };

  const renderBackdrop = (open: boolean) =>
    open ? <div className="modal-backdrop show" style={{ zIndex: 1050 }} /> : null;

  // ==============================
  // Render
  // ==============================
  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <h5 className="mb-1">จัดการถุงข้อสอบ</h5>
              <small className="text-muted">
                สร้างถุงและสแกนสมุดคำตอบ (QR Payload) เพื่อเชื่อมโยงข้อมูล
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
            <label htmlFor="bag-search" className="visually-hidden">
              ค้นหา
            </label>
            <div className="position-relative flex-fill">
              <Search
                className="position-absolute"
                size={16}
                style={{
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
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
              <Plus size={16} /> สร้างถุง (Bulk)
            </button>
          </ShowIfCan>
        </div>
      </div>

      {/* Table */}
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
                        <span className="small text-muted">
                          {bag.subjectName ?? "ไม่ระบุวิชา"}
                        </span>
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
                          disabled={bag.status === "ready" || bag.status === "incomplete"}
                        >
                          <QrCode size={14} />
                          {bag.status === "draft" ? "สแกน/จัดถุง" : "ดูรายการ"}
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
                      {bagStatus === "loading" ? "Loading..." : "ยังไม่มีถุงข้อสอบสำหรับสนามสอบนี้"}
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
              <h6 className="modal-title">สร้างถุงข้อสอบ (Bulk Create)</h6>
              <button
                type="button"
                className="btn-close"
                onClick={() => setCreateDialogOpen(false)}
              />
            </div>

            <form onSubmit={handleBulkCreateBags}>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="bag-session" className="form-label">
                    เลือกรอบสอบ
                  </label>
                  <select
                    id="bag-session"
                    className="form-select"
                    {...createForm.register("sessionId", { required: true })}
                  >
                    <option value="">-- เลือกรอบสอบ --</option>
                    {sessions.map((session: any) => (
                      <option key={session.id} value={session.id}>
                        {session.label} ·{" "}
                        {new Date(session.examDate).toLocaleDateString("th-TH")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row g-3">
                  <div className="col-sm-6">
                    <label htmlFor="bag-prefix" className="form-label">
                      คำนำหน้า (Prefix)
                    </label>
                    <input
                      id="bag-prefix"
                      className="form-control"
                      {...createForm.register("prefix", { required: true })}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label htmlFor="bag-count" className="form-label">
                      จำนวน (ถุง)
                    </label>
                    <input
                      id="bag-count"
                      type="number"
                      min={1}
                      className="form-control"
                      {...createForm.register("count", {
                        valueAsNumber: true,
                        required: true,
                        min: 1,
                      })}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label htmlFor="bag-capacity" className="form-label">
                    จำนวนเล่มต่อถุง
                  </label>
                  <input
                    id="bag-capacity"
                    type="number"
                    min={1}
                    className="form-control"
                    disabled
                    {...createForm.register("capacity", {
                      valueAsNumber: true,
                      required: true,
                    })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={bagStatus === "loading"}
                >
                  {bagStatus === "loading" && (
                    <Loader2 size={16} className="me-2 spin-animation" />
                  )}
                  สร้าง {createForm.getValues("count") ?? 0} ถุง
                </button>
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
                    สแกนสมุดคำตอบ : {composeBag.id}{" "}
                    <span className="fw-normal text-muted">
                      ({composeBag.scanned.length}/{composeBag.capacity})
                    </span>
                  </h6>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setComposeBagId(null)}
                  />
                </div>

                <div className="modal-body">
                  <div className="row g-3">
                    {/* Left: scanned list */}
                    <div className="col-lg-7">
                      <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white">
                          <h6 className="mb-1">รายการสแกนแล้ว (QR Payloads)</h6>
                          <small className="text-muted">
                            วิชา {composeBag.subjectCode ?? "-"} ·{" "}
                            {composeBag.subjectName ?? "ไม่ระบุ"} · รอบ{" "}
                            {composeBag.sessionLabel}
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
                                onChange={(e) =>
                                  handleCapacityChange(Number(e.target.value))
                                }
                                className="form-control form-control-sm text-end"
                                style={{ width: 90 }}
                              />
                              <span>เล่ม</span>
                            </div>
                          </div>

                          <div
                            className="border rounded overflow-auto"
                            style={{ maxHeight: 240 }}
                          >
                            <ul className="list-group list-group-flush">
                              {composeBag.scanned.map((code) => (
                                <li
                                  key={code}
                                  className="list-group-item d-flex align-items-center justify-content-between"
                                >
                                  <span
                                    className="fw-medium text-truncate"
                                    style={{ maxWidth: "80%" }}
                                  >
                                    {code}
                                  </span>
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
                                <li className="list-group-item text-center text-muted">
                                  ยังไม่มีการสแกน QR Code
                                </li>
                              )}
                            </ul>
                          </div>

                          <div className="d-flex justify-content-between small mt-2">
                            <span className="text-muted">
                              ครบ {composeBag.capacity} เล่มหรือไม่
                            </span>
                            <span
                              className={
                                composeBag.scanned.length >= composeBag.capacity
                                  ? "text-success"
                                  : "text-warning"
                              }
                            >
                              {composeBag.scanned.length >= composeBag.capacity
                                ? "ครบแล้ว"
                                : "ยังไม่ครบ"}
                            </span>
                          </div>

                          <div className="d-flex justify-content-end mt-2">
                            <button className="btn btn-link" onClick={handleClearCodes}>
                              ล้างทั้งหมด
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: scanner & manual add */}
                    <div className="col-lg-5">
                      <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white">
                          <h6 className="mb-1">สแกนเพิ่ม (QR Payload)</h6>
                          <small className="text-muted">
                            สแกน QR Code ที่เข้ารหัสจากใบเซ็นชื่อ
                          </small>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <label className="form-label small text-uppercase text-muted">
                              สแกนด้วยกล้อง
                            </label>
                            <div className="rounded border bg-black overflow-hidden">
                              {scannerEnabled ? (
                                <Scanner
                                  formats={["qr_code"]}
                                  constraints={{ deviceId }}
                                  onScan={(detected) =>
                                    detected?.[0]?.rawValue &&
                                    handleScan(detected[0].rawValue)
                                  }
                                  onError={(error) => console.log(`onError: ${error}`)}
                                  styles={{ container: { height: "400px", width: "100%" } }}
                                  components={{
                                    onOff: true,
                                    torch: true,
                                    zoom: true,
                                    finder: true,
                                    tracker: boundingBox,
                                  }}
                                  allowMultiple={false}
                                  scanDelay={1000}
                                />
                              ) : (
                                <div
                                  className="d-flex align-items-center justify-content-center text-muted"
                                  style={{ height: 400 }}
                                >
                                  <Loader2 size={24} className="me-2 spin-animation" />
                                  รีเซ็ตกล้อง...
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mb-2">
                            <label className="form-label small text-uppercase text-muted">
                              เพิ่มรหัสด้วยตนเอง
                            </label>
                            <div className="d-flex gap-2">
                              <input
                                className="form-control"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="กรอก QR code"
                              />
                              <button
                                className="btn btn-outline-secondary"
                                onClick={handleManualAdd}
                              >
                                เพิ่ม
                              </button>
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
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setComposeBagId(null)}
                  >
                    ยกเลิก
                  </button>
                  <button
                    className="btn btn-primary d-inline-flex align-items-center gap-2"
                    onClick={handleFinalizeAndLink}
                    disabled={
                      bagStatus === "loading" ||
                      composeBag.scanned.length < composeBag.capacity
                    }
                  >
                    {bagStatus === "loading" ? (
                      <Loader2 size={16} className="spin-animation" />
                    ) : (
                      <DatabaseZap size={16} />
                    )}
                    บันทึกและเชื่อมโยงข้อมูล
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
