// src/pages/accounts/components/AccountEditModal.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import ModalBackdrop from "./ModalBackdrop";
import type { Account, Role, UpdateAccountFormValues } from "../types";

interface AccountEditModalProps {
  open: boolean;
  account: Account | null;
  roles: Role[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (id: number, values: UpdateAccountFormValues) => Promise<void>;
}

export default function AccountEditModal({
  open,
  account,
  roles,
  loading,
  onClose,
  onSubmit,
}: AccountEditModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateAccountFormValues>();

  useEffect(() => {
    if (account && open) {
      reset({
        full_name: account.full_name,
        email: account.email ?? "",
        role_id: account.role_id,
        active: account.active,
        newPassword: "",
      });
    }
  }, [account, open, reset]);

  const handleFormSubmit = handleSubmit(async (values) => {
    if (!account) return;
    await onSubmit(account.id, values);
    reset({
      full_name: "",
      email: "",
      role_id: 0,
      active: false,
      newPassword: "",
    });
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
              <h6 className="modal-title">แก้ไขผู้ใช้: {account?.username}</h6>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Username</label>
                    <input
                      className="form-control"
                      disabled
                      value={account?.username ?? ""}
                      readOnly
                    />
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
{/* 
                  <div className="col-md-6">
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

                  <div className="col-md-6">
                    <label className="form-label">เปลี่ยนรหัสผ่าน (ถ้าต้องการ)</label>
                    <input
                      type="password"
                      className={`form-control ${errors.newPassword ? "is-invalid" : ""}`}
                      placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
                      {...register("newPassword", {
                        validate: (value) => {
                          if (value && value.length < 8) {
                            return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
                          }
                          return true;
                        },
                      })}
                    />
                    {errors.newPassword && (
                      <div className="invalid-feedback">{errors.newPassword.message}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <div className="form-check mt-4 pt-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="edit-active"
                        {...register("active")}
                      />
                      <label className="form-check-label" htmlFor="edit-active">
                        Active
                      </label>
                    </div>
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
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
