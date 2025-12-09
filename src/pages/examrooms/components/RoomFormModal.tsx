// src/pages/exam/components/RoomFormModal.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import type { RoomFormValues } from "../hooks/useExamRooms";

interface EditingRoom {
  sessionId: string;
  roomCode: string;
  capacity: number;
}

interface RoomFormModalProps {
  open: boolean;
  sessions: any[];
  selectedSessionId: string | null;
  editingRoom: EditingRoom | null;
  loading: boolean;
  onSubmit: (values: RoomFormValues) => Promise<void> | void;
  onClose: () => void;
}

export default function RoomFormModal({
  open,
  sessions,
  selectedSessionId,
  editingRoom,
  loading,
  onSubmit,
  onClose,
}: RoomFormModalProps) {
  const form = useForm<RoomFormValues>({
    defaultValues: {
      sessionId: selectedSessionId ?? sessions[0]?.id ?? "",
      roomCode: editingRoom?.roomCode ?? "",
      capacity: editingRoom?.capacity ?? 30,
      applyToAllSessions: false,
    },
  });

  const watchApplyToAll = form.watch("applyToAllSessions");
  const watchRoomCode = form.watch("roomCode");

  // reset form values when modal opens / editingRoom changes
  useEffect(() => {
    if (!open) return;

    form.reset({
      sessionId:
        editingRoom?.sessionId ??
        selectedSessionId ??
        sessions[0]?.id ??
        "",
      roomCode: editingRoom?.roomCode ?? "",
      capacity: editingRoom?.capacity ?? 30,
      applyToAllSessions: false,
    });
  }, [open, editingRoom, selectedSessionId, sessions, form]);

  const handleClose = () => {
    form.reset({
      sessionId:
        editingRoom?.sessionId ??
        selectedSessionId ??
        sessions[0]?.id ??
        "",
      roomCode: editingRoom?.roomCode ?? "",
      capacity: editingRoom?.capacity ?? 30,
      applyToAllSessions: false,
    });
    onClose();
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
    // การปิด modal ทำจาก hook เมื่อบันทึกสำเร็จ
  });

  if (!open) return null;

  const canBulk = !editingRoom;

  return (
    <>
      <div className="modal-backdrop show" style={{ zIndex: 1050 }} />
      <div
        className="modal show"
        style={{ display: "block" }}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title">
                {editingRoom ? "แก้ไขข้อมูลห้องสอบ" : "เพิ่มห้องสอบใหม่"}
              </h6>
              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
                aria-label="Close"
              />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Session */}
                <div className="mb-3">
                  <label htmlFor="room-session" className="form-label">
                    เลือกเซสชัน
                  </label>
                  <select
                    id="room-session"
                    className="form-select"
                    value={form.watch("sessionId")}
                    onChange={(e) =>
                      form.setValue("sessionId", e.target.value)
                    }
                    disabled={Boolean(editingRoom) || Boolean(watchApplyToAll)}
                  >
                    {sessions.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.label ?? s.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room code */}
                <div className="mb-3">
                  <label htmlFor="room-code" className="form-label">
                    รหัสห้องสอบ
                  </label>
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
                  <label htmlFor="room-capacity" className="form-label">
                    จำนวนที่รองรับ (คน)
                  </label>
                  <input
                    id="room-capacity"
                    type="number"
                    min={1}
                    className="form-control"
                    {...form.register("capacity", {
                      valueAsNumber: true,
                      min: 1,
                    })}
                  />
                </div>

                {/* Apply to all sessions */}
                {canBulk && (
                  <div className="form-check mt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="applyToAll"
                      {...form.register("applyToAllSessions")}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="applyToAll"
                    >
                      เพิ่มห้อง{" "}
                      <strong className="text-primary">
                        {watchRoomCode || "(รหัสห้อง)"}
                      </strong>{" "}
                      นี้ลงใน <strong>ทุก Session</strong> (
                      {sessions.length} รอบ)
                    </label>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleClose}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading && (
                    <Loader2 size={16} className="me-2 spin-animation" />
                  )}
                  {editingRoom
                    ? "บันทึก"
                    : watchApplyToAll
                    ? "เพิ่ม (ทุก Session)"
                    : "เพิ่มห้องสอบ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
