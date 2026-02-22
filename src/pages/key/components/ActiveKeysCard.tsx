// components/ActiveKeysCard.tsx
import { Hash, Loader2, Trash2 } from "lucide-react";

interface ActiveKeysCardProps {
  activeKeys: any[];
  keyStatus: string;
  isLoading: boolean;
  onDeleteKey: (id: number) => void;
}

export default function ActiveKeysCard({
  activeKeys,
  keyStatus,
  isLoading,
  onDeleteKey,
}: ActiveKeysCardProps) {
  return (
    <div className="card" style={{ border: 0, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)" }}>
      <div className="card-header bg-white">
        <h6 className="mb-0">
          2. คีย์ที่ใช้งาน (Active Keys) ({activeKeys.length} / 2)
        </h6>
      </div>
      <div className="card-body">
        {isLoading && (
          <div className="text-center text-muted">
            <Loader2 size={16} className="me-2 spin-animation" />
            Loading keys...
          </div>
        )}

        {keyStatus === "failed" && (
          <div className="alert alert-danger mb-0">
            Failed to fetch keys
          </div>
        )}

        {keyStatus === "succeeded" && activeKeys.length === 0 && (
          <div className="text-center text-muted">
            Campaign นี้ยังไม่มีคีย์
          </div>
        )}

        {activeKeys.length > 0 && (
          <ul className="list-group">
            {activeKeys.map((key: any) => (
              <li
                key={key.id}
                className="list-group-item d-flex align-items-center justify-content-between"
              >
                <div className="d-flex align-items-center gap-3">
                  <Hash size={16} className="text-muted" />
                  <div className="d-flex flex-column">
                    <span className="fw-semibold text-monospace">{key.key}</span>
                  </div>
                </div>
                <button
                  className="btn btn-link text-danger p-1"
                  onClick={() => onDeleteKey(key.id)}
                  disabled={isLoading}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
