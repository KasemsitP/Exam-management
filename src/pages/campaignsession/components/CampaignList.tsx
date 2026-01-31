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
          <div className="card-header bg-light d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center justify-content-lg-between">
            <div>
              <div className="d-flex align-items-center gap-2">
                <h6 className="mb-0">{campaign.name}</h6>
                <span className="badge text-bg-light d-inline-flex align-items-center gap-1">
                  {/* <CalendarDays size={14} />
                  {formatDateDisplay(campaign.startDate)} -{" "}
                  {formatDateDisplay(campaign.endDate)} */}
                </span>
              </div>
              {/* {campaign.description && (
                <p className="mb-0 mt-1 text-muted small">
                  {campaign.description}
                </p>
              )} */}
            </div>

            <ShowIfCan permission="manage_subjects">
              <div className="d-flex flex-wrap gap-2">
                {/* <button
                  className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
                  onClick={() => onEditCampaign(campaign)}
                >
                  <Pencil size={14} />
                  แก้ไข
                </button>
                <button
                  className="btn btn-danger btn-sm d-inline-flex align-items-center gap-2"
                  onClick={() => onDeleteCampaign(campaign)}
                >
                  <Trash2 size={14} />
                  ลบ
                </button>
                <button
                  className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
                  onClick={() => onCreateSession(campaign.id)}
                >
                  <BadgePlus size={14} />
                  เพิ่มเซสชัน
                </button> */}
              </div>
            </ShowIfCan>
          </div>

          {/* Sessions & subjects */}
          <div className="card-body bg-body-tertiary">
            {sessions.length === 0 && matchesCampaignOnly && (
              <div className="border border-dashed rounded-3 p-4 text-center text-muted small">
                แคมเปญนี้ไม่มีรายการที่ตรงกับเงื่อนไข / กรุณาเพิ่มเซสชัน
              </div>
            )}
            <div className=" d-flex flex-row justify-content-end mb-2 gap-2">
              <button
                className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
                onClick={() => onEditCampaign(campaign)}
              >
                <Pencil size={14} />
                แก้ไข
              </button>
              <button
                className="btn btn-danger btn-sm d-inline-flex align-items-center gap-2"
                onClick={() => onDeleteCampaign(campaign)}
              >
                <Trash2 size={14} />
                ลบ
              </button>
              <button
                className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
                onClick={() => onCreateSession(campaign.id)}
              >
                <BadgePlus size={14} />
                เพิ่มเซสชัน
              </button>
            </div>

            {sessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-3 bg-white p-4 mb-3"
              >
                <div className="d-flex flex-column flex-sm-row gap-3 align-items-start align-items-sm-center justify-content-sm-between">
                  <div>
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <h6 className="mb-0">{session.label}</h6>
                      {/* <span className="badge text-bg-secondary d-inline-flex align-items-center gap-1">
                        <MoreHorizontal size={14} />
                        {session.subjects.length} วิชา
                      </span> */}
                    </div>
                    <p className="mb-0 mt-1 small text-muted">
                      วันที่สอบ: {formatDateDisplay(session.examDate)}
                    </p>
                  </div>

                  <ShowIfCan permission="manage_subjects">
                    <div className="d-flex flex-wrap gap-2">
                      {/* <button
                        className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
                        onClick={() => onEditSession(campaign.id, session)}
                      >
                        <Pencil size={14} />
                        แก้ไข
                      </button> */}
                      <button
                        className="btn btn-danger btn-sm d-inline-flex align-items-center gap-2"
                        onClick={() => onDeleteSession(campaign.id, session)}
                      >
                        <Trash2 size={14} />
                        ลบ
                      </button>
                      <button
                        className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
                        onClick={() => onCreateSubject(campaign.id, session.id)}
                      >
                        <Plus size={14} />
                        เพิ่มรายวิชา
                      </button>
                    </div>
                  </ShowIfCan>
                </div>

                <div className="table-responsive mt-3">
                  <table className="table align-middle table-hover ">
                    <colgroup>
                      <col style={{ width: 110 }} />
                      <col />
                      <col style={{ width: 140 }} />
                      <col style={{ width: 110 }} />
                      <col style={{ width: 170 }} />
                      <col style={{ width: 110 }} />
                    </colgroup>

                    <thead>
                      <tr>
                        <th>รหัสวิชา</th>
                        <th>ชื่อวิชา</th>
                        <th>เวลา</th>
                        <th>จำนวนข้อ</th>
                        <th>ชุดเล่มข้อสอบ</th>
                        <th>การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.subjects.map((subject) => (
                        <tr key={subject.id}>
                          <td className="fw-medium">{subject.code}</td>
                          <td>
                            <div>{subject.name}</div>
                            {/* <div className="small text-muted d-flex align-items-center gap-1">
                              <Clock size={12} />
                              {subject.startTime} - {subject.endTime}
                            </div> */}
                          </td>
                          <td className="small">
                            {subject.startTime} - {subject.endTime}
                          </td>
                          <td className="text-center">{subject.questions}</td>
                          <td>{subject.bookletRange || "-"}</td>
                          <td>
                            <div className="d-flex justify-content-end gap-2">
                              {/* <button
                                className="btn btn-link p-0"
                                onClick={() =>
                                  onEditSubject(
                                    campaign.id,
                                    session.id,
                                    subject
                                  )
                                }
                                aria-label="แก้ไขรายวิชา"
                              >
                                <Pencil size={16} />
                              </button> */}
                              <div className="d-flex flex-wrap gap-2">
                                <button
                                  className="btn btn-danger btn-sm d-inline-flex align-items-center gap-2"
                                  onClick={() =>
                                    onDeleteSubject(
                                      campaign.id,
                                      session.id,
                                      subject
                                    )
                                  }
                                  aria-label="ลบรายวิชา"
                                >
                                  <Trash2 size={16} />
                                  ลบ
                                </button>
                              </div>
                            </div>
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
