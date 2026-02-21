import { useEffect, useMemo, useState } from "react";
import { FolderKanban, Search as SearchIcon, X } from "lucide-react";
import { ExamCampaign } from "@/store/slices/examData.slice";

interface CampaignPickerModalProps {
  open: boolean;
  campaigns: ExamCampaign[];
  activeCampaignId: number | null;
  onClose: () => void;
  onConfirm: (campaignId: number) => void;
}

export function CampaignPickerModal({
  open,
  campaigns,
  activeCampaignId,
  onClose,
  onConfirm,
}: CampaignPickerModalProps) {
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedId(activeCampaignId);
    }
  }, [open, activeCampaignId]);

  const filteredCampaigns = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return campaigns;
    return campaigns.filter((c) => {
      const code = (c.year_be ?? `${c.id}`).toLowerCase();
      const name = (c.name ?? "").toLowerCase();
      return code.includes(k) || name.includes(k);
    });
  }, [campaigns, keyword]);

  if (!open) return null;

  const handleConfirm = () => {
    if (selectedId != null) {
      onConfirm(selectedId);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1100 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-4 shadow-lg position-relative overflow-hidden animate-fade-in"
        style={{ width: "min(600px, 92vw)", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-bottom bg-light bg-opacity-50 d-flex align-items-center justify-content-between">
          <div>
            <h5 className="mb-1 fw-bold text-dark">เลือกรอบสอบ</h5>
            <p className="mb-0 small text-muted">เลือกรายการรอบสอบที่ต้องการจัดการ</p>
          </div>
          <button
            className="btn btn-sm btn-icon btn-light rounded-circle"
            onClick={onClose}
            style={{ width: 32, height: 32 }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-hidden d-flex flex-column" style={{ minHeight: 0 }}>
          <div className="position-relative mb-3">
            <SearchIcon
              className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
              size={18}
            />
            <input
              type="text"
              className="form-control ps-5 py-2 bg-light border-0"
              placeholder="ค้นหารอบสอบ..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ borderRadius: "10px" }}
            />
          </div>

          <div className="flex-grow-1 overflow-auto border rounded-3 p-2 custom-scrollbar">
            <div className="list-group list-group-flush gap-1">
              {filteredCampaigns.length === 0 && (
                <div className="text-center py-5 text-muted">
                  <FolderKanban size={48} className="opacity-25 mb-3" />
                  <p>ไม่พบรายการที่ค้นหา</p>
                </div>
              )}

              {filteredCampaigns.map((c) => {
                const idNum = Number(c.id);
                const isSelected = selectedId === idNum;
                return (
                  <label
                    key={idNum}
                    className={`list-group-item d-flex align-items-center gap-3 p-3 rounded-3 border-0 cursor-pointer transition-all ${
                      isSelected ? "bg-primary bg-opacity-10" : "hover-bg-light"
                    }`}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="form-check">
                      <input
                        type="radio"
                        name="campaign"
                        className="form-check-input"
                        checked={isSelected}
                        onChange={() => setSelectedId(idNum)}
                        style={{ transform: "scale(1.2)" }}
                      />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className={`fw-bold ${isSelected ? "text-primary" : "text-dark"}`}>
                          {c.name ?? idNum}
                        </span>
                        {c.isActive ? (
                          <span
                            className="badge bg-success bg-opacity-25 text-success rounded-pill"
                            style={{ fontSize: "10px" }}
                          >
                            Active
                          </span>
                        ) : (
                          <span
                            className="badge bg-secondary bg-opacity-25 text-secondary rounded-pill"
                            style={{ fontSize: "10px" }}
                          >
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="text-secondary small">{c.name}</div>
                      {/* {c.note && (
                        <div className="small text-muted fst-italic mt-1">
                          <small>{c.note}</small>
                        </div>
                      )} */}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-3 border-top bg-light bg-opacity-50 d-flex justify-content-end gap-2">
          <button className="btn btn-light fw-medium px-4 text-secondary" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            className="btn btn-primary fw-medium px-4 shadow-sm"
            disabled={selectedId == null}
            onClick={handleConfirm}
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}
