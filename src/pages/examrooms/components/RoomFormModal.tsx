// src/pages/exam/components/RoomFormModal.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import type { RoomFormValues } from "../hooks/useExamRooms";

interface RoomFormModalProps {
  open: boolean;
  campaignId: string | null;
  editingRoom: RoomFormValues | null;
  loading: boolean;
  onSubmit: (values: RoomFormValues) => Promise<void> | void;
  onClose: () => void;
}

export default function RoomFormModal({
  open,
  campaignId,
  editingRoom,
  loading,
  onSubmit,
  onClose,
}: RoomFormModalProps) {
  const form = useForm<RoomFormValues>({
    defaultValues: {
      campaign_id: campaignId ?? editingRoom?.campaign_id ?? "",
      roomCode: editingRoom?.roomCode ?? "",
      capacity: editingRoom?.capacity ?? 30,
    },
  });

  const watchRoomCode = form.watch("roomCode");

  // reset เมื่อเปิด modal / campaignId เปลี่ยน / editingRoom เปลี่ยน
  useEffect(() => {
    if (!open) return;

    form.reset({
      campaign_id: campaignId ?? editingRoom?.campaign_id ?? "",
      roomCode: editingRoom?.roomCode ?? "",
      capacity: editingRoom?.capacity ?? 30,
    });
  }, [open, campaignId, editingRoom, form]);

  const handleClose = () => {
    form.reset({
      campaign_id: campaignId ?? editingRoom?.campaign_id ?? "",
      roomCode: editingRoom?.roomCode ?? "",
      capacity: editingRoom?.capacity ?? 30,
    });
    onClose();
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    // ย้ำว่าต้องมี campaign_id
    const payload: RoomFormValues = {
      campaign_id: values.campaign_id || (campaignId ?? ""),
      roomCode: values.roomCode,
      capacity: Number(values.capacity),
    };
    await onSubmit(payload);
  });

  if (!open) return null;

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
                {/* campaign_id ซ่อนไว้ ไม่ให้แก้ในฟอร์ม */}
                <input
                  type="hidden"
                  {...form.register("campaign_id")}
                  value={campaignId ?? editingRoom?.campaign_id ?? ""}
                />

                {/* Room code */}
                <div className="mb-3">
                  <label htmlFor="room-code" className="form-label">
                    รหัสห้องสอบหรือชื่อห้องสอบ
                  </label>
                  <input
                    id="room-code"
                    className="form-control"
                    placeholder="THE DECK 1"
                    {...form.register("roomCode", { required: true })}
                    disabled={Boolean(editingRoom)} 
                  />
                </div>

                {/* Capacity */}
                <div className="mb-3">
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

                <p className="text-muted small mb-0">
                  ห้อง{" "}
                  <strong>{watchRoomCode || "(ระบุรหัสห้อง)"}</strong>{" "}
                </p>
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
                  {editingRoom ? "บันทึก" : "เพิ่มห้องสอบ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
