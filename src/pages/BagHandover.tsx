import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ClipboardCheck, HandCoins, History, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast"; // คงระบบ toast เดิมของโปรเจกต์คุณ
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import { selectBagsForCampaign } from "@/store/slices/bags.slice";
import { selectGradersForCampaign } from "@/store/slices/graders.slice";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import {
  bagCheckedIn,
  bagCheckedOut,
  selectBagLocksForCampaign,
  selectBagLogsForCampaign,
  BagLock,
} from "@/store/slices/bagHandover.slice";
import { ShowIfCan } from "@/components/auth/ShowIfCan";

interface CheckoutFormValues {
  bagId: string;
  graderId: string;
  note?: string;
}

export default function BagHandoverPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const activeCampaign = useAppSelector(selectActiveCampaign);
  const bags = useAppSelector(selectBagsForCampaign(activeCampaign?.id ?? null));
  const graders = useAppSelector(selectGradersForCampaign(activeCampaign?.id ?? null));
  const locks = useAppSelector(selectBagLocksForCampaign(activeCampaign?.id ?? null));
  const logs = useAppSelector(selectBagLogsForCampaign(activeCampaign?.id ?? null));
  const operator = useAppSelector(selectCurrentUser);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBagId, setSelectedBagId] = useState("");

  const form = useForm<CheckoutFormValues>({
    defaultValues: { bagId: "", graderId: "", note: "" },
  });

  const bagMap = useMemo(() => {
    return bags.reduce<Record<string, typeof bags[number]>>((map, bag) => {
      map[bag.id] = bag;
      return map;
    }, {});
  }, [bags]);

  const graderMap = useMemo(() => {
    return graders.reduce<Record<string, typeof graders[number]>>((map, grader) => {
      map[grader.id] = grader;
      return map;
    }, {});
  }, [graders]);

  const filteredBags = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return bags.filter((bag) => {
      if (!term) return true;
      return [bag.id, bag.sessionLabel, bag.subjectName].some((text) =>
        (text ?? "").toLowerCase().includes(term)
      );
    });
  }, [bags, searchTerm]);

  const currentLock: BagLock | null = useMemo(() => {
    if (!selectedBagId || !activeCampaign) return null;
    return locks.find((lock) => lock.bagId === selectedBagId) ?? null;
  }, [locks, selectedBagId, activeCampaign]);

  const handleCheckout = (values: CheckoutFormValues) => {
    if (!activeCampaign || !operator) {
      toast({ title: "ไม่พบข้อมูลแคมเปญหรือผู้ใช้งาน", variant: "destructive" });
      return;
    }
    if (!values.bagId || !values.graderId) {
      toast({ title: "กรุณาเลือกถุงและผู้ตรวจ", variant: "destructive" });
      return;
    }
    if (locks.some((lock) => lock.bagId === values.bagId)) {
      toast({ title: "ถุงนี้อยู่ระหว่างการตรวจ", description: "กรุณารับคืนก่อนส่งต่อ", variant: "destructive" });
      return;
    }
    const grader = graders.find((item) => item.id === values.graderId);
    if (!grader) {
      toast({ title: "ไม่พบข้อมูลผู้ตรวจ", variant: "destructive" });
      return;
    }
    dispatch(
      bagCheckedOut({
        campaignId: activeCampaign.id,
        bagId: values.bagId,
        graderId: grader.id,
        graderName: `${grader.firstName} ${grader.lastName}`,
        operatorId: operator.id,
        operatorName: operator.name,
        note: values.note,
      })
    );
    toast({ title: "ลงทะเบียนส่งมอบเรียบร้อย", description: `${grader.firstName} ได้รับถุง ${values.bagId}` });
    form.reset({ bagId: "", graderId: "", note: "" });
    setSelectedBagId(values.bagId);
  };

  const handleCheckIn = () => {
    if (!activeCampaign || !operator) {
      toast({ title: "ไม่พบข้อมูลแคมเปญหรือผู้ใช้งาน", variant: "destructive" });
      return;
    }
    if (!currentLock) {
      toast({ title: "ถุงนี้ยังไม่ได้ลงทะเบียน", description: "กรุณาเลือกถุงที่กำลังใช้งาน", variant: "destructive" });
      return;
    }
    dispatch(
      bagCheckedIn({
        campaignId: activeCampaign.id,
        bagId: currentLock.bagId,
        operatorId: operator.id,
        operatorName: operator.name,
      })
    );
    toast({ title: "รับคืนถุงเรียบร้อย", description: `ถุง ${currentLock.bagId} กลับสู่สถานะว่าง` });
  };

  if (!activeCampaign) {
    return (
      <ShowIfCan permission="manage_bags">
        <div className="border border-2 border-dashed rounded-4 p-5 text-center text-muted">
          ยังไม่มีข้อมูลแคมเปญ กรุณาเลือกแคมเปญเพื่อจัดการการส่งมอบถุง
        </div>
      </ShowIfCan>
    );
  }

  return (
    <ShowIfCan permission="manage_bags">
      <div className="d-flex flex-column gap-4">
        {/* Header Card */}
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
              <div>
                <h5 className="card-title mb-1 text-body">ลงทะเบียนผู้ตรวจกับถุง</h5>
                <p className="card-text text-muted mb-0">
                  บันทึกการส่งมอบถุงข้อสอบให้ผู้ตรวจ เพื่อป้องกันการใช้งานซ้ำและติดตามการทำงานแบบเรียลไทม์
                </p>
              </div>
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

        {/* Checkout / Check-in */}
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <div className="d-flex align-items-center gap-2">
              <HandCoins size={18} className="text-primary" />
              <h6 className="mb-0">ส่งมอบถุงข้อสอบ</h6>
            </div>
            <small className="text-muted">เลือกถุงและผู้ตรวจ จากนั้นบันทึกเพื่อทำการ Check-out หรือ Check-in</small>
          </div>
          <div className="card-body">
            <form onSubmit={form.handleSubmit(handleCheckout)} className="row g-3">
              {/* Bag select */}
              <div className="col-md-4">
                <label className="form-label text-muted small mb-1">เลือกถุง</label>
                <select
                  className="form-select"
                  value={form.watch("bagId")}
                  onChange={(e) => {
                    form.setValue("bagId", e.target.value);
                    setSelectedBagId(e.target.value);
                  }}
                >
                  <option value="">เลือกถุงข้อสอบ</option>
                  {filteredBags.map((bag) => (
                    <option key={bag.id} value={bag.id}>
                      {bag.id} • {bag.subjectName ?? "ไม่ระบุ"} ({bag.sessionLabel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Grader select */}
              <div className="col-md-4">
                <label className="form-label text-muted small mb-1">เลือกผู้ตรวจ</label>
                <select
                  className="form-select"
                  value={form.watch("graderId")}
                  onChange={(e) => form.setValue("graderId", e.target.value)}
                >
                  <option value="">เลือกผู้ตรวจ</option>
                  {graders.map((grader) => (
                    <option key={grader.id} value={grader.id}>
                      {grader.firstName} {grader.lastName} • {grader.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Note */}
              <div className="col-md-4">
                <label className="form-label text-muted small mb-1">หมายเหตุ</label>
                <input
                  className="form-control"
                  placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                  {...form.register("note")}
                />
              </div>

              {/* Buttons */}
              <div className="col-12 d-flex gap-2">
                <button type="submit" className="btn btn-primary flex-fill" disabled={!operator}>
                  ลงทะเบียนส่งมอบ
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary flex-fill"
                  onClick={handleCheckIn}
                  disabled={!currentLock}
                >
                  รับคืนถุง
                </button>
              </div>
            </form>

            {currentLock && (
              <div className="alert alert-success mt-3 mb-0 py-2">
                ถุง <strong>{currentLock.bagId}</strong> อยู่ระหว่างตรวจโดย {currentLock.graderName} (ตั้งแต่{" "}
                {new Date(currentLock.at).toLocaleString("th-TH")})
              </div>
            )}
          </div>
        </div>

        {/* Two columns section */}
        <div className="row g-4">
          {/* Left: Locks status */}
          <div className="col-lg-6">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-1">สถานะการครอบครองถุง</h6>
                  <small className="text-muted">แสดงรายการถุงทั้งหมดพร้อมสถานะปัจจุบัน</small>
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
                      <th scope="col" className="text-end">ผู้รับผิดชอบ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bags.map((bag) => {
                      const lock = locks.find((item) => item.bagId === bag.id);
                      return (
                        <tr key={bag.id}>
                          <td className="fw-semibold">{bag.id}</td>
                          <td>
                            <div className="fw-medium">{bag.subjectName ?? "ไม่ระบุวิชา"}</div>
                            <div className="small text-muted">{bag.sessionLabel}</div>
                          </td>
                          <td>
                            {lock ? (
                              <span className="badge text-bg-light border border-1">
                                {lock.graderName}
                              </span>
                            ) : (
                              <span className="badge text-bg-secondary">ว่าง</span>
                            )}
                          </td>
                          <td className="text-end">
                            {lock ? (
                              <>
                                <div className="small">{lock.operatorName}</div>
                                <div className="text-muted" style={{ fontSize: 11 }}>
                                  {new Date(lock.at).toLocaleString("th-TH", {
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
                    {bags.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted">
                          ยังไม่มีการสร้างถุงในแคมเปญนี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Recent logs */}
          <div className="col-lg-6">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-white d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-1">บันทึกการส่งมอบล่าสุด</h6>
                  <small className="text-muted">ติดตามประวัติ Check-in / Check-out</small>
                </div>
                <History size={16} className="text-muted" />
              </div>
              <div className="card-body d-flex flex-column gap-2">
                {logs.slice(0, 6).map((log) => (
                  <div key={log.id} className="border rounded p-2">
                    <div className="d-flex align-items-center justify-content-between">
                      <p className="fw-semibold mb-0">{log.bagId}</p>
                      <span className={`badge ${log.action === "CHECK_OUT" ? "text-bg-primary" : "text-bg-secondary"}`}>
                        {log.action === "CHECK_OUT" ? "ส่งมอบ" : "รับคืน"}
                      </span>
                    </div>
                    <div className="small text-muted">
                      วิชา: {bagMap[log.bagId]?.subjectName ?? "ไม่ระบุ"} (
                      {bagMap[log.bagId]?.sessionLabel ?? "ไม่ระบุรอบ"})
                    </div>
                    <div className="small text-muted">
                      ผู้ตรวจ: {graderMap[log.graderId]?.firstName
                        ? `${graderMap[log.graderId]?.firstName} ${graderMap[log.graderId]?.lastName}`
                        : log.graderId} • เจ้าหน้าที่: {log.operatorId}
                    </div>
                    <div className="small text-muted">{new Date(log.timestamp).toLocaleString("th-TH")}</div>
                    {log.note && <div className="small text-muted">หมายเหตุ: {log.note}</div>}
                  </div>
                ))}
                {logs.length === 0 && (
                  <p className="text-center text-muted small mb-0">ยังไม่มีประวัติการส่งมอบ</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ShowIfCan>
  );
}
