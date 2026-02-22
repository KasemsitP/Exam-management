// src/pages/accounts/components/AccountsTable.tsx
import { CheckCircle2, X, Trash2, Edit, Search, Loader2, Pencil } from "lucide-react";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import type { Account, Role } from "../types";
import { selectIsSystemLocked } from "@/store/slices/examData.slice";
import { useAppSelector } from "@/store/hook";

interface AccountsTableProps {
  accounts: Account[];
  roles: Role[];
  status: "idle" | "loading" | "succeeded" | "failed";

  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onRevoke: (account: Account) => void;
  onUnrevoke: (account: Account) => void;
  onViewSubjects: (account: Account) => void;
}

export default function AccountsTable({
  accounts,
  roles,
  status,
  onEdit,
  onDelete,
  onRevoke,
  onUnrevoke,
  onViewSubjects
}: AccountsTableProps) {
  const roleName = (id: number) =>
    roles.find((r) => r.id === id)?.name ?? `Role#${id}`;
  const roleCode = (id: number) =>
    roles.find((r) => r.id === id)?.code ?? "-";
  const locked = useAppSelector(selectIsSystemLocked);

  const filteredAccounts = accounts;

  return (
    <div className="card" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)' }}>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 table-striped text-nowrap">
            <thead className="table-light text-uppercase small">
              <tr>
                <th>ชื่อผู้ใช้</th>
                <th>ชื่อ-นามสกุล</th>
                <th>สถานะ</th>
                <th className="text-center">Active</th>
                <th className="text-end"></th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((acc) => (
                <tr key={acc.id} className="text-sm">
                  <td className="fw-semibold">{acc.username}</td>
                  <td>{acc.full_name}</td>
                  {/* <td className="text-truncate" style={{ maxWidth: 260 }}>
                    {acc.email ?? "-"}
                  </td> */}
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
                    <div className="d-flex flex-wrap gap-1 justify-content-center justify-content-lg-end">

                      <button
                        className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                        onClick={() => onViewSubjects(acc)}
                        title="ดูวิชารายวิชา"
                      >
                        <Edit size={14} />
                        <span>ดูรายวิชา</span>
                      </button>

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
