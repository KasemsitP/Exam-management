// src/pages/reports/SubjectRankingExportPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { FileText, Download, Loader2, ArrowDownUp } from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";
import { useAppSelector } from "@/store/hook";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
// ลบ import selectActiveCampaignSessions ออก

type SortBy =
    | "TOTAL_DESC"
    | "TOTAL_ASC"
    | "EXAMCODE_ASC"
    | "EXAMCODE_DESC"
    | "NAME_ASC"
    | "NAME_DESC"
    | "ROOM_ASC"
    | "ROOM_DESC"
    | "SEAT_ASC"
    | "SEAT_DESC";

type ExportFormat = "PDF";

type SubjectOption = {
    id: number;
    code: string;
    name: string;
    full_score?: number;
};

// ถ้าอนาคตจะรับ props ก็สามารถ destructure ใน function ได้
type Props = {
    campaignId: number; 
    sessionId?: number; 
    userRole?: "ADMIN" | "MANAGER" | "STAFF" | "GRADER" | string;
};

function openBlobInNewTab(blob: Blob) {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function SubjectRankingExportPage() {

    const activeCampaign = useAppSelector(selectActiveCampaign);
    // ลบ const sessions = ... ออก

    const campaignId = activeCampaign?.id;
    
    // ปรับ sessionId เป็น undefined (หรือไม่กำหนดค่า) เพราะเราไม่ใช้ sessions แล้ว
    // แต่ถ้าต้องการรับจากข้างนอก สามารถเปลี่ยนเป็นรับ props ได้
    const sessionId: number | undefined = undefined; 

    const userRole = "ADMIN"; 

    // ===== UI state =====
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    const [subjectId, setSubjectId] = useState<number | "">("");
    const [sortBy, setSortBy] = useState<SortBy>("TOTAL_DESC");
    const [format] = useState<ExportFormat>("PDF");

    // ตัวเลือกเพิ่มเติม
    const [includeRankNo, setIncludeRankNo] = useState(true);
    const [includeRoomSeat, setIncludeRoomSeat] = useState(true);
    const [includeAvgExplain, setIncludeAvgExplain] = useState(true); 
    const [onlyCompleted, setOnlyCompleted] = useState(false); 

    const [exporting, setExporting] = useState(false);

    const isAdminOnlyBlocked = useMemo(() => {
        if (!userRole) return false;
        return String(userRole).toUpperCase() !== "ADMIN";
    }, [userRole]);

    // ===== load subjects =====
    useEffect(() => {
        if (!campaignId) return;

        const load = async () => {
            setLoadingSubjects(true);

            try {
                const res = await axios.get<SubjectOption[]>("/api/subjects");
                console.log("Loaded subjects:", res.data);
                const data = res.data;

                setSubjects(Array.isArray(data) ? data : []);

                // auto select วิชาแรก
                if (Array.isArray(data) && data.length > 0) {
                    setSubjectId(data[0].id);
                }
            } catch (error: any) {
                setSubjects([]);

                const message =
                    axios.isAxiosError(error)
                        ? error.response?.data?.message || "โหลดรายวิชาไม่สำเร็จ"
                        : "เกิดข้อผิดพลาด";

                Swal.fire({
                    icon: "error",
                    title: "โหลดรายวิชาไม่สำเร็จ",
                    text: message,
                });
            } finally {
                setLoadingSubjects(false);
            }
        };

        load();
    }, [campaignId, sessionId]);
    
    const selectedSubject = useMemo(() => {
        if (!subjectId) return null;
        return subjects.find((s) => s.id === subjectId) ?? null;
    }, [subjects, subjectId]);

    const sortLabel = (v: SortBy) => {
        switch (v) {
            case "TOTAL_DESC":
                return "คะแนนรวม: มาก → น้อย";
            case "TOTAL_ASC":
                return "คะแนนรวม: น้อย → มาก";
            case "EXAMCODE_ASC":
                return "รหัสสอบ: A → Z";
            case "EXAMCODE_DESC":
                return "รหัสสอบ: Z → A";
            case "NAME_ASC":
                return "ชื่อ-สกุล: ก → ฮ";
            case "NAME_DESC":
                return "ชื่อ-สกุล: ฮ → ก";
            case "ROOM_ASC":
                return "ห้องสอบ: น้อย → มาก (หรือ A→Z)";
            case "ROOM_DESC":
                return "ห้องสอบ: มาก → น้อย (หรือ Z→A)";
            case "SEAT_ASC":
                return "ที่นั่ง: น้อย → มาก";
            case "SEAT_DESC":
                return "ที่นั่ง: มาก → น้อย";
            default:
                return v;
        }
    };

    const handleExport = async () => {
        if (!campaignId) {
            Swal.fire({ icon: "error", title: "ไม่พบ campaignId" });
            return;
        }
        if (!subjectId) {
            Swal.fire({ icon: "warning", title: "กรุณาเลือกวิชา" });
            return;
        }
        if (isAdminOnlyBlocked) {
            Swal.fire({
                icon: "warning",
                title: "สิทธิ์ไม่เพียงพอ",
                text: "เฉพาะ ADMIN เท่านั้นที่สามารถออกเอกสารนี้ได้",
            });
            return;
        }

        setExporting(true);
        try {
            const qs = new URLSearchParams();
            if (sessionId != null) qs.set("sessionId", String(sessionId));
            qs.set("sortBy", sortBy);
            qs.set("format", format);

            qs.set("includeRankNo", includeRankNo ? "1" : "0");
            qs.set("includeRoomSeat", includeRoomSeat ? "1" : "0");
            qs.set("includeAvgExplain", includeAvgExplain ? "1" : "0");
            qs.set("onlyCompleted", onlyCompleted ? "1" : "0");

            const url = `/api/reports/campaigns/${campaignId}/subjects/${subjectId}/ranking/pdf?${qs.toString()}`;

            const res = await fetch(url, {
                method: "GET",
                headers: { Accept: "application/pdf" },
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || "Export PDF ไม่สำเร็จ");
            }

            const blob = await res.blob();
            openBlobInNewTab(blob);
        } catch (e: any) {
            Swal.fire({
                icon: "error",
                title: "ไม่สามารถออกเอกสารได้",
                text: e?.message || "Backend error. กรุณาลองใหม่อีกครั้ง",
            });
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="container-fluid px-3 px-sm-4 py-3">
            <div className="card shadow-sm border-0">
                <div className="card-header bg-white d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                    <div>
                        <h5 className="mb-1 d-flex align-items-center gap-2">
                            <FileText size={18} />
                            ออกเอกสาร “ใบรายชื่อเรียงลำดับคะแนน” รายวิชา
                        </h5>
                        <small className="text-muted">
                            เลือกวิชา + เลือกการจัดลำดับ แล้วดาวน์โหลดเป็น PDF
                        </small>
                    </div>

                    <button
                        type="button"
                        className="btn btn-primary btn-lg d-flex align-items-center gap-2"
                        onClick={handleExport}
                        disabled={
                            exporting ||
                            loadingSubjects ||
                            !campaignId ||
                            !subjectId ||
                            isAdminOnlyBlocked
                        }
                        title={
                            isAdminOnlyBlocked
                                ? "เฉพาะ ADMIN เท่านั้น"
                                : "ออกเอกสาร PDF"
                        }
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

                <div className="card-body">
                    {/* ===== controls ===== */}
                    <div className="row g-3">
                        <div className="col-12 col-lg-6">
                            <div className="border rounded-3 p-3">
                                <div className="small text-muted mb-1">รายวิชา</div>

                                <select
                                    className="form-select"
                                    value={subjectId}
                                    onChange={(e) =>
                                        setSubjectId(e.target.value ? Number(e.target.value) : "")
                                    }
                                    disabled={loadingSubjects}
                                >
                                    {loadingSubjects && <option value="">กำลังโหลด...</option>}
                                    {!loadingSubjects && subjects.length === 0 && (
                                        <option value="">ไม่พบรายวิชา</option>
                                    )}
                                    {subjects.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.code} - {s.name}
                                        </option>
                                    ))}
                                </select>

                                <div className="small text-muted mt-2">
                                    วิชาที่เลือก:{" "}
                                    <span className="fw-semibold">
                                        {selectedSubject ? selectedSubject.name : "-"}
                                    </span>
                                    {selectedSubject?.full_score != null && (
                                        <>
                                            {" "}
                                            | คะแนนเต็ม{" "}
                                            <span className="fw-semibold">
                                                {selectedSubject.full_score}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-lg-6">
                            <div className="border rounded-3 p-3">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="small text-muted">จัดลำดับ (Sort)</div>
                                    <div className="text-muted small d-flex align-items-center gap-1">
                                        <ArrowDownUp size={14} />
                                        <span>เลือกได้ตามต้องการ</span>
                                    </div>
                                </div>

                                <select
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
                                    <option value="ROOM_ASC">{sortLabel("ROOM_ASC")}</option>
                                    <option value="ROOM_DESC">{sortLabel("ROOM_DESC")}</option>
                                    <option value="SEAT_ASC">{sortLabel("SEAT_ASC")}</option>
                                    <option value="SEAT_DESC">{sortLabel("SEAT_DESC")}</option>
                                </select>

                                <div className="small text-muted mt-2">
                                    หมายเหตุ: คะแนนรวม “รายวิชา” ควรเป็นค่าเฉลี่ยผู้ตรวจ 1 และ 2
                                    (เช่น (s1+s2)/2) ตามที่คุณกำหนดในฝั่ง backend
                                </div>
                            </div>
                        </div>

                        {/* ===== options ===== */}
                        <div className="col-12">
                            <div className="border rounded-3 p-3">
                                <div className="small text-muted mb-2">ตัวเลือกในเอกสาร</div>

                                <div className="row g-2">
                                    <div className="col-12 col-md-6 col-lg-3">
                                        <label className="form-check d-flex gap-2 align-items-start">
                                            <input
                                                className="form-check-input mt-1"
                                                type="checkbox"
                                                checked={includeRankNo}
                                                onChange={(e) => setIncludeRankNo(e.target.checked)}
                                            />
                                            <span>
                                                <div className="fw-semibold">แสดงลำดับที่</div>
                                                <div className="small text-muted">
                                                    เช่น 1, 2, 3 ...
                                                </div>
                                            </span>
                                        </label>
                                    </div>

                                    <div className="col-12 col-md-6 col-lg-3">
                                        <label className="form-check d-flex gap-2 align-items-start">
                                            <input
                                                className="form-check-input mt-1"
                                                type="checkbox"
                                                checked={includeRoomSeat}
                                                onChange={(e) => setIncludeRoomSeat(e.target.checked)}
                                            />
                                            <span>
                                                <div className="fw-semibold">แสดงห้อง/ที่นั่ง</div>
                                                <div className="small text-muted">
                                                    room_code, row_no, col_no
                                                </div>
                                            </span>
                                        </label>
                                    </div>

                                    <div className="col-12 col-md-6 col-lg-3">
                                        <label className="form-check d-flex gap-2 align-items-start">
                                            <input
                                                className="form-check-input mt-1"
                                                type="checkbox"
                                                checked={includeAvgExplain}
                                                onChange={(e) => setIncludeAvgExplain(e.target.checked)}
                                            />
                                            <span>
                                                <div className="fw-semibold">แสดงสูตรเฉลี่ย</div>
                                                <div className="small text-muted">
                                                    (ผู้ตรวจ1 + ผู้ตรวจ2) / 2
                                                </div>
                                            </span>
                                        </label>
                                    </div>

                                    <div className="col-12 col-md-6 col-lg-3">
                                        <label className="form-check d-flex gap-2 align-items-start">
                                            <input
                                                className="form-check-input mt-1"
                                                type="checkbox"
                                                checked={onlyCompleted}
                                                onChange={(e) => setOnlyCompleted(e.target.checked)}
                                            />
                                            <span>
                                                <div className="fw-semibold">เฉพาะคนที่ครบคะแนน</div>
                                                <div className="small text-muted">
                                                    แล้วแต่คุณนิยามใน backend
                                                </div>
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {isAdminOnlyBlocked && (
                                    <div className="alert alert-warning mt-3 mb-0">
                                        หน้านี้ตั้งให้ <b>ADMIN เท่านั้น</b> ที่กดออกเอกสารได้
                                        (ถ้าคุณไม่อยากล็อค เอา prop <code>userRole</code> ออกได้)
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ===== preview hint ===== */}
                    <div className="mt-3 small text-muted">
                        ทริค: ถ้าคุณอยากทำ “หน้าตั้งค่า sort แบบในรูป” เพิ่มเติม
                        คุณสามารถเพิ่ม radio/checkbox ได้ และส่งค่าไปใน query string ตัวเดิมได้เลย
                    </div>
                </div>
            </div>
        </div>
    );
}