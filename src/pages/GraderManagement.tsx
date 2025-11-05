
// import { useMemo, useState } from "react";
// import { useForm } from "react-hook-form";
// import {
//   Layers,
//   Pencil,
//   Plus,
//   Trash2,
//   Filter,
//   Check,
//   X,
//   KeyRound,
// } from "lucide-react";
// import { useAppDispatch, useAppSelector } from "@/store/hook";
// import { selectActiveCampaign, selectActiveCampaignSessions } from "@/store/slices/examData.slice";
// import {
//   graderAdded,
//   graderRemoved,
//   graderUpdated,
//   selectGradersForCampaign,
// } from "@/store/slices/graders.slice";
// import { ShowIfCan } from "@/components/auth/ShowIfCan";
// import { useToast } from "@/components/ui/use-toast";

// interface FormValues {
//   code: string;
//   firstName: string;
//   lastName: string;
//   username: string;
//   password: string;
//   sessionId: string;
//   subjectId: string;
//   questionRange: string;
//   notes?: string;
// }

// export default function GraderManagementPage() {
//   const dispatch = useAppDispatch();
//   const { toast } = useToast();

//   const activeCampaign = useAppSelector(selectActiveCampaign);
//   const sessions = useAppSelector(selectActiveCampaignSessions);
//   const graders = useAppSelector(selectGradersForCampaign(activeCampaign?.id ?? null));

//   const [searchTerm, setSearchTerm] = useState("");
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);

//   const defaultSessionId = sessions[0]?.id ?? "";
//   const defaultSubjectId = sessions[0]?.subjects?.[0]?.id ?? "";

//   const form = useForm<FormValues>({
//     defaultValues: {
//       code: "",
//       firstName: "",
//       lastName: "",
//       username: "",
//       password: "",
//       sessionId: defaultSessionId,
//       subjectId: defaultSubjectId,
//       questionRange: "",
//       notes: "",
//     },
//   });

//   const selectedSessionSubjects = useMemo(() => {
//     const currentSessionId = form.watch("sessionId") || defaultSessionId;
//     return sessions.find((s) => s.id === currentSessionId)?.subjects ?? [];
//   }, [form, sessions, defaultSessionId]);

//   const openCreateDialog = () => {
//     form.reset({
//       code: `G-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
//       firstName: "",
//       lastName: "",
//       username: "",
//       password: "",
//       sessionId: defaultSessionId,
//       subjectId: defaultSubjectId,
//       questionRange: "",
//       notes: "",
//     });
//     setEditingId(null);
//     setDialogOpen(true);
//   };

//   const openEditDialog = (id: string) => {
//     const grader = graders.find((g) => g.id === id);
//     if (!grader) return;
//     const subject = grader.subjects[0];
//     form.reset({
//       code: grader.code,
//       firstName: grader.firstName,
//       lastName: grader.lastName,
//       username: grader.username,
//       password: grader.password,
//       sessionId: subject?.sessionId ?? defaultSessionId,
//       subjectId: subject?.subjectId ?? defaultSubjectId,
//       questionRange: subject?.questionRange ?? "",
//       notes: grader.notes ?? "",
//     });
//     setEditingId(id);
//     setDialogOpen(true);
//   };

//   const filteredGraders = useMemo(() => {
//     if (!searchTerm.trim()) return graders;
//     const term = searchTerm.trim().toLowerCase();
//     return graders.filter((g) =>
//       [
//         g.code,
//         g.firstName,
//         g.lastName,
//         g.username,
//         g.subjects.map((s) => s.subjectName).join(" "),
//       ]
//         .join(" ")
//         .toLowerCase()
//         .includes(term)
//     );
//   }, [graders, searchTerm]);

//   const handleSubmit = form.handleSubmit((values) => {
//     if (!activeCampaign) {
//       toast({ title: "ยังไม่ได้เลือกสนามสอบ", description: "โปรดเลือกสนามสอบก่อนบันทึกผู้ตรวจ", variant: "destructive" });
//       return;
//     }

//     const session = sessions.find((s) => s.id === values.sessionId);
//     const subject = session?.subjects?.find((subj) => subj.id === values.subjectId);
//     if (!session || !subject) {
//       toast({ title: "ข้อมูลรอบสอบหรือวิชาไม่ครบ", variant: "destructive" });
//       return;
//     }

//     const payload = {
//       campaignId: activeCampaign.id,
//       code: values.code,
//       firstName: values.firstName,
//       lastName: values.lastName,
//       username: values.username,
//       password: values.password,
//       subjects: [
//         {
//           sessionId: session.id,
//           sessionLabel: session.label ?? "ไม่ระบุรอบสอบ",
//           subjectId: subject.id,
//           subjectName: subject.name,
//           questionRange: values.questionRange,
//         },
//       ],
//       notes: values.notes,
//     };

//     if (editingId) {
//       dispatch(graderUpdated({ id: editingId, ...payload }));
//       toast({ title: "บันทึกข้อมูลผู้ตรวจแล้ว" });
//     } else {
//       dispatch(graderAdded(payload));
//       toast({ title: "เพิ่มผู้ตรวจเรียบร้อย" });
//     }

//     setDialogOpen(false);
//   });

//   const handleRemove = (id: string) => {
//     if (!activeCampaign) return;
//     const grader = graders.find((g) => g.id === id);
//     const ok = window.confirm(`ต้องการลบผู้ตรวจ ${grader?.firstName ?? ""} หรือไม่?`);
//     if (!ok) return;
//     dispatch(graderRemoved({ campaignId: activeCampaign.id, graderId: id }));
//     toast({ title: "ลบข้อมูลผู้ตรวจแล้ว" });
//   };

//   // Bootstrap modal backdrop helper
//   const renderBackdrop = (open: boolean) => (open ? <div className="modal-backdrop show" /> : null);

//   return (
//     <ShowIfCan permission="manage_sessions">
//       <div className="container-fluid px-3 px-sm-4 py-4">
//         {/* Header */}
//         <div className="d-flex flex-column flex-sm-row align-items-sm-start justify-content-between gap-3 mb-3">
//           <div>
//             <h1 className="h4 mb-1">จัดการผู้ตรวจข้อสอบ</h1>
//             <div className="text-muted small">
//               เพิ่ม/แก้ไข/ลบผู้ตรวจ กำหนดวิชาและช่วงข้อที่รับผิดชอบ พร้อมตั้งค่าบัญชีเข้าสู่ระบบ
//             </div>
//             {activeCampaign && (
//               <div className="mt-1 small text-muted">
//                 สนามสอบปัจจุบัน: <span className="fw-semibold text-body">{activeCampaign.name}</span>
//               </div>
//             )}
//           </div>
//           <div className="d-flex flex-wrap align-items-center gap-2">
//             <div className="position-relative">
//               <Filter size={16} className="position-absolute" style={{ left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
//               <input
//                 className="form-control ps-5"
//                 placeholder="ค้นหา ชื่อ / รหัส / วิชา"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 style={{ minWidth: 240 }}
//               />
//             </div>
//             <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={openCreateDialog}>
//               <Plus size={16} /> เพิ่มผู้ตรวจ
//             </button>
//           </div>
//         </div>

//         {/* List Card */}
//         <div className="card shadow-sm">
//           <div className="card-header bg-white">
//             <h6 className="mb-0">รายชื่อผู้ตรวจ</h6>
//           </div>

//           <div className="card-body p-0">
//             <div style={{ maxHeight: "65vh", overflow: "auto" }}>
//               <table className="table align-middle mb-0">
//                 <thead className="table-light position-sticky top-0">
//                   <tr className="text-uppercase small text-muted">
//                     <th style={{ width: 140 }}>รหัส</th>
//                     <th>ชื่อ-นามสกุล</th>
//                     <th>บัญชีเข้าสู่ระบบ</th>
//                     <th>วิชาที่ตรวจได้</th>
//                     <th className="text-center" style={{ width: 110 }}>ช่วงข้อ</th>
//                     <th className="text-end" style={{ width: 120 }}>จัดการ</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredGraders.map((grader) => (
//                     <tr key={grader.id} className="align-middle">
//                       <td className="fw-semibold">{grader.code}</td>
//                       <td>
//                         <div className="fw-medium">{grader.firstName} {grader.lastName}</div>
//                         {grader.notes && <div className="small text-muted">{grader.notes}</div>}
//                       </td>
//                       <td>
//                         <div className="d-flex align-items-center gap-2 text-muted">
//                           <KeyRound size={16} />
//                           <div>
//                             <div className="fw-semibold text-body">{grader.username}</div>
//                             <div className="small text-muted">
//                               รหัสผ่าน: <span className="font-monospace">{grader.password}</span>
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                       <td>
//                         <div className="d-flex flex-wrap gap-2">
//                           {grader.subjects.map((s, idx) => (
//                             <span key={`${s.subjectId}-${idx}`} className="badge text-bg-light d-inline-flex align-items-center gap-1">
//                               <Layers size={14} />
//                               {s.subjectName} <span className="small text-muted">({s.sessionLabel})</span>
//                             </span>
//                           ))}
//                         </div>
//                       </td>
//                       <td className="text-center">
//                         {grader.subjects.map((s, idx) => (
//                           <div key={idx} className="small text-muted">{s.questionRange || "-"}</div>
//                         ))}
//                       </td>
//                       <td className="text-end">
//                         <div className="d-inline-flex gap-1">
//                           <button className="btn btn-outline-secondary btn-sm" onClick={() => openEditDialog(grader.id)}>
//                             <Pencil size={16} />
//                           </button>
//                           <button
//                             className="btn btn-link text-danger p-2"
//                             onClick={() => handleRemove(grader.id)}
//                             title="ลบ"
//                           >
//                             <Trash2 size={16} />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                   {filteredGraders.length === 0 && (
//                     <tr>
//                       <td colSpan={6} className="text-center text-muted py-4">
//                         ยังไม่มีข้อมูลผู้ตรวจ กรุณาเพิ่มผู้ตรวจใหม่
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>

//         {/* Modal Create/Edit */}
//         {renderBackdrop(dialogOpen)}
//         <div
//           className={`modal ${dialogOpen ? "show" : ""}`}
//           style={{ display: dialogOpen ? "block" : "none" }}
//           role="dialog"
//           aria-modal={dialogOpen}
//         >
//           <div className="modal-dialog modal-dialog-centered modal-lg">
//             <div className="modal-content">
//               <div className="modal-header">
//                 <h6 className="modal-title">{editingId ? "แก้ไขข้อมูลผู้ตรวจ" : "เพิ่มผู้ตรวจใหม่"}</h6>
//                 <button className="btn-close" onClick={() => setDialogOpen(false)} />
//               </div>

//               <form onSubmit={handleSubmit}>
//                 <div className="modal-body">
//                   <div className="row g-3">
//                     <div className="col-md-6">
//                       <label htmlFor="grader-code" className="form-label">รหัสผู้ตรวจ</label>
//                       <input id="grader-code" className="form-control" {...form.register("code", { required: true })} />
//                     </div>
//                     <div className="col-md-6">
//                       <label htmlFor="grader-username" className="form-label">ชื่อผู้ใช้</label>
//                       <input id="grader-username" className="form-control" {...form.register("username", { required: true })} />
//                     </div>

//                     <div className="col-md-6">
//                       <label htmlFor="grader-first" className="form-label">ชื่อ</label>
//                       <input id="grader-first" className="form-control" {...form.register("firstName", { required: true })} />
//                     </div>
//                     <div className="col-md-6">
//                       <label htmlFor="grader-last" className="form-label">นามสกุล</label>
//                       <input id="grader-last" className="form-control" {...form.register("lastName", { required: true })} />
//                     </div>

//                     <div className="col-md-6">
//                       <label htmlFor="grader-password" className="form-label">รหัสผ่านสำหรับเข้าสู่ระบบ</label>
//                       <input
//                         id="grader-password"
//                         type="text"
//                         className="form-control"
//                         {...form.register("password", { required: true, minLength: 6 })}
//                       />
//                     </div>

//                     <div className="col-md-6">
//                       <label htmlFor="grader-session" className="form-label">เลือกรอบสอบ</label>
//                       <select
//                         id="grader-session"
//                         className="form-select"
//                         value={form.watch("sessionId")}
//                         onChange={(e) => form.setValue("sessionId", e.target.value)}
//                       >
//                         {sessions.map((s) => (
//                           <option key={s.id} value={s.id}>
//                             {(s.label ?? "รอบสอบ") +
//                               " · " +
//                               (s.examDate ? new Date(s.examDate).toLocaleDateString("th-TH") : "-")}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div className="col-md-6">
//                       <label htmlFor="grader-subject" className="form-label">เลือกวิชา</label>
//                       <select
//                         id="grader-subject"
//                         className="form-select"
//                         value={form.watch("subjectId")}
//                         onChange={(e) => form.setValue("subjectId", e.target.value)}
//                       >
//                         {selectedSessionSubjects.length === 0 && <option value="">ไม่มีวิชาสำหรับรอบสอบนี้</option>}
//                         {selectedSessionSubjects.map((subj) => (
//                           <option key={subj.id} value={subj.id}>{subj.name}</option>
//                         ))}
//                       </select>
//                     </div>

//                     <div className="col-12">
//                       <label htmlFor="question-range" className="form-label">ช่วงข้อที่รับผิดชอบ (เช่น 1-10)</label>
//                       <input
//                         id="question-range"
//                         className="form-control"
//                         placeholder="ตัวอย่าง: 1-10 หรือ 5,7,9"
//                         {...form.register("questionRange", { required: true })}
//                       />
//                     </div>

//                     <div className="col-12">
//                       <label htmlFor="notes" className="form-label">หมายเหตุ</label>
//                       <input
//                         id="notes"
//                         className="form-control"
//                         placeholder="ข้อมูลเพิ่มเติม เช่น ความถนัด หรือข้อจำกัด"
//                         {...form.register("notes")}
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 <div className="modal-footer">
//                   <button type="button" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" onClick={() => setDialogOpen(false)}>
//                     <X size={16} /> ยกเลิก
//                   </button>
//                   <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2">
//                     <Check size={16} /> บันทึกข้อมูล
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//         {/* /Modal */}
//       </div>
//     </ShowIfCan>
//   );
// }


