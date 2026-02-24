// src/pages/accounts/components/AccountCreateModal.tsx
import { useEffect, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import ModalBackdrop from "./ModalBackdrop";
import type { CreateAccountFormValues, Role } from "../types";
import type { CampaignSession } from "@/store/slices/examData.slice";
import { selectQuestionsBySubjectId, selectSubjectsSlice } from "@/store/slices/subjects.slice";
import { useAppSelector } from "@/store/hook";

interface AccountCreateModalProps {
  open: boolean;
  roles: Role[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: CreateAccountFormValues) => Promise<void>;
  onSessionChange: (sessionId: number) => void;
  sessions: CampaignSession[];
}


export default function AccountCreateModal({
  open,
  roles,
  loading,
  onClose,
  onSubmit,
  sessions,
  onSessionChange
}: AccountCreateModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountFormValues>();

  const assignment = watch("assignments");
  const password = watch("password");

  const selectedSessionId = assignment?.sessionId ?? 0;
  const selectedSubjectId = assignment?.subjectId ?? 0;
  const q1 = assignment?.questionNo1 ?? 0;

  const questions = useAppSelector(
    selectQuestionsBySubjectId(selectedSubjectId)
  );

  const didInitRef = useRef(false);
  const defaultRoleId = useMemo(() => roles[0]?.id ?? 1, [roles]);

  useEffect(() => {
    if (!open) {
      didInitRef.current = false; // ปิดแล้วค่อยให้ init ใหม่รอบหน้า
      return;
    }

    if (didInitRef.current) return; // ✅ เปิดอยู่แล้ว ไม่ reset ซ้ำ
    didInitRef.current = true;

    reset({
      username: "",
      password: "",
      full_name: "",
      email: "",
      role_id: defaultRoleId,
      active: true,
      assignments: {
        sessionId: 0,
        subjectId: 0,
        questionNo1: 0,
        questionNo2: 0,
      },
    });
  }, [open, reset, defaultRoleId]);

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  // หาว่าอยู่ session ไหน
  const selectedSession = sessions.find(
    (s) => Number(s.id) === selectedSessionId
  );
  const subjects = selectedSession?.subjects ?? [];



  // หาวิชาที่เลือก
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
  const questions2 = questions.filter((q) => q.questionNo !== q1);

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
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      Username <span className="text-danger">*</span>
                    </label>
                    <input
                      className={`form-control ${errors.username ? "is-invalid" : ""}`}
                      {...register("username", { required: "จำเป็นต้องระบุ" })}
                    />
                    {errors.username && (
                      <div className="invalid-feedback">{errors.username.message}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">
                      ชื่อ-นามสกุล <span className="text-danger">*</span>
                    </label>
                    <input
                      className={`form-control ${errors.full_name ? "is-invalid" : ""}`}
                      {...register("full_name", { required: "จำเป็นต้องระบุ" })}
                    />
                    {errors.full_name && (
                      <div className="invalid-feedback">{errors.full_name.message}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-control ${errors.password ? "is-invalid" : ""}`}
                      {...register("password", {
                        required: "จำเป็นต้องระบุ",
                        minLength: {
                          value: 8,
                          message: "รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร",
                        },
                      })}
                    />
                    {errors.password && (
                      <div className="invalid-feedback">{errors.password.message}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      ยืนยัน Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                      {...register("confirmPassword", {
                        required: "จำเป็นต้องระบุ",
                        validate: (value) =>
                          value === password || "รหัสผ่านไม่ตรงกัน",
                      })}
                    />
                    {errors.confirmPassword && (
                      <div className="invalid-feedback">
                        {errors.confirmPassword.message}
                      </div>
                    )}
                  </div>


                  {/* <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? "is-invalid" : ""}`}
                      {...register("email")}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email.message}</div>
                    )}
                  </div> */}

                  <div className="col-md-6">
                    <label className="form-label">
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.role_id ? "is-invalid" : ""}`}
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
                      <div className="invalid-feedback">{errors.role_id.message}</div>
                    )}
                  </div>

                  {/* <div className="col-md-6">
                    <div className="form-check mt-4 pt-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="create-active"
                        {...register("active")}
                      />
                      <label className="form-check-label" htmlFor="create-active">
                        Active
                      </label>
                    </div>
                  </div> */}
                </div>

                <hr className="my-3" />
                <h6 className="mb-2">
                  มอบหมายวิชาและข้อให้ผู้ตรวจในแต่ละวันที่สอบ
                </h6>

                {sessions.length === 0 && (
                  <p className="text-muted small mb-0">
                    ยังไม่มีวันที่สอบในรอบสอบนี้
                  </p>
                )}

                {/* 1) เลือก Session */}
                <div className="mt-2">
                  <label className="form-label">วันที่สอบ </label>
                  <select
                    className="form-select"
                    {...register("assignments.sessionId", {
                      valueAsNumber: true,
                      onChange: (e) => {
                        const sessionId = Number(e.target.value);
                        onSessionChange(sessionId);
                        setValue("assignments.subjectId", 0);
                        setValue("assignments.questionNo1", 0);
                        setValue("assignments.questionNo2", 0);
                      },
                    })}
                  >

                    <option value={0}>-- เลือกวันที่สอบ --</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={Number(s.id)}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2) เลือกวิชาใน session นั้น */}
                {/* 2) วิชา (ซ้าย) + ข้อ (ขวา) */}
                <div className="row mt-3">
                  {/* ซ้าย: วิชา */}
                  <div className="col-md-6">
                    <label className="form-label">วิชา</label>
                    <select
                      className="form-select"
                      {...register("assignments.subjectId", {
                        valueAsNumber: true,
                        onChange: () => {
                          // เปลี่ยนวิชา → reset ข้อ
                          setValue("assignments.questionNo1", 0);
                          setValue("assignments.questionNo2", 0);
                        },
                      })}
                      disabled={!selectedSessionId || subjects.length === 0}
                    >
                      <option value={0}>-- เลือกวิชา --</option>
                      {subjects.map((subj) => {
                        const [, subjIdStr] = subj.id.split("-sub-");
                        return (
                          <option key={subj.id} value={Number(subjIdStr)}>
                            {subj.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* ขวา: ข้อ */}
                  <div className="col-md-6">
                    <label className="form-label">ข้อที่ 1</label>
                    <select
                      className="form-select"
                      {...register("assignments.questionNo1", { valueAsNumber: true })}
                      disabled={!selectedSubjectId || questionCount === 0}
                    >
                      <option value={0}>-- เลือกข้อ --</option>
                      {questions.map((q) => (
                        <option key={q.id} value={q.questionNo}>
                          ข้อ {q.questionNo} : {q.label}
                        </option>
                      ))}

                    </select>

                    <label className="form-label mt-2">ข้อที่ 2 (ไม่บังคับ)</label>
                    <select
                      className="form-select"
                      {...register("assignments.questionNo2", { valueAsNumber: true })}
                      disabled={!selectedSubjectId || !q1}
                    >
                      <option value={0}>-- ไม่เลือกข้อที่ 2 --</option>

                      {questions2.map((q) => (
                        <option key={q.id} value={q.questionNo}>
                          ข้อ {q.questionNo} : {q.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
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
