import { useEffect, useMemo, useState } from "react";
import { DownloadCloud, PlayCircle, RotateCcw, Loader2, AlertTriangle, Search, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { selectCurrentSession } from "@/store/slices/sessions.slice";

// ⭐️ (1) seats.slice
import {
  seatAssignmentsCleared,
  selectSeatAllocationMeta,
  selectSeatAssignments,
  selectSeatViolations,
  seatAllocationStarted,
  seatAllocationFinished,
  fetchSeatAllocationThunk,
  saveSeatAllocationThunk,
} from "@/store/slices/seats.slice";

import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { selectActiveCampaign } from "@/store/slices/examData.slice";

// ⭐️ (2) usercampaign + roomseat selectors
import {
  fetchUserCampaignsThunk,
  selectUserCampaignsForCampaign,
} from "@/store/slices/usercampaign.slice";
import {
  fetchRoomSeatsThunk,
  selectRoomSeatsForSite,
  selectRoomSeatsMeta,
} from "@/store/slices/roomseat.slice";

// ⭐️ (3) allocator + detector
import { ExamSeatAllocator, type Student } from "../lib/allocationAlgorithm";
import { detectFamilyViolations, type Violation, type AllocationWithSeatCode } from "../lib/seatviloation";

// ----------------------------------------------
// Small helpers / components
// ----------------------------------------------
const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="card shadow-sm mb-3">
    <div className="card-body d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center justify-content-lg-between">
      <div>
        <h5 className="card-title mb-1">{title}</h5>
        {subtitle && <p className="card-text text-muted mb-0 small">{subtitle}</p>}
      </div>
    </div>
  </div>
);

const StatChip = ({ label, value, tone = "light" }: { label: string; value: string | number; tone?: "light" | "success" | "danger" | "warning" }) => (
  <span className={`badge text-bg-${tone} d-inline-flex align-items-center gap-1 px-2 py-1`}>{value} <span className="text-uppercase text-muted small" style={{ letterSpacing: ".5px" }}>{label}</span></span>
);

const Legend = () => (
  <div className="d-flex flex-wrap align-items-center gap-2 small">
    <div className="d-flex align-items-center gap-2">
      <span className="legend-swatch swatch-empty" /> ว่าง
    </div>
    <div className="d-flex align-items-center gap-2">
      <span className="legend-swatch swatch-occupied" /> มีผู้สอบ
    </div>
    <div className="d-flex align-items-center gap-2">
      <span className="legend-swatch swatch-violation" /> ฝ่าฝืน (ครอบครัวติดกัน)
    </div>
  </div>
);

// ----------------------------------------------
// Seating Grid
// ----------------------------------------------

type SeatingProps = {
  assignments: AllocationWithSeatCode[];
  violations: Violation[];
  roomSeats: any[];
  columns: number;
  filterText: string;
  showViolationsOnly: boolean;
};

function SeatingGrid({ assignments, violations, roomSeats, columns, filterText, showViolationsOnly }: SeatingProps) {
  const totalSeats = roomSeats.length;
  const rows = Math.ceil(totalSeats / columns);

  const violationSet = useMemo(() => {
    const set = new Set<string>();
    violations.forEach(v => set.add(`${v.row}-${v.col}`));
    return set;
  }, [violations]);

  // Build grid from physical layout (roomSeats)
  const grid: (any)[][] = useMemo(() => {
    const g: any[][] = Array.from({ length: rows }, () => Array(columns).fill(null));
    roomSeats.forEach(seat => {
      if (seat.row_no < rows && seat.col_no < columns) g[seat.row_no][seat.col_no] = seat;
    });
    return g;
  }, [rows, columns, roomSeats]);

  // Map for quick lookup by seat code
  const assignmentMap = useMemo(() => {
    const map = new Map<string, AllocationWithSeatCode>();
    assignments.forEach(a => map.set(a.seatCode, a));
    return map;
  }, [assignments]);

  const filtered = (seat: any, r: number, c: number) => {
    const seatCode: string = seat?.seat_code ?? "";
    const a = seat ? assignmentMap.get(seatCode) : undefined;
    const occupied = Boolean(a);
    const isViolation = violationSet.has(`${r}-${c}`);
    if (showViolationsOnly && !isViolation) return false;
    if (filterText) {
      const f = filterText.toLowerCase();
      const hit = seatCode.toLowerCase().includes(f) || (occupied && `${a!.studentId}`.includes(f)) || (occupied && `${a!.familyGroup}`.toLowerCase().includes(f));
      if (!hit) return false;
    }
    return true;
  };

  return (
    <div className="seating-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(88px, 1fr))` }}>
      {grid.map((row, r) => (
        row.map((seat, c) => {
          if (!seat) return <div key={`gap-${r}-${c}`} className="seat seat-gap" aria-hidden />; // physical gap
          if (!filtered(seat, r, c)) return null;

          const seatCode: string = seat.seat_code;
          const a = assignmentMap.get(seatCode);
          const occupied = Boolean(a);
          const isViolation = violationSet.has(`${r}-${c}`);

          let seatClass = "seat seat-empty";
          if (occupied) seatClass = "seat seat-occupied";
          if (isViolation) seatClass = "seat seat-violation";

          return (
            <div key={`${r}-${c}`} className={seatClass} title={isViolation ? `ผิดพลาด: ครอบครัวติดกันที่ (${r}, ${c})` : `Seat ${seatCode} (r${r} c${c})`}>
              <div className="seat-code">{seatCode}</div>
              <div className="seat-sub">{occupied ? `ID: ${a!.studentId}` : "ว่าง"}</div>
              {occupied && <div className="seat-meta">Fam: {a!.familyGroup}</div>}
            </div>
          );
        })
      ))}
    </div>
  );
}

// ----------------------------------------------
// Page
// ----------------------------------------------

export default function SeatAllocationPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const activeCampaign = useAppSelector(selectActiveCampaign);
  const currentSession = useAppSelector(selectCurrentSession);

  const userCampaigns = useAppSelector((state) => selectUserCampaignsForCampaign(activeCampaign?.id ?? null)(state));
  const roomSeats = useAppSelector((state) => selectRoomSeatsForSite(currentSession?.site_id ?? null)(state));
  const { columns, totalSeats } = useAppSelector(selectRoomSeatsMeta(currentSession?.site_id ?? null));

  const assignments = useAppSelector(selectSeatAssignments);
  const violations = useAppSelector(selectSeatViolations);
  const meta = useAppSelector(selectSeatAllocationMeta);

  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 10_000));
  const [filterText, setFilterText] = useState("");
  const [showViolationsOnly, setShowViolationsOnly] = useState(false);

  // Fetch
  useEffect(() => {
    if (activeCampaign) {
      dispatch(fetchUserCampaignsThunk(activeCampaign.id));
      dispatch(fetchSeatAllocationThunk(activeCampaign.id));
    }
    if (currentSession?.site_id) {
      dispatch(fetchRoomSeatsThunk(currentSession.site_id));
    }
  }, [activeCampaign, currentSession?.site_id, dispatch]);

  const seatsAssigned = useMemo(() => assignments.filter((a) => a.studentId != null).length, [assignments]);

  // Allocate (inline)
  const handleAllocateInline = () => {
    if (!activeCampaign || !currentSession) {
      toast({ title: "กรุณาเลือก Campaign และ Session", variant: "destructive" });
      return;
    }

    try {
      dispatch(seatAllocationStarted({ seed }));

      const students: Student[] = userCampaigns.map((u: any) => ({ id: u.user_id, familyGroup: u.family_group_id ?? `FG-${u.user_id}` }));

      if (students.length === 0) throw new Error("ไม่พบข้อมูลผู้สอบสำหรับ Campaign นี้");
      if (roomSeats.length === 0) throw new Error("ไม่พบข้อมูลแผนผังที่นั่งของ Site นี้");
      if (students.length > totalSeats) throw new Error(`ผู้สอบ (${students.length}) มากกว่าที่นั่ง (${totalSeats})`);

      const allocator = new ExamSeatAllocator(seed, [17, 43, 100]);
      const allocs = allocator.allocateSeats(students, totalSeats, columns);
      const vios = detectFamilyViolations(allocs, totalSeats, columns);

      // map row/col -> seat_code
      const seatMap = new Map<string, string>();
      roomSeats.forEach((seat) => seatMap.set(`${seat.row_no}-${seat.col_no}`, seat.seat_code));

      const finalAssignments: AllocationWithSeatCode[] = allocs.map((a) => ({
        ...a,
        seatCode: seatMap.get(`${a.row}-${a.col}`) ?? "UNKNOWN",
        roomCode: roomSeats[0]?.room_code ?? "A101", // TODO: handle multi-room grouping if needed
      }));

      dispatch(seatAllocationFinished({ assignments: finalAssignments, violations: vios }));
      toast({ title: "จัดที่นั่ง (Inline) สำเร็จ", description: `จัดแล้ว ${allocs.length} ที่นั่ง | พบ ${vios.length} ข้อผิดพลาด` });
    } catch (e: any) {
      toast({ title: "เกิดข้อผิดพลาด (Inline)", description: e?.message ?? "ไม่สามารถจัดที่นั่งได้", variant: "destructive" });
      dispatch(seatAllocationFinished({ assignments: [], violations: [] }));
    }
  };

  const handleReset = () => {
    dispatch(seatAssignmentsCleared());
    toast({ title: "ล้างการจัดที่นั่งแล้ว" });
  };

  const handleSaveToDB = () => {
    if (!activeCampaign) return;
    if (violations.length > 0) {
      if (!window.confirm(`พบ ${violations.length} ข้อผิดพลาด. ยืนยันการบันทึก?`)) return;
    }
    dispatch(saveSeatAllocationThunk({ campaignId: activeCampaign.id, assignments }))
      .unwrap()
      .then(() => toast({ title: "บันทึกการจัดที่นั่งสำเร็จ" }))
      .catch((err) => toast({ title: "บันทึกล้มเหลว", description: err.message, variant: "destructive" }));
  };

  // Derived UI states
  const hasData = roomSeats.length > 0 && userCampaigns.length > 0;
  const showEmpty = !hasData && !meta.allocating;

  return (
    <div className="container py-4">
      <style>{`
        .toolbar-sticky { position: sticky; top: 0; z-index: 1020; backdrop-filter: blur(6px); }
        .legend-swatch { width: 16px; height: 12px; border-radius: 3px; display: inline-block; border: 1px solid rgba(0,0,0,.1); }
        .swatch-empty { background: var(--bs-tertiary-bg,#f8f9fa); }
        .swatch-occupied { background: rgba(25,135,84,.15); border-color: rgba(25,135,84,.35); }
        .swatch-violation { background: rgba(220,53,69,.15); border-color: rgba(220,53,69,.35); }
        .seating-grid { display: grid; gap: .5rem; margin-top: .75rem; }
        .seat { border: 1px solid var(--bs-border-color, #dee2e6); border-radius: .5rem; padding: .4rem .5rem; min-height: 64px; position: relative; background: var(--bs-body-bg,#fff); }
        .seat-empty { background: var(--bs-tertiary-bg,#f8f9fa); }
        .seat-occupied { background: rgba(25,135,84,.1); border-color: rgba(25,135,84,.35); }
        .seat-violation { background: rgba(220,53,69,.1); border-color: rgba(220,53,69,.45); box-shadow: inset 0 0 0 2px rgba(220,53,69,.2); }
        .seat-code { font-weight: 600; font-size: .95rem; }
        .seat-sub { font-size: .8rem; color: var(--bs-secondary-color,#6c757d); }
        .seat-meta { position: absolute; right: .35rem; bottom: .25rem; font-size: .7rem; color: var(--bs-secondary-color,#6c757d); }
        .empty-state { border: 1px dashed var(--bs-border-color,#dee2e6); border-radius: .75rem; padding: 1.25rem; text-align: center; }
      `}</style>

      {/* Header */}
      <SectionHeader
        title="การจัดที่นั่งสอบ "
        subtitle={`Campaign: ${activeCampaign?.name ?? "N/A"}`}
      />

      {/* Toolbar */}
      <div className="card toolbar-sticky shadow-sm mb-3">
        <div className="card-body d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center justify-content-lg-between">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <StatChip label="seed" value={meta.lastSeed ?? "—"} />
            <StatChip label="จัดแล้ว" value={`${seatsAssigned}/${totalSeats}`} tone="success" />
            <StatChip label="ผิดพลาด" value={violations.length} tone={violations.length ? "danger" : "light"} />
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="input-group" style={{ maxWidth: 320 }}>
              <span className="input-group-text bg-white"><Search size={16} /></span>
              <input
                type="text"
                className="form-control"
                placeholder="ค้นหา seat / ID / family"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
            <div className="form-check form-switch">
              <input className="form-check-input" type="checkbox" id="violationsOnly" checked={showViolationsOnly} onChange={(e) => setShowViolationsOnly(e.target.checked)} />
              <label className="form-check-label small" htmlFor="violationsOnly">แสดงเฉพาะที่ผิดพลาด</label>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <label htmlFor="seed" className="form-label mb-0 small text-muted">ค่า seed</label>
              <input id="seed" type="number" className="form-control" style={{ width: "8rem" }} value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
              <button type="button" className="btn btn-outline-secondary d-inline-flex align-items-center justify-content-center" onClick={() => setSeed(Math.floor(Math.random() * 9999))} aria-label="สุ่มค่า seed">
                <RotateCcw size={16} />
              </button>
            </div>

            <ShowIfCan permission="allocate_seats">
              <button type="button" onClick={handleAllocateInline} className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={meta.allocating || userCampaigns.length === 0 || roomSeats.length === 0}>
                {meta.allocating ? <Loader2 size={16} className="spin-animation" /> : <PlayCircle size={16} />}
                {meta.allocating ? "กำลังจัดที่นั่ง..." : `เริ่มจัดที่นั่ง (${userCampaigns.length} คน)`}
              </button>
            </ShowIfCan>

            <button type="button" className="btn btn-outline-secondary" onClick={handleReset}>รีเซ็ต</button>
            <button type="button" className="btn btn-success d-inline-flex align-items-center gap-2" onClick={handleSaveToDB} disabled={meta.allocating || assignments.length === 0}>
              <DownloadCloud size={16} />{meta.allocating ? "กำลังบันทึก..." : "บันทึกลงฐานข้อมูล"}
            </button>
          </div>
        </div>

        <div className="card-footer bg-white d-flex flex-wrap align-items-center gap-3">
          <Legend />
          <span className="text-muted small d-flex align-items-center gap-1"><Info size={14}/> เคล็ดลับ: พิมพ์ "FG-" เพื่อค้นหากลุ่มครอบครัว</span>
        </div>
      </div>

      {/* Content */}
      {showEmpty && (
        <div className="empty-state">
          <div className="d-flex flex-column align-items-center gap-2">
            <AlertTriangle className="text-warning" />
            <div className="fw-semibold">ยังไม่มีข้อมูลให้แสดง</div>
            <div className="text-muted small">ดึงผู้สอบของแคมเปญและแผนผังที่นั่งของไซต์ก่อน</div>
          </div>
        </div>
      )}

      {hasData && (
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <div className="fw-semibold">แผนผังที่นั่ง</div>
            <div className="text-muted small">Site: {currentSession?.site_id ?? "—"} · Columns: {columns} · Total seats: {totalSeats}</div>
          </div>
          <div className="card-body">
            <SeatingGrid
              assignments={assignments}
              violations={violations}
              roomSeats={roomSeats}
              columns={columns}
              filterText={filterText}
              showViolationsOnly={showViolationsOnly}
            />
          </div>
        </div>
      )}
    </div>
  );
}
