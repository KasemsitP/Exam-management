import React, { useState, useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import {
  selectAllSubjects,
  selectSubjectsLoading,
  selectSubjectsError,
  fetchSubjectsThunk,
  createSubjectThunk,
  deleteSubjectThunk,
  addQuestionToSubjectThunk,
  deleteQuestionFromSubjectThunk,
} from "@/store/slices/subjects.slice";

import { showSuccess } from "../../components/ui/successAlert";
import Swal from "sweetalert2";
import AddQuestionModal from "./components/AddQuestionModal";

const SubjectPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const subjects = useAppSelector(selectAllSubjects);
  const loading = useAppSelector(selectSubjectsLoading);
  const error = useAppSelector(selectSubjectsError);

  /* ---------------- create subject modal ---------------- */
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  /* ---------------- view subject modal ---------------- */
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewSubjectId, setViewSubjectId] = useState<number | null>(null);

  const openViewSubjectModal = (subjectId: number) => {
    setViewSubjectId(subjectId);
    setViewModalOpen(true);
  };

  const closeViewSubjectModal = () => {
    setViewModalOpen(false);
    setViewSubjectId(null);
  };

  const viewSubject = useMemo(
    () => subjects.find((s) => s.id === viewSubjectId) ?? null,
    [subjects, viewSubjectId]
  );

  /* ---------------- add question modal ---------------- */
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionModalSubjectId, setQuestionModalSubjectId] = useState<number | null>(null);
  const [questionModalSubjectCode, setQuestionModalSubjectCode] = useState("");
  const [questionModalSubjectName, setQuestionModalSubjectName] = useState("");
  const [questionModalMaxNo, setQuestionModalMaxNo] = useState(0);

  useEffect(() => {
    dispatch(fetchSubjectsThunk());
  }, [dispatch]);

  const SortedSubject = subjects.slice().sort((a, b) => b.id - a.id);

  /* ---------------- CREATE SUBJECT ---------------- */
  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    Swal.fire({
      title: "ยืนยันการสร้างวิชาใหม่?",
      html: `
        <div style="text-align:left">
          <div><b>รหัสวิชา:</b> ${newCode.trim()}</div>
          <div><b>ชื่อวิชา:</b> ${newName.trim()}</div>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    }).then((r) => {
      if (!r.isConfirmed) return;

      dispatch(
        createSubjectThunk({
          code: newCode.trim(),
          name: newName.trim(),
        })
      )
        .unwrap()
        .then(() => {
          showSuccess("สำเร็จ", "สร้างวิชาเรียบร้อย");
          setNewCode("");
          setNewName("");
          setShowCreateForm(false);
          dispatch(fetchSubjectsThunk());
        })
        .catch(() => {
          Swal.fire("ผิดพลาด", "สร้างวิชาไม่สำเร็จ", "error");
        });
    });
  };

  /* ---------------- DELETE SUBJECT ---------------- */
  const handleDeleteSubject = (subjectId: number) => {
    const subj = subjects.find((s) => s.id === subjectId);

    Swal.fire({
      title: "ลบวิชานี้?",
      html: subj
        ? `<div style="text-align:left">
            <div><b>รหัส:</b> ${subj.code}</div>
            <div><b>วิชา:</b> ${subj.name}</div>
          </div>`
        : "คุณกำลังลบวิชา",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#d33",
    }).then((r) => {
      if (!r.isConfirmed) return;

      dispatch(deleteSubjectThunk({ id: subjectId }))
        .unwrap()
        .then(() => {
          showSuccess("ลบสำเร็จ", "ลบวิชาเรียบร้อย");
          dispatch(fetchSubjectsThunk());
          if (viewSubjectId === subjectId) closeViewSubjectModal();
        })
        .catch(() => {
          Swal.fire("ผิดพลาด", "ลบวิชาไม่สำเร็จ", "error");
        });
    });
  };

  /* ---------------- ADD QUESTION ---------------- */
  const openAddQuestionModal = (subjectId: number) => {
    const subj = subjects.find((s) => s.id === subjectId);
    if (!subj) return;

    setQuestionModalSubjectId(subj.id);
    setQuestionModalSubjectCode(subj.code);
    setQuestionModalSubjectName(subj.name);
    setQuestionModalMaxNo(subj.questions.length);
    setQuestionModalOpen(true);
  };

  const closeAddQuestionModal = () => {
    setQuestionModalOpen(false);
    setQuestionModalSubjectId(null);
  };

  const handleConfirmAddQuestion = (payload: { label: string; questionNo: number; maxScore: number }) => {
    if (!questionModalSubjectId) return;

    dispatch(
      addQuestionToSubjectThunk({
        subjectId: questionModalSubjectId,
        ...payload,
      }) as any
    )
      .unwrap()
      .then(() => {
        showSuccess("เพิ่มสำเร็จ", "สร้างหัวข้อแล้ว");
        setQuestionModalOpen(false);
        dispatch(fetchSubjectsThunk());
      })
      .catch(() => {
        Swal.fire("ผิดพลาด", "เพิ่มหัวข้อไม่สำเร็จ", "error");
      });
  };

  /* ---------------- DELETE QUESTION ---------------- */
  const handleRemoveQuestion = (subjectId: number, questionId: string) => {
    const subj = subjects.find((s) => s.id === subjectId);
    const q = subj?.questions.find((x) => x.id === questionId);

    Swal.fire({
      title: "ลบหัวข้อนี้?",
      html: q
        ? `<div style="text-align:left">
            <div><b>วิชา:</b> ${subj?.code} - ${subj?.name}</div>
            <div><b>ข้อ:</b> ${q.questionNo}</div>
            <div><b>หัวข้อ:</b> ${q.label || "-"}</div>
          </div>`
        : "คุณกำลังลบหัวข้อ",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#d33",
    }).then((r) => {
      if (!r.isConfirmed) return;

      dispatch(deleteQuestionFromSubjectThunk({ subjectId, questionId }))
        .unwrap()
        .then(() => {
          showSuccess("ลบสำเร็จ", "ลบหัวข้อเรียบร้อย");
          dispatch(fetchSubjectsThunk());
        })
        .catch(() => {
          Swal.fire("ผิดพลาด", "ลบหัวข้อไม่สำเร็จ", "error");
        });
    });
  };

  

  return (
    <div className="container-fluid px-4 py-3 d-flex flex-column gap-3">
      {/* HEADER */}
      <Header
        showCreateForm={showCreateForm}
        setShowCreateForm={setShowCreateForm}
        setNewCode={setNewCode}
        setNewName={setNewName}
        loading={loading}
      />

      {error && <div className="alert alert-danger mb-0">เกิดข้อผิดพลาด: {error}</div>}

      {/* ===================== TABLE SUBJECTS ===================== */}
      <div className="card shadow-sm" style={{ borderLeft: "3px solid #3B82F6" }}>
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">รายวิชา</h5>
            <small className="text-muted">เลือกวิชาเพื่อดูหัวข้อ</small>
          </div>

          <button className="btn btn-primary btn-lg" onClick={() => setShowCreateForm(true)} disabled={loading}>
            + เพิ่มวิชา
          </button>
        </div>

        {/* <div className="card-body p-3">
                  <div className="table-responsive">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="text-muted small">กำลังโหลด...</div>
            </div>
          ) : (
            <table className="table table-sm table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="text-nowrap" style={{ width: 120 }}>รหัส</th>
                  <th>วิชา</th>
                  <th className="text-center text-nowrap" style={{ width: 110 }}>จำนวนข้อ</th>
                  <th className="text-center text-nowrap" style={{ width: 110 }}>คะแนนเต็ม</th>
                  <th className="text-center text-nowrap" style={{ width: 220 }}>จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {SortedSubject.map((sub) => (
                  <tr key={sub.id}>
                    <td className="fw-semibold text-nowrap">{sub.code}</td>

                    <td style={{ minWidth: 150 }}>
                      <div className="fw-semibold">{sub.name}</div>
                      <small className="text-muted">วิชา {sub.code}</small>
                    </td>

                    <td className="text-center text-nowrap">{sub.questions.length}</td>
                    <td className="text-center text-nowrap">{sub.full_score}</td>

                    <td className="text-center text-nowrap">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openViewSubjectModal(sub.id)}
                          disabled={loading}
                        >
                          ดูหัวข้อ
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteSubject(sub.id)}
                          disabled={loading}
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {subjects.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      ยังไม่มีวิชาในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        </div> */}
        <div className="card-body p-3 position-relative">
          {loading && (
            <div></div>
          )}

          <div className="table-responsive" style={{ opacity: loading ? 1 : 1 }}>
            <table className="table table-sm table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="text-nowrap" style={{ width: 120 }}>รหัส</th>
                  <th>วิชา</th>
                  <th className="text-center text-nowrap" style={{ width: 110 }}>จำนวนข้อ</th>
                  <th className="text-center text-nowrap" style={{ width: 110 }}>คะแนนเต็ม</th>
                  <th className="text-center text-nowrap" style={{ width: 220 }}>จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {SortedSubject.map((sub) => (
                  <tr key={sub.id}>
                    <td className="fw-semibold text-nowrap">{sub.code}</td>

                    <td style={{ minWidth: 150 }}>
                      <div className="fw-semibold">{sub.name}</div>
                      <small className="text-muted">วิชา {sub.code}</small>
                    </td>

                    <td className="text-center text-nowrap">{sub.questions.length}</td>
                    <td className="text-center text-nowrap">{sub.full_score}</td>

                    <td className="text-center text-nowrap">
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openViewSubjectModal(sub.id)}
                          disabled={loading}
                        >
                          ดูหัวข้อ
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteSubject(sub.id)}
                          disabled={loading}
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {subjects.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      ยังไม่มีวิชาในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===================== CREATE SUBJECT MODAL ===================== */}
      {showCreateForm && (
        <>
          <div className="modal-backdrop show" style={{ zIndex: 1040 }} />
          <div className="modal d-block" style={{ zIndex: 1050 }} tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content" style={{ borderTop: "4px solid #22C55E" }}>
                <div className="modal-header">
                  <h6 className="modal-title">สร้างวิชาใหม่</h6>
                  <button className="btn-close" onClick={() => setShowCreateForm(false)} disabled={loading} />
                </div>

                <form onSubmit={handleCreateSubject}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label mb-1">รหัสวิชา</label>
                        <input
                          className="form-control"
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value)}
                          placeholder="เช่น LAW1002"
                          disabled={loading}
                          autoFocus
                        />
                      </div>

                      <div className="col-12 col-md-8">
                        <label className="form-label mb-1">ชื่อวิชา</label>
                        <input
                          className="form-control"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="เช่น กฎหมายแพ่ง"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreateForm(false)}>
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={loading || !newCode.trim() || !newName.trim()}
                    >
                      บันทึกวิชา
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        </>
      )}

      {/* ===================== VIEW SUBJECT MODAL ===================== */}
      {viewModalOpen && viewSubject && (
        <>
          <div className="modal-backdrop show" style={{ zIndex: 1040 }} />
          <div className="modal d-block" style={{ zIndex: 1050 }} tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content" style={{ borderTop: "4px solid #8B5CF6" }}>
                <div className="modal-header">
                  <div>
                    <h6 className="mb-0">รายการหัวข้อวิชา</h6>
                    <small className="text-muted">
                      {viewSubject.code} — {viewSubject.name}
                    </small>
                  </div>
                  <button className="btn-close" onClick={closeViewSubjectModal} disabled={loading} />
                </div>

                <div className="modal-body">
                  {viewSubject.questions.length === 0 ? (
                    <div className="alert alert-info mb-0">ยังไม่มีหัวข้อ</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: 80 }} className="text-center text-nowrap">ข้อ</th>
                            <th>หัวข้อ</th>
                            <th style={{ width: 110 }} className="text-center text-nowrap">คะแนนเต็ม</th>
                            <th style={{ width: 110 }} className="text-center text-nowrap">จัดการ</th>
                          </tr>
                        </thead>

                        <tbody>
                          {viewSubject.questions.map((q) => (
                            <tr key={q.id}>
                              <td className="text-center text-nowrap">{q.questionNo}</td>
                              <td style={{ minWidth: 150, maxWidth: 300, wordWrap: "break-word" }}>
                                {q.label || <span className="text-muted">-</span>}
                              </td>
                              <td className="text-center text-nowrap">{q.maxScore}</td>
                              <td className="text-center text-nowrap">
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleRemoveQuestion(viewSubject.id, q.id)}
                                  disabled={loading}
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

                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={closeViewSubjectModal} disabled={loading}>
                    ปิด
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => openAddQuestionModal(viewSubject.id)}
                    disabled={loading}
                  >
                    + สร้างหัวข้อ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===================== ADD QUESTION MODAL ===================== */}
      <AddQuestionModal
        open={questionModalOpen}
        subjectCode={questionModalSubjectCode}
        subjectName={questionModalSubjectName}
        maxQuestionNo={questionModalMaxNo}
        onClose={closeAddQuestionModal}
        onConfirm={handleConfirmAddQuestion}
      />
    </div>
  );
};

export default SubjectPage;