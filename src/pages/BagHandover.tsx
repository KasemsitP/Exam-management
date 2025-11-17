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

// สถานะส่งมอบถุง
import {
  fetchBagHandoverForCampaign,
  selectBagLocksForCampaign,
  selectBagLogsForCampaign,
  BagLock,
  registerBagToGraderThunk,
  returnBagThunk,
} from "@/store/slices/bagHandover.slice";

interface CheckoutFormValues {
  sessionId: string;
  bagId: string;
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
    selectGradersForCampaign(activeCampaign?.id ?? null)
  );
  const locks = useAppSelector(
    selectBagLocksForCampaign(activeCampaign?.id ?? null)
  );
  const logs = useAppSelector(
    selectBagLogsForCampaign(activeCampaign?.id ?? null)
  );
  const operator = useAppSelector(selectCurrentUser);

  // ---------- Local state / form ----------

  const [searchTerm, setSearchTerm] = useState("");
  const [filterSessionId, setFilterSessionId] = useState<string>("all");
  const [selectedBagId, setSelectedBagId] = useState<string>("");

  const form = useForm<CheckoutFormValues>({
    defaultValues: { sessionId: "", bagId: "", graderId: "", note: "" },
  });

  // ---------- Effects ----------

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

  // ---------- Memoized helpers ----------

  const bagMap = useMemo(() => {
    return bags.reduce<Record<string, (typeof bags)[number]>>((map, bag) => {
      map[String(bag.id)] = bag;
      return map;
    }, {});
  }, [bags]);

  const graderMap = useMemo(() => {
    return graders.reduce<Record<string, (typeof graders)[number]>>(
      (map, grader) => {
        map[String(grader.id)] = grader;
        return map;
      },
      {}
    );
  }, [graders]);

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

  const currentLock: BagLock | null = useMemo(() => {
    if (!selectedBagId || !activeCampaign) return null;
    return locks.find((lock) => String(lock.bagId) === selectedBagId) ?? null;
  }, [locks, selectedBagId, activeCampaign]);

  const sessionIdInForm = form.watch("sessionId");
  const bagsForSelectedSession = useMemo(() => {
    if (!sessionIdInForm) return [];
    return bags.filter(
      (bag) => String(bag.sessionId) === String(sessionIdInForm)
    );
  }, [bags, sessionIdInForm]);

  // ---------- Handlers ----------

  // **ลงทะเบียนส่งมอบถุงให้ผู้ตรวจ**  (ใช้ API /check-in)
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

    if (locks.some((lock) => String(lock.bagId) === values.bagId)) {
      toast({
        title: "ถุงนี้อยู่ระหว่างการตรวจ",
        description: "กรุณารับคืนก่อนส่งมอบให้ผู้อื่น",
        variant: "destructive",
      });
      return;
    }

    const grader = graders.find(
      (item) => String(item.id) === values.graderId
    );
    if (!grader) {
      toast({ title: "ไม่พบข้อมูลผู้ตรวจ", variant: "destructive" });
      return;
    }

    const graderName =
      grader.name ?? `${grader.firstName ?? ""} ${grader.lastName ?? ""}`.trim();

    dispatch(
      registerBagToGraderThunk({
        campaignId: activeCampaign.id,       // camp-1
        bagId: values.bagId,                 // string → thunk แปลงเป็น number เอง
        graderId: values.graderId,           // string → number
        graderName,
        operatorId: Number(operator.id),
        operatorName: operator.name,
        note: values.note,
      })
    )
      .unwrap()
      .then(() => {
        toast({
          title: "ลงทะเบียนส่งมอบเรียบร้อย",
          description: `${graderName} ได้รับถุง ${values.bagId}`,
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

  // **รับคืนถุง** (ใช้ API /check-out)
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
        bagId: Number(currentLock.bagId),
        operatorId: Number(operator.id),
      })
    )
      .unwrap()
      .then(() => {
        toast({
          title: "รับคืนถุงเรียบร้อย",
          description: `ถุง ${currentLock.bagId} กลับสู่สถานะว่าง`,
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

                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-muted">
                      ฟิลเตอร์ตามรอบสอบ
                    </span>
                    <select
                      className="form-select form-select-sm"
                      value={filterSessionId}
                      onChange={(e) => setFilterSessionId(e.target.value)}
                      style={{ minWidth: 220 }}
                    >
                      <option value="all">แสดงทุกรอบสอบ</option>
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
                      setSelectedBagId(e.target.value);
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
                        <option key={bag.id} value={bag.id}>
                          {String(bag.id).padStart(3, "0")} •{" "}
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
                      <option key={grader.id} value={grader.id}>
                        {grader.name ??
                          `${grader.firstName} ${grader.lastName}`}{" "}
                        • {grader.code ?? `G-${grader.id}`}
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
                  ถุง <strong>{currentLock.bagId}</strong>{" "}
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

                        return (
                          <tr
                            key={bag.id}
                            onClick={() => setSelectedBagId(String(bag.id))}
                            style={{ cursor: "pointer" }}
                          >
                            <td className="fw-semibold">
                              {String(bag.id).padStart(3, "0")}
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

            {/* Right: Recent logs */}
            <div className="col-lg-5">
              <div className="card shadow-sm h-100">
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
                  {logs.slice(0, 8).map((log) => (
                    <div
                      key={log.id}
                      className="border rounded p-2"
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedBagId(String(log.bagId))}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <p className="fw-semibold mb-0">{log.bagId}</p>
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
                        วิชา:{" "}
                        {bagMap[String(log.bagId)]?.subjectName ?? "ไม่ระบุ"} (
                        {bagMap[String(log.bagId)]?.sessionLabel ??
                          "ไม่ระบุรอบ"}
                        )
                      </div>
                      <div className="small text-muted">
                        ผู้ตรวจ:{" "}
                        {log.graderId &&
                        graderMap[String(log.graderId)]?.first_name
                          ? graderMap[String(log.graderId)]?.first_name
                          : log.graderId
                          ? `ID ${log.graderId}`
                          : "-"}{" "}
                        • เจ้าหน้าที่:{" "}
                        {log.operatorId
                          ? `ID ${log.operatorId}`
                          : "ไม่ระบุ/ระบบ"}
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
                  ))}
                  {logs.length === 0 && (
                    <p className="text-center text-muted small mb-0">
                      ยังไม่มีประวัติการส่งมอบ
                    </p>
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
