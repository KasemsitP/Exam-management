// src/pages/SubjectPage.tsx
import React, { useState } from "react";
import { Header } from "./components/Header";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import {
  selectAllSubjects,
  createSubject,
  addQuestion,
  updateQuestionLabel,
  removeQuestion,
  deleteSubject,
} from "@/store/slices/subjects.slice";
import { WarningButton } from "@/components/ui/warnning-button";
import Swal from 'sweetalert2';

const SubjectPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const subjects = useAppSelector(selectAllSubjects);

  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    dispatch(
      createSubject({
        code: newCode.trim(),
        name: newName.trim(),
      })
    );
    setNewCode("");
    setNewName("");
    setShowCreateForm(false);
  };

  const handleAddQuestion = (subjectId: number) => {
    dispatch(addQuestion({ subjectId }));
  };

  const handleChangeQuestionLabel = (
    subjectId: number,
    questionId: string,
    label: string
  ) => {
    dispatch(
      updateQuestionLabel({
        subjectId,
        questionId,
        label,
      })
    );
  };

  const handleRemoveQuestion = (subjectId: number, questionId: string) => {
    dispatch(removeQuestion({ subjectId, questionId }));
  };

  const handleDeleteSubject = (subjectId: number) => {
    Swal.fire({
      title: 'ระวังนะ!',
      text: 'คุณกำลังลบข้อมูลสำคัญ',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'โอเค เข้าใจแล้ว',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteSubject({ id: subjectId }));
      }
    });
  };

  return (
    <>
      <Header />
      <div className="card shadow-sm mx-0 mb-4">
        <div className="card-header bg-white">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
            <div className="mb-2 mb-md-0">
              <h4 className="mb-1">จัดการวิชาและข้อสอบ</h4>
              <small className="text-muted">
                เพิ่มวิชา แล้วกำหนดหัวข้อของแต่ละข้อในวิชานั้น
              </small>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCreateForm((s) => !s)}
            >
              + เพิ่มวิชา
            </button>
          </div>
        </div>
      </div>


      {/* ฟอร์มสร้างวิชาใหม่ (แบบแถบด้านบนเหมือน “เพิ่มเซสชัน”) */}
      {showCreateForm && (
        <div className="card mb-4">
          <div className="card-header">
            <strong>สร้างวิชาใหม่</strong>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateSubject}>
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-3">
                  <label className="form-label mb-1">รหัสวิชา</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="เช่น LAW1002"
                  />
                </div>
                <div className="col-12 col-md-5">
                  <label className="form-label mb-1">ชื่อวิชา</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="เช่น กฎหมายแพ่ง"
                  />
                </div>
                <div className="col-12 col-md-2">
                  <button
                    type="submit"
                    className="btn btn-success w-100"
                    disabled={!newCode.trim() || !newName.trim()}
                  >
                    บันทึกวิชา
                  </button>
                </div>
                <div className="col-12 col-md-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    onClick={() => setShowCreateForm(false)}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ถ้ายังไม่มีวิชาเลย */}
      {subjects.length === 0 && !showCreateForm && (
        <div className="alert alert-info">
          ยังไม่มีวิชาในระบบ กดปุ่ม <strong>“เพิ่มวิชา”</strong> ด้านขวาบนเพื่อเริ่มต้น
        </div>
      )}

      {/* การ์ดวิชาแต่ละตัว (เหมือนการ์ด session ในรูป) */}
      {subjects.map((sub) => (
        <div className="card mb-4" key={sub.id}>
          {/* ส่วนหัวการ์ด (ชื่อวิชา + badge จำนวนข้อ + ปุ่ม) */}
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <div className="d-flex align-items-center gap-2">
                <strong>{sub.name}</strong>
                <span className="badge bg-secondary">
                  {sub.questions.length} ข้อ
                </span>
              </div>
              <div className="text-muted small">
                รหัสวิชา: <strong>{sub.code}</strong>
              </div>
            </div>

            <div className="d-flex gap-2">
              {/* ปุ่มแก้ไขชื่อวิชา (ตอนนี้ยังไม่ทำฟอร์ม popup ให้ – เผื่อคุณจะต่อเอง) */}
              {/* <button className="btn btn-outline-secondary btn-sm">แก้ไข</button> */}
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => handleDeleteSubject(sub.id)}
              >
                ลบ
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleAddQuestion(sub.id)}
              >
                + เพิ่มข้อ
              </button>
            </div>
          </div>

          {/* ตาราง “ข้อในวิชา” (แทนที่ตารางวิชาในรูป) */}
          <div className="card-body p-0">
            {sub.questions.length === 0 ? (
              <div className="p-3 text-muted">
                วิชา <strong>{sub.code} - {sub.name}</strong>{" "}
                ยังไม่มีข้อสอบ กดปุ่ม <strong>“เพิ่มข้อ”</strong> ด้านขวาบนเพื่อเพิ่ม เช่น{" "}
                <strong>ข้อ 1 กฎหมายรัฐธรรมนูญ</strong>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "80px" }}>ข้อ</th>
                      <th>ชื่อหัวข้อ</th>
                      <th style={{ width: "120px" }} className="text-center">
                        การจัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sub.questions.map((q) => (
                      <tr key={q.id}>
                        <td>{q.questionNo}</td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="เช่น กฎหมายรัฐธรรมนูญ"
                            value={q.label}
                            onChange={(e) =>
                              handleChangeQuestionLabel(
                                sub.id,
                                q.id,
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() =>
                              handleRemoveQuestion(sub.id, q.id)
                            }
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
};

export default SubjectPage;
