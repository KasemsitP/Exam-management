// src/components/Header.tsx
import React from "react";

interface HeaderProps {
  showCreateForm: boolean;
  setShowCreateForm: React.Dispatch<React.SetStateAction<boolean>>;
  setNewCode: React.Dispatch<React.SetStateAction<string>>;
  setNewName: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  showCreateForm,
  setShowCreateForm,
  setNewCode,
  setNewName,
  loading,
}) => {
  return (
    <div className="card shadow-sm mx-0 mb-4">
      <div className="card-header bg-white">

        {/* ใช้ flex-row เพื่อจัดแถวให้หัวข้อ+ปุ่มอยู่แนวนอน */}
        <div className="d-flex align-items-center w-100">
          <div className="d-flex flex-column">
            <h5 className="mb-1">จัดการรายวิชา</h5>
            <small className="text-muted">
              เพิ่ม ลบ แก้ไข และกำหนดสิทธิ์ผู้ใช้งานระบบ
            </small>
          </div>

          {/* ปุ่มชิดขวา */}
          <button
            type="button"
            className="btn btn-primary  ms-auto"
            onClick={() => {
              setShowCreateForm((s) => !s);
              if (!showCreateForm) {
                setNewCode("");
                setNewName("");
              }
            }}
            disabled={loading}
          >
            + เพิ่มวิชา
          </button>
        </div>
      </div>
    </div>
  );
};


{/* export const Header: React.FC = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container-fluid">
        <span className="navbar-brand">ระบบจัดการหัวข้อข้อสอบ</span>
      </div>
    </nav>
  );
}; */}