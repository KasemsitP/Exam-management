import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ClipboardCheck, HandCoins, History, Search } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useAppDispatch, useAppSelector } from "@/store/hook";

import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
} from "@/store/slices/examData.slice";
import { selectCurrentUser } from "@/store/slices/auth.slice";

// ถุง + ผู้ตรวจ
import { selectBagsForCampaign } from "@/store/slices/bags.slice";
import { selectGradersForCampaign } from "@/store/slices/graders.slice";
import { fetchBagsForCampaignThunk } from "@/store/slices/bags.slice";

// สถานะส่งมอบถุง
import {
  fetchBagHandoverForCampaign,
  selectBagLocksForCampaign,
  selectBagLogsForCampaign,
  BagLock,
  returnBagThunk,
  registerBagToGraderThunk,
} from "@/store/slices/bagHandover.slice";

// 🎯 grading history
import {
  fetchRecordThunk,
  selectGradingRecords,
  selectIsGradingLoading,
  selectGradingError,
} from "@/store/slices/grading.slice";
import { fetchGradersForCampaignThunk } from "@/store/slices/graders.slice";

interface CheckoutFormValues {
  sessionId: string;
  bagId: string; // 👉 ใช้เก็บ bag_id (PK)
  graderId: string;
  note?: string;
}

export default function BagHandoverPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  // ---------- Redux selectors ----------
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const sessions = useAppSelector(selectActiveCampaignSessions);

  const bags = useAppSelector(
    selectBagsForCampaign(activeCampaign?.id ?? null)
  );

  const graders = useAppSelector(
    selectGradersForCampaign(
      activeCampaign ? Number(activeCampaign.id) : null
    )
  );

  const locks = useAppSelector(
    selectBagLocksForCampaign(activeCampaign?.id ?? null)
  );
  const logs = useAppSelector(
    selectBagLogsForCampaign(activeCampaign?.id ?? null)
  );
  const operator = useAppSelector(selectCurrentUser);

  // grading history
  const gradingRecords = useAppSelector(selectGradingRecords);
  const gradingLoading = useAppSelector(selectIsGradingLoading);
  const gradingError = useAppSelector(selectGradingError);

  // ---------- Local state / form ----------
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSessionId, setFilterSessionId] = useState<string>("all");

  // 👉 ใช้เก็บ bag_id (string) ของถุงที่เลือกอยู่
  const [selectedBagId, setSelectedBagId] = useState<string>("");

  const form = useForm<CheckoutFormValues>({
    defaultValues: { sessionId: "", bagId: "", graderId: "", note: "" },
  });

  // ---------- Effects ----------
  
    // --- 2. Fetch Graders (ถ้ายังไม่มี) ---
    useEffect(() => {
      if (activeCampaign) {
        dispatch(fetchGradersForCampaignThunk(activeCampaign.id ? Number(activeCampaign.id) : null));
      }
    }, [activeCampaign, dispatch]);

  // โหลด handover เมื่อมี campaign
  useEffect(() => {
    if (!activeCampaign) return;
    dispatch(
      fetchBagHandoverForCampaign({
        campaignId: activeCampaign.id,
      })
    );
  }, [activeCampaign, dispatch]);

  // ตั้งค่า session default ในฟอร์ม
  useEffect(() => {
    if (!sessions.length) return;
    const defaultSessionId = sessions[0]?.id?.toString() ?? "";
    form.setValue("sessionId", defaultSessionId);
    setFilterSessionId(defaultSessionId || "all");
  }, [sessions, form]);


    useEffect(() => {
      if (activeCampaign) {
        dispatch(fetchBagsForCampaignThunk(activeCampaign.id));
      }
    }, [dispatch, activeCampaign]);
  // ---------- Memoized helpers ----------

  // map ด้วย bag_id (id) เป็น key
  const bagMap = useMemo(() => {
    return bags.reduce<Record<string, (typeof bags)[number]>>((map, bag) => {
      map[String(bag.id)] = bag;
      return map;
    }, {});
  }, [bags]);

  // filter ตาม session + search
  const filteredBags = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const sessionFiltered =
      filterSessionId === "all"
        ? bags
        : bags.filter((bag) => String(bag.sessionId) === filterSessionId);

    if (!term) return sessionFiltered;

    return sessionFiltered.filter((bag) => {
      const subjectText = `${bag.subjectCode ?? ""} ${
        bag.subjectName ?? ""
      }`.toLowerCase();
      return (
        String(bag.id).toLowerCase().includes(term) ||
        (bag.sessionLabel ?? "").toLowerCase().includes(term) ||
        subjectText.includes(term)
      );
    });
  }, [bags, searchTerm, filterSessionId]);

  // lock ปัจจุบันของถุง (match ด้วย bag_id)
  const currentLock: BagLock | null = useMemo(() => {
    if (!selectedBagId || !activeCampaign) return null;
    return (
      locks.find(
        (lock) => String(lock.bagId) === String(selectedBagId)
      ) ?? null
    );
  }, [locks, selectedBagId, activeCampaign]);

  // ถุงที่เลือก (จาก bag_id)
  const currentBag = useMemo(() => {
    if (!selectedBagId) return undefined;
    return bagMap[String(selectedBagId)];
  }, [selectedBagId, bagMap]);

  const sessionIdInForm = form.watch("sessionId");
  const bagsForSelectedSession = useMemo(() => {
    if (!sessionIdInForm) return [];
    return bags.filter(
      (bag) => String(bag.sessionId) === String(sessionIdInForm)
    );
  }, [bags, sessionIdInForm]);

  // 🎯 เลือก grader id (สำหรับดึงประวัติคะแนน)
  const graderIdInForm = form.watch("graderId");
  const graderIdForHistory = useMemo(() => {
    if (graderIdInForm) return graderIdInForm;
    if (currentLock?.graderId) return String(currentLock.graderId);
    return null;
  }, [graderIdInForm, currentLock]);

  // 🎯 ดึงประวัติคะแนนเมื่อ graderIdForHistory เปลี่ยน
  useEffect(() => {
    if (!graderIdForHistory) return;
    dispatch(fetchRecordThunk(Number(graderIdForHistory)));
  }, [graderIdForHistory, dispatch]);

  // ---------- Handlers ----------

  // **ลงทะเบียนส่งมอบถุงให้ผู้ตรวจ**  (Check-in)
  const handleRegisterBag = (values: CheckoutFormValues) => {
    if (!activeCampaign || !operator) {
      toast({
        title: "ไม่พบข้อมูลแคมเปญหรือผู้ใช้งาน",
        variant: "destructive",
      });
      return;
    }
    if (!values.sessionId || !values.bagId || !values.graderId) {
      toast({
        title: "กรุณาเลือกรอบสอบ ถุง และผู้ตรวจ",
        variant: "destructive",
      });
      return;
    }

    // ถุงนี้มี lock อยู่แล้วหรือยัง (ใช้ bag_id)
    if (
      locks.some(
        (lock) => String(lock.bagId) === String(values.bagId)
      )
    ) {
      toast({
        title: "ถุงนี้อยู่ระหว่างการตรวจ",
        description: "กรุณารับคืนก่อนส่งมอบให้ผู้อื่น",
        variant: "destructive",
      });
      return;
    }

    // หา grader จากรายการ (ใช้ account_id หรือ id ตามโครงสร้างคุณ)
    const grader = graders.find(
      (item: any) => String(item.account_id) === values.graderId
    );
    if (!grader) {
      toast({ title: "ไม่พบข้อมูลผู้ตรวจ", variant: "destructive" });
      return;
    }

    const graderName =
      grader.grader_name?? 
      `Grader #${grader.account_id}`;

    dispatch(
      registerBagToGraderThunk({
        campaignId: activeCampaign.id, // camp-1 หรือ "1"
        bagId: values.bagId, // 👈 ส่ง bag_id ไป backend
        graderId: values.graderId,
        graderName,
        operatorId: Number(operator.id),
        operatorName: operator.name,
        note: values.note,
      })
    )
      .unwrap()
      .then(() => {
        const bag = bagMap[values.bagId];
        const bagNo = bag?.bag_no ?? values.bagId;

        toast({
          title: "ลงทะเบียนส่งมอบเรียบร้อย",
          description: `${graderName} ได้รับถุง ${String(bagNo).padStart(
            3,
            "0"
          )}`,
        });

        setSelectedBagId(values.bagId);
        form.reset({
          sessionId: values.sessionId,
          bagId: "",
          graderId: "",
          note: "",
        });
      })
      .catch((err) => {
        toast({
          title: "ไม่สามารถลงทะเบียนส่งมอบถุงได้",
          description: String(err),
          variant: "destructive",
        });
      });
  };

  // **รับคืนถุง** (Check-out)
  const handleReturnBag = () => {
    if (!activeCampaign || !operator) {
      toast({
        title: "ไม่พบข้อมูลแคมเปญหรือผู้ใช้งาน",
        variant: "destructive",
      });
      return;
    }
    if (!currentLock) {
      toast({
        title: "ถุงนี้ยังไม่ได้ลงทะเบียน",
        description: "กรุณาเลือกถุงที่กำลังใช้งานอยู่",
        variant: "destructive",
      });
      return;
    }

    dispatch(
      returnBagThunk({
        campaignId: activeCampaign.id,
        bagId: Number(currentLock.bagId), // 👈 ใช้ bag_id
        operatorId: Number(operator.id),
      })
    )
      .unwrap()
      .then(() => {
        const bag = bagMap[String(currentLock.bagId)];
        const bagNo = bag?.bag_no ?? currentLock.bagId;

        toast({
          title: "รับคืนถุงเรียบร้อย",
          description: `ถุง ${String(bagNo).padStart(
            3,
            "0"
          )} กลับสู่สถานะว่าง`,
        });
      })
      .catch((err) => {
        toast({
          title: "ไม่สามารถรับคืนถุงได้",
          description: String(err),
          variant: "destructive",
        });
      });
  };

  // ---------- Render ----------

  return (
    <ShowIfCan permission="manage_bags">
      {!activeCampaign ? (
        <div className="border border-2 border-dashed rounded-4 p-5 text-center text-muted">
          ยังไม่มีข้อมูลแคมเปญ กรุณาเลือกแคมเปญเพื่อจัดการการส่งมอบถุง
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {/* Header Card */}
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                <div>
                  <h5 className="card-title mb-1 text-body">
                    ลงทะเบียนผู้ตรวจกับถุง
                  </h5>
                  <p className="card-text text-muted mb-0">
                    บันทึกการส่งมอบถุงข้อสอบให้ผู้ตรวจ
                    เพื่อป้องกันการใช้งานซ้ำและติดตามการทำงานแบบเรียลไทม์
                  </p>
                </div>

                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <Search size={16} className="text-muted" />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ค้นหาจากรหัสถุง รอบสอบ หรือรายวิชา"
                      className="form-control"
                      style={{ width: 260 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout / Check-in */}
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <HandCoins size={18} className="text-primary" />
                    <h6 className="mb-0">ส่งมอบ / รับคืนถุงข้อสอบ</h6>
                  </div>
                  <small className="text-muted">
                    เลือกรอบสอบ ถุง และผู้ตรวจ จากนั้นบันทึกเพื่อ
                    Check-in (ส่งมอบ) หรือ Check-out (รับคืนถุง)
                  </small>
                </div>
              </div>
            </div>

            <div className="card-body">
              <form
                onSubmit={form.handleSubmit(handleRegisterBag)}
                className="row g-3 align-items-end"
              >
                {/* Session select */}
                <div className="col-md-3">
                  <label className="form-label text-muted small mb-1">
                    เลือกรอบสอบ
                  </label>
                  <select
                    className="form-select"
                    {...form.register("sessionId", { required: true })}
                    onChange={(e) => {
                      form.setValue("sessionId", e.target.value);
                      form.setValue("bagId", "");
                      setFilterSessionId(e.target.value || "all");
                    }}
                  >
                    <option value="">เลือกรอบสอบ</option>
                    {sessions.map((session: any) => (
                      <option key={session.id} value={session.id}>
                        {session.label ?? session.title} (
                        {new Date(
                          session.examDate
                        ).toLocaleDateString("th-TH")}
                        )
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bag select */}
                <div className="col-md-4">
                  <label className="form-label text-muted small mb-1">
                    เลือกถุง
                  </label>
                  <select
                    className="form-select"
                    value={form.watch("bagId")}
                    onChange={(e) => {
                      form.setValue("bagId", e.target.value);
                      setSelectedBagId(e.target.value); // 👈 เก็บ bag_id
                    }}
                    disabled={!sessionIdInForm}
                  >
                    <option value="">
                      {sessionIdInForm
                        ? "เลือกถุงข้อสอบ"
                        : "กรุณาเลือกรอบสอบก่อน"}
                    </option>
                    {bagsForSelectedSession.map((bag) => {
                      const lock = locks.find(
                        (l) => String(l.bagId) === String(bag.id)
                      );

                      return (
                        <option key={bag.id} value={String(bag.id)}>
                          {String(bag.bag_no).padStart(3, "0")} •{" "}
                          {bag.subjectName ?? "ไม่ระบุ"} ({bag.sessionLabel}){" "}
                          {lock ? `• กำลังตรวจโดย ${lock.graderName}` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Grader select */}
                <div className="col-md-3">
                  <label className="form-label text-muted small mb-1">
                    เลือกผู้ตรวจ
                  </label>
                  <select
                    className="form-select"
                    value={form.watch("graderId")}
                    onChange={(e) => form.setValue("graderId", e.target.value)}
                  >
                    <option value="">เลือกผู้ตรวจ</option>
                    {graders.map((grader: any) => (
                      <option
                        key={grader.account_id}
                        value={String(grader.account_id)}
                      >
                        {(
                          grader.grader_name ??
                          grader.name ??
                          `${grader.first_name ?? ""} ${
                            grader.last_name ?? ""
                          }`.trim()
                        ) || `Grader #${grader.account_id}`}{" "}
                        • {grader.code ?? `G-${grader.account_id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Note */}
                <div className="col-md-2">
                  <label className="form-label text-muted small mb-1">
                    หมายเหตุ
                  </label>
                  <input
                    className="form-control"
                    placeholder="ระบุหมายเหตุ (ถ้ามี)"
                    {...form.register("note")}
                  />
                </div>

                {/* Buttons */}
                <div className="col-12 d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary flex-fill"
                    disabled={!operator}
                  >
                    ลงทะเบียนส่งมอบ (Check-in)
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary flex-fill"
                    onClick={handleReturnBag}
                    disabled={!currentLock}
                  >
                    รับคืนถุง (Check-out)
                  </button>
                </div>
              </form>

              {selectedBagId && currentLock && (
                <div className="alert alert-success mt-3 mb-0 py-2">
                  ถุง{" "}
                  <strong>
                    {String(
                      currentBag?.bag_no ?? currentLock.bagId
                    ).padStart(3, "0")}
                  </strong>{" "}
                  อยู่ระหว่างตรวจโดย {currentLock.graderName} ตั้งแต่{" "}
                  {new Date(currentLock.at).toLocaleString("th-TH")}
                </div>
              )}
            </div>
          </div>

          {/* Two columns section */}
          <div className="row g-4">
            {/* Left: Locks status */}
            <div className="col-lg-7">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-white d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1">สถานะการครอบครองถุง</h6>
                    <small className="text-muted">
                      แสดงรายการถุงทั้งหมดพร้อมผู้ตรวจ
                    </small>
                  </div>
                  <span className="badge text-bg-secondary d-inline-flex align-items-center gap-1">
                    <ClipboardCheck size={14} /> {locks.length} ถุงที่กำลังตรวจ
                  </span>
                </div>
                <div className="card-body table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-uppercase small">
                      <tr>
                        <th scope="col">รหัสถุง</th>
                        <th scope="col">รอบสอบ / วิชา</th>
                        <th scope="col">ผู้ตรวจ</th>
                        <th scope="col" className="text-end">
                          เจ้าหน้าที่ / เวลา
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBags.map((bag) => {
                        const lock = locks.find(
                          (item) => String(item.bagId) === String(bag.id)
                        );

                        const isSelected =
                          String(bag.id) === String(selectedBagId);

                        return (
                          <tr
                            key={bag.id}
                            onClick={() => setSelectedBagId(String(bag.id))}
                            style={{ cursor: "pointer" }}
                            className={isSelected ? "table-primary" : ""}
                          >
                            <td className="fw-semibold">
                              {String(bag.bag_no).padStart(3, "0")}
                            </td>
                            <td>
                              <div className="fw-medium">
                                {bag.subjectName ?? "ไม่ระบุวิชา"}
                              </div>
                              <div className="small text-muted">
                                {bag.sessionLabel}
                              </div>
                            </td>
                            <td>
                              {lock ? (
                                <span className="badge text-bg-light border border-1">
                                  {lock.graderName}
                                </span>
                              ) : (
                                <span className="badge text-bg-secondary">
                                  ว่าง
                                </span>
                              )}
                            </td>
                            <td className="text-end">
                              {lock ? (
                                <>
                                  <div className="small">
                                    {lock.operatorName}
                                  </div>
                                  <div
                                    className="text-muted"
                                    style={{ fontSize: 11 }}
                                  >
                                    {new Date(
                                      lock.at
                                    ).toLocaleString("th-TH", {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredBags.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center text-muted py-4"
                          >
                            ยังไม่มีถุงในแคมเปญ / รอบสอบนี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Recent logs + grading history */}
            <div className="col-lg-5 d-flex flex-column gap-3">
              {/* Logs card */}
              <div className="card shadow-sm">
                <div className="card-header bg-white d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1">บันทึกการส่งมอบล่าสุด</h6>
                    <small className="text-muted">
                      ติดตามประวัติ Check-in / Check-out แยกตามถุง
                    </small>
                  </div>
                  <History size={16} className="text-muted" />
                </div>
                <div className="card-body d-flex flex-column gap-2">
                  {logs.slice(0, 8).map((log) => {
                    const logBag = bagMap[String(log.bagId)];
                    const displayBagNo =
                      logBag?.bag_no ??
                      (log as any).bagNo ?? // ถ้า backend ส่ง bagNo มา
                      log.bagId;

                    const logGraderName =
                      log.graderId ??
                      (log.graderId ? `ID ${log.graderId}` : "-");

                    const logOperatorName =
                      log.operatorId ??
                      (log.operatorId ? `ID ${log.operatorId}` : "ไม่ระบุ/ระบบ");

                    return (
                      <div
                        key={log.id}
                        className="border rounded p-2"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
   
                          setSelectedBagId(String(log.bagId)) // 👈 เลือกจาก bag_id
                        }
                      >
                        <div className="d-flex align-items-center justify-content-between">
                          <p className="fw-semibold mb-0">
                            {String(displayBagNo).padStart(3, "0")}
                          </p>
                          <span
                            className={`badge ${
                              log.action === "CHECK_OUT"
                                ? "text-bg-primary"
                                : "text-bg-secondary"
                            }`}
                          >
                            {log.action === "CHECK_OUT" ? "ส่งมอบ" : "รับคืน"}
                          </span>
                        </div>

                        <div className="small text-muted">
                          วิชา: {logBag?.subjectName ?? "ไม่ระบุ"} (
                          {logBag?.sessionLabel ?? "ไม่ระบุรอบ"})
                        </div>

                        <div className="small text-muted">
                          ผู้ตรวจ: {logGraderName} • เจ้าหน้าที่:{" "}
                          {logOperatorName}
                        </div>

                        <div className="small text-muted">
                          {new Date(log.timestamp).toLocaleString("th-TH")}
                        </div>

                        {log.note && (
                          <div className="small text-muted">
                            หมายเหตุ: {log.note}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {logs.length === 0 && (
                    <p className="text-center text-muted small mb-0">
                      ยังไม่มีประวัติการส่งมอบ
                    </p>
                  )}
                </div>
              </div>

              {/* 🎯 Grading history card */}
              <div className="card shadow-sm">
                <div className="card-header bg-white d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1">ประวัติคะแนนล่าสุดของผู้ตรวจ</h6>
                    <small className="text-muted">
                      แสดงจากผู้ตรวจที่เลือกในฟอร์มหรือกำลังถือถุงอยู่
                    </small>
                  </div>
                </div>
                <div className="card-body">
                  {!graderIdForHistory && (
                    <p className="text-muted small mb-0">
                      เลือกผู้ตรวจในฟอร์มหรือเลือกถุงที่มีผู้ตรวจอยู่
                      เพื่อดูประวัติคะแนน
                    </p>
                  )}

                  {graderIdForHistory && (
                    <>
                      {gradingLoading && (
                        <p className="text-muted small">
                          กำลังโหลดประวัติคะแนน...
                        </p>
                      )}
                      {gradingError && (
                        <p className="text-danger small mb-2">
                          {gradingError}
                        </p>
                      )}

                      {!gradingLoading &&
                        !gradingError &&
                        gradingRecords.length === 0 && (
                          <p className="text-muted small mb-0">
                            ผู้ตรวจคนนี้ยังไม่มีประวัติการให้คะแนน
                          </p>
                        )}

                      {gradingRecords.length > 0 && (
                        <div className="table-responsive">
                          <table className="table table-sm table-hover align-middle mb-0">
                            <thead className="table-light text-uppercase small">
                              <tr>
                                <th>Slot</th>
                                <th>คะแนน</th>
                                <th>เวลา</th>
                              </tr>
                            </thead>
                            <tbody>
                              {gradingRecords.map((rec, idx) => (
                                <tr key={`${rec.slotId}-${idx}`}>
                                  <td>{rec.slotId}</td>
                                  <td className="fw-semibold">{rec.score}</td>
                                  <td className="text-muted small">
                                    {rec.enteredAt}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ShowIfCan>
  );
}
