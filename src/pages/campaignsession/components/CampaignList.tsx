// src/pages/campaigns/components/CampaignList.tsx
import {
  BadgePlus,
  CalendarDays,
  Clock,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import {
  CampaignSession,
  CampaignSubject,
  ExamCampaign,
} from "@/store/slices/examData.slice";
import { VisibleCampaign } from "../hooks/useCampaignsPage";
import './campaignsession.css'


const formatDateDisplay = (date: string) => {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
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
  onCreateSession: (campaignId: string) => void;
  onEditSession: (campaignId: string, session: CampaignSession) => void;
  onDeleteSession: (campaignId: string, session: CampaignSession) => void;
  onCreateSubject: (campaignId: string, sessionId: string) => void;
  onActiveCampaign: (campaign: ExamCampaign) => void,
  onEditSubject: (
    campaignId: string,
    sessionId: string,
    subject: CampaignSubject
  ) => void;
  onDeleteSubject: (
    campaignId: string,
    sessionId: string,
    subject: CampaignSubject
  ) => void;
}

export function CampaignList({
  visibleCampaigns,
  onEditCampaign,
  onDeleteCampaign,
  onCreateSession,
  onEditSession,
  onDeleteSession,
  onCreateSubject,
  onEditSubject,
  onDeleteSubject,
  onActiveCampaign
}: CampaignListProps) {
  if (visibleCampaigns.length === 0) {
    return (
      <div className="card border-0">
        <div className="card-body text-center border border-dashed rounded-3 p-5 text-muted">
          ไม่พบข้อมูลแคมเปญหรือรายการที่ค้นหาตรงตามเงื่อนไข
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      {visibleCampaigns.map(({ campaign, sessions, matchesCampaignOnly }) => (
        <div key={campaign.id} className="card shadow-sm">
          {/* Campaign header */}
          <div className="card-header bg-light">
            <div className="d-flex flex-column gap-3">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-2">
                <h6 className="mb-0">{campaign.name}</h6>
                <ShowIfCan permission="manage_subjects">
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      className={`btn btn-sm d-inline-flex align-items-center rounded gap-1 text-nowrap ${
                        campaign.isActive ? "btn-danger" : "btn-success"
                      }`}
                      onClick={() => onActiveCampaign(campaign)}
                    >
                      {campaign.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    </button>

                    <button
                      className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1 text-nowrap"
                      onClick={() => onEditCampaign(campaign)}
                    >
                      <Pencil size={14} />
                      แก้ไข
                    </button>
                    <button
                      className="btn btn-danger btn-sm d-inline-flex align-items-center gap-1 text-nowrap"
                      onClick={() => onDeleteCampaign(campaign)}
                    >
                      <Trash2 size={14} />
                      ลบ
                    </button>
                  </div>
                </ShowIfCan>
              </div>
            </div>
          </div>

          {/* Sessions & subjects */}
          <div className="card-body bg-body-tertiary">
            {sessions.length === 0 && matchesCampaignOnly && (
              <div className="border border-dashed rounded-3 p-4 text-center text-muted small">
                แคมเปญนี้ไม่มีรายการที่ตรงกับเงื่อนไข / กรุณาเพิ่มเซสชัน
              </div>
            )}
            <div className="d-flex flex-row justify-content-end mb-2 gap-2">
              <button
                className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2 text-nowrap"
                onClick={() => onCreateSession(campaign.id)}
              >
                <BadgePlus size={14} />
                เพิ่มเซสชัน
              </button>
            </div>

            {sessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-3 bg-white p-3 p-sm-4 mb-3"
              >
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-2">
                    <div>
                      <h6 className="mb-1">{session.label}</h6>
                      <p className="mb-0 small text-muted">
                        วันที่สอบ: {formatDateDisplay(session.examDate)}
                      </p>
                    </div>

                    <ShowIfCan permission="manage_subjects">
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          className="btn btn-danger btn-sm d-inline-flex align-items-center gap-1 text-nowrap"
                          onClick={() => onDeleteSession(campaign.id, session)}
                        >
                          <Trash2 size={14} />
                          ลบ
                        </button>
                        <button
                          className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1 text-nowrap"
                          onClick={() => onCreateSubject(campaign.id, session.id)}
                        >
                          <Plus size={14} />
                          เพิ่มรายวิชา
                        </button>
                      </div>
                    </ShowIfCan>
                  </div>
                </div>

                <div className="table-responsive mt-3">
                  <table className="table align-middle table-hover">
                    <colgroup>
                      <col style={{ width: 100, minWidth: 100 }} />
                      <col />
                      <col style={{ width: 130, minWidth: 130 }} />
                      <col style={{ width: 90, minWidth: 90 }} />
                      <col style={{ width: 140, minWidth: 140 }} />
                      <col style={{ width: 100, minWidth: 100 }} />
                    </colgroup>

                    <thead>
                      <tr>
                        <th className="text-nowrap">รหัสวิชา</th>
                        <th className="text-nowrap">ชื่อวิชา</th>
                        <th className="text-nowrap">เวลา</th>
                        <th className="text-center text-nowrap">จำนวนข้อ</th>
                        <th className="text-nowrap">ชุดเล่มข้อสอบ</th>
                        <th className="text-center text-nowrap">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.subjects.map((subject) => (
                        <tr key={subject.id}>
                          <td className="fw-medium text-nowrap">{subject.code}</td>
                          <td>
                            <div>{subject.name}</div>
                          </td>
                          <td className="small text-nowrap">
                            {subject.startTime} - {subject.endTime}
                          </td>
                          <td className="text-center text-nowrap">{subject.questions}</td>
                          <td className="text-nowrap">{subject.bookletRange || "-"}</td>
                          <td className="text-center text-nowrap">
                            <button
                              className="btn btn-danger btn-sm d-inline-flex align-items-center gap-1"
                              onClick={() =>
                                onDeleteSubject(
                                  campaign.id,
                                  session.id,
                                  subject
                                )
                              }
                              aria-label="ลบรายวิชา"
                            >
                              <Trash2 size={14} />
                              <span className="d-none d-sm-inline">ลบ</span>
                            </button>
                          </td>
                        </tr>
                      ))}

                      {session.subjects.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-4">
                            ยังไม่มีรายวิชาในเซสชันนี้ กรุณาเพิ่มรายวิชา
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
