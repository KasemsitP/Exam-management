// src/pages/exam/components/RoomsTable.tsx
import { Loader2, Trash2 } from "lucide-react";

export interface Room {
  campaign_id: string;
  roomCode: string;
  capacity: number;
}

interface RoomsTableProps {
  rooms: Room[];
  loading: boolean;
  onEdit: (room: Room) => void;
  onRemove: (campaignId: string, roomCode: string) => void;
}

export default function RoomsTable({
  rooms,
  loading,
  onEdit,
  onRemove,
}: RoomsTableProps) {
  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white">
        <h6 className="mb-0 d-flex align-items-center gap-2">
          รายการห้องสอบในรอบสอบนี้
        </h6>

      </div>

      <div className="card-body">
        {loading && (
          <div className="text-center text-muted p-4">
            <Loader2 size={24} className="spin-animation" />
            <p>กำลังโหลดข้อมูลห้องสอบ...</p>
          </div>
        )}

        {!loading && rooms.length === 0 && (
          <div className="border border-dashed rounded p-4 text-center text-muted">
            ยังไม่มีห้องสอบในรอบสอบนี้ กรุณาเพิ่มห้องใหม่
          </div>
        )}

        {!loading && rooms.length > 0 && (
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
                {rooms.map((room) => (
                  <tr key={room.roomCode}>
                    <td className="fw-semibold">{room.roomCode}</td>
                    <td className="text-end">
                      {room.capacity.toLocaleString()}
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => onEdit(room)}
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm d-inline-flex align-items-center gap-1"
                          onClick={() =>
                            onRemove(room.campaign_id, room.roomCode)
                          }
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
  );
}
