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
    <div className="card shadow-sm border-0">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 table-striped">
            <colgroup>
              <col style={{ width: "15%", minWidth: 120 }} />
              <col style={{ width: "25%", minWidth: 180 }} />
              <col style={{ width: "20%", minWidth: 160 }} />
              <col style={{ width: "10%", minWidth: 80 }} />
              <col style={{ width: "30%", minWidth: 280 }} />
            </colgroup>
            <thead className="table-light text-uppercase small fw-semibold">
              <tr>
                <th className="px-3 py-3">ชื่อผู้ใช้</th>
                <th className="px-3 py-3">ชื่อ-นามสกุล</th>
                <th className="px-3 py-3">สถานะ</th>
                <th className="text-center px-3 py-3">Active</th>
                <th className="text-end px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((acc) => (
                <tr key={acc.id}>
                  <td className="fw-semibold text-nowrap px-3 py-2">{acc.username}</td>
                  <td className="text-nowrap px-3 py-2">{acc.full_name}</td>
                  <td className="text-nowrap px-3 py-2">
                    <span className="badge bg-light text-dark border">
                      {roleName(acc.role_id)} ({roleCode(acc.role_id)})
                    </span>
                  </td>
                  <td className="text-center text-nowrap px-3 py-2">
                    {acc.active ? (
                      <CheckCircle2 size={18} className="text-success" />
                    ) : (
                      <X size={18} className="text-muted" />
                    )}
                  </td>
                  <td className="text-end text-nowrap px-3 py-2">
                  <div className="d-flex flex-wrap gap-1 justify-content-center justify-content-lg-end">
  {/* ปุ่มแก้ไข */}
  <button
    className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
    onClick={() => onEdit(acc)}
    title="แก้ไข"
  >
    <Edit size={14} />
    <span>แก้ไข</span>
  </button>

  {/* ถ้า active = true → แสดงปุ่ม Revoke */}
  {acc.active ? (
    <button
      className="btn btn-outline-dark btn-sm d-inline-flex align-items-center gap-1"
      onClick={() => onRevoke(acc)}
      title="ถอนสิทธิ์"
    >
      <X size={14} />
      <span>ถอนสิทธิ์</span>
    </button>
  ) : (
    <button
      className="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-1"
      onClick={() => onUnrevoke(acc)}
      title="คืนสิทธิ์"
    >
      <CheckCircle2 size={14} />
      <span>คืนสิทธิ์</span>
    </button>
  )}

  {/* ปุ่มลบ (เฉพาะคนมี permission) */}
  <ShowIfCan permission="manage_accounts">
    <button
      className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
      onClick={() => onDelete(acc)}
      title="ลบบัญชี"
    >
      <Trash2 size={14} />
      <span>ลบ</span>
    </button>
  </ShowIfCan>
</div>
                  </td>
                </tr>
              ))}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-5 text-center">
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
