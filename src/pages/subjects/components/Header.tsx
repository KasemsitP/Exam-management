// src/components/Header.tsx
import React from "react";

export const Header: React.FC = () => {
  return (
    <div className="card shadow-sm mx-0 mb-4">
      <div className="card-header bg-white">
        <div className="navbar navbar-expand-lg navbar-light flex-column align-items-start">
          <h5 className="mb-1">จัดการรายวิชา</h5>
          <small className="text-muted">
            เพิ่ม ลบ แก้ไข และกำหนดสิทธิ์ผู้ใช้งานระบบ
          </small>
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