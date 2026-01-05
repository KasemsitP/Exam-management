// src/pages/SeatAllocationPage.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import {
  selectExamRoomsSlice,
  fetchRoomsByCampaignThunk,
} from "@/store/slices/examRooms.slice";
import axios from "axios";
import Swal from "sweetalert2";

type SeatCell = {
  seatNo: number;
  user_code: string;
  fullName: string;
  lastNameKey?: string;
};

type RoomLike = {
  roomCode: string;
  capacity: number;
};

type SeatApiResponse = {
  campaignId: string;
  roomCode: string;
  seatsPerRow: number;
  seats: Array<{
    rowIndex: number;
    colIndex: number;
    user_id: number;
    user_code: string;
    full_name: string;
    last_name: string;
  }>;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function SeatAllocationPage() {
  const dispatch = useAppDispatch();
  const campaign = useAppSelector(selectActiveCampaign);
  const roomsState = useAppSelector(selectExamRoomsSlice);

  // cache layout แต่ละห้อง: key = roomCode
  const [roomSeats, setRoomSeats] = useState<Record<string, SeatCell[]>>({});

  const rooms: RoomLike[] = (roomsState?.rooms ?? []) as any;

  const roomsTotal = useMemo(() => {
    if (!rooms.length) return 0;
    return rooms.map((r) => r.capacity).reduce((a, b) => a + b, 0);
  }, [rooms]);

  // preview (global setting เผื่อใช้ทีหลัง)
  const [seatsPerColumn, setSeatsPerColumn] = useState(30);
  const [inputSeatsPerColumn, setInputSeatsPerColumn] =
    useState<number>(seatsPerColumn);

  // pagination ห้อง
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((rooms?.length || 0) / itemsPerPage)),
    [rooms?.length]
  );

  const currentRooms = useMemo(() => {
    const indexOfLastRoom = currentPage * itemsPerPage;
    const indexOfFirstRoom = indexOfLastRoom - itemsPerPage;
    return rooms.slice(indexOfFirstRoom, indexOfLastRoom);
  }, [rooms, currentPage]);

  // ===== Modal state =====
  const [selectedRoom, setSelectedRoom] = useState<RoomLike | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [modalColsPerPage, setModalColsPerPage] = useState(6);
  const [modalPage, setModalPage] = useState(1);
  const [modalSeatsPerRow, setModalSeatsPerRow] = useState(30);

  const handleSetSeatsPerColumn = () => {
    const value = Number(inputSeatsPerColumn);
    if (Number.isFinite(value) && value > 0) {
      setSeatsPerColumn(value);
    } else {
      alert("จำนวนที่นั่งต่อคอลัมน์ต้องมากกว่า 0");
    }
  };

  useEffect(() => {
    if (campaign?.id) {
      dispatch(fetchRoomsByCampaignThunk(Number(campaign.id)));
    }
  }, [campaign?.id, dispatch]);

  useEffect(() => {
    setModalPage(1);
  }, [modalSearch, selectedRoom]);

  // ใช้ layout ตามห้อง (ทั้ง summary + modal)
  const getRoomSeatCells = (room: RoomLike | null): SeatCell[] => {
    if (!room) return [];
    const fromApi = roomSeats[room.roomCode];
    return fromApi && fromApi.length > 0 ? fromApi : [];
  };

  const buildColumns = (cells: SeatCell[], perCol: number): SeatCell[][] => {
    if (!cells || cells.length === 0 || perCol <= 0) return [];
    const totalColumns = Math.ceil(cells.length / perCol);
    const columns: SeatCell[][] = Array.from(
      { length: totalColumns },
      () => []
    );
    for (let i = 0; i < cells.length; i++) {
      const colIdx = Math.floor(i / perCol);
      columns[colIdx].push(cells[i]);
    }
    return columns;
  };

  const modalCellStyle: CSSProperties = {
    width: 140,
    height: 64,
    padding: "8px 8px",
    lineHeight: 1.1,
    fontSize: 12,
    userSelect: "none",
  };

  // cells ที่ใช้ใน modal = layout ของ selectedRoom + filter
  const modalCells = useMemo(() => {
    if (!selectedRoom) return [];

    const all = getRoomSeatCells(selectedRoom);
    const k = modalSearch.trim().toLowerCase();
    if (!k) return all;

    return all.filter(
      (x) =>
        String(x.user_code).toLowerCase().includes(k) ||
        x.fullName.toLowerCase().includes(k)
    );
  }, [selectedRoom, modalSearch, roomSeats]);

  const modalColumns = useMemo(
    () => buildColumns(modalCells, modalSeatsPerRow),
    [modalCells, modalSeatsPerRow]
  );

  const totalModalPages = useMemo(
    () => Math.max(1, Math.ceil(modalColumns.length / modalColsPerPage)),
    [modalColumns.length, modalColsPerPage]
  );

  const modalColumnsPage = useMemo(() => {
    const start = (modalPage - 1) * modalColsPerPage;
    const end = start + modalColsPerPage;
    return modalColumns.slice(start, end);
  }, [modalColumns, modalPage, modalColsPerPage]);

  const mapApiSeatsToCells = (data: SeatApiResponse): SeatCell[] => {
    return data.seats.map((s) => ({
      seatNo: s.rowIndex * data.seatsPerRow + s.colIndex + 1,
      user_code: s.user_code,
      fullName: s.full_name,
      lastNameKey: s.last_name,
    }));
  };

  // ===== เปิด modal + โหลด layout เฉพาะห้องที่กด =====
  const handleOpenRoom = async (room: RoomLike) => {
    if (!campaign?.id) return;

    // เปิด modal + reset เฉพาะของ modal
    setSelectedRoom(room);
    setModalSearch("");
    setModalPage(1);
    setModalSeatsPerRow(30);

    try {
      const committedRes = await axios.get<SeatApiResponse>(
        `/api/seat/campaign/${campaign.id}/room/${encodeURIComponent(
          room.roomCode
        )}`,
        { params: { _t: Date.now() } }
      );

      const committed = committedRes.data;
      console.log(committed)

      if (committed.seats && committed.seats.length > 0) {
        console.log("gy")
        const seatCells = mapApiSeatsToCells(committed);

        setRoomSeats((prev) => ({
          ...prev,
          [room.roomCode]: seatCells,
        }));

        if (committed.seatsPerRow && committed.seatsPerRow > 0) {
          setModalSeatsPerRow(committed.seatsPerRow);
        }

        return; // ไม่ต้องไป preview
      }

      // 2) ถ้ายังไม่มีใน DB → preview
      const initialSeatsPerRow = 30;
      const previewRes = await axios.get<SeatApiResponse>(
        `/api/seat/campaign/${campaign.id}/room/${encodeURIComponent(
          room.roomCode
        )}/preview`,
        {
          params: {
            seatsPerRow: initialSeatsPerRow,
            _t: Date.now(),
          },
        }
      );
      

      const data = previewRes.data;
      console.log(data)
      const seatCells = mapApiSeatsToCells(data);

      setRoomSeats((prev) => ({
        ...prev,
        [room.roomCode]: seatCells,
      }));

      setModalSeatsPerRow(data.seatsPerRow || initialSeatsPerRow);
    } catch (err) {
      console.error("fetch seat layout error", err);

      Swal.fire({
        icon: "error",
        title: "ไม่สามารถเปิดได้",
        text: "ไม่สามารถเชื่อมต่อ API ได้",
        confirmButtonText: "ตกลง",
      }).then(() => {
        setSelectedRoom(null);
      });
    }
  };

  // ===== จัดใหม่ (Preview) สำหรับห้องที่เปิดอยู่ =====
  const handleApplySeatsPerRow = async () => {
    if (!campaign?.id || !selectedRoom) return;

    try {
      const seatsPerRow = modalSeatsPerRow || 30;

      const res = await axios.get<SeatApiResponse>(
        `/api/seat/campaign/${campaign.id}/room/${encodeURIComponent(
          selectedRoom.roomCode
        )}/preview`,
        {
          params: {
            seatsPerRow,
            _t: Date.now(),
          },
        }
      );

      const data = res.data;
      const seatCells = mapApiSeatsToCells(data);

      setModalSeatsPerRow(data.seatsPerRow || seatsPerRow);

      setRoomSeats((prev) => ({
        ...prev,
        [selectedRoom.roomCode]: seatCells,
      }));

      Swal.fire({
        icon: "success",
        title: "จัดที่นั่งใหม่ (Preview) แล้ว",
        showConfirmButton: false,
        timer: 1200,
      });
    } catch (err) {
      console.error("re-allocate seat error", err);
      Swal.fire({
        icon: "error",
        title: "จัดที่นั่งไม่สำเร็จ",
        text: "กรุณาลองใหม่อีกครั้ง",
      });
    }
  };

  // ===== ยืนยันจัดสรร (commit) =====
  const handleConfirmSeatAllocation = async () => {
    if (!campaign?.id || !selectedRoom) return;

    try {
      await axios.post(
        `/api/seat/campaign/${campaign.id}/room/${encodeURIComponent(
          selectedRoom.roomCode
        )}/confirm`,
        {
          seatsPerRow: modalSeatsPerRow,
        }
      );

      const committedRes = await axios.get<SeatApiResponse>(
        `/api/seat/campaign/${campaign.id}/room/${encodeURIComponent(
          selectedRoom.roomCode
        )}`,
        { params: { _t: Date.now() } }
      );

      const committed = committedRes.data;

      if (committed.seats && committed.seats.length > 0) {
        const seatCells = mapApiSeatsToCells(committed);

        setRoomSeats((prev) => ({
          ...prev,
          [selectedRoom.roomCode]: seatCells,
        }));

        setModalSeatsPerRow(
          committed.seatsPerRow || modalSeatsPerRow || 30
        );
      }

      Swal.fire({
        icon: "success",
        title: "ยืนยันการจัดสรรเรียบร้อยแล้ว",
        showConfirmButton: false,
        timer: 1500,
      });

      setSelectedRoom(null);

      // reload summary (allocatedCount ฯลฯ)
      dispatch(fetchRoomsByCampaignThunk(Number(campaign.id)));
    } catch (err) {
      console.error("confirm seat allocation error", err);
      Swal.fire({
        icon: "error",
        title: "ยืนยันไม่สำเร็จ",
        text: "กรุณาลองใหม่อีกครั้ง",
      });
    }
  };

  const handleCloseModal = () => {
    setSelectedRoom(null);
    setModalSearch("");
    setModalPage(1);
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-column gap-4">
        {/* ===== Header ===== */}
        <div className="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-2">
          <div>
            <h4 className="mb-1">จัดการที่นั่งสอบ</h4>
            <div className="text-muted">
              แสดงรายการห้องสอบและสถานะการจัดที่นั่ง (กด “เปิดดู” เพื่อดูผังเต็ม)
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="badge text-bg-light border">
              Campaign: {campaign?.code ?? campaign?.id ?? "-"}
            </span>
            <span className="badge text-bg-light border">
              Rooms: {rooms.length}
            </span>
            <span className="badge text-bg-light border">
              Total capacity: {roomsTotal}
            </span>
          </div>
        </div>

        {/* ===== Summary cards ===== */}
        <div className="row g-3">
          <div className="col-md-6 col-xl-3">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="text-uppercase small text-muted mb-1">
                  จำนวนห้องสอบในรอบนี้
                </div>
                <div className="display-6 mb-0">{rooms.length}</div>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-xl-3">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="text-uppercase small text-muted mb-1">
                  ความจุรวม (คน)
                </div>
                <div className="display-6 mb-0">{roomsTotal}</div>
              </div>
            </div>
          </div>

          <div className="col-xl-6">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                  <div>
                    <div className="text-uppercase small text-muted mb-1">
                      ตั้งค่าการแสดงผล (ใช้ตอนทำ preview ต่อคอลัมน์ในอนาคต)
                    </div>
                    <div className="fw-semibold">
                      จำนวนที่นั่งต่อคอลัมน์ (แนวตั้ง)
                      <span className="badge text-bg-primary ms-2">
                        {seatsPerColumn}
                      </span>
                    </div>
                  </div>

                  <div style={{ minWidth: 340 }}>
                    <div className="input-group">
                      <span className="input-group-text">ที่นั่ง/คอลัมน์</span>
                      <input
                        type="number"
                        className="form-control"
                        min={1}
                        value={inputSeatsPerColumn}
                        onChange={(e) =>
                          setInputSeatsPerColumn(Number(e.target.value))
                        }
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleSetSeatsPerColumn}
                      >
                        ใช้ค่า
                      </button>
                    </div>
                    <div className="small text-muted mt-1">แนะนำ: 20–40</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Rooms grid ===== */}
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
              <div>
                <div className="fw-semibold">รายการห้องสอบ</div>
                <div className="text-muted small">
                  ดูสถานะการจัดสรรแบบรวม แล้วกด “เปิดดู” เพื่อเรียก API ผังที่นั่งของห้องนั้น ๆ
                </div>
              </div>
              <div className="text-muted small">
                หน้า {currentPage} / {totalPages}
              </div>
            </div>
          </div>

          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "20%" }}>ห้องสอบ</th>
                    <th style={{ width: "10%" }}>ความจุ (ที่นั่ง)</th>
                    <th style={{ width: "20%" }}>สถานะการจัดสรร</th>
                    <th style={{ width: "20%" }}>จัดแล้ว / ความจุ</th>
                    <th className="text-end" style={{ width: "15%" }}>
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentRooms.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        ไม่มีห้องสอบในหน้านี้
                      </td>
                    </tr>
                  )}

                  {currentRooms.map((room) => {
                    const cells = getRoomSeatCells(room);
                    const anyRoom = room as any;
                    const allocatedCount = Number(
                      anyRoom.allocatedCount ?? cells.length ?? 0
                    );

                    let statusBadge: React.ReactNode;
                    if (allocatedCount <= 0) {
                      statusBadge = (
                        <span className="badge text-bg-danger">
                          ยังไม่จัดสรร
                        </span>
                      );
                    } else if (allocatedCount < room.capacity) {
                      statusBadge = (
                        <span className="badge text-bg-warning">
                          จัดสรรบางส่วน
                        </span>
                      );
                    } else {
                      statusBadge = (
                        <span className="badge text-bg-success">
                          จัดสรรครบ
                        </span>
                      );
                    }

                    return (
                      <tr key={room.roomCode}>
                        <td>
                          <strong>{room.roomCode}</strong>
                        </td>
                        <td>{room.capacity}</td>
                        <td>{statusBadge}</td>
                        <td>
                          {allocatedCount} / {room.capacity} คน
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleOpenRoom(room)}
                          >
                            เปิดดู
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <nav className="mt-3">
              <ul className="pagination justify-content-center mb-0">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() =>
                      setCurrentPage((p) => clamp(p - 1, 1, totalPages))
                    }
                  >
                    Previous
                  </button>
                </li>

                {Array.from({ length: totalPages }).map((_, idx) => (
                  <li
                    key={idx}
                    className={`page-item ${
                      currentPage === idx + 1 ? "active" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(idx + 1)}
                    >
                      {idx + 1}
                    </button>
                  </li>
                ))}

                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() =>
                      setCurrentPage((p) => clamp(p + 1, 1, totalPages))
                    }
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* ===== Modal: ผังที่นั่ง ===== */}
        {selectedRoom && (
          <div
            className="modal d-block"
            tabIndex={-1}
            role="dialog"
            style={{ background: "rgba(0,0,0,.35)" }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) handleCloseModal();
            }}
          >
            <div
              className="modal-dialog modal-xl modal-dialog-scrollable"
              role="document"
            >
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title mb-1">
                      ห้อง {selectedRoom.roomCode}
                    </h5>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={handleCloseModal}
                  />
                </div>

                <div className="modal-body">
                  <div className="row g-3 align-items-end mb-3">
                    <div className="col-md-5">
                      <label className="form-label">
                        ค้นหา (userId / ชื่อ)
                      </label>
                      <input
                        className="form-control"
                        placeholder="นายทดสอบ"
                        value={modalSearch}
                        onChange={(e) => setModalSearch(e.target.value)}
                      />
                    </div>

                    <div className="col-12 col-md-5 d-flex flex-column flex-md-row align-items-end gap-2">
                      <div className="flex-grow-1">
                        <label className="form-label">ที่นั่งต่อแถว</label>
                        <input
                          type="number"
                          className="form-control"
                          min={5}
                          max={60}
                          value={modalSeatsPerRow}
                          onChange={(e) =>
                            setModalSeatsPerRow(
                              clamp(Number(e.target.value), 5, 60)
                            )
                          }
                        />
                      </div>

                      <div className="mt-2 mt-md-0">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={handleApplySeatsPerRow}
                        >
                          จัดที่นั่งใหม่
                        </button>
                      </div>
                    </div>

                    <div className="col-md-4 d-flex gap-2 justify-content-md-end">
                      <span className="badge text-bg-light border align-self-center">
                        capacity: {selectedRoom.capacity}
                      </span>
                      <span className="badge text-bg-light border align-self-center">
                        show: {modalCells.length}
                      </span>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => setModalSearch("")}
                      >
                        ล้างค้นหา
                      </button>
                    </div>
                  </div>

                  <div className="border rounded-3 p-2 bg-light">
                    <div
                      className="overflow-auto"
                      style={{ maxWidth: "100%", maxHeight: 600 }}
                    >
                      <div className="d-inline-flex gap-2 pe-2">
                        {modalColumnsPage.map((col, colIdx) => (
                          <div
                            key={colIdx}
                            className="d-flex flex-column gap-2 flex-shrink-0"
                          >
                            <div className="small text-muted text-center">
                              แถวที่{" "}
                              {(modalPage - 1) * modalColsPerPage +
                                colIdx +
                                1}
                            </div>

                            {col.map((cell) => (
                              <div
                                key={`${selectedRoom.roomCode}-${cell.seatNo}-${cell.user_code}`}
                                className="border rounded-3 bg-white d-flex flex-column justify-content-between"
                                style={modalCellStyle}
                                title={`${cell.user_code} - ${cell.fullName}`}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="badge text-bg-light border">
                                    ลำดับที่ {cell.seatNo}
                                  </span>
                                  <span className="fw-semibold">
                                    {cell.user_code}
                                  </span>
                                </div>

                                <div className="text-truncate">
                                  {cell.fullName}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mt-3">
                    <div className="d-flex gap-2 align-items-center">
                      <span className="text-muted small">Cols/หน้า</span>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: 120 }}
                        value={modalColsPerPage}
                        onChange={(e) => {
                          setModalColsPerPage(Number(e.target.value));
                          setModalPage(1);
                        }}
                      >
                        {[3, 4, 6, 8, 10, 12].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>

                      <span className="text-muted small">
                        หน้า {modalPage}/{totalModalPages} (ทั้งหมด{" "}
                        {modalColumns.length} คอลัมน์)
                      </span>
                    </div>

                    <div className="btn-group">
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        disabled={modalPage <= 1}
                        onClick={() =>
                          setModalPage((p) => Math.max(1, p - 1))
                        }
                      >
                        Previous
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        disabled={modalPage >= totalModalPages}
                        onClick={() =>
                          setModalPage((p) =>
                            Math.min(totalModalPages, p + 1)
                          )
                        }
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                  >
                    ปิด
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleConfirmSeatAllocation}
                  >
                    ยืนยันการจัดสรร
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
