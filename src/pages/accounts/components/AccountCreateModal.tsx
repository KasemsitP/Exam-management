// src/pages/accounts/components/AccountCreateModal.tsx
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import ModalBackdrop from "./ModalBackdrop";
import type { CreateAccountFormValues, Role } from "../types";

interface AccountCreateModalProps {
  open: boolean;
  roles: Role[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (values: CreateAccountFormValues) => Promise<void>;
}

export default function AccountCreateModal({
  open,
  roles,
  loading,
  onClose,
  onSubmit,
}: AccountCreateModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountFormValues>({
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      full_name: "",
      email: "",
      role_id: roles[0]?.id ?? 1,
      active: true,
      managerKeyNo: 1,
    },
  });

  const password = watch("password") ?? "";
  const roleId = watch("role_id");
  const managerKeyNo = watch("managerKeyNo");

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === roleId),
    [roles, roleId]
  );

  const isManager = (selectedRole?.code ?? "").toLowerCase() === "manager";

  // reset form ตอนเปิด modal
  useEffect(() => {
    if (!open) return;

    reset({
      username: "",
      password: "",
      confirmPassword: "",
      full_name: "",
      email: "",
      role_id: roles[0]?.id ?? 1,
      active: true,
      managerKeyNo: 1,
    });
  }, [open, reset, roles]);

  // ถ้า role ไม่ใช่ manager ให้ล้าง managerKeyNo / ถ้าเป็น manager แล้วค่าว่างค่อย set default
  useEffect(() => {
    if (!open) return;

    if (!isManager) {
      setValue("managerKeyNo", undefined, { shouldValidate: true });
      return;
    }

    if (managerKeyNo !== 1 && managerKeyNo !== 2) {
      setValue("managerKeyNo", 1, { shouldValidate: true });
    }
  }, [open, isManager, managerKeyNo, setValue]);

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
          <div
            className="modal-content"
            style={{
              border: 0,
              boxShadow:
                "0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.10)",
            }}
          >
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
                      className={`form-control ${
                        errors.username ? "is-invalid" : ""
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
                      ชื่อ-นามสกุล <span className="text-danger">*</span>
                    </label>
                    <input
                      className={`form-control ${
                        errors.full_name ? "is-invalid" : ""
                      }`}
                      {...register("full_name", { required: "จำเป็นต้องระบุ" })}
                    />
                    {errors.full_name && (
                      <div className="invalid-feedback">
                        {errors.full_name.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-control ${
                        errors.password ? "is-invalid" : ""
                      }`}
                      {...register("password", {
                        required: "จำเป็นต้องระบุ",
                        minLength: {
                          value: 8,
                          message: "รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร",
                        },
                      })}
                    />
                    {errors.password && (
                      <div className="invalid-feedback">
                        {errors.password.message}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      ยืนยัน Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-control ${
                        errors.confirmPassword ? "is-invalid" : ""
                      }`}
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

                  <div className="col-md-6">
                    <label className="form-label">
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${
                        errors.role_id ? "is-invalid" : ""
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

                  {/* ✅ โชว์เฉพาะตอนเลือก manager */}
                  {isManager && (
                    <div className="col-md-6">
                      <label className="form-label">
                        ผู้จัดการคีย์ <span className="text-danger">*</span>
                      </label>

                      <div className="d-flex gap-4 pt-2">
                        <label className="d-flex align-items-center gap-2">
                          <input
                            type="radio"
                            name="managerKeyNo"
                            className={`form-check-input m-0 ${
                              errors.managerKeyNo ? "is-invalid" : ""
                            }`}
                            checked={managerKeyNo === 1}
                            onChange={() =>
                              setValue("managerKeyNo", 1, {
                                shouldValidate: true,
                              })
                            }
                          />
                          <span>คนที่ 1</span>
                        </label>

                        <label className="d-flex align-items-center gap-2">
                          <input
                            type="radio"
                            name="managerKeyNo"
                            className={`form-check-input m-0 ${
                              errors.managerKeyNo ? "is-invalid" : ""
                            }`}
                            checked={managerKeyNo === 2}
                            onChange={() =>
                              setValue("managerKeyNo", 2, {
                                shouldValidate: true,
                              })
                            }
                          />
                          <span>คนที่ 2</span>
                        </label>
                      </div>

                      {/* ✅ ให้ RHF มี field นี้ไว้ validate */}
                      <input
                        type="hidden"
                        {...register("managerKeyNo", {
                          valueAsNumber: true,
                          validate: (v) =>
                            isManager
                              ? (v === 1 || v === 2) ||
                                "กรุณาเลือกผู้จัดการคีย์"
                              : true,
                        })}
                      />

                      {errors.managerKeyNo && (
                        <div className="invalid-feedback d-block">
                          {errors.managerKeyNo.message as any}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer d-flex justify-content-end gap-2">
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