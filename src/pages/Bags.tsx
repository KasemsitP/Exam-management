import { useEffect, useMemo, useRef, useState } from "react";
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

// Thunks & selectors
import {
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
  fetchBagsForCampaignThunk,
  deleteBagThunk,
  selectBookletsInBag,
  ScannedPayloadThunk
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

// Fallback สำหรับสถานะที่ไม่รู้จักหรือ undefined
const getStatusStyle = (
  status: string | undefined
): { badge: string; label: string } => {
  if (!status) return { badge: "text-bg-secondary", label: "ไม่ทราบ" };
  const m = STATUS_STYLE[status as keyof typeof STATUS_STYLE];
  return m ?? { badge: "text-bg-secondary", label: status };
};

// ปรับแต่งรูปแบบ payload ให้เทียบเท่ากันเสมอ
const normalizePayload = (s: string) => s.trim(); // ถ้า payload ไม่ case-sensitive อาจเพิ่ม .toLowerCase()

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
  const [filterSessionId, setFilterSessionId] = useState<string>("all");
  const [composeBagId, setComposeBagId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const deviceId: string | undefined = undefined;


  const createForm = useForm<CreateBagForm>();

  // === NEW: ใช้ Set ป้องกันซ้ำในถุง ===
  // เก็บ payload ที่สแกนแล้วในถุงปัจจุบัน (O(1))
  const scannedSetRef = useRef<Set<string>>(new Set());
  // กันยิงซ้ำในช่วงเวลาใกล้ๆ (เช่น กล้องยิงสองเฟรมติดกัน)
  const recentScanSetRef = useRef<Set<string>>(new Set());
  const RECENT_WINDOW_MS = 1200;

  // Reset ค่าเริ่มต้นตอนเปิด modal
  useEffect(() => {
    if (!createDialogOpen) return;
    const defaultSessionId = sessions?.[0]?.id ?? "";
    createForm.reset({
      prefix: "BAG-",
      count: 120,
      sessionId: defaultSessionId != null ? String(defaultSessionId) : "",
      capacity: defaultCapacity,
    });
  }, [createDialogOpen, sessions, createForm, defaultCapacity]);

  useEffect(() => {
    if (activeCampaign) {
      dispatch(fetchBagsForCampaignThunk(activeCampaign.id));
    }
  }, [dispatch, activeCampaign]);

  const composeBag = useAppSelector((state) =>
    composeBagId && activeCampaign
      ? selectBagById(activeCampaign.id, composeBagId)(state)
      : null
  );

  useEffect(() => {
    if (!composeBag || !activeCampaign) return;

    // ✅ ถ้ายังไม่ seal → ไม่ต้องไปดึงจาก API
    const status = (composeBag as any).status;
    const isSealed = status === "ready" || status === "SEALED";

    if (!isSealed) return;

    const bagNo = (composeBag as any).bag_no ?? Number(composeBag.id);
    const sessionId = Number(composeBag.sessionId);
    const campaignIdNumeric = Number(activeCampaign.id);

    dispatch(
      ScannedPayloadThunk({
        bagNo,
        campaignId: campaignIdNumeric,
        sessionId,
      })
    );
  }, [composeBag, activeCampaign, dispatch]);


  // === NEW: sync Set เมื่อเปลี่ยนถุง ===
  useEffect(() => {
    scannedSetRef.current = new Set((composeBag?.scanned ?? []).map(normalizePayload));
    recentScanSetRef.current.clear();
  }, [composeBag?.id]);

  // === NEW: sync Set เมื่อรายการสแกนเปลี่ยน (จาก Redux) ===
  useEffect(() => {
    scannedSetRef.current = new Set((composeBag?.scanned ?? []).map(normalizePayload));
  }, [composeBag?.scanned]);

  // useEffect(()=>{
  //   console.log(bags.map((bag)=>console.log(bag.sessionId)))
  //   console.log(bags)
  // })
  // ฟิลเตอร์ + ค้นหา
  const filteredBags = useMemo(() => {
    const term = searchText.trim().toLowerCase();

    // แปลง filterSessionId ให้ match กับ bag.sessionId
    const sessionFiltered =
      filterSessionId === "all"
        ? bags
        : bags.filter((bag) => String(bag.sessionId) === filterSessionId);

    if (!term) return sessionFiltered;

    return sessionFiltered.filter((bag) => {
      const subjectText = `${bag.subjectCode ?? ""} ${bag.subjectName ?? ""}`.toLowerCase();
      return (
        bag.id.toString().toLowerCase().includes(term) ||
        bag.sessionLabel.toLowerCase().includes(term) ||
        subjectText.includes(term)
      );
    });
  }, [bags, searchText, filterSessionId]);

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
      title: "สร้างถุงข้อสอบสำเร็จ",
      description: `สร้าง ${values.count} ถุง (Prefix: ${values.prefix})`,
    });
  });

  // ------------------------------
  // Scan (QR Payload)
  // ------------------------------
  const handleScan = (raw: string) => {
    if (!composeBag || !activeCampaign || !scannerEnabled) return;

    const data = normalizePayload(raw);

    // กันยิงซ้ำแบบเร็ว (เฟรมติดกัน)
    if (recentScanSetRef.current.has(data)) {
      return; // เงียบ ๆ ได้เลย
    }
    recentScanSetRef.current.add(data);
    setTimeout(() => recentScanSetRef.current.delete(data), RECENT_WINDOW_MS);

    // กันซ้ำในถุง (O(1))
    if (scannedSetRef.current.has(data)) {
      toast({ title: "สแกนซ้ำ", description: "QR Code นี้ถูกสแกนในถุงแล้ว", variant: "destructive" });
      return;
    }

    // ผ่าน → dispatch + อัปเดต Set ทันที (optimistic)
    dispatch(bagScanAdded({ campaignId: activeCampaign.id, bagId: composeBag.id, code: data }));
    scannedSetRef.current.add(data);

    setManualCode("");
    setScannerEnabled(false);
    setTimeout(() => setScannerEnabled(true), 500);
  };

  const handleManualAdd = () => {
    const v = normalizePayload(manualCode);
    if (!v) return;
    handleScan(v);
  };

  // ------------------------------
  // Finalize (ส่งไป backend เพื่อ link)
  // ------------------------------
  const handleFinalizeAndLink = async () => {
    if (!composeBag || !activeCampaign) return;
    const isComplete = composeBag.scanned.length >= composeBag.capacity;
    // if (!isComplete) {
    //   toast({ title: "ถุงยังไม่ครบ", description: `สแกน ${composeBag.scanned.length}/${composeBag.capacity} เล่ม`, variant: "destructive" });
    //   return;
    // }
    try {
      const result = await dispatch(
        finalizeAndLinkBagThunk({
          campaignId: activeCampaign.id,
          bag_no: composeBag.bag_no,
          scannedCodes: composeBag.scanned,
        })
      ).unwrap();
      toast({ title: "บันทึกข้อมูล", description: `ถุง ${composeBag.id} บันทึกสมุด ${composeBagId.length} เล่ม` });
      setComposeBagId(null);
    } catch (error: any) {
      console.error("Finalize Error:", error);
      toast({ title: "Finalize ล้มเหลว", description: error?.message ?? "ไม่สามารถเชื่อมโยงข้อมูลกับ Backend ได้", variant: "destructive" });
    }
  };

  // ------------------------------
  // Misc actions
  // ------------------------------
  const handleRemoveCode = (code: string) => {
    if (!composeBag || !activeCampaign) return;
    const n = normalizePayload(code);
    dispatch(bagScanRemoved({ campaignId: activeCampaign.id, bagId: composeBag.id, code: n }));
    scannedSetRef.current.delete(n); // อัปเดต Set ให้ตรงกับ Redux
  };

  const handleClearCodes = () => {
    if (!composeBag || !activeCampaign) return;
    if (window.confirm("ลบรายการสแกนทั้งหมดหรือไม่?")) {
      dispatch(bagScansCleared({ campaignId: activeCampaign.id, bagId: composeBag.id }));
      scannedSetRef.current.clear();     // เคลียร์ Set
      recentScanSetRef.current.clear();  // กันซ้ำชั่วคราวด้วย
    }
  };

  const handleDeleteBag = async (bagId: string) => {
    if (!activeCampaign) return;
    if (!window.confirm(`ลบถุง ${bagId} หรือไม่?`)) return;
    try {
      await dispatch(deleteBagThunk({ campaignId: activeCampaign.id, bagId })).unwrap();
      toast({ title: "ลบถุงแล้ว", description: bagId, variant: "destructive" });
    } catch (error: any) {
      toast({ title: "ลบถุงล้มเหลว", description: error?.message ?? "API Error", variant: "destructive" });
    }
  };

  const handleCapacityChange = (value: number) => {
    if (!composeBag || !activeCampaign) return;
    if (Number.isNaN(value) || value < 1) return;
    dispatch(
      bagCapacityUpdated({ campaignId: activeCampaign.id, bagId: composeBag.id, capacity: value })
    );
  };
  const bookletsInBag = useAppSelector((state) => {
    if (!composeBag || !activeCampaign) return [];

    const campaignNumeric = Number((activeCampaign.id));
    const sessionNumeric = Number(composeBag.sessionId);
    const bagNo = Number((composeBag as any).bag_no ?? composeBag.id); // แล้วแต่คุณ map

    return selectBookletsInBag(campaignNumeric, sessionNumeric, bagNo)(state);
  });

  const renderBackdrop = (open: boolean) =>
    open ? <div className="modal-backdrop show" style={{ zIndex: 1050 }} /> : null;

const status = composeBag ? (composeBag as any).status : undefined;
const isSealed = status === "ready" || status === "SEALED";
const canScan = !isSealed;


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

        {/* Search + Filter */}
        <div className="card-body d-flex flex-column flex-md-row gap-2 align-items-md-end justify-content-between">
          <div className="w-100 d-flex flex-column flex-md-row gap-2">
            {/* Search */}
            <div className="flex-fill">
              <label htmlFor="bag-search" className="form-label small text-muted">ค้นหา (รหัสถุง, วิชา)</label>
              <div className="position-relative">
                <Search className="position-absolute" size={16} style={{ left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  id="bag-search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="ค้นหาเลขถุง, รอบสอบ, หรือวิชา"
                  className="form-control ps-5"
                />
              </div>
            </div>

            {/* Session Filter */}
            <div style={{ minWidth: "220px" }}>
              <label htmlFor="session-filter" className="form-label small text-muted">ฟิลเตอร์รอบสอบ</label>
              <select
                id="session-filter"
                className="form-select"
                value={filterSessionId}
                onChange={(e) => setFilterSessionId(e.target.value)}
              >
                <option value="all">แสดงทุกรอบสอบ</option>
                {sessions.map((session: any) => (
                  <option key={session.id} value={session.id}>
                    {session.label ?? session.title} ({new Date(session.examDate).toLocaleDateString("th-TH")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 pt-md-0">
            <ShowIfCan permission="manage_bags">
              <button className="btn btn-primary d-inline-flex align-items-center gap-2 w-100" onClick={() => setCreateDialogOpen(true)} disabled={!activeCampaign}>
                <Plus size={16} /> สร้างถุงข้อสอบ
              </button>
            </ShowIfCan>
          </div>
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
                  {/* <th>วิชา</th> */}
                  <th className="text-center">จำนวนเล่ม</th>
                  <th className="text-center">สแกนแล้ว</th>
                  <th className="text-center">สถานะ</th>
                  <th className="text-end">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredBags.map((bag) => (
                  <tr key={bag.id} className="text-sm">
                    <td className="fw-semibold">{String(bag.bag_no).padStart(3, "0")}</td>
                    <td>{bag.sessionLabel}</td>
                    {/*<td>
                     <div className="d-flex flex-column">
                        <span className="fw-medium">{bag.subjectCode ?? "-"}</span>
                        <span className="small text-muted">{bag.subjectName ?? "ไม่ระบุวิชา"}</span>
                      </div>
                    </td>*/}
                    <td className="text-center">{bag.capacity}</td>
                    <td className="text-center">{bag.scannedCount ?? 0}</td>
                    <td className="text-center">
                      {(() => {
                        const st = getStatusStyle((bag as any).status);
                        return <span className={`badge ${st.badge}`}>{st.label}</span>;
                      })()}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                          onClick={() => setComposeBagId(bag.id)}
                          disabled={bag.status === "ready" || bag.status === "incomplete"}
                        >
                          <QrCode size={14} /> {bag.status === "draft" ? "สแกน/จัดถุง" : "ดูรายการ"}
                        </button>
                        <ShowIfCan permission="manage_bags">
                          <button className="btn btn-link text-danger p-2" onClick={() => handleDeleteBag(bag.id)} title="ลบถุง">
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
      <div className={`modal ${createDialogOpen ? "show" : ""}`} style={{ display: createDialogOpen ? "block" : "none" }} aria-modal={createDialogOpen} role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title">สร้างถุงข้อสอบ </h6>
              <button type="button" className="btn-close" onClick={() => setCreateDialogOpen(false)} />
            </div>
            <form onSubmit={handleBulkCreateBags}>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="bag-session" className="form-label">เลือกรอบสอบ</label>
                  <select id="bag-session" className="form-select" {...createForm.register("sessionId", { required: true })}>
                    <option value="">-- เลือกรอบสอบ --</option>
                    {sessions.map((session: any) => (
                      <option key={session.id} value={session.id}>
                        {session.label ?? session.title} · {new Date(session.examDate).toLocaleDateString("th-TH")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row g-3">
                  {/*<div className="col-sm-6">
                    <label htmlFor="bag-prefix" className="form-label">คำนำหน้า (Prefix)</label>
                    <input id="bag-prefix" className="form-control" {...createForm.register("prefix", { required: true })} />
                  </div>*/}
                  <div className="col-sm-6">
                    <label htmlFor="bag-count" className="form-label">จำนวน (ถุง)</label>
                    <input id="bag-count" type="number" min={1} className="form-control" {...createForm.register("count", { valueAsNumber: true, required: true, min: 1 })} />
                  </div>
                </div>

                <div className="mt-3">
                  <label htmlFor="bag-capacity" className="form-label">จำนวนเล่มต่อถุง</label>
                  <input id="bag-capacity" type="number" min={1} className="form-control" disabled {...createForm.register("capacity", { valueAsNumber: true, required: true })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setCreateDialogOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={bagStatus === "loading"}>
                  {bagStatus === "loading" && <Loader2 size={16} className="me-2 spin-animation" />}
                  สร้าง {createForm.getValues("count") ?? 0} ถุง
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Compose Bag Modal */}
      {renderBackdrop(!!composeBag)}
      <div className={`modal ${composeBag ? "show" : ""}`} style={{ display: composeBag ? "block" : "none" }} aria-modal={!!composeBag} role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content">
            {composeBag && (
              <>
                <div className="modal-header">
                  <h6 className="modal-title">
                    สแกนสมุดคำตอบ : {composeBag.id}{" "}
                    <span className="fw-normal text-muted">({composeBag.scanned.length}/{composeBag.capacity})</span>
                  </h6>
                  <button type="button" className="btn-close" onClick={() => setComposeBagId(null)} />
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    {/* Left: scanned list */}
                    <div className="col-lg-7">
                      <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white">
                          <h6 className="mb-1">รายการสแกนแล้ว (QR Payloads)</h6>
                          <small className="text-muted">วิชา {composeBag.subjectCode ?? "-"} · {composeBag.subjectName ?? "ไม่ระบุ"} · รอบ {composeBag.sessionLabel}</small>
                        </div>
                        <div className="card-body">
                          <div className="d-flex align-items-center justify-content-between small text-muted mb-2">
                            <span>จำนวนที่ต้องการ</span>
                            <div className="d-flex align-items-center gap-2">
                              <input type="number" min={1} value={composeBag.capacity} onChange={(e) => handleCapacityChange(Number(e.target.value))} className="form-control form-control-sm text-end" style={{ width: 90 }} />
                              <span>เล่ม</span>
                            </div>
                          </div>
                          <div className="border rounded overflow-auto" style={{ maxHeight: 240 }}>
                            <ul className="list-group list-group-flush">
                              {isSealed
                                ? bookletsInBag.map((bk) => (
                                  <li key={bk.id} className="list-group-item">
                                    <div className="d-flex flex-column">
                                      <span className="fw-medium">
                                        {bk.userCode} — {bk.fullName}
                                      </span>
                                      <span
                                        className="small text-muted text-truncate"
                                        style={{ maxWidth: "100%" }}
                                      >
                                        {bk.qrPayload}
                                      </span>
                                    </div>
                                  </li>
                                ))
                                : composeBag.scanned.map((code) => (
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

                              {(!isSealed && composeBag.scanned.length === 0) ||
                                (isSealed && bookletsInBag.length === 0) ? (
                                <li className="list-group-item text-center text-muted">
                                  ยังไม่มีการสแกน QR Code
                                </li>
                              ) : null}
                            </ul>
                          </div>
                          <div className="d-flex justify-content-between small mt-2">
                            <span className="text-muted">ครบ {composeBag.capacity} เล่มหรือไม่</span>
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

                    {/* Right: scanner & manual add */}
                    <div className="col-lg-5">
                      <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white">
                          <h6 className="mb-1">สแกนเพิ่ม (QR Payload)</h6>
                          <small className="text-muted">สแกน QR Code ที่เข้ารหัสจากใบเซ็นชื่อ</small>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <label className="form-label small text-uppercase text-muted">สแกนด้วยกล้อง</label>
                            <div className="rounded border bg-black overflow-hidden">
                              {canScan && scannerEnabled ? (
                                <Scanner
                                  formats={["qr_code"]}
                                  constraints={deviceId ? { deviceId } : undefined}
                                  onScan={(detected) => detected?.[0]?.rawValue && handleScan(detected[0].rawValue)}
                                  onError={(error) => console.log(`onError: ${error}`)}
                                  styles={{ container: { height: "400px", width: "100%" } }}
                                  components={{ onOff: true, torch: true, zoom: true, finder: true, tracker: boundingBox }}
                                  allowMultiple={false}
                                  scanDelay={1000}
                                />
                              ) : (
                                <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 400 }}>
                                  <Loader2 size={24} className="me-2 spin-animation" /> รีเซ็ตกล้อง...
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mb-2">
                            <label className="form-label small text-uppercase text-muted">เพิ่มรหัสด้วยตนเอง</label>
                            <div className="d-flex gap-2">
                              <input className="form-control" value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="กรอก QR code" disabled={!canScan} />
                              <button className="btn btn-outline-secondary" onClick={handleManualAdd} disabled={!canScan}>เพิ่ม</button>
                            </div>
                          </div>
                          {composeBag.scanned.length < composeBag.capacity && (
                            <div className="alert alert-warning py-2 small mb-0">ยังขาด {composeBag.capacity - composeBag.scanned.length} เล่ม</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={() => setComposeBagId(null)}>ยกเลิก</button>
                  <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={handleFinalizeAndLink} disabled={!canScan}> {/*disabled={bagStatus === "loading" || composeBag.scanned.length < composeBag.capacity */}
                    {bagStatus === "loading" ? <Loader2 size={16} className="spin-animation" /> : <DatabaseZap size={16} /> }
                    บันทึกข้อมูล
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
