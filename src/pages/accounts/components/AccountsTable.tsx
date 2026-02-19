// src/pages/accounts/components/AccountsTable.tsx
import { CheckCircle2, X, Trash2, Edit, Search, Loader2, Pencil } from "lucide-react";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import type { Account, Role } from "../types";

interface AccountsTableProps {
  accounts: Account[];
  roles: Role[];
  status: "idle" | "loading" | "succeeded" | "failed";
  onRevoke: (account: Account) => void;
  onUnrevoke: (account: Account) => void;

  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export default function AccountsTable({
  accounts,
  roles,
  status,
  onEdit,
  onDelete,
  onRevoke,
  onUnrevoke,
}: AccountsTableProps) {
  const roleName = (id: number) =>
    roles.find((r) => r.id === id)?.name ?? `Role#${id}`;
  const roleCode = (id: number) =>
    roles.find((r) => r.id === id)?.code ?? "-";

  const filteredAccounts = accounts;

  return (
    <div className="card shadow-sm">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <colgroup>
              <col style={{ width: 120, minWidth: 120 }} />
              <col style={{ minWidth: 180 }} />
              <col style={{ minWidth: 200 }} />
              <col style={{ width: 180, minWidth: 180 }} />
              <col style={{ width: 80, minWidth: 80 }} />
              <col style={{ width: 260, minWidth: 260 }} />
            </colgroup>
            <thead className="table-light text-uppercase small">
              <tr>
                <th className="text-nowrap">Username</th>
                <th className="text-nowrap">ชื่อ-นามสกุล</th>
                <th className="text-nowrap">Email</th>
                <th className="text-nowrap">Role</th>
                <th className="text-center text-nowrap">Active</th>
                <th className="text-end text-nowrap">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((acc) => (
                <tr key={acc.id} className="text-sm">
                  <td className="fw-semibold text-nowrap">{acc.username}</td>
                  <td className="text-nowrap">{acc.full_name}</td>
                  <td className="text-truncate" style={{ maxWidth: 200 }}>
                    {acc.email ?? "-"}
                  </td>
                  <td className="text-nowrap">
                    <span className="badge text-bg-light">
                      {roleName(acc.role_id)} ({roleCode(acc.role_id)})
                    </span>
                  </td>
                  <td className="text-center text-nowrap">
                    {acc.active ? (
                      <CheckCircle2 size={16} className="text-success" />
                    ) : (
                      <X size={16} className="text-muted" />
                    )}
                  </td>
                  <td className="text-end text-nowrap">
                    <div className="d-flex justify-content-end gap-1 flex-wrap">
                      {/* ปุ่มแก้ไข */}
                      <button
                        className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1 text-nowrap"
                        onClick={() => onEdit(acc)}
                        title="แก้ไข"
                      //  disabled={locked}
                      >
                        <Edit size={14} /> <span className="d-none d-md-inline">แก้ไข</span>
                      </button>

                      {/* ถ้า active = true → แสดงปุ่ม Revoke */}
                      {acc.active ? (
                        <button
                          className="btn btn-outline-dark btn-sm d-inline-flex align-items-center gap-1 text-nowrap"
                          onClick={() => onRevoke(acc)}
                          title="ถอนสิทธิ์"
                        >
                          <X size={14} /> <span className="d-none d-lg-inline">ถอนสิทธิ์</span>
                        </button>
                      ) : (
                        // ถ้า active = false → แสดงปุ่มคืนสิทธิ์
                        <button
                          className="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-1 text-nowrap"
                          onClick={() => onUnrevoke(acc)}
                          title="คืนสิทธิ์"
                        // disabled={locked}
                        >
                          <CheckCircle2 size={14} /> <span className="d-none d-lg-inline">คืนสิทธิ์</span>
                        </button>
                      )}

                      {/* บุ่มลบ (เฉพาะคนมี permission) */}
                      <ShowIfCan permission="manage_accounts">
                        <button
                          className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1 text-nowrap"
                          onClick={() => onDelete(acc)}
                          title="ลบบัญชี"
                        // disabled={locked}
                        >
                          <Trash2 size={14} /> <span className="d-none d-sm-inline">ลบ</span>
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
                      {status === "loading" ? (
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
  );
}
