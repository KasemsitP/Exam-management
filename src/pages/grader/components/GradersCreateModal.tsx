// src/pages/accounts/components/AccountCreateModal.tsx
import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Loader2 } from "lucide-react";
import ModalBackdrop from "./ModalBackdrop";
import type { CreateAccountFormValues, Role } from "../types";
import type { CampaignSession } from "@/store/slices/examData.slice";

interface AccountCreateModalProps {
  open: boolean;
  roles: Role[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: CreateAccountFormValues) => Promise<void>;
  sessions: CampaignSession[];  
}

export default function AccountCreateModal({
  open,
  roles,
  loading,
  onClose,
  onSubmit,
  sessions,
}: AccountCreateModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountFormValues>();

  const assignments = watch("assignments") ?? [];

  useEffect(() => {
    if (open) {
      reset({
        username: "",
        password: "",
        full_name: "",
        email: "",
        role_id: roles[0]?.id ?? 1,
        active: true,
        assignments: sessions.map((s) => ({
          sessionId: Number(s.id), // id จาก backend
          subjectId: 0,            // ยังไม่เลือกวิชา
          questionNo: 0,           // ยังไม่เลือกข้อ
        })),
      });
    }
  }, [open, reset, roles, sessions]);

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <>
      <ModalBackdrop open={open} />
      <div
        className={`modal ${open ? "show" : ""}`}
        style={{ display: open ? "block" : "none" }}
        role="dialog"
        aria-modal={open}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title">สร้างผู้ใช้ใหม่</h6>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {/* --------- ฟอร์มข้อมูล account เดิม --------- */}
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      Username <span className="text-danger">*</span>
                    </label>
                    <input
                      className={`form-control ${errors.username ? "is-invalid" : ""
                        }`}
                      {...register("username", { required: "จำเป็นต้องระบุ" })}
                    />
                    {errors.username && (
                      <div className="invalid-feedback">
                        {errors.username.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-control ${errors.password ? "is-invalid" : ""
                        }`}
                      {...register("password", { required: "จำเป็นต้องระบุ" })}
                    />
                    {errors.password && (
                      <div className="invalid-feedback">
                        {errors.password.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      ชื่อ-นามสกุล <span className="text-danger">*</span>
                    </label>
                    <input
                      className={`form-control ${errors.full_name ? "is-invalid" : ""
                        }`}
                      {...register("full_name", {
                        required: "จำเป็นต้องระบุ",
                      })}
                    />
                    {errors.full_name && (
                      <div className="invalid-feedback">
                        {errors.full_name.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? "is-invalid" : ""
                        }`}
                      {...register("email")}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">
                        {errors.email.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.role_id ? "is-invalid" : ""
                        }`}
                      {...register("role_id", {
                        required: "จำเป็นต้องระบุ",
                        valueAsNumber: true,
                      })}
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name} ({role.code})
                        </option>
                      ))}
                    </select>
                    {errors.role_id && (
                      <div className="invalid-feedback">
                        {errors.role_id.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <div className="form-check mt-4 pt-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="create-active"
                        {...register("active")}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="create-active"
                      >
                        Active
                      </label>
                    </div>
                  </div>
                </div>

                {/* --------- มอบหมายวิชาให้ grader ต่อ session --------- */}
                <hr className="my-3" />
                <h6 className="mb-2">
                  มอบหมายวิชาและข้อให้ผู้ตรวจในแต่ละรอบสอบ (Session)
                </h6>

                {sessions.length === 0 && (
                  <p className="text-muted small mb-0">
                    ยังไม่มีรอบสอบในแคมเปญนี้
                  </p>
                )}

                {sessions.map((session, index) => {
                  const assign = assignments[index];
                  const selectedSubjectId = assign?.subjectId || 0;

                  // ใน CampaignSubject.id ของคุณเป็น "10-sub-101"
                  // แต่ใน assignments เราเก็บ subjectId = 101 (ตัวเลขจาก backend)
                  const subjects = session.subjects;
                  const selectedSubject =
                    selectedSubjectId > 0
                      ? subjects.find((subj) => {
                        const [, subjIdStr] = subj.id.split("-sub-");
                        return Number(subjIdStr) === selectedSubjectId;
                      })
                      : undefined;

                  const questionCount = selectedSubject?.questions ?? 0;
                  const questionOptions = Array.from(
                    { length: questionCount },
                    (_, i) => i + 1
                  );

                  return (
                    <div key={session.id} className="border rounded p-3 mb-3">
                      <div className=" mb-2">
                        session: {session.label}{" "}
                        <span className="text-muted small">
                          (
                          {new Date(session.examDate).toLocaleDateString("en-CA", {
                            timeZone: "Asia/Bangkok",
                          })}
                          )
                        </span>
                      </div>

                      {/* ซ่อน sessionId เข้า form */}
                      <input
                        type="hidden"
                        {...register(`assignments.${index}.sessionId`, {
                          valueAsNumber: true,
                        })}
                        defaultValue={Number(session.id)}
                      />

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">วิชา</label>
                          <select
                            className="form-select"
                            {...register(`assignments.${index}.subjectId`, {
                              valueAsNumber: true,
                            })}
                          >
                            <option value={0}>-- ไม่มอบหมายวิชา --</option>
                            {subjects.map((subject) => {
                              const [, subjIdStr] = subject.id.split("-sub-");
                              const backendSubjectId = Number(subjIdStr);
                              return (
                                <option
                                  key={subject.id}
                                  value={backendSubjectId}
                                >
                                  {subject.code} - {subject.name}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label">ข้อ</label>
                          <select
                            className="form-select"
                            {...register(`assignments.${index}.questionNo`, {
                              valueAsNumber: true,
                            })}
                            disabled={!selectedSubjectId || questionCount === 0}
                          >
                            <option value={0}>-- เลือกข้อ --</option>
                            {questionOptions.map((no) => (
                              <option key={no} value={no}>
                                ข้อ {no}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || isSubmitting}
                >
                  {(loading || isSubmitting) && (
                    <Loader2 size={16} className="me-2 spin-animation" />
                  )}
                  สร้างผู้ใช้
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
