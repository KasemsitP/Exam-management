// src/pages/reports/SubjectRankingExportPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Download,
  Loader2,
  Settings,
  Layers,
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  ArrowDownUp,
  CheckCircle2, // เพิ่มไอคอนติ๊กถูกแสดงสถานะ
} from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";
import { useAppSelector } from "@/store/hook";
import { selectActiveCampaign, selectActiveCampaignSessions } from "@/store/slices/examData.slice";
import { selectSession } from "@/store/slices/dashboard.slice";

/** =========================
 * Types
 * ========================= */
type SortBy =
  | "TOTAL_DESC"
  | "TOTAL_ASC"
  | "EXAMCODE_ASC"
  | "EXAMCODE_DESC"
  | "NAME_ASC"
  | "NAME_DESC";

type ExportFormat = "PDF";

export type RawRow = {
  session_id: number;
  subject_id: number;
  subject_name: string;
  question_no: number;
  label: string;
};

type GroupedSubject = {
  subjectId: number;
  subjectName: string;
  sessionIds: number[];
  questions: { questionNo: number; label: string }[];
};

type SessionBlock = {
  sessionId: number;
  subjects: GroupedSubject[];
};

type QKey = string;
type GroupItem = { sessionId: number; subjectId: number; questionNo: number };

type GroupRule = {
  id: string;
  title: string;
  items: GroupItem[];
};

/** =========================
 * Helpers
 * ========================= */
function makeId() {
  const g: any = globalThis as any;
  if (g?.crypto?.randomUUID) return g.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function qKey(sessionId: number, subjectId: number, questionNo: number): QKey {
  return `${sessionId}:${subjectId}:${questionNo}`;
}

function parseQKey(key: QKey): GroupItem {
  const [sess, sid, qno] = key.split(":");
  return { sessionId: Number(sess), subjectId: Number(sid), questionNo: Number(qno) };
}

function openBlobInNewTab(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function sortLabel(v: SortBy) {
  switch (v) {
    case "TOTAL_DESC": return "คะแนนรวม: มาก → น้อย";
    case "TOTAL_ASC": return "คะแนนรวม: น้อย → มาก";
    case "EXAMCODE_ASC": return "รหัสสอบ: A → Z";
    case "EXAMCODE_DESC": return "รหัสสอบ: Z → A";
    case "NAME_ASC": return "ชื่อ-สกุล: ก → ฮ";
    case "NAME_DESC": return "ชื่อ-สกุล: ฮ → ก";
    default: return v;
  }
}

// ข้อมูลของทั้ง 4 ปุ่ม (แก้ข้อความและสีได้ที่นี่เลย)
const buttonData = [
  {
    id: 1,
    title: "ดาวน์โหลดใบคะแนนรายถุงทั้งหมด",
    desc: "คลิกเพื่อสร้างรายงานสรุปผลการสอบ",
    theme: "primary", // สีฟ้า
    icon: "📄"
  },
  {
    id: 2,
    title: "ดาวน์โหลดใบรายชื่อผู้ตรวจในแต่ละถุง",
    desc: "แสดงกราฟและผลการวิเคราะห์",
    theme: "info", // สีฟ้าอ่อน
    icon: "📊"
  },
  {
    id: 3,
    title: "ดาวโหลดรายชื่อผู้มีสิทธิ์สอบ",
    desc: "",
    theme: "success", // สีเขียว
    icon: "👥"
  },
  {
    id: 4,
    title: "ดาวน์โหลดผังที่นั่งสอบ",
    desc: "แสดงกราฟและผลการวิเคราะห์",
    theme: "info", // สีฟ้าอ่อน
    icon: "📊"
  },
];

/** =========================
 * Component
 * ========================= */
export default function SubjectRankingExportPage() {
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const campaignId = activeCampaign?.id;

  const sessions = useAppSelector(selectActiveCampaignSessions)
  const selectedSessionId = sessions[0]?.id

  // data
  const [rows, setRows] = useState<RawRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);

  // selection (ตอนนี้จะเก็บทุกวิชาเสมอ)
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);

  const [sortBy, setSortBy] = useState<SortBy>("TOTAL_DESC");
  const [format] = useState<ExportFormat>("PDF");

  // export options
  const [includeRankNo, setIncludeRankNo] = useState(true);
  const [includeRoomSeat, setIncludeRoomSeat] = useState(true);
  const [includeAvgExplain, setIncludeAvgExplain] = useState(true);
  const [onlyCompleted, setOnlyCompleted] = useState(false);

  // limit
  const [passCount, setPassCount] = useState<string>("50");

  // grouping UI
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [pickedKeys, setPickedKeys] = useState<QKey[]>([]);
  const [groups, setGroups] = useState<GroupRule[]>([]);
  const [exporting, setExporting] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);



  /** =========================
   * Load rows & Auto Select All
   * ========================= */
  useEffect(() => {
    if (!campaignId) return;

    const load = async () => {
      setLoadingRows(true);
      try {
        const res = await axios.get<RawRow[]>(
          `/api/subjects/questioncamp/${campaignId}`
        );
        const data = Array.isArray(res.data) ? res.data : [];
        setRows(data);

        // ✅ Change: Auto Select All Subjects
        if (data.length > 0) {
          // หา unique subject_id ทั้งหมด
          const allSubjectIds = Array.from(new Set(data.map(r => Number(r.subject_id))));
          setSelectedSubjectIds(allSubjectIds);
        } else {
          setSelectedSubjectIds([]);
        }

      } catch (err: any) {
        setRows([]);
        setSelectedSubjectIds([]);
        Swal.fire({
          icon: "error",
          title: "โหลดรายวิชาไม่สำเร็จ",
          text: err?.response?.data?.message || "Backend error",
        });
      } finally {
        setLoadingRows(false);
      }
    };

    load();
  }, [campaignId]);

  /** =========================
   * Build groupedSubjects (List of Subjects)
   * ========================= */
  const groupedSubjects = useMemo<GroupedSubject[]>(() => {
    const map = new Map<number, GroupedSubject>();

    for (const r of rows) {
      const subjectId = Number(r.subject_id);
      const questionNo = Number(r.question_no);
      const sessionId = Number(r.session_id);

      if (!map.has(subjectId)) {
        map.set(subjectId, {
          subjectId,
          subjectName: r.subject_name,
          sessionIds: [sessionId],
          questions: [],
        });
      } else {
        const g = map.get(subjectId)!;
        if (!g.sessionIds.includes(sessionId)) g.sessionIds.push(sessionId);
      }

      const g = map.get(subjectId)!;
      if (!g.questions.some((q) => q.questionNo === questionNo)) {
        g.questions.push({ questionNo, label: r.label });
      }
    }

    const arr = Array.from(map.values()).map((g) => ({
      ...g,
      sessionIds: [...g.sessionIds].sort((a, b) => a - b),
      questions: [...g.questions].sort((a, b) => a.questionNo - b.questionNo),
    }));

    arr.sort((a, b) => a.subjectName.localeCompare(b.subjectName, "th"));
    return arr;
  }, [rows]);

  /** =========================
   * แยกเป็น block ตาม session (สำหรับ Modal)
   * ========================= */
  const sessionBlocks = useMemo<SessionBlock[]>(() => {
    // ใช้ rows ทั้งหมดเลย เพราะเราถือว่า select all
    const sessMap = new Map<number, Map<number, GroupedSubject>>();

    for (const r of rows) {
      const sessionId = Number(r.session_id);
      const subjectId = Number(r.subject_id);
      const questionNo = Number(r.question_no);

      if (!sessMap.has(sessionId)) sessMap.set(sessionId, new Map());
      const subjMap = sessMap.get(sessionId)!;

      if (!subjMap.has(subjectId)) {
        subjMap.set(subjectId, {
          subjectId,
          subjectName: r.subject_name,
          sessionIds: [sessionId],
          questions: [],
        });
      }

      const g = subjMap.get(subjectId)!;
      if (!g.questions.some((q) => q.questionNo === questionNo)) {
        g.questions.push({ questionNo, label: r.label });
      }
    }

    const blocks: SessionBlock[] = Array.from(sessMap.entries())
      .map(([sessionId, subjMap]) => ({
        sessionId,
        subjects: Array.from(subjMap.values()).map((s) => ({
          ...s,
          questions: [...s.questions].sort((a, b) => a.questionNo - b.questionNo),
        })),
      }))
      .sort((a, b) => a.sessionId - b.sessionId);

    return blocks;
  }, [rows]);

  // Keys used in groups
  const usedKeys = useMemo<QKey[]>(() => {
    const list: QKey[] = [];
    for (const g of groups) {
      for (const it of g.items) list.push(qKey(it.sessionId, it.subjectId, it.questionNo));
    }
    return list;
  }, [groups]);

  const usedSet = useMemo(() => new Set(usedKeys), [usedKeys]);

  /** =========================
   * UI actions (Modal)
   * ========================= */
  const togglePick = (key: QKey) => {
    setPickedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const createGroupFromPicked = () => {
    if (pickedKeys.length === 0) return;


    const items = pickedKeys.map(parseQKey);

    // ห้ามข้าม session
    const sessionSet = new Set(items.map((x) => x.sessionId));
    if (sessionSet.size > 1) {
      Swal.fire({
        icon: "warning",
        title: "จัดกลุ่มข้าม session ไม่ได้",
        text: "กรุณาเลือกข้อภายใน session เดียวกันต่อ 1 กลุ่ม",
      });
      return;
    }

    items.sort((a, b) => {
      if (a.sessionId !== b.sessionId) return a.sessionId - b.sessionId;
      if (a.subjectId !== b.subjectId) return a.subjectId - b.subjectId;
      return a.questionNo - b.questionNo;
    });

    const title = `กลุ่ม ${groups.length + 1}`;

    Swal.fire({
      icon: "success",
      title: "สร้างกลุ่มหัวข้อสำเร็จ",
      text: `เพิ่มกลุ่ม "${title}" ที่มี ${items.length} ข้อแล้ว`,
      showConfirmButton: false,
      timer: 1500,
    });

    setGroups((prev) => [...prev, { id: makeId(), title, items }]);
    setPickedKeys([]);
  };

  const removeGroup = (id: string) => setGroups((prev) => prev.filter((g) => g.id !== id));

  const updateGroupTitle = (id: string, title: string) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, title } : g)));
  };

  const moveGroup = (id: string, dir: "up" | "down") => {
    setGroups((prev) => {
      const idx = prev.findIndex((g) => g.id === id);
      if (idx < 0) return prev;
      const nextIdx = dir === "up" ? idx - 1 : idx + 1;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const copy = [...prev];
      const [it] = copy.splice(idx, 1);
      copy.splice(nextIdx, 0, it);
      return copy;
    });
  };

  const removeItemFromGroup = (groupId: string, itemKey: QKey) => {
    const it = parseQKey(itemKey);
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          items: g.items.filter(
            (x) =>
              !(x.sessionId === it.sessionId && x.subjectId === it.subjectId && x.questionNo === it.questionNo)
          ),
        };
      })
    );
  };
  console.log(sessions)

  /** =========================
   * Export
   * ========================= */
  const handleDownloadPdf = async () => {
    if (!activeCampaign?.id || !selectedSessionId) return;

    const numericSessionId = parseInt(
      String(selectedSessionId).replace("sess-", ""),
      10
    );
    if (Number.isNaN(numericSessionId)) return;

    setIsExportingPdf(true);

    try {
      Swal.fire({
        title: "กำลังสร้างไฟล์ PDF...",
        text: "กรุณารอสักครู่",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      const course = ""
      const org = ""
      const sessionText = ""
      const res = await axios.get(
        `/api/signsheet/campaign/${activeCampaign.id}/session/${numericSessionId}/pdf`,
        {
          params: { course, org, sessionText },
          responseType: "blob",
        }
      );
      Swal.close();

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      setTimeout(() => URL.revokeObjectURL(url), 10000);

    } catch (error) {
      Swal.close();
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Export PDF ล้มเหลว",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadSeatPlan = async () => {
    if (!activeCampaign?.id || !selectedSessionId) return;

    const numericSessionId = parseInt(
      String(selectedSessionId).replace("sess-", ""),
      10
    );
    if (Number.isNaN(numericSessionId)) return;

    try {
      // ✅ เปิด loading modal
      Swal.fire({
        title: "กำลังสร้างผังที่นั่งสอบ...",
        text: "กรุณารอสักครู่",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.get(
        `/api/seatplan/campaign/${activeCampaign.id}/session/${numericSessionId}/pdf`,
        { responseType: "blob" }
      );

      // ✅ ปิด loading
      Swal.close();

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      // (optional) แจ้งสำเร็จสั้น ๆ
      // Swal.fire({
      //   icon: "success",
      //   title: "ดาวน์โหลดสำเร็จ",
      //   timer: 1200,
      //   showConfirmButton: false,
      // });

    } catch (err) {
      Swal.close(); // ปิด loading ก่อน

      console.error(err);
      Swal.fire({
        icon: "error",
        title: "ดาวน์โหลดผังที่นั่งสอบไม่สำเร็จ",
      });
    }
  };


  const handleDownloadSeatPlanNameList = async () => {
    if (!activeCampaign?.id) return;

    try {
      //  เปิด loading ก่อน
      Swal.fire({
        title: "กำลังสร้างไฟล์ PDF...",
        text: "กรุณารอสักครู่",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.get(
        `/api/seatplan/campaign/${activeCampaign.id}/name-list-pdf`,
        { responseType: "blob" }
      );

      // ✅ ปิด loading
      Swal.close();

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

    } catch (err) {
      Swal.close(); // ปิด loading ก่อน

      console.error(err);
      Swal.fire({
        icon: "error",
        title: "ดาวน์โหลดรายชื่อผู้มีสิทธิ์สอบไม่สำเร็จ",
      });
    }
  };

  const handleExport = async () => {
    if (!campaignId) {
      Swal.fire({ icon: "error", title: "ไม่พบ campaignId" });
      return;
    }
    if (selectedSubjectIds.length === 0) {
      Swal.fire({ icon: "warning", title: "ไม่พบข้อมูลรายวิชาในระบบ" });
      return;
    }
    const passCountNumber = Number(passCount);
    if (!Number.isFinite(passCountNumber) || passCountNumber <= 0) {
      Swal.fire({ icon: "warning", title: "กรุณากรอกจำนวนคนที่ผ่านให้ถูกต้อง" });
      return;
    }

    setExporting(true);
    try {
      const url = `/api/campaigns/${campaignId}/ranking/pdf`;
      const body = {
        sortBy,
        format,
        includeRankNo,
        includeRoomSeat,
        includeAvgExplain,
        onlyCompleted,
        subjectIds: selectedSubjectIds, // ส่งทั้งหมด
        limit: passCount,
        groups: groups.map((g) => ({ title: g.title, items: g.items })),
      };

      const res = await axios.post(url, body, {
        responseType: "blob",
        headers: { Accept: "application/pdf" },
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      openBlobInNewTab(blob);
    } catch (err: any) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message || "Export PDF ไม่สำเร็จ"
        : "Export PDF ไม่สำเร็จ";
      Swal.fire({ icon: "error", title: "ไม่สามารถออกเอกสารได้", text: message });
    } finally {
      setExporting(false);
    }
  };

  const handlePDFAllBags = async () => {
    if (!activeCampaign.id) {
      Swal.fire({
        icon: "error",
        title: "ยังไม่มีรอบสอบ",
        text: "กรุณาเช็ครอบสอบ"
      })
      return;
    }
    try {
      const res = await axios.get(`/api/reports/campaigns/${activeCampaign.id}/scoreall/pdf`,
        {
          responseType: "blob",
        }
      )
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถ export ใบคะแนนได้",
        text:
          error?.response?.data?.message ||
          "Backend error. กรุณาลองใหม่อีกครั้ง",
      });
    }

  }

  const handleDownloadGradersBags = async () => {
    if (!activeCampaign?.id) return;

    try {
      //  เปิด loading ก่อน
      Swal.fire({
        title: "กำลังสร้างไฟล์ PDF...",
        text: "กรุณารอสักครู่",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.get(
        `/api/reports/campaigns/${activeCampaign.id}/bags/graders/pdf`,
        { responseType: "blob" }
      );

      // 
      Swal.close();

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

    } catch (err) {
      Swal.close(); // ปิด loading ก่อน

      console.error(err);
      Swal.fire({
        icon: "error",
        title: "ดาวน์โหลดรายชื่อผู้ตรวจในแต่ละถุงไม่สำเร็จ",
      });
    }
  };



  const handleSubmit = () => {
    const numberValue = Number(passCount);

    if (!passCount || numberValue < 1) {
      alert("กรุณากรอกจำนวนผู้สอบผ่านอย่างน้อย 1 คน");
      return;
    }

    //  console.log("จำนวนผู้สอบผ่าน:", numberValue);
  };
  const handleButtonClick = (id) => {
    switch (id) {
      case 1:
        handlePDFAllBags();
        break;

      case 2:
        handleDownloadSeatPlanNameList();
        break;

      case 3:
        handleDownloadSeatPlan();
        break;

      case 4:
        handleDownloadGradersBags();
        break;

      default:
        break;
    }
  };


  return (
    <div className="container-fluid px-2 px-sm-3 px-md-4 py-2 py-sm-3">
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-header bg-white d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-2 gap-md-3">
          <div>
            <h5 className="mb-1 d-flex align-items-center gap-2 text-nowrap">
              สร้างบัญชีรายชื่อผู้สอบผ่าน
            </h5>
            <small className="text-muted d-block">
              คำนวณคะแนนรวมจากทุกรายวิชาที่มีในแคมเปญนี้
            </small>
          </div>

          <div className="d-flex gap-2 flex-shrink-0 align-self-start align-self-lg-center">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 text-nowrap"
              onClick={() => setShowGroupModal(true)}
              disabled={selectedSubjectIds.length === 0}
            >
              <Layers size={14} />
              <span className="d-none d-sm-inline">จัดกลุ่มวิชาสอบ</span>
              <span className="d-sm-none">กลุ่ม</span>
            </button>

            {/* <button
              type="button"
              className="btn btn-primary btn-lg d-flex align-items-center gap-2"
              onClick={handleExport}
              disabled={exporting || loadingRows || !campaignId || selectedSubjectIds.length === 0}
            >
              {exporting ? (
                <>
                  <Loader2 size={18} className="spin-animation" />
                  กำลังออกเอกสาร...
                </>
              ) : (
                <>
                  <Download size={18} />
                  ดาวน์โหลด PDF
                </>
              )}
            </button> */}
          </div>
        </div>

        <div className="card-body">
          <div className="row g-3">
            {/* Left: Subjects List (Read Only) */}
            <div className="col-12 col-lg-6">
              <div className="border rounded-3 p-2 p-sm-3 h-100 bg-light-subtle">
                <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                  <div className="small text-muted d-flex align-items-center gap-1">
                    {/* <Settings size={14} /> */}
                    <span className="text-nowrap">รายวิชาที่สามารถเลือกได้</span>
                  </div>
                  <span className="badge bg-success border border-success-subtle flex-shrink-0">
                    {selectedSubjectIds.length} วิชา
                  </span>
                </div>

                <div
                  className="mt-2 border rounded-3 p-2 bg-white"
                  style={{ maxHeight: "220px", overflowY: "auto" }}
                >
                  {loadingRows ? (
                    <div className="text-center text-muted small py-2 py-sm-3">กำลังโหลด...</div>
                  ) : groupedSubjects.length === 0 ? (
                    <div className="text-center text-muted small py-2 py-sm-3">ไม่พบข้อมูลรายวิชา</div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {groupedSubjects.map((s) => (
                        <div
                          key={s.subjectId}
                          className="d-flex align-items-center gap-1 px-2 py-2 rounded border border-light-subtle"
                        >
                          {/* เปลี่ยนจาก checkbox เป็น icon ติ๊กถูกสีเขียว */}
                          {/* <CheckCircle2 size={18} className="text-success flex-shrink-0" /> */}

                          <div className="flex-grow-1 overflow-hidden">
                            <div className="fw-semibold text-truncate small"><span>{s.subjectName}</span></div>
                            <div className="small text-muted d-flex gap-1 text-nowrap">
                              <span>{s.questions.length} ข้อ</span>
                              <span>•</span>
                              <span className="text-truncate">Session: {s.sessionIds.join(", ")}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Options & Tie-break */}
            <div className="col-12 col-lg-6">
              <div className="border rounded-3 p-2 p-sm-3 h-100">
                <div className="small text-muted d-flex align-items-center gap-2 text-nowrap">
                  <span>กรอกจำนวนผู้สอบผ่าน</span>
                </div>

                <div>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={passCount}
                    min={1}
                    onChange={(e) => setPassCount(e.target.value)}
                    placeholder="เช่น 50 คน"
                  />

                  {/* <button
                    type="button"
                    className="btn btn-primary mt-2"
                    onClick={handleSubmit}
                    disabled={!passCount || Number(passCount) < 1}
                  >
                    บันทึก
                  </button> */}

                </div>


                {/* <select
                                    className="form-select mt-2"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                                >
                                    <option value="TOTAL_DESC">{sortLabel("TOTAL_DESC")}</option>
                                    <option value="TOTAL_ASC">{sortLabel("TOTAL_ASC")}</option>
                                    <option value="EXAMCODE_ASC">{sortLabel("EXAMCODE_ASC")}</option>
                                    <option value="EXAMCODE_DESC">{sortLabel("EXAMCODE_DESC")}</option>
                                    <option value="NAME_ASC">{sortLabel("NAME_ASC")}</option>
                                    <option value="NAME_DESC">{sortLabel("NAME_DESC")}</option>
                                </select>

                                <hr className="my-3" />

                                <div className="small text-muted mb-2">จำนวน "ผู้สอบผ่าน" (Top N)</div>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={passCount}
                                    min={1}
                                    onChange={(e) => setPassCount(Number(e.target.value))}
                                    placeholder="เช่น 50"
                                />
                                <div className="small text-muted mt-1">
                                    ระบบจะตัดยอด {passCount} คนแรก หลังจากเรียงลำดับคะแนนแล้ว
                                </div>

                                <hr className="my-3" />

                                <div className="small text-muted mb-2">ตัวเลือกการแสดงผล</div>
                                <div className="row g-2">
                                    <div className="col-6">
                                        <label className="form-check d-flex gap-2 align-items-center">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={includeRankNo}
                                                onChange={(e) => setIncludeRankNo(e.target.checked)}
                                            />
                                            <span className="small">แสดงลำดับที่</span>
                                        </label>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-check d-flex gap-2 align-items-center">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={includeRoomSeat}
                                                onChange={(e) => setIncludeRoomSeat(e.target.checked)}
                                            />
                                            <span className="small">แสดงห้อง/ที่นั่ง</span>
                                        </label>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-check d-flex gap-2 align-items-center">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={includeAvgExplain}
                                                onChange={(e) => setIncludeAvgExplain(e.target.checked)}
                                            />
                                            <span className="small">แสดงสูตรคำนวณ</span>
                                        </label>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-check d-flex gap-2 align-items-center">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={onlyCompleted}
                                                onChange={(e) => setOnlyCompleted(e.target.checked)}
                                            />
                                            <span className="small">เฉพาะคนตรวจครบ</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-4 d-flex flex-wrap align-items-center gap-2">

                                    {groups.length > 0 && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger ms-auto d-flex align-items-center gap-2"
                                            onClick={() => {
                                                setGroups([]);
                                                setPickedKeys([]);
                                            }}
                                        >
                                            <Trash2 size={16} />
                                            ล้างกลุ่ม
                                        </button>
                                    )}
                                </div>

                                {groups.length > 0 ? (
                                    <div className="alert alert-info py-2 px-3 small mt-3 mb-0">
                                        <div className="fw-bold mb-1">ลำดับการตัดสิน (Tie-breaker):</div>
                                        <ol className="mb-0 ps-3">
                                            <li>คะแนนรวม (Total Score)</li>
                                            {groups.map((g) => (
                                                <li key={g.id}>
                                                    คะแนน {g.title} ({g.items.length} ข้อ)
                                                </li>
                                            ))}
                                            <li>รหัสประจำตัวสอบ</li>
                                        </ol>
                                    </div>
                                ) : (
                                    <div className="small text-muted mt-2 fst-italic">
                                        * หากไม่มีกลุ่ม Tie-break ระบบจะใช้ "รหัสประจำตัว" ตัดสินกรณีคะแนนรวมเท่ากัน
                                    </div>
                                )} */}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-header bg-white d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-2 gap-md-3">
          <div>
            <h5 className="mb-1 d-flex align-items-center gap-2 text-nowrap">
              สร้างเอกสารอื่น
            </h5>
            <small className="text-muted d-block">
              เลือกเอกสารที่ต้องการสร้างจากปุ่มด้านล่างนี้
            </small>
          </div>

          <div className="d-flex gap-2">

            {/* <button
              type="button"
              className="btn btn-primary btn-lg d-flex align-items-center gap-2"
              onClick={handleExport}
              disabled={exporting || loadingRows || !campaignId || selectedSubjectIds.length === 0}
            >
              {exporting ? (
                <>
                  <Loader2 size={18} className="spin-animation" />
                  กำลังออกเอกสาร...
                </>
              ) : (
                <>
                  <Download size={18} />
                  ดาวน์โหลด PDF
                </>
              )}
            </button> */}
          </div>
        </div>

        <div className="card-body">
          <div className="row g-3">
            {buttonData.map((btn) => (
              // จัดเลย์เอาต์เป็น 2x2 บนหน้าจอขนาดกลางขึ้นไป
              <div key={btn.id} className="col-12 col-sm-6 col-md-6">
                <div
                  key={btn.id}
                  role="button"
                  onClick={() => handleButtonClick(btn.id)}
                  onMouseEnter={() => setHoveredId(btn.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="h-100 p-3 p-sm-4 d-flex flex-column justify-content-center align-items-center rounded-3 border bg-white"
                  style={{
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    transform: hoveredId === btn.id ? "translateY(-5px)" : "translateY(0)",
                    boxShadow: hoveredId === btn.id
                      ? "0 10px 20px rgba(0,0,0,0.1)"
                      : "0 2px 5px rgba(0,0,0,0.05)",
                    borderColor: hoveredId === btn.id
                      ? `var(--bs-${btn.theme})`
                      : "#dee2e6"
                  }}
                >
                  {/* ไอคอน */}
                  <div
                    className={`mb-2 mb-sm-3 d-flex justify-content-center align-items-center rounded-circle bg-${btn.theme} bg-opacity-10 text-${btn.theme}`}
                    style={{ width: "50px", height: "50px", fontSize: "1.25rem" }}
                  >
                    {btn.icon}
                  </div>

                  {/* ข้อความ */}
                  <div className={`fw-bold fs-6 fs-sm-5 mb-1 text-center text-${btn.theme === 'warning' ? 'dark' : btn.theme}`}>
                    {btn.title}
                  </div>
                  <div className="small text-muted text-center">
                    {btn.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================
       * Group Modal (คงเดิม Logic เดิม)
       * ========================= */}
      {showGroupModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-xl modal-dialog-centered"> {/* เอา modal-dialog-scrollable ออก แล้วจัดการ scroll เอง */}
            <div className="modal-content" style={{ maxHeight: '90vh' }}> {/* กำหนด Max Height ของ Modal */}

              {/* --- Header --- */}
              <div className="modal-header">
                <div>
                  <h5 className="modal-title mb-0">จัดกลุ่มคะแนนหัวข้อสอบ</h5>
                  <div className="small text-muted">
                    สร้างกลุ่มเพื่อใช้เป็นเงื่อนไขในการตัดสินกรณีคะแนนรวมเท่ากัน
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowGroupModal(false)} />
              </div>

              {/* --- Body (Fixed Height Container) --- */}
              <div className="modal-body p-0">
                <div className="row g-0" style={{ height: '70vh' }}> {/* ✅ Fix ความสูงตรงนี้ (ปรับเลขได้ตามต้องการ) */}

                  {/* ================= Left: Pick Questions (Scrollable) ================= */}
                  <div className="col-lg-7 border-end bg-light d-flex flex-column h-100">

                    {/* Left Header (Fixed) */}
                    <div className="p-3 bg-white border-bottom d-flex justify-content-between align-items-center flex-shrink-0">
                      <div className="fw-semibold d-flex align-items-center gap-2">
                        <CheckSquare size={16} />
                        เลือกข้อ ({pickedKeys.length})
                      </div>
                      <button
                        className="btn btn-primary btn-sm d-flex align-items-center gap-2"
                        disabled={pickedKeys.length === 0}
                        onClick={createGroupFromPicked}
                      >
                        <Plus size={16} />
                        สร้างกลุ่ม
                      </button>
                    </div>

                    {/* Left List (Scrollable Area) */}
                    <div className="p-3 flex-grow-1 overflow-auto"> {/* ✅ Scrollbar จะขึ้นตรงนี้ */}
                      {sessionBlocks.map((block) => (
                        <div key={block.sessionId} className="mb-4">
                          {/* แสดง Session Header */}
                          {/* <div className="fw-semibold mb-2 text-dark border-bottom pb-1 sticky-top bg-light" style={{top: -16, zIndex: 5}}>
                      Session {block.sessionId}
                    </div> */}

                          {block.subjects.map((subj) => {
                            const available = subj.questions
                              .map((q) => ({
                                sessionId: block.sessionId,
                                subjectId: subj.subjectId,
                                subjectName: subj.subjectName,
                                questionNo: q.questionNo,
                                label: q.label,
                                key: qKey(block.sessionId, subj.subjectId, q.questionNo),
                              }))
                              .filter((x) => !usedSet.has(x.key));

                            if (available.length === 0) return null;

                            return (
                              <div key={`${block.sessionId}-${subj.subjectId}`} className="mb-3 ps-2">
                                <div className="fw-semibold text-primary mb-2 small">
                                  {subj.subjectName}
                                </div>
                                <div className="row g-2">
                                  {available.map((q) => {
                                    const checked = pickedKeys.includes(q.key);
                                    return (
                                      <div key={q.key} className="col-12 col-md-6 col-xl-4">
                                        <label
                                          className={`border rounded bg-white p-2 d-flex gap-2 align-items-start cursor-pointer h-100 ${checked ? "border-primary shadow-sm" : ""
                                            }`}
                                        >
                                          <input
                                            type="checkbox"
                                            className="form-check-input mt-1"
                                            checked={checked}
                                            onChange={() => togglePick(q.key)}
                                          />
                                          <div className="overflow-hidden">
                                            <div className="fw-semibold small">ข้อ {q.questionNo}</div>
                                            <div className="text-muted text-truncate" style={{ fontSize: "0.75rem" }} title={q.label || "-"}>
                                              {q.label || "-"}
                                            </div>
                                          </div>
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ================= Right: Groups List (Scrollable) ================= */}
                  <div className="col-lg-5 bg-white d-flex flex-column h-100">

                    {/* Right Header (Fixed) */}
                    <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center flex-shrink-0">
                      <div className="fw-semibold d-flex align-items-center gap-2">
                        <Layers size={16} />
                        กลุ่มที่สร้างแล้ว ({groups.length})
                      </div>
                      <button
                        className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2"
                        onClick={() => { setGroups([]); setPickedKeys([]); }}
                        disabled={groups.length === 0}
                      >
                        <Trash2 size={14} />
                        ล้างทั้งหมด
                      </button>
                    </div>

                    {/* Right List (Scrollable Area) */}
                    <div className="p-3 flex-grow-1 overflow-auto"> {/* ✅ Scrollbar จะขึ้นตรงนี้ */}
                      {groups.length === 0 ? (
                        <div className="text-center text-muted py-5 h-100 d-flex flex-column justify-content-center">
                          <div>ยังไม่มีกลุ่ม</div>
                          <div className="small">เลือกข้อฝั่งซ้าย แล้วกด “สร้างกลุ่ม”</div>
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-3">
                          <small>
                            หากคะแนนรวมเท่ากัน ระบบจะดูคะแนนจากหัวข้อเหล่านี้เป็นอันดับแรกในการตัดสิน
                          </small>
                          {groups.map((g, idx) => (
                            <div key={g.id} className="card shadow-sm border-0 bg-light-subtle">
                              <div className="card-body p-2">
                                <div className="d-flex align-items-start gap-2">
                                  <span className="badge bg-dark rounded-pill mt-1 flex-shrink-0">{idx + 1}</span>
                                  <div className="flex-grow-1" style={{ minWidth: 0 }}> {/* minWidth fix flex overflow */}
                                    <input
                                      className="form-control form-control-sm fw-bold mb-2"
                                      value={g.title}
                                      onChange={(e) => updateGroupTitle(g.id, e.target.value)}
                                    />

                                    <div className="d-flex flex-wrap gap-1">
                                      {g.items.map((it) => {
                                        const key = qKey(it.sessionId, it.subjectId, it.questionNo);

                                        // Logic หาชื่อมาแสดง
                                        const rowData = rows.find(
                                          (r) =>
                                            Number(r.session_id) === it.sessionId &&
                                            Number(r.subject_id) === it.subjectId &&
                                            Number(r.question_no) === it.questionNo
                                        );
                                        const subjName = rowData?.subject_name || `วิชา ${it.subjectId}`;
                                        const qLabel = rowData?.label ? rowData.label : `ข้อ ${it.questionNo}`;
                                        const shortSubj = subjName.length > 15 ? subjName.substring(0, 15) + ".." : subjName;
                                        // const displayText = `${shortSubj}: ${qLabel}`;
                                        const displayText = `${qLabel}`;
                                        const fullTooltip = `${subjName} - ข้อ ${it.questionNo} (${rowData?.label || '-'})`;

                                        return (
                                          <span
                                            key={key}
                                            className="badge bg-white text-dark border d-inline-flex align-items-center gap-1"
                                            title={fullTooltip}
                                            style={{ maxWidth: "100%", whiteSpace: "normal", textAlign: "left" }}
                                          >
                                            <span className="text-truncate" style={{ fontSize: "0.8rem", maxWidth: "180px", display: "inline-block" }}>
                                              {displayText}
                                            </span>
                                            <button
                                              type="button"
                                              className="btn btn-sm p-0 ms-1 text-danger"
                                              onClick={() =>
                                                removeItemFromGroup(g.id, key)
                                              }
                                            >
                                              <X size={14} />
                                            </button>
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Buttons */}
                                  {/* <div className="d-flex flex-column gap-1 flex-shrink-0">
                                    <button
                                      className="btn btn-light border btn-sm"
                                      onClick={() => moveGroup(g.id, "up")}
                                      disabled={idx === 0}
                                    >
                                      <ArrowUp size={12} />
                                    </button>
                                    <button
                                      className="btn btn-light border btn-sm"
                                      onClick={() => moveGroup(g.id, "down")}
                                      disabled={idx === groups.length - 1}
                                    >
                                      <ArrowDown size={12} />
                                    </button>
                                    <button
                                      className="btn btn-light border text-danger btn-sm"
                                      onClick={() => removeGroup(g.id)}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div> */}

                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* --- Footer --- */}
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-primary btn-lg d-flex align-items-center gap-2"
                  onClick={handleExport}
                  disabled={exporting || loadingRows || !campaignId || selectedSubjectIds.length === 0}
                >
                  {exporting ? (
                    <>
                      <Loader2 size={18} className="spin-animation" />
                      กำลังออกเอกสาร...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      ดาวน์โหลด PDF
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
          <style>{`.cursor-pointer { cursor: pointer; }`}</style>
        </div>
      )}
      <style>{`
        .spin-animation { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
      `}</style>
    </div>
  );
}