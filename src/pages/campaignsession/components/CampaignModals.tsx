// src/pages/campaigns/components/CampaignModals.tsx
import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  CampaignFormValues,
  SessionFormValues,
  SubjectFormValues,
} from "../hooks/useCampaignsPage";
import {
  CampaignSession,
  CampaignSubject,
  ExamCampaign,
} from "@/store/slices/examData.slice";

/* =====================================================================
   Shared helpers
   ===================================================================== */

type MasterSubject = { id: number; code: string; name: string };

const currentYear = new Date().getFullYear() + 543;
const years = [currentYear - 1, currentYear, currentYear + 1];

const formatDateDisplay = (date: string) => {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date;
  }
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="d-flex align-items-center justify-content-between mb-2">
      <div className="fw-semibold" style={{ letterSpacing: 0.2 }}>
        {children}
      </div>
    </div>
  );
}

/* =====================================================================
   Campaign Modal
   ===================================================================== */

interface CampaignModalProps {
  open: boolean;
  editingCampaignName?: string | null;
  form: UseFormReturn<CampaignFormValues>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CampaignFormValues) => Promise<void> | void;
}

export function CampaignModal({
  open,
  editingCampaignName,
  form,
  onOpenChange,
  onSubmit,
}: CampaignModalProps) {
  if (!open) return null;

  const isEdit = Boolean(editingCampaignName);

  return (
    <>
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        style={{ zIndex: 1055 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content" style={{ border: 0, boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.10)" }}>
            <div className="modal-header bg-white border-bottom">
              <div>
                <h6 className="modal-title mb-0 fw-semibold">
                  {isEdit ? "แก้ไขแคมเปญ" : "สร้างแคมเปญใหม่"}
                </h6>
                <small className="text-muted">
                  กำหนดข้อมูลแคมเปญให้ครบถ้วนก่อนเริ่มใช้งาน
                </small>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => onOpenChange(false)}
              />
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="modal-body p-4">
                <div className="mb-4">
                  <SectionTitle>ข้อมูลหลัก</SectionTitle>

                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="form-label">สนามสอบ</label>
                      <select
                        className="form-select"
                        {...form.register("campaign_size", { required: true })}
                      >
                        <option value="">-- เลือกสนามสอบ --</option>
                        <option value="สนามใหญ่">สนามใหญ่</option>
                        <option value="สนามเล็ก">สนามเล็ก</option>
                        <option value="สนามจิ๋ว">สนามจิ๋ว</option>
                      </select>
                    </div>

                    <div className="col-sm-6">
                      <label className="form-label">ปีพุทธศักราช</label>
                      <select
                        className="form-select"
                        {...form.register("year_be", { required: true })}
                      >
                        <option value="">-- เลือกปี พ.ศ. --</option>
                        {years.map((year) => (
                          <option key={year} value={year}>
                            พ.ศ. {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label">สถานที่สอบ</label>
                      <input
                        className="form-control"
                        placeholder="เช่น ศูนย์ประชุมธรรมศาสตร์รังสิต"
                        {...form.register("site", { required: true })}
                      />
                      <div className="form-text">
                        แนะนำให้กรอกชื่อสถานที่ให้ชัดเพื่อใช้ในเอกสาร/รายงาน
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-top pt-4 mt-2">
                  <SectionTitle>สถานะ</SectionTitle>
                  <div className="form-check form-switch">
                    <input
                      id="campaign-active"
                      type="checkbox"
                      className="form-check-input"
                      {...form.register("isActive")}
                    />
                    <label className="form-check-label" htmlFor="campaign-active">
                      Active campaign
                    </label>
                    <div className="form-text">
                      เปิดใช้งานเพื่อให้ระบบถือเป็นแคมเปญปัจจุบัน
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-white border-top">
                <div className="d-grid d-sm-flex gap-2 w-100 w-sm-auto justify-content-sm-end">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => onOpenChange(false)}
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="submit"
                    className="btn btn-dark"
                  >
                    {isEdit ? "บันทึกการแก้ไข" : "สร้างแคมเปญ"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1054 }}
        onClick={() => onOpenChange(false)}
      />
    </>
  );
}

/* =====================================================================
   Session Modal — ตารางวันที่สอบ + ตารางวิชาซ้อนใน
   ===================================================================== */

interface SessionModalProps {
  open: boolean;
  campaign: ExamCampaign | null;

  // form สำหรับสร้าง/แก้ session (รับมาแต่ไม่ได้ใช้ใน modal นี้)
  sessionForm: UseFormReturn<SessionFormValues>;
  sessionContext: { campaignId: string; session: CampaignSession | null } | null;
  onSessionFormOpenChange: (open: boolean) => void;
  onSessionSubmit: (values: SessionFormValues) => Promise<void> | void;

  // actions ที่ hook ส่งมา
  onOpenSessionDialog: (campaignId: string, session?: CampaignSession) => void;
  onDeleteSession: (campaignId: string, session: CampaignSession) => void;
  onOpenSubjectDialog: (
    campaignId: string,
    sessionId: string,
    subject?: CampaignSubject
  ) => void;
  onDeleteSubject: (
    campaignId: string,
    sessionId: string,
    subject: CampaignSubject
  ) => void;

  onOpenChange: (open: boolean) => void;
}

export function SessionModal({
  open,
  campaign,
  onOpenChange,
  onOpenSessionDialog,
  onDeleteSession,
  onOpenSubjectDialog,
  onDeleteSubject,
}: SessionModalProps) {
  if (!open || !campaign) return null;

  return (
    <>
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        style={{ zIndex: 1055 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
          <div className="modal-content" style={{ border: 0, boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.10)" }}>
            {/* Header */}
            <div className="modal-header bg-white border-bottom">
              <div>
                <h6 className="modal-title mb-0 fw-semibold">{campaign.name}</h6>
                <small className="text-muted">{campaign.site}</small>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => onOpenChange(false)}
              />
            </div>

            <div className="modal-body p-0">
              {/* Top bar */}
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 px-3 px-sm-4 py-3 border-bottom bg-white">
                <div>
                  <div className="fw-semibold">รายการวันที่สอบ</div>
                  <div className="text-muted small">
                    ทั้งหมด {campaign.sessions.length} วัน
                  </div>
                </div>

                <div className="d-grid d-sm-block">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => onOpenSessionDialog(campaign.id)}
                  >
                    + เพิ่มวันสอบ
                  </button>
                </div>
              </div>

              {campaign.sessions.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <div style={{ fontSize: 40 }}>📅</div>
                  <p className="mt-2 mb-0">
                    ยังไม่มีวันสอบ กดปุ่ม “+ เพิ่มวันสอบ” เพื่อเริ่มต้น
                  </p>
                </div>
              ) : (
                <div className="accordion accordion-flush" id="sessionAccordion">
                  {campaign.sessions.map((session, idx) => (
                    <div key={session.id} className="accordion-item border-bottom">
                      {/* Session header row */}
                      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center px-4 py-3 border-bottom gap-2 bg-white">
                        {/* <div
                          className="text-muted small text-nowrap"
                          style={{ width: 72 }}
                        >
                          วัน {idx + 1}
                        </div> */}

                        <div className="flex-grow-1 me-auto">
                          <div className="fw-semibold">{session.label}  </div>
                          <div className="text-muted small">
                            สอบวันที่ {formatDateDisplay(session.examDate)}
                          </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() =>
                              onOpenSubjectDialog(campaign.id, session.id)
                            }
                          >
                            + เพิ่มวิชา
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() =>
                              onOpenSessionDialog(campaign.id, session)
                            }
                          >
                            แก้ไข
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => onDeleteSession(campaign.id, session)}
                          >
                            ลบวันที่สอบ
                          </button>
                        </div>
                      </div>

                      {/* Subject table */}
                      {session.subjects.length === 0 ? (
                        <div className="text-muted small px-4 py-2 fst-italic">
                          — ยังไม่มีรายวิชาในวันนี้ —
                        </div>
                      ) : (
                        <div className="p-3">
                        
                        <div className="table-responsive">
                          <table className="table table-sm table-hover align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                {/* <th
                                  className="text-nowrap ps-4"
                                  style={{ width: 60 }}
                                >
                                  #
                                </th> */}
                                <th
                                  className="text-nowrap"
                                  style={{ width: 140 }}
                                >
                                  รหัส
                                </th>
                                <th>วิชา</th>
                                <th
                                  className="text-center text-nowrap"
                                  style={{ width: 110 }}
                                >
                                  เวลาเริ่ม
                                </th>
                                <th
                                  className="text-center text-nowrap"
                                  style={{ width: 110 }}
                                >
                                  เวลาสิ้นสุด
                                </th>
                                <th
                                  className="text-center text-nowrap"
                                  style={{ width: 180 }}
                                >
                                  จัดการ
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {session.subjects.map((subject, sIdx) => (
                                <tr key={subject.id}>
                                  {/* <td className="ps-4 text-muted">{sIdx + 1}</td> */}

                                  <td className="fw-semibold text-nowrap">
                                    {subject.code}
                                  </td>

                                  <td style={{ minWidth: 180 }}>
                                    <div className="fw-semibold">
                                      {subject.name}
                                    </div>
                                    <small className="text-muted">
                                      วิชา {subject.code}
                                    </small>
                                  </td>

                                  <td className="text-center text-nowrap">
                                    {subject.startTime}
                                  </td>
                                  <td className="text-center text-nowrap">
                                    {subject.endTime}
                                  </td>

                                  <td className="text-center text-nowrap">
                                    <div className="d-flex justify-content-center gap-2">
                                      {/* <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() =>
                                          onOpenSubjectDialog(
                                            campaign.id,
                                            session.id,
                                            subject
                                          )
                                        }
                                      >
                                        แก้ไข
                                      </button> */}

                                      <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() =>
                                          onDeleteSubject(
                                            campaign.id,
                                            session.id,
                                            subject
                                          )
                                        }
                                      >
                                        ลบรายวิชา
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer bg-white border-top">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => onOpenChange(false)}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1054 }}
        onClick={() => onOpenChange(false)}
      />
    </>
  );
}

/* =====================================================================
   Session Form Modal — สำหรับสร้าง/แก้ไข session (แยกออกมา)
   ===================================================================== */

interface SessionFormModalProps {
  open: boolean;
  context: { session: CampaignSession | null } | null;
  form: UseFormReturn<SessionFormValues>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SessionFormValues) => Promise<void> | void;
}

export function SessionFormModal({
  open,
  context,
  form,
  onOpenChange,
  onSubmit,
}: SessionFormModalProps) {
  if (!open) return null;
  const isEdit = Boolean(context?.session);

  return (
    <>
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        style={{ zIndex: 1065 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ border: 0, boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.10)" }}>
            <div className="modal-header bg-white border-bottom">
              <div>
                <h6 className="modal-title mb-0 fw-semibold">
                  {isEdit ? "แก้ไขวันสอบ" : "เพิ่มวันสอบใหม่"}
                </h6>
                <small className="text-muted">
                  ระบุวันที่สอบให้ถูกต้อง
                </small>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => onOpenChange(false)}
              />
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="modal-body p-4">
                <SectionTitle>รายละเอียดวันสอบ</SectionTitle>

                <div className="mb-4">
                  <label className="form-label">
                    รอบสอบ <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    {...form.register("label", { required: true })}
                  >
                    <option value="">-- เลือกรอบสอบ --</option>
                    <option value="วันที่ 1">วันที่ 1</option>
                    <option value="วันที่ 2">วันที่ 2</option>
                    <option value="วันที่ 3">วันที่ 3</option>
                  </select>
                </div>

                <div className="mb-0">
                  <label className="form-label">
                    วันที่สอบ <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    {...form.register("examDate", { required: true })}
                  />
                </div>
              </div>

              <div className="modal-footer bg-white border-top">
                <div className="d-grid d-sm-flex gap-2 w-100 w-sm-auto justify-content-sm-end">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => onOpenChange(false)}
                  >
                    ยกเลิก
                  </button>
                  <button type="submit" className="btn btn-dark">
                    {isEdit ? "บันทึก" : "เพิ่มวันสอบ"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1064 }}
        onClick={() => onOpenChange(false)}
      />
    </>
  );
}

/* =====================================================================
   Subject Modal
   ===================================================================== */

interface SubjectModalProps {
  open: boolean;
  context: { subject: CampaignSubject | null } | null;
  form: UseFormReturn<SubjectFormValues>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SubjectFormValues) => Promise<void> | void;
  allSubjects: MasterSubject[];
}

export function SubjectModal({
  open,
  context,
  form,
  onOpenChange,
  onSubmit,
  allSubjects,
}: SubjectModalProps) {
  if (!open) return null;

  const isEdit = Boolean(context?.subject);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const selectedSubjectId = watch("subjectId");
  const selectedMaster = allSubjects.find(
    (s) => String(s.id) === String(selectedSubjectId)
  );

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setValue("subjectId", value, { shouldValidate: true });

    const subj = allSubjects.find((s) => String(s.id) === value);
    if (subj) {
      setValue("code", subj.code);
      setValue("name", subj.name);
    }
  };

  return (
    <>
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        style={{ zIndex: 1065 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content" style={{ border: 0, boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.10)" }}>
            <div className="modal-header bg-white border-bottom">
              <div>
                <h6 className="modal-title mb-0 fw-semibold">
                  {isEdit ? "แก้ไขรายวิชา" : "เพิ่มรายวิชา"}
                </h6>
                <small className="text-muted">
                  เลือกรายวิชาหลัก แล้วกำหนดเวลาเริ่ม–สิ้นสุด
                </small>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => onOpenChange(false)}
              />
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-body p-4">
                <SectionTitle>ข้อมูลรายวิชา</SectionTitle>

                <div className="mb-4">
                  <label className="form-label">
                    รายวิชา <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.subjectId ? "is-invalid" : ""
                      }`}
                    value={selectedSubjectId || ""}
                    onChange={handleSubjectChange}
                  >
                    <option value="">เลือกรายวิชา</option>
                    {allSubjects.map((subj) => (
                      <option key={subj.id} value={subj.id}>
                        {subj.code} - {subj.name}
                      </option>
                    ))}
                  </select>

                  {selectedMaster && (
                    <div className="form-text">
                      จะผูกกับ:{" "}
                      <span className="fw-semibold">
                        {selectedMaster.code} - {selectedMaster.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="row g-3">
                  <div className="col-sm-6">
                    <label className="form-label">รหัสวิชา</label>
                    <input
                      className="form-control"
                      readOnly
                      {...register("code")}
                    />
                  </div>

                  <div className="col-sm-6">
                    <label className="form-label">ชื่อวิชา</label>
                    <input
                      className="form-control"
                      readOnly
                      {...register("name")}
                    />
                  </div>
                </div>

                <div className="border-top pt-4 mt-2">
                  <SectionTitle>เวลา</SectionTitle>
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="form-label">
                        เวลาเริ่ม <span className="text-danger">*</span>
                      </label>
                      <input
                        type="time"
                        className="form-control"
                        {...register("startTime", { required: true })}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label">
                        เวลาสิ้นสุด <span className="text-danger">*</span>
                      </label>
                      <input
                        type="time"
                        className="form-control"
                        {...register("endTime", { required: true })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-white border-top">
                <div className="d-grid d-sm-flex gap-2 w-100 w-sm-auto justify-content-sm-end">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => onOpenChange(false)}
                  >
                    ยกเลิก
                  </button>
                  <button type="submit" className="btn btn-dark">
                    {isEdit ? "บันทึกการแก้ไข" : "เพิ่มรายวิชา"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1064 }}
        onClick={() => onOpenChange(false)}
      />
    </>
  );
}