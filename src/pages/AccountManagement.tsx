import  { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Users,
  Loader2,
  Search,
  Plus,
  Trash2,
  Edit,
  X,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useAppDispatch, useAppSelector } from "@/store/hook";

// Thunks & Selectors
import {
  Account,
  selectAccountsSlice,
  selectAllAccounts,
  selectAllRoles,
  fetchAccountsThunk,
  fetchRolesThunk,
  createAccountThunk,
  updateAccountThunk,
  deleteAccountThunk,
} from "@/store/slices/account.slice";

// ------------------------------
// Form types
// ------------------------------
type AccountFormInputs = {
  username: string;
  password: string; // create only
  newPassword?: string; // edit only
  full_name: string;
  email: string;
  role_id: number;
  active: boolean;
};

// ------------------------------
// Backdrop helper
// ------------------------------
const renderBackdrop = (open: boolean) =>
  open ? <div className="modal-backdrop show" style={{ zIndex: 1050 }} /> : null;

export default function AccountsPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const { status: accountStatus } = useAppSelector(selectAccountsSlice);
  const accounts = useAppSelector(selectAllAccounts);
  const roles = useAppSelector(selectAllRoles);

  // UI states
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | "all">("all");
  const [activeOnly, setActiveOnly] = useState<"all" | "active" | "inactive">("all");

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // forms
  const {
    register: registerCreate,
    handleSubmit: submitCreate,
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: creating },
  } = useForm<AccountFormInputs>();

  const {
    register: registerEdit,
    handleSubmit: submitEdit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: updating },
  } = useForm<AccountFormInputs>();

  // Initial fetch
  useEffect(() => {
    dispatch(fetchAccountsThunk());
    dispatch(fetchRolesThunk());
  }, [dispatch]);

  // Reset create form on open
  useEffect(() => {
    if (isCreateModalOpen) {
      resetCreate({
        username: "",
        password: "",
        full_name: "",
        email: "",
        role_id: roles[0]?.id ?? 1,
        active: true,
      });
    }
  }, [isCreateModalOpen, resetCreate, roles]);

  // Reset edit form when selecting account
  useEffect(() => {
    if (editingAccount) {
      resetEdit({
        username: editingAccount.username,
        full_name: editingAccount.full_name,
        email: editingAccount.email ?? "",
        role_id: editingAccount.role_id,
        active: editingAccount.active,
        newPassword: "",
      });
    }
  }, [editingAccount, resetEdit]);

  // Derived: filtered accounts
  const filteredAccounts = useMemo(() => {
    const term = searchText.trim().toLowerCase();

    let list = accounts;

    if (roleFilter !== "all") {
      list = list.filter((a) => a.role_id === roleFilter);
    }

    if (activeOnly !== "all") {
      list = list.filter((a) => (activeOnly === "active" ? a.active : !a.active));
    }

    if (!term) return list;

    return list.filter(
      (acc) =>
        acc.username.toLowerCase().includes(term) ||
        acc.full_name.toLowerCase().includes(term) ||
        acc.email?.toLowerCase().includes(term)
    );
  }, [accounts, searchText, roleFilter, activeOnly]);

  // Handlers
  const handleCreate = submitCreate(async (data) => {
    try {
      await dispatch(
        createAccountThunk({
          username: data.username,
          password: data.password,
          full_name: data.full_name,
          email: data.email,
          role: data.role_id, // backend expects 'role'
        })
      ).unwrap();
      toast({ title: "สร้างผู้ใช้สำเร็จ", description: data.username });
      setCreateModalOpen(false);
    } catch (err: any) {
      toast({
        title: "สร้างผู้ใช้ล้มเหลว",
        description: err?.message ?? "ไม่สามารถสร้างบัญชีได้",
        variant: "destructive",
      });
    }
  });

  const handleUpdate = submitEdit(async (data) => {
    if (!editingAccount) return;
    try {
      await dispatch(
        updateAccountThunk({
          id: editingAccount.id,
          full_name: data.full_name,
          email: data.email,
          role_id: data.role_id,
          active: data.active,
          newPassword: data.newPassword ? data.newPassword : undefined,
        })
      ).unwrap();
      toast({ title: "บันทึกการแก้ไขแล้ว", description: editingAccount.username });
      setEditingAccount(null);
    } catch (err: any) {
      toast({
        title: "อัปเดตล้มเหลว",
        description: err?.message ?? "ไม่สามารถอัปเดตบัญชีได้",
        variant: "destructive",
      });
    }
  });

  const handleDelete = async (acc: Account) => {
    if (!window.confirm(`ยืนยันการลบผู้ใช้: ${acc.username}?`)) return;
    try {
      await dispatch(deleteAccountThunk(acc.id)).unwrap();
      toast({ title: "ลบผู้ใช้แล้ว", description: acc.username, variant: "destructive" });
    } catch (err: any) {
      toast({
        title: "ลบล้มเหลว",
        description: err?.message ?? "ไม่สามารถลบผู้ใช้ได้",
        variant: "destructive",
      });
    }
  };

  // Small helpers
  const roleName = (id: number) =>
    roles.find((r) => r.id === id)?.name ?? `Role#${id}`;
  const roleCode = (id: number) =>
    roles.find((r) => r.id === id)?.code ?? "-";

  // ==============================
  // Render
  // ==============================
  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <h5 className="mb-1">จัดการบัญชีผู้ใช้</h5>
              <small className="text-muted">
                เพิ่ม ลบ แก้ไข และกำหนดสิทธิ์ผู้ใช้งานระบบ
              </small>
            </div>

            {/* Stats chips */}
            <div className="d-flex flex-wrap gap-2">
              <span className="badge text-bg-secondary d-inline-flex align-items-center gap-1">
                <Users size={14} /> ทั้งหมด {accounts.length}
              </span>
              <span className="badge text-bg-success d-inline-flex align-items-center gap-1">
                <CheckCircle2 size={14} /> Active{" "}
                {accounts.filter((a) => a.active).length}
              </span>
              <span className="badge text-bg-light d-inline-flex align-items-center gap-1">
                <X size={14} /> Inactive{" "}
                {accounts.filter((a) => !a.active).length}
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar: search + filters + create */}
        <div className="card-body d-flex flex-column flex-md-row gap-3 align-items-md-end justify-content-between">
          <div className="w-100 d-flex flex-column flex-lg-row gap-3">
            {/* Search */}
            <div className="flex-fill">
              <label htmlFor="acc-search" className="form-label small text-muted">
                ค้นหา
              </label>
              <div className="position-relative">
                <Search
                  className="position-absolute"
                  size={16}
                  style={{
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="acc-search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="ค้นหา username, ชื่อ-สกุล, หรือ email"
                  className="form-control ps-5"
                />
              </div>
            </div>

            {/* Role filter */}
            <div style={{ minWidth: 220 }}>
              <label htmlFor="role-filter" className="form-label small text-muted">
                ฟิลเตอร์ตาม Role
              </label>
              <select
                id="role-filter"
                className="form-select"
                value={roleFilter}
                onChange={(e) => {
                  const v = e.target.value;
                  setRoleFilter(v === "all" ? "all" : Number(v));
                }}
              >
                <option value="all">ทุก Role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Active filter */}
            <div style={{ minWidth: 220 }}>
              <label htmlFor="active-filter" className="form-label small text-muted">
                สถานะการใช้งาน
              </label>
              <select
                id="active-filter"
                className="form-select"
                value={activeOnly}
                onChange={(e) => setActiveOnly(e.target.value as any)}
              >
                <option value="all">ทั้งหมด</option>
                <option value="active">เฉพาะ Active</option>
                <option value="inactive">เฉพาะ Inactive</option>
              </select>
            </div>
          </div>

          {/* Create button */}
          <div>
            <ShowIfCan permission="manage_accounts">
              <button
                className="btn btn-primary d-inline-flex align-items-center gap-2"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus size={16} /> สร้างผู้ใช้ใหม่
              </button>
            </ShowIfCan>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-uppercase small">
                <tr>
                  <th>Username</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th className="text-center">Active</th>
                  <th className="text-end">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="text-sm">
                    <td className="fw-semibold">{acc.username}</td>
                    <td>{acc.full_name}</td>
                    <td className="text-truncate" style={{ maxWidth: 260 }}>
                      {acc.email ?? "-"}
                    </td>
                    <td>
                      <span className="badge text-bg-light">
                        {roleName(acc.role_id)} ({roleCode(acc.role_id)})
                      </span>
                    </td>
                    <td className="text-center">
                      {acc.active ? (
                        <CheckCircle2 size={16} className="text-success" />
                      ) : (
                        <X size={16} className="text-muted" />
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                          onClick={() => setEditingAccount(acc)}
                          title="แก้ไข"
                        >
                          <Edit size={14} /> แก้ไข
                        </button>
                        <ShowIfCan permission="manage_accounts">
                          <button
                            className="btn btn-link text-danger p-2"
                            onClick={() => handleDelete(acc)}
                            title="ลบบัญชี"
                          >
                            <Trash2 size={16} />
                          </button>
                        </ShowIfCan>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredAccounts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-5">
                      <div className="d-flex flex-column align-items-center justify-content-center text-muted">
                        {accountStatus === "loading" ? (
                          <>
                            <Loader2 className="spin-animation mb-2" size={20} />
                            <div>Loading accounts…</div>
                          </>
                        ) : (
                          <>
                            <Search size={20} className="mb-2" />
                            <div>ไม่พบผลลัพธ์ที่ตรงกับเงื่อนไข</div>
                            <small>ลองลบฟิลเตอร์หรือเปลี่ยนคำค้นหา</small>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Account Modal */}
      {renderBackdrop(isCreateModalOpen)}
      <div
        className={`modal ${isCreateModalOpen ? "show" : ""}`}
        style={{ display: isCreateModalOpen ? "block" : "none" }}
        role="dialog"
        aria-modal={isCreateModalOpen}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title">สร้างผู้ใช้ใหม่</h6>
              <button
                type="button"
                className="btn-close"
                onClick={() => setCreateModalOpen(false)}
              />
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      Username <span className="text-danger">*</span>
                    </label>
                    <input
                      className={`form-control ${createErrors.username ? "is-invalid" : ""}`}
                      {...registerCreate("username", { required: "จำเป็นต้องระบุ" })}
                    />
                    {createErrors.username && (
                      <div className="invalid-feedback">{createErrors.username.message}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-control ${createErrors.password ? "is-invalid" : ""}`}
                      {...registerCreate("password", { required: "จำเป็นต้องระบุ" })}
                    />
                    {createErrors.password && (
                      <div className="invalid-feedback">{createErrors.password.message}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      ชื่อ-นามสกุล <span className="text-danger">*</span>
                    </label>
                    <input
                      className={`form-control ${createErrors.full_name ? "is-invalid" : ""}`}
                      {...registerCreate("full_name", { required: "จำเป็นต้องระบุ" })}
                    />
                    {createErrors.full_name && (
                      <div className="invalid-feedback">{createErrors.full_name.message}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className={`form-control ${createErrors.email ? "is-invalid" : ""}`}
                      {...registerCreate("email")}
                    />
                    {createErrors.email && (
                      <div className="invalid-feedback">{createErrors.email.message}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${createErrors.role_id ? "is-invalid" : ""}`}
                      {...registerCreate("role_id", { required: "จำเป็นต้องระบุ", valueAsNumber: true })}
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name} ({role.code})
                        </option>
                      ))}
                    </select>
                    {createErrors.role_id && (
                      <div className="invalid-feedback">{createErrors.role_id.message}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <div className="form-check mt-4 pt-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="create-active"
                        {...registerCreate("active")}
                      />
                      <label className="form-check-label" htmlFor="create-active">
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
                  onClick={() => setCreateModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={accountStatus === "loading" || creating}
                >
                  {(accountStatus === "loading" || creating) && (
                    <Loader2 size={16} className="me-2 spin-animation" />
                  )}
                  สร้างผู้ใช้
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Account Modal */}
      {renderBackdrop(!!editingAccount)}
      <div
        className={`modal ${editingAccount ? "show" : ""}`}
        style={{ display: editingAccount ? "block" : "none" }}
        role="dialog"
        aria-modal={!!editingAccount}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
          <div className="modal-header">
              <h6 className="modal-title">แก้ไขผู้ใช้: {editingAccount?.username}</h6>
              <button type="button" className="btn-close" onClick={() => setEditingAccount(null)} />
            </div>

            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Username</label>
                    <input className="form-control" disabled {...registerEdit("username")} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      ชื่อ-นามสกุล <span className="text-danger">*</span>
                    </label>
                    <input
                      className={`form-control ${editErrors.full_name ? "is-invalid" : ""}`}
                      {...registerEdit("full_name", { required: "จำเป็นต้องระบุ" })}
                    />
                    {editErrors.full_name && (
                      <div className="invalid-feedback">{editErrors.full_name.message}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className={`form-control ${editErrors.email ? "is-invalid" : ""}`}
                      {...registerEdit("email")}
                    />
                    {editErrors.email && (
                      <div className="invalid-feedback">{editErrors.email.message}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${editErrors.role_id ? "is-invalid" : ""}`}
                      {...registerEdit("role_id", { required: "จำเป็นต้องระบุ", valueAsNumber: true })}
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name} ({role.code})
                        </option>
                      ))}
                    </select>
                    {editErrors.role_id && (
                      <div className="invalid-feedback">{editErrors.role_id.message}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">เปลี่ยนรหัสผ่าน (ถ้าต้องการ)</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="กรอกรหัสผ่านใหม่"
                      {...registerEdit("newPassword")}
                    />
                  </div>

                  <div className="col-md-6">
                    <div className="form-check mt-4 pt-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="edit-active"
                        {...registerEdit("active")}
                      />
                      <label className="form-check-label" htmlFor="edit-active">
                        Active
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setEditingAccount(null)}>
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={accountStatus === "loading" || updating}
                >
                  {(accountStatus === "loading" || updating) && (
                    <Loader2 size={16} className="me-2 spin-animation" />
                  )}
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
