// src/pages/campaigns/components/CampaignList.tsx
import { useEffect, useMemo, useState } from "react";
import { BadgePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import {
  CampaignSession,
  CampaignSubject,
  ExamCampaign,
} from "@/store/slices/examData.slice";
import { VisibleCampaign } from "../hooks/useCampaignsPage";
import "./campaignsession.css";

const formatDateDisplay = (date: string) => {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date;
  }
};

interface CampaignListProps {
  visibleCampaigns: VisibleCampaign[];
  onEditCampaign: (campaign: ExamCampaign) => void;
  onDeleteCampaign: (campaign: ExamCampaign) => void;
  onActiveCampaign: (campaign: ExamCampaign) => void;
  onOpenSessions: (campaign: ExamCampaign) => void;
  onCreateCampaign: () => void;
}

export function CampaignList({
  visibleCampaigns,
  onEditCampaign,
  onDeleteCampaign,
  onActiveCampaign,
  onOpenSessions,
  onCreateCampaign,

}: CampaignListProps) {
  return (
    <div className="card" style={{ border: 0, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)" }}>
      <div className="card-header bg-light d-flex justify-content-between align-items-start">

        <div>
          <h6 className="mb-1">ตารางรอบสอบ</h6>
          <p className="mb-0 text-muted small">จัดการรอบสอบในแต่ละรอบ</p>
        </div>

        <button
          className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
          onClick={onCreateCampaign}
        >
          สร้างรอบสอบ
        </button>

      </div>

      {/* ── Mobile: card list (< md) ── */}
      <div className="d-md-none">
        {visibleCampaigns.length === 0 ? (
          <div className="text-center text-muted py-5">ยังไม่มีรอบสอบ</div>
        ) : (
          <div className="list-group list-group-flush">
            {visibleCampaigns.map(({ campaign, sessions }) => (
              <div key={campaign.id} className="list-group-item px-3 py-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div className="fw-semibold">{campaign.name}</div>
                    <small className="text-muted">{campaign.site || "-"}</small>
                  </div>
                  <span className={`badge ms-2 flex-shrink-0 ${campaign.isActive ? "bg-success" : "bg-secondary"}`}>
                    {campaign.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="d-flex flex-column gap-2">
                  <button
                    className="btn btn-sm btn-outline-primary w-100"
                    onClick={() => onOpenSessions(campaign)}
                  >
                    รายการวันที่สอบ ({sessions.length})
                  </button>

                  <div className="d-grid grid-cols-3 gap-2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => onEditCampaign(campaign)}
                    >
                      แก้ไข
                    </button>
                    <button
                      className={`btn btn-sm text-nowrap ${campaign.isActive ? "btn-warning" : "btn-success"}`}
                      onClick={() => onActiveCampaign(campaign)}
                    >
                      {campaign.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDeleteCampaign(campaign)}
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop: table (≥ md) ── */}
      <div className="d-none d-md-block table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="text-nowrap">รอบสอบ</th>
              <th className="text-nowrap">สถานที่</th>
              <th className="text-nowrap text-center">สถานะ</th>
              <th className="text-nowrap text-center">
      
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleCampaigns.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted py-4">
                  ยังไม่มีรอบสอบ
                </td>
              </tr>
            ) : (
              visibleCampaigns.map(({ campaign, sessions }) => (
                <tr key={campaign.id}>
                  <td className="fw-semibold">{campaign.name}</td>
                  <td className="text-muted">{campaign.site || "-"}</td>

                  <td className="text-center">
                    <span className={` `}>
                      {campaign.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </td>

                  <td>
                    <div className="d-flex flex-wrap gap-1 justify-content-center justify-content-lg-end">
                      <button
                        className="btn btn-sm btn-outline-primary text-nowrap"
                        onClick={() => onOpenSessions(campaign)}
                      >
                        วันที่สอบ ({sessions.length})
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => onEditCampaign(campaign)}
                      >
                        แก้ไข
                      </button>
                      <button
                        className={`btn btn-sm text-nowrap ${campaign.isActive ? "btn-warning" : "btn-success"}`} style ={{ minWidth: 100 }}
                        onClick={() => onActiveCampaign(campaign)}
                      >
                        {campaign.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onDeleteCampaign(campaign)}
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
