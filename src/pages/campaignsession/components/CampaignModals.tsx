// src/pages/campaigns/components/CampaignModals.tsx
import { UseFormReturn } from "react-hook-form";
import {
  CampaignFormValues,
  SessionFormValues,
  SubjectFormValues,
} from "../hooks/useCampaignsPage";
import { CampaignSession, CampaignSubject } from "@/store/slices/examData.slice";

/* --------------------------- Campaign Modal --------------------------- */

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

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title">
                {editingCampaignName ? "แก้ไขแคมเปญ" : "สร้างแคมเปญใหม่"}
              </h6>
              <button
                type="button"
                className="btn-close"
                onClick={() => onOpenChange(false)}
              />
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="campaign-code" className="form-label">
                    Campaign code
                  </label>
                  <input
                    id="campaign-code"
                    className="form-control"
                    placeholder="เช่น Y68-T2 หรือ 2568A"
                    {...form.register("code", { required: true })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="campaign-name" className="form-label">
                    ชื่อแคมเปญ
                  </label>
                  <input
                    id="campaign-name"
                    className="form-control"
                    {...form.register("name", { required: true })}
                  />
                </div>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <label htmlFor="campaign-start" className="form-label">
                      วันที่เริ่มต้น
                    </label>
                    <input
                      id="campaign-start"
                      type="date"
                      className="form-control"
                      {...form.register("startDate", { required: true })}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label htmlFor="campaign-end" className="form-label">
                      วันที่สิ้นสุด
                    </label>
                    <input
                      id="campaign-end"
                      type="date"
                      className="form-control"
                      {...form.register("endDate", { required: true })}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label htmlFor="campaign-desc" className="form-label">
                    รายละเอียดเพิ่มเติม
                  </label>
                  <input
                    id="campaign-desc"
                    className="form-control"
                    placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                    {...form.register("description")}
                  />
                </div>
                <div className="form-check form-switch mt-3">
                  <input
                    id="campaign-active"
                    type="checkbox"
                    className="form-check-input"
                    {...form.register("isActive")}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="campaign-active"
                  >
                    Active campaign
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => onOpenChange(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCampaignName ? "บันทึกการแก้ไข" : "สร้างแคมเปญ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div
        className="modal-backdrop fade show"
        onClick={() => onOpenChange(false)}
      />
    </>
  );
}

/* --------------------------- Session Modal ---------------------------- */

interface SessionModalProps {
  open: boolean;
  context: { session: CampaignSession | null } | null;
  form: UseFormReturn<SessionFormValues>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SessionFormValues) => Promise<void> | void;
}

export function SessionModal({
  open,
  context,
  form,
  onOpenChange,
  onSubmit,
}: SessionModalProps) {
  if (!open) return null;

  const isEdit = Boolean(context?.session);

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title">
                {isEdit ? "แก้ไขเซสชัน" : "เพิ่มเซสชันใหม่"}
              </h6>
              <button
                type="button"
                className="btn-close"
                onClick={() => onOpenChange(false)}
              />
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="session-label" className="form-label">
                    ชื่อเซสชัน / รอบสอบ
                  </label>
                  <input
                    id="session-label"
                    className="form-control"
                    {...form.register("label", { required: true })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="session-date" className="form-label">
                    วันที่สอบ
                  </label>
                  <input
                    id="session-date"
                    type="date"
                    className="form-control"
                    {...form.register("examDate", { required: true })}
                  />
                </div>
                <div>
                  <label htmlFor="session-note" className="form-label">
                    หมายเหตุ
                  </label>
                  <input
                    id="session-note"
                    className="form-control"
                    placeholder="เช่น ห้องสอบ / หมายเหตุเพิ่มเติม"
                    {...form.register("note")}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => onOpenChange(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEdit ? "บันทึกการแก้ไข" : "เพิ่มเซสชัน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div
        className="modal-backdrop fade show"
        onClick={() => onOpenChange(false)}
      />
    </>
  );
}

/* --------------------------- Subject Modal ---------------------------- */

type MasterSubject = {
  id: number;
  code: string;
  name: string;
};

interface SubjectModalProps {
  open: boolean;
  context: { subject: CampaignSubject | null } | null;
  form: UseFormReturn<SubjectFormValues>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SubjectFormValues) => Promise<void> | void;
  allSubjects: MasterSubject[];   // 👈 เพิ่ม
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

  // ค่าที่เลือกปัจจุบัน
  const selectedSubjectId = watch("subjectId");

  const selectedMaster = allSubjects.find(
    (s) => String(s.id) === String(selectedSubjectId)
  );

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setValue("subjectId", value, { shouldValidate: true });

    const subj = allSubjects.find((s) => String(s.id) === value);
    if (subj) {
      // auto-fill code / name จาก master
      setValue("code", subj.code);
      setValue("name", subj.name);
    }
  };

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title">
                {isEdit ? "แก้ไขรายวิชา" : "เพิ่มรายวิชา"}
              </h6>
              <button
                type="button"
                className="btn-close"
                onClick={() => onOpenChange(false)}
              />
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-body">
                {/* เลือกวิชาจาก master */}
                <div className="mb-3">
                  <label className="form-label">
                    รายวิชา <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${
                      errors.subjectId ? "is-invalid" : ""
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
                  {errors.subjectId && (
                    <div className="invalid-feedback">
                      {errors.subjectId.message as string}
                    </div>
                  )}
                  {selectedMaster && (
                    <div className="form-text">
                      จะผูกกับ:{" "}
                      <strong>
                        {selectedMaster.code} - {selectedMaster.name}
                      </strong>
                    </div>
                  )}
                </div>

                {/* แสดง code / name ที่ถูก auto-fill (อ่านอย่างเดียว) */}
                <div className="row g-3">
                  <div className="col-sm-6">
                    <label htmlFor="subject-code" className="form-label">
                      รหัสวิชา
                    </label>
                    <input
                      id="subject-code"
                      className="form-control"
                      readOnly
                      {...register("code")}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label htmlFor="subject-name" className="form-label">
                      ชื่อวิชา
                    </label>
                    <input
                      id="subject-name"
                      className="form-control"
                      readOnly
                      {...register("name")}
                    />
                  </div>
                </div>

                {/* เวลา + จำนวนข้อ + ช่วงเล่ม เหมือนเดิม */}
                <div className="row g-3 mt-3">
                  <div className="col-sm-6">
                    <label htmlFor="subject-start" className="form-label">
                      เวลาเริ่ม
                    </label>
                    <input
                      id="subject-start"
                      type="time"
                      className="form-control"
                      {...register("startTime", { required: true })}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label htmlFor="subject-end" className="form-label">
                      เวลาสิ้นสุด
                    </label>
                    <input
                      id="subject-end"
                      type="time"
                      className="form-control"
                      {...register("endTime", { required: true })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => onOpenChange(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEdit ? "บันทึกการแก้ไข" : "เพิ่มรายวิชา"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div
        className="modal-backdrop fade show"
        onClick={() => onOpenChange(false)}
      />
    </>
  );
}
