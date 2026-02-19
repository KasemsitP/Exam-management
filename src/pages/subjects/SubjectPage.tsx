// src/pages/SubjectPage.tsx
import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import {
  selectAllSubjects,
  selectSubjectsLoading,
  selectSubjectsError,
  updateQuestionLabel,
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

  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // state สำหรับ modal เพิ่มข้อ
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionModalSubjectId, setQuestionModalSubjectId] = useState<number | null>(null);
  const [questionModalSubjectCode, setQuestionModalSubjectCode] = useState<string>("");
  const [questionModalSubjectName, setQuestionModalSubjectName] = useState<string>("");
  const [questionModalMaxNo, setQuestionModalMaxNo] = useState<number>(0);

  useEffect(() => {
    dispatch(fetchSubjectsThunk());
  }, [dispatch]);

  /* --------------------- สร้างวิชาใหม่ --------------------- */
  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    Swal.fire({
      title: "ยืนยันการสร้างวิชาใหม่?",
      html: `
        <div class="text-start">
          <div><b>รหัสวิชา:</b> ${newCode.trim()}</div>
          <div><b>ชื่อวิชา:</b> ${newName.trim()}</div>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (!result.isConfirmed) return;

      dispatch(
        createSubjectThunk({
          code: newCode.trim(),
          name: newName.trim(),
        })
      )
        .unwrap()
        .then(() => {
          showSuccess("สร้างวิชาสำเร็จ", "ได้เพิ่มวิชาใหม่เข้าระบบแล้ว");
          setNewCode("");
          setNewName("");
          setShowCreateForm(false);
        })
        .catch(() => {
          Swal.fire("สร้างวิชาไม่สำเร็จ", "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์", "error");
        });
    });
  };

  /* --------------------- เปิด / ปิด modal เพิ่มข้อ --------------------- */
  const openAddQuestionModal = (subjectId: number) => {
    const subj = subjects.find((s) => s.id === subjectId);
    if (!subj) return;

    setQuestionModalSubjectId(subj.id);
    setQuestionModalSubjectCode(subj.code);
    setQuestionModalSubjectName(subj.name);
    setQuestionModalMaxNo(subj.questions.length); // จำนวนข้อเดิม
    setQuestionModalOpen(true);
  };

  const closeAddQuestionModal = () => {
    setQuestionModalOpen(false);
    setQuestionModalSubjectId(null);
  };

  // เวลา user กดยืนยันใน modal
  // const handleConfirmAddQuestion = (payload: { label: string; questionNo: number }) => {
  //   if (!questionModalSubjectId) return;

  //   const { label, questionNo } = payload;

  //   dispatch(
  //     addQuestionToSubjectThunk({
  //       subjectId: questionModalSubjectId,
  //       label,
  //       questionNo,
  //     }) as any
  //   )
  //     .unwrap()
  //     .then(() => {
  //       showSuccess("เพิ่มข้อสำเร็จ", `ได้เพิ่มข้อที่ ${questionNo} : "${label}" แล้ว`);
  //       setQuestionModalOpen(false);
  //       setQuestionModalSubjectId(null);
  //     })
  //     .catch(() => {
  //       Swal.fire("เพิ่มข้อไม่สำเร็จ", "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์", "error");
  //     });
  // };
  const handleConfirmAddQuestion = (payload: { label: string; questionNo: number; maxScore: number }) => {
    if (!questionModalSubjectId) return;

    const { label, questionNo, maxScore } = payload;

    dispatch(
      addQuestionToSubjectThunk({
        subjectId: questionModalSubjectId,
        label,
        questionNo,
        maxScore,              // ✅ เพิ่มไปที่ thunk
      }) as any
    )
      .unwrap()
      .then(() => {
        showSuccess("เพิ่มข้อสำเร็จ", `ได้เพิ่มข้อที่ ${questionNo} : "${label}" (เต็ม ${maxScore} คะแนน) แล้ว`);
        setQuestionModalOpen(false);
        setQuestionModalSubjectId(null);
        dispatch(fetchSubjectsThunk());
      })
      .catch(() => {
        Swal.fire("เพิ่มข้อไม่สำเร็จ", "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์", "error");
      });
  };



  /* --------------------- เปลี่ยน label ของข้อ (แก้ในตาราง) --------------------- */
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

  /* --------------------- ลบข้อ --------------------- */
  const handleRemoveQuestion = (subjectId: number, questionId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    const question = subject?.questions.find((q) => q.id === questionId);

    Swal.fire({
      title: "ยืนยันการลบข้อสอบ?",
      html: question
        ? `<div class="text-start">
           <div><b>วิชา:</b> ${subject?.code} - ${subject?.name}</div>
           <div><b>ข้อที่:</b> ${question.questionNo}</div>
           <div><b>หัวข้อ:</b> ${question.label || "-"}</div>
         </div>`
        : "คุณกำลังลบข้อสอบออกจากวิชานี้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (!result.isConfirmed) return;

      dispatch(
        deleteQuestionFromSubjectThunk({
          subjectId,
          questionId,
        })
      )
        .unwrap()
        .then(() => {
          showSuccess("ลบข้อสอบสำเร็จ", "ได้ลบข้อจากวิชานี้เรียบร้อยแล้ว");
          dispatch(fetchSubjectsThunk()); // ถ้าต้องการ sync question_no ใหม่จาก DB
        })
        .catch(() => {
          Swal.fire("ลบข้อสอบไม่สำเร็จ", "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์", "error");
        });
    });
  };

  /* --------------------- ลบวิชา --------------------- */
  const handleDeleteSubject = (subjectId: number) => {
    const subject = subjects.find((s) => s.id === subjectId);

    Swal.fire({
      title: "คุณต้องการลบวิชานี้หรือไม่?",
      html: subject
        ? `<div class="text-start">
            <div><b>รหัสวิชา:</b> ${subject.code}</div>
            <div><b>ชื่อวิชา:</b> ${subject.name}</div>
          </div>`
        : "คุณกำลังลบข้อมูลสำคัญ",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (!result.isConfirmed) return;

      dispatch(deleteSubjectThunk({ id: subjectId }))
        .unwrap()
        .then(() => {
          showSuccess("ลบวิชาสำเร็จ", "คุณได้ลบวิชาออกจากระบบแล้ว");
          dispatch(fetchSubjectsThunk());
        })
        .catch(() => {
          Swal.fire("ลบวิชาไม่สำเร็จ", "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์", "error");
        });
    });
  };

  return (
    <div className="container-fluid px-3 px-sm-4 py-3 gap-1 d-flex flex-column">
      <Header
        showCreateForm={showCreateForm}
        setShowCreateForm={setShowCreateForm}
        setNewCode={setNewCode}
        setNewName={setNewName}
        loading={loading}


      />
      {/* <div className="card shadow-sm mx-0 mb-4">
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
        {loading && (
          <div className="card-body py-2">
            <span className="text-muted small">กำลังโหลด/บันทึกข้อมูล...</span>
          </div>
        )}
        {error && (
          <div className="card-body py-2">
            <div className="alert alert-danger mb-0">
              เกิดข้อผิดพลาด: {error}
            </div>
          </div>
        )}
      </div> */}

      {/* ฟอร์มสร้างวิชาใหม่ */}
      {showCreateForm && (
        <>
          {/* Backdrop */}
          <div
            className="modal-backdrop show"
            style={{ zIndex: 1050 }}
            onClick={() => {
              if (!loading) setShowCreateForm(false);
            }}
          />

          {/* Modal */}
          <div
            className="modal show"
            style={{ display: "block", zIndex: 1055 }}
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              // คลิกนอกกล่องเพื่อปิด (optional)
              if (e.target === e.currentTarget && !loading) setShowCreateForm(false);
            }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title">สร้างวิชาใหม่</h6>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    disabled={loading}
                    onClick={() => setShowCreateForm(false)}
                  />
                </div>

                <form onSubmit={handleCreateSubject}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label mb-1">รหัสวิชา</label>
                        <input
                          type="text"
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
                          type="text"
                          className="form-control"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="เช่น กฎหมายแพ่ง"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer flex-column flex-sm-row gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100 w-sm-auto order-2 order-sm-1"
                      onClick={() => setShowCreateForm(false)}
                      disabled={loading}
                    >
                      ยกเลิก
                    </button>

                    <button
                      type="submit"
                      className="btn btn-success w-100 w-sm-auto order-1 order-sm-2"
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


      {subjects.length === 0 && !showCreateForm && !loading && (
        <div className="alert alert-info">
          ยังไม่มีวิชาในระบบ กดปุ่ม <strong>“เพิ่มวิชา”</strong> ด้านขวาบนเพื่อเริ่มต้น
        </div>
      )}

      {/* การ์ดวิชาแต่ละตัว */}
      {subjects.map((sub) => (
        <div className="card mb-4" key={sub.id}>
          <div className="card-header">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-3">
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2">
                  <strong className="fs-6">วิชา {sub.name}</strong>
                </div>
                <div className="text-muted small">
                  รหัสวิชา: <strong>{sub.code}</strong>
                </div>
                <div className="text-muted small">
                  จำนวน {sub.questions.length} ข้อ | คะแนนเต็ม {sub.full_score} คะแนน
                </div>
              </div>

              <div className="d-flex gap-2 flex-nowrap align-self-sm-start">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm text-nowrap"
                  onClick={() => handleDeleteSubject(sub.id)}
                  disabled={loading}
                >
                  ลบ
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm text-nowrap"
                  onClick={() => openAddQuestionModal(sub.id)}
                  disabled={loading}
                >
                  + เพิ่มข้อ
                </button>
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            {sub.questions.length === 0 ? (
              <div className="p-4 text-muted d-flex justify-content-start align-items-center">
                {/* วิชา <strong>{sub.code} - {sub.name}</strong>{" "}
                ยังไม่มีข้อสอบ กดปุ่ม <strong>“เพิ่มข้อ”</strong> ด้านขวาบนเพื่อเพิ่ม เช่น{" "}
                <strong>ข้อ 1 กฎหมายรัฐธรรมนูญ</strong> */}
                <strong> ยังไม่มีข้อสอบ</strong>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table mb-0 align-middle">
                  <thead className="table-light">
                    <tr className="align-middle">
                      <th style={{ width: 60, minWidth: 60 }} className="text-center text-nowrap">ข้อ</th>
                      <th className="text-start">ชื่อหัวข้อ</th>
                      <th style={{ width: 100, minWidth: 100 }} className="text-center text-nowrap">คะแนนเต็ม</th>
                      <th style={{ width: 90, minWidth: 90 }} className="text-center text-nowrap">การจัดการ</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sub.questions.map((q) => (
                      <tr key={q.id} className="align-middle">
                        <td
                          className="text-center text-nowrap"
                          style={{
                            fontVariantNumeric: "tabular-nums",
                            fontFeatureSettings: '"tnum" 1',
                          }}
                        >
                          {q.questionNo}
                        </td>

                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={q.label}
                            onChange={(e) =>
                              handleChangeQuestionLabel(sub.id, q.id, e.target.value)
                            }
                            disabled={true}
                          />
                        </td>

                        <td className="text-center text-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {q.maxScore}
                        </td>

                        <td className="text-center text-nowrap">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleRemoveQuestion(sub.id, q.id)}
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
        </div>
      ))}

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
