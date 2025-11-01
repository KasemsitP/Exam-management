import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Building2, DoorOpen, Plus, Search, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import {
  roomRemoved,
  roomUpserted,
  selectRoomSummary,
  selectRoomsBySession,
} from "@/store/slices/examRooms.slice";
import { ShowIfCan } from "@/components/auth/ShowIfCan";

interface RoomFormValues {
  sessionId: string;
  roomCode: string;
  capacity: number;
}

export default function ExamRoomsPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const activeCampaign = useAppSelector(selectActiveCampaign);
  const sessions = activeCampaign?.sessions ?? [];

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(sessions[0]?.id ?? null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<{ sessionId: string; roomCode: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!sessions.length) {
      setSelectedSessionId(null);
      return;
    }
    if (!selectedSessionId || !sessions.some((s) => s.id === selectedSessionId)) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  const rooms = useAppSelector(selectRoomsBySession(selectedSessionId));
  const summary = useAppSelector(selectRoomSummary(selectedSessionId));

  const form = useForm<RoomFormValues>({
    defaultValues: { sessionId: selectedSessionId ?? "", roomCode: "", capacity: 30 },
  });

  useEffect(() => {
    const current = selectedSessionId ?? sessions[0]?.id ?? "";
    if (current && !form.getValues("sessionId")) form.setValue("sessionId", current);
  }, [form, selectedSessionId, sessions]);

  const resetForm = () => {
    form.reset({ sessionId: selectedSessionId ?? sessions[0]?.id ?? "", roomCode: "", capacity: 30 });
    setEditingRoom(null);
  };

  const filteredRooms = useMemo(() => {
    if (!searchTerm.trim()) return rooms;
    const term = searchTerm.trim().toLowerCase();
    return rooms.filter((r) => r.roomCode.toLowerCase().includes(term));
  }, [rooms, searchTerm]);

  const onSubmit = (values: RoomFormValues) => {
    if (!values.sessionId) {
      toast({ title: "กรุณาเลือกเซสชัน", variant: "destructive" });
      return;
    }
    const roomCode = values.roomCode.trim();
    if (!roomCode) {
      toast({ title: "กรุณาระบุรหัสห้องสอบ", variant: "destructive" });
      return;
    }
    const capacity = Number(values.capacity);
    if (Number.isNaN(capacity) || capacity <= 0) {
      toast({ title: "จำนวนที่รองรับต้องมากกว่า 0", variant: "destructive" });
      return;
    }
    dispatch(roomUpserted({ sessionId: values.sessionId, roomCode, capacity }));
    toast({
      title: editingRoom ? "บันทึกห้องสอบเรียบร้อย" : "เพิ่มห้องสอบสำเร็จ",
      description: `${roomCode} รองรับ ${capacity.toLocaleString()} คน`,
    });
    resetForm();
    setDialogOpen(false);
  };

  const handleCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (sessionId: string, roomCode: string, capacity: number) => {
    setEditingRoom({ sessionId, roomCode });
    form.reset({ sessionId, roomCode, capacity });
    setDialogOpen(true);
  };

  const handleRemove = (sessionId: string, roomCode: string) => {
    if (!window.confirm(`ยืนยันลบห้องสอบ ${roomCode} หรือไม่`)) return;
    dispatch(roomRemoved({ sessionId, roomCode }));
    toast({ title: "ลบห้องสอบแล้ว", description: roomCode });
    if (editingRoom && editingRoom.roomCode === roomCode && editingRoom.sessionId === sessionId) {
      resetForm();
      setDialogOpen(false);
    }
  };

  const selectedSessionLabel = useMemo(() => {
    if (!selectedSessionId) return "-";
    return sessions.find((s) => s.id === selectedSessionId)?.label ?? "-";
  }, [selectedSessionId, sessions]);

  const renderBackdrop = (open: boolean) => (open ? <div className="modal-backdrop show" /> : null);

  if (!activeCampaign || sessions.length === 0) {
    return (
      <ShowIfCan permission="manage_rooms">
        <div className="mx-auto rounded-4 border border-dashed p-5 text-center text-muted">
          ยังไม่มีข้อมูลรอบสอบ กรุณาสร้างเซสชันก่อนจัดการห้องสอบ
        </div>
      </ShowIfCan>
    );
  }

  return (
    <ShowIfCan permission="manage_rooms">
      <div className="d-flex flex-column gap-4">
        {/* Header Card */}
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            <div>
              <h5 className="mb-1 d-flex align-items-center gap-2">
                <DoorOpen className="text-primary" size={20} />
                จัดการห้องสอบ
              </h5>
              <small className="text-muted">
                รวบรวมความจุห้องสอบสำหรับแต่ละรอบสอบของแคมเปญ {activeCampaign.name}
              </small>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              {/* Session select */}
              <select
                className="form-select"
                style={{ width: 260 }}
                value={selectedSessionId ?? ""}
                onChange={(e) => setSelectedSessionId(e.target.value)}
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>

              {/* Search */}
              <div className="position-relative">
                <Search size={16} className="position-absolute" style={{ left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  className="form-control ps-5"
                  style={{ width: 220 }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาห้องสอบ"
                />
              </div>

              <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={handleCreate}>
                <Plus size={16} /> เพิ่มห้องสอบ
              </button>
            </div>
          </div>

          <div className="card-body">
            <div className="row g-3">
              <div className="col-sm-6 col-lg-4">
                <div className="card shadow-none border">
                  <div className="card-body">
                    <div className="text-uppercase small text-muted mb-1">จำนวนห้องสอบในรอบนี้</div>
                    <div className="h3 mb-0">{summary.totalRooms}</div>
                  </div>
                </div>
              </div>
              <div className="col-sm-6 col-lg-4">
                <div className="card shadow-none border">
                  <div className="card-body">
                    <div className="text-uppercase small text-muted mb-1">ความจุรวม (คน)</div>
                    <div className="h3 mb-0">{summary.totalCapacity.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <h6 className="mb-0 d-flex align-items-center gap-2">
              <Building2 className="text-primary" size={20} />
              รายการห้องสอบในเซสชัน {selectedSessionLabel}
            </h6>
            <small className="text-muted">ดูและจัดการข้อมูลห้องสอบสำหรับการจัดผู้เข้าสอบ</small>
          </div>

          <div className="card-body">
            {rooms.length === 0 ? (
              <div className="border border-dashed rounded p-4 text-center text-muted">
                ยังไม่มีห้องสอบในเซสชันนี้ กรุณาเพิ่มห้องใหม่
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light text-uppercase small">
                    <tr>
                      <th>รหัสห้องสอบ</th>
                      <th className="text-end">ความจุ (คน)</th>
                      <th className="text-end">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRooms.map((room) => (
                      <tr key={`${room.sessionId}-${room.roomCode}`}>
                        <td className="fw-semibold">{room.roomCode}</td>
                        <td className="text-end">{room.capacity.toLocaleString()}</td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-2">
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleEdit(room.sessionId, room.roomCode, room.capacity)}
                            >
                              แก้ไข
                            </button>
                            <button
                              className="btn btn-danger btn-sm d-inline-flex align-items-center gap-1"
                              onClick={() => handleRemove(room.sessionId, room.roomCode)}
                            >
                              <Trash2 size={16} /> ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Create/Edit */}
        {renderBackdrop(dialogOpen)}
        <div
          className={`modal ${dialogOpen ? "show" : ""}`}
          style={{ display: dialogOpen ? "block" : "none" }}
          role="dialog"
          aria-modal={dialogOpen}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">{editingRoom ? "แก้ไขข้อมูลห้องสอบ" : "เพิ่มห้องสอบใหม่"}</h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => { setDialogOpen(false); resetForm(); }}
                />
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="modal-body">
                  {/* Session */}
                  <div className="mb-3">
                    <label htmlFor="room-session" className="form-label">เลือกเซสชัน</label>
                    <select
                      id="room-session"
                      className="form-select"
                      value={form.watch("sessionId")}
                      onChange={(e) => form.setValue("sessionId", e.target.value)}
                    >
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Room code */}
                  <div className="mb-3">
                    <label htmlFor="room-code" className="form-label">รหัสห้องสอบ</label>
                    <input
                      id="room-code"
                      className="form-control"
                      placeholder="เช่น RM101"
                      {...form.register("roomCode", { required: true })}
                      disabled={Boolean(editingRoom)}
                    />
                  </div>

                  {/* Capacity */}
                  <div className="mb-1">
                    <label htmlFor="room-capacity" className="form-label">จำนวนที่รองรับ (คน)</label>
                    <input
                      id="room-capacity"
                      type="number"
                      min={1}
                      className="form-control"
                      {...form.register("capacity", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => { resetForm(); setDialogOpen(false); }}
                  >
                    ยกเลิก
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingRoom ? "บันทึก" : "เพิ่มห้องสอบ"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* /Modal */}
      </div>
    </ShowIfCan>
  );
}
