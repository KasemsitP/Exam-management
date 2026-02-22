import React from "react";

interface HeaderProps {
  showCreateForm: boolean;
  setShowCreateForm: React.Dispatch<React.SetStateAction<boolean>>;
  setNewCode: React.Dispatch<React.SetStateAction<string>>;
  setNewName: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  setShowCreateForm,
  setNewCode,
  setNewName,
  loading,
}) => {
  return (
    <div className="card shadow-sm mx-0" style={{ borderTop: "4px solid #3B82F6" }}>
      <div className="card-header bg-white">
        <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2">
          <div className="me-auto">
            <h5 className="mb-1">จัดการรายวิชา</h5>
            <small className="text-muted">
              เพิ่ม / ลบ วิชา และจัดการหัวข้อของแต่ละวิชา
            </small>
          </div>

          <div className="d-grid d-sm-block">
            {/* <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setShowCreateForm(true);
                setNewCode("");
                setNewName("");
              }}
              disabled={loading}
            >
              + เพิ่มวิชา
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
};