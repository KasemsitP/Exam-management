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
import { ExamRoom, deleteRoomThunk, saveRoomThunk } from "@/store/slices/examRooms.slice";
import { Search, Plus } from "lucide-react";
import { useForm } from 'react-hook-form';

type SeatCell = {
  seatNo: number;
  user_code: string;
  fullName: string;
  lastNameKey?: string;
};

type AssignedSummary = {
  room_code: string;
  count_user: number;
};


type RoomLike = {
  campaign_id?: number;
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

export interface RoomFormValues {
  campaign_id: string;
  roomCode: string;
  capacity: number;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function SeatAllocationPage() {
  const dispatch = useAppDispatch();
  const campaign = useAppSelector(selectActiveCampaign);
  const { rooms = [], status: roomStatus } = useAppSelector(selectExamRoomsSlice);

  // cache layout แต่ละห้อง: key = roomCode
  const [roomSeats, setRoomSeats] = useState<Record<string, SeatCell[]>>({});
  // ===== Create Layout Modal state =====
  const [createRoom, setCreateRoom] = useState<RoomLike | null>(null);
  const [createSeatsPerRow, setCreateSeatsPerRow] = useState<number>(30);
  const [isCreatingLayout, setIsCreatingLayout] = useState(false);
  const [unassignedRoomCodes, setUnassignedRoomCodes] = useState<string[]>([]);
  const [assignedCounts, setAssignedCounts] = useState<Record<string, number>>({});

  const [totaluser, setTotalUsers] = useState<number>(0);
  const [totaluserAssigned, setTotalUsersAssigned] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomFormValues | null>(null);



  //  const rooms: RoomLike[] = (roomsState?.rooms ?? []) as any;

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

  // ===== Modal state =====
  const [selectedRoom, setSelectedRoom] = useState<RoomLike | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [modalColsPerPage, setModalColsPerPage] = useState(6);
  const [modalPage, setModalPage] = useState(1);
  const [modalSeatsPerRow, setModalSeatsPerRow] = useState(30);
  const [Room, setRoom] = useState<ExamRoom[]>([])
  const [searchTerm, setSearchTerm] = useState("");

  // const handleSetSeatsPerColumn = () => {
  //   const value = Number(inputSeatsPerColumn);
  //   if (Number.isFinite(value) && value > 0) {
  //     setSeatsPerColumn(value);
  //   } else {
  //     alert("จำนวนที่นั่งต่อคอลัมน์ต้องมากกว่า 0");
  //   }
  // };

  const form = useForm<RoomFormValues>({
    defaultValues: {
      campaign_id: String(campaign?.id ?? editingRoom?.campaign_id ?? ""),
      roomCode: editingRoom?.roomCode ?? "",
      capacity: editingRoom?.capacity ?? 30,
    },
  });
  const filteredRooms = useMemo(() => {
    const campaignId = campaign?.id;
    let list = Array.isArray(rooms) ? rooms : [];
    if (campaignId != null) {
      list = list.filter(
        (r) => Number(r.campaign_id) === Number(campaignId)
      );

    }
    console.log(list)

    const term = searchTerm.trim().toLowerCase();
    if (!term) return list;

    return list.filter(
      (r) =>
        r.roomCode.toLowerCase().includes(term) ||
        String(r.capacity).includes(term)
    );
  }, [rooms, campaign, searchTerm]);

  const summary = useMemo(() => {
    const totalRooms = filteredRooms.length;
    const totalCapacity = filteredRooms.reduce(
      (sum, r) => sum + (Number(r.capacity) || 0),
      0
    );
    return { totalRooms, totalCapacity };
  }, [filteredRooms]);


  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredRooms.length / itemsPerPage)),
    [filteredRooms.length]
  );

  const currentRooms = useMemo(() => {
    const indexOfLastRoom = currentPage * itemsPerPage;
    const indexOfFirstRoom = indexOfLastRoom - itemsPerPage;
    return filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom);
  }, [filteredRooms, currentPage]);

  useEffect(() => {
    if (!dialogOpen) return;

    form.reset({
      campaign_id: String(campaign?.id ?? editingRoom?.campaign_id ?? ""),
      roomCode: editingRoom?.roomCode ?? "",
      capacity: editingRoom?.capacity ?? 30,
    });
  }, [dialogOpen, editingRoom, campaign?.id]);

  useEffect(() => {
    if (!campaign?.id) return;
    const cid = Number(campaign.id);

    dispatch(fetchRoomsByCampaignThunk(cid));
    loadAssignedCounts(cid);
    fetchUserAssigned(cid);
    fetchRoom(cid)
  }, [campaign?.id, dispatch]);
  useEffect(() => {
    setModalPage(1);
  }, [modalSearch, selectedRoom]);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (!campaign?.id) return;
    // const fetchUserAssigned = async () => {
    //   try {
    //     const res = await axios.get<{
    //       total_users: number;
    //       total_users_assigned_room: number;
    //     }>(`api/seat/countusers/${campaign.id}`);
    //     //console.log("test", res.data)

    //     const total = res.data.total_users;
    //     const assigned = res.data.total_users_assigned_room;

    //     setTotalUsersAssigned(assigned)
    //     setTotalUsers(total)
    //     console.log(total, assigned)
    //   } catch (err) {
    //     console.error("fetch unassigned rooms error", err);
    //   }
    // };

    const fetchUnassignedRooms = async () => {
      try {
        const res = await axios.get<{ room_code: string }[]>(
          `/api/seat/isassigned/${campaign.id}`
        );

        const codes = res.data.map((r) => r.room_code);
        setUnassignedRoomCodes(codes);
        console.log("unassignedRoomCodes =", codes);
      } catch (err) {
        console.error("fetch unassigned rooms error", err);
      }
    };
    fetchUnassignedRooms();
  }, [campaign?.id]);

  // ด้านบนใน component (ก่อน useEffect)
  const fetchUserAssigned = async (campaignId: number) => {
    try {
      const res = await axios.get<{
        total_users: number;
        total_users_assigned_room: number;
      }>(`/api/seat/countusers/${campaignId}`);

      const total = res.data.total_users;
      const assigned = res.data.total_users_assigned_room;

      setTotalUsers(total);
      setTotalUsersAssigned(assigned);
    } catch (err) {
      console.error("fetch user assigned error", err);
    }
  };

  const fetchRoom = async (campaignId: number) => {
    try {
      const res = await axios.get(
        `/api/exam-rooms/campaign/${campaignId}`
      );
      const rooms: ExamRoom[] = res.data.map((r: any) => ({
        campaign_id: r.campaignId,
        roomCode: r.roomCode,
        capacity: r.capacity,
      }));
      setRoom(rooms)
      console.log(rooms)

    } catch (err) {
      console.error("fetch user assigned error", err);
    }
  };




  const loadAssignedCounts = async (campaignId: number) => {
    try {
      const res = await axios.get<AssignedSummary[]>(
        `/api/seat/isassigned/${campaignId}`
      );

      const map: Record<string, number> = {};
      res.data.forEach((item) => {
        map[item.room_code] = item.count_user ?? 0;
      });

      setAssignedCounts(map);
    } catch (err) {
      console.error("fetch assigned counts error", err);
      // จะ popup ก็ได้ แต่ถ้าไม่ critical จะแค่ console ก็โอเค
    }
  };

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

  // const filteredRooms = useMemo(() => {
  //   const campaignId = campaign?.id;
  //   let list = Array.isArray(rooms) ? rooms : [];
  //   if (campaignId != null) {
  //     list = list.filter(
  //       (r) => Number(r.campaign_id) === Number(campaignId)
  //     );

  //   }
  //   console.log(list)

  //   const term = searchTerm.trim().toLowerCase();
  //   if (!term) return list;

  //   return list.filter(
  //     (r) =>
  //       r.roomCode.toLowerCase().includes(term) ||
  //       String(r.capacity).includes(term)
  //   );
  // }, [rooms, activeCampaign, searchTerm]);


  // const summary = useMemo(() => {
  //   const totalRooms = filteredRooms.length;
  //   const totalCapacity = filteredRooms.reduce(
  //     (sum, r) => sum + (Number(r.capacity) || 0),
  //     0
  //   );
  //   return { totalRooms, totalCapacity };
  // }, [filteredRooms]);
  const watchRoomCode = form.watch("roomCode");

  // reset เมื่อเปิด dialog / campaign เปลี่ยน / editingRoom เปลี่ยน
  useEffect(() => {
    if (!dialogOpen) return;

    form.reset({
      campaign_id: String(campaign?.id ?? editingRoom?.campaign_id ?? ""),
      roomCode: editingRoom?.roomCode ?? "",
      capacity: editingRoom?.capacity ?? 30,
    });
  }, [dialogOpen, campaign?.id, editingRoom, form]);
  const openCreate = () => {
    setEditingRoom(null);
    setDialogOpen(true);
  };

  const openEdit = (room: RoomFormValues) => {
    setEditingRoom(room);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    form.reset({
      campaign_id: String(campaign?.id ?? editingRoom?.campaign_id ?? ""),
      roomCode: editingRoom?.roomCode ?? "",
      capacity: editingRoom?.capacity ?? 30,
    });

    setDialogOpen(false);
    setEditingRoom(null);
  };

  // -------- Actions ----------
  const handleRemove = async (campaign_id: string, roomCode: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบห้องสอบ",
      text: `คุณต้องการลบห้องสอบ ${roomCode} หรือไม่`,
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      await dispatch(deleteRoomThunk({ campaign_id, roomCode })).unwrap();

      await Swal.fire({
        icon: "success",
        title: "ลบห้องสอบแล้ว",
        text: `ห้องสอบ ${roomCode} ถูกลบเรียบร้อย`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "ลบล้มเหลว",
        text: error?.message ?? "API Error",
      });
    }
  };
  const handleSubmit = async (values: RoomFormValues) => {
    const roomCode = values.roomCode.trim();
    if (!roomCode) {
      await Swal.fire({ icon: "error", title: "ข้อมูลไม่ครบ", text: "กรุณาระบุรหัสห้องสอบ" });
      return;
    }

    const capacity = Number(values.capacity);
    if (Number.isNaN(capacity) || capacity <= 0) {
      await Swal.fire({ icon: "error", title: "ข้อมูลไม่ถูกต้อง", text: "จำนวนที่รองรับต้องมากกว่า 0" });
      return;
    }

    const payload: RoomFormValues = {
      campaign_id: values.campaign_id || String(campaign?.id ?? ""),
      roomCode,
      capacity,
    };

    if (!payload.campaign_id) {
      await Swal.fire({ icon: "error", title: "ไม่พบข้อมูลรอบสอบ", text: "กรุณาเลือกแคมเปญก่อน" });
      return;
    }

    try {
      await dispatch(saveRoomThunk(payload)).unwrap();

      await Swal.fire({
        icon: "success",
        title: editingRoom ? "บันทึกห้องสอบเรียบร้อย" : "เพิ่มห้องสอบสำเร็จ",
        text: `${roomCode} รองรับ ${capacity.toLocaleString()} คน`,
        timer: 1500,
        showConfirmButton: false,
      });

      if (campaign?.id) dispatch(fetchRoomsByCampaignThunk(Number(campaign.id)));
      closeDialog();
    } catch (error: any) {
      await Swal.fire({ icon: "error", title: "บันทึกล้มเหลว", text: error?.message ?? "API Error" });
    }
  };




  const handleOpenRoomPreview = async (room: RoomLike) => {
    if (!campaign?.id) return;
    setModalSearch("");
    setModalPage(1);

    try {
      const res = await axios.get<SeatApiResponse>(
        `/api/seat/campaign/${campaign.id}/room/${encodeURIComponent(
          room.roomCode
        )}`,
        { params: { _t: Date.now() } }
      );

      const data = res.data;

      if (!data.seats || data.seats.length === 0) {
        await Swal.fire({
          icon: "info",
          title: "ยังไม่มีผังที่นั่ง",
          text: "กรุณากดปุ่ม \"สร้างผังที่นั่ง\" ก่อน",
        });
        setSelectedRoom(null);
        return;
      }
      setSelectedRoom(room);

      const seatCells = mapApiSeatsToCells(data);

      setRoomSeats((prev) => ({
        ...prev,
        [room.roomCode]: seatCells,
      }));

      setModalSeatsPerRow(data.seatsPerRow || 30);
    } catch (err) {
      console.error("fetch seat layout error", err);

      await Swal.fire({
        icon: "error",
        title: "ไม่สามารถโหลดผังที่นั่งได้",
        text: "กรุณาลองใหม่อีกครั้ง",
      });

      setSelectedRoom(null);
    }
  };


  const handleResetSeat = async () => {
    if (!campaign?.id) {
      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่พบข้อมูลแคมเปญ",
      });
      return;
    }

    // ให้ถามยืนยันก่อน
    const ok = await Swal.fire({
      icon: "warning",
      title: "รีเซ็ตผังที่นั่งทั้งหมด",
      text: `ระบบจะลบผังที่นั่งของแคมเปญ${campaign.name ?? campaign.campaign_size} ทุกห้อง`,
      showCancelButton: true,
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
    }).then((r) => r.isConfirmed);

    if (!ok) return;

    try {
      await axios.delete(`/api/seat/reset/${campaign.id}`);

      // 1) เคลียร์ state layout ที่ cache ไว้ทั้งหมด
      setRoomSeats({});       // ถ้าคุณใช้ useState<Record<string, SeatCell[]>>({})
      setSelectedRoom(null);  // ปิด modal ถ้ามี
      setModalSearch("");
      setModalPage(1);

      // 2) รีเซ็ตตัวเลขที่คุณใช้โชว์จำนวนคน (แล้วแต่ที่ประกาศ state ไว้)
      setAssignedCounts({});
      // ถ้าอนาคตเปลี่ยนเป็น per-room ก็ใช้ setAssignedCounts({}) แล้วค่อย reload ใหม่

      // 3) refresh รายการห้องจาก backend (จะได้ allocatedCount = 0)
      dispatch(fetchRoomsByCampaignThunk(Number(campaign.id)));
      loadAssignedCounts(Number(campaign.id));
      fetchUserAssigned(Number(campaign.id));


      await Swal.fire({
        icon: "success",
        title: "รีเซ็ตผังที่นั่งเรียบร้อย",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "จัดที่นั่งไม่สำเร็จ",
        text: "กรุณาลองใหม่อีกครั้ง",
      });
    }
  };

  const handleCreateRoom = async () => {
    if (!campaign?.id) {
      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่พบข้อมูลแคมเปญ",
      });
      return;
    }

    const ok = await Swal.fire({
      icon: "warning",
      title: "รีเซ็ตผังที่นั่งทั้งหมด",
      text: `ระบบจะลบผังที่นั่งของแคมเปญ${campaign.name ?? campaign.campaign_size} ทุกห้อง`,
      showCancelButton: true,
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
    }).then((r) => r.isConfirmed);

    if (!ok) return;

    try {
      await axios.delete(`/api/seat/reset/${campaign.id}`);

      // 1) เคลียร์ state layout ที่ cache ไว้ทั้งหมด
      setRoomSeats({});       // ถ้าคุณใช้ useState<Record<string, SeatCell[]>>({})
      setSelectedRoom(null);  // ปิด modal ถ้ามี
      setModalSearch("");
      setModalPage(1);

      // 2) รีเซ็ตตัวเลขที่คุณใช้โชว์จำนวนคน (แล้วแต่ที่ประกาศ state ไว้)
      setAssignedCounts({});
      // ถ้าอนาคตเปลี่ยนเป็น per-room ก็ใช้ setAssignedCounts({}) แล้วค่อย reload ใหม่

      // 3) refresh รายการห้องจาก backend (จะได้ allocatedCount = 0)
      dispatch(fetchRoomsByCampaignThunk(Number(campaign.id)));
      loadAssignedCounts(Number(campaign.id));
      fetchUserAssigned(Number(campaign.id));


      await Swal.fire({
        icon: "success",
        title: "รีเซ็ตผังที่นั่งเรียบร้อย",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "จัดที่นั่งไม่สำเร็จ",
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
        <div className="card shadow-sm">
          {/* Card Header */}
          <div className="card-header bg-white d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            <div>
              <h5 className="mb-1 d-flex align-items-center gap-2">จัดการที่นั่งสอบ</h5>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              {/* Search */}
              <div className="position-relative">
                <Search
                  size={16}
                  className="position-absolute"
                  style={{
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  className="form-control ps-5"
                  style={{ width: 220 }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาห้องสอบ"
                />
              </div>

              <button
                className="btn btn-primary d-inline-flex align-items-center gap-2"
                onClick={openCreate}
              >
                <Plus size={16} /> เพิ่มห้องสอบ
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="card-body">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              <span className="badge text-bg-light border">
                รอบสอบ: {campaign?.name ?? campaign?.id ?? "-"}
              </span>
            </div>

            {/* Optional stats row (เหมือน card ย่อยข้างบน) */}
            <div className="row g-3">
              <div className="col-sm-6 col-lg-3">
                <div className="card shadow-none border">
                  <div className="card-body">
                    <div className="text-uppercase small text-muted mb-1">
                      จำนวนห้องสอบ
                    </div>
                    <div className="h3 mb-0">{rooms.length}</div>
                  </div>
                </div>
              </div>
              <div className="col-sm-6 col-lg-3">
                <div className="card shadow-none border">
                  <div className="card-body">
                    <div className="text-uppercase small text-muted mb-1">
                      ความจุที่นั่งรวม (คน)
                    </div>
                    <div className="h3 mb-0">{roomsTotal}</div>
                  </div>
                </div>
              </div>
              <div className="col-sm-6 col-lg-3">
                <div className="card shadow-none border">
                  <div className="card-body">
                    <div className="text-uppercase small text-muted mb-1">
                      จำนวนผู้เข้าสอบทั้งหมด
                    </div>
                    <div className="h3 mb-0">{totaluser} </div>
                  </div>
                </div>
              </div>
              <div className="col-sm-6 col-lg-3">
                <div className="card shadow-none border">
                  <div className="card-body">
                    <div className="text-uppercase small text-muted mb-1">
                      จำนวนผู้เข้าสอบที่ถูกจัดสรรแล้ว
                    </div>
                    <div className="h3 mb-0">{totaluserAssigned} </div>
                  </div>
                </div>
              </div>
            </div>

            {/* เพิ่ม list ห้องสอบ หรือ grid ของที่นั่งสอบตรงนี้ */}
          </div>
        </div>



        {/* ===== Rooms grid ===== */}
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
              <div>
                <div className="fw-semibold">รายการห้องสอบ</div>
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
                    <th className="text-end " style={{ width: "15%" }}>
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

                    // ใช้ค่าจาก API เป็นหลัก
                    const assignedCountFromApi = assignedCounts[room.roomCode];

                    const allocatedCount = assignedCountFromApi ?? Number(
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
                        <td>
                          <div className="d-flex justify-content-center gap-2 ">
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => setCreateRoom(room)}
                            >
                              สร้างผังที่นั่ง
                            </button>

                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleOpenRoomPreview(room)}
                            >
                              ดูผังที่นั่ง
                            </button>

                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() =>
                                openEdit({
                                  campaign_id: String(room.campaign_id ?? campaign?.id ?? ""),
                                  roomCode: room.roomCode,
                                  capacity: Number(room.capacity ?? 0),
                                })
                              }
                            >
                              แก้ไข
                            </button>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                handleRemove(
                                  String(room.campaign_id ?? campaign?.id ?? ""),
                                  room.roomCode
                                )
                              }
                            >
                              ลบ
                            </button>
                          </div>
                        </td>


                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <nav className="mt-3 d-flex justify-content-between align-items-center">
              <div>
                <button className="btn btn-outline-secondary" onClick={handleResetSeat}>
                  รีเซ็ตการจัดสรรทั้งหมด
                </button>
              </div>

              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() =>
                      setCurrentPage((p) => clamp(p - 1, 1, totalPages))
                    }
                  >
                    ก่อนหน้า
                  </button>
                </li>

                {Array.from({ length: totalPages }).map((_, idx) => (
                  <li
                    key={idx}
                    className={`page-item ${currentPage === idx + 1 ? "active" : ""}`}
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
                  className={`page-item ${currentPage === totalPages ? "disabled" : ""
                    }`}
                >
                  <button
                    className="page-link"
                    onClick={() =>
                      setCurrentPage((p) => clamp(p + 1, 1, totalPages))
                    }
                  >
                    ต่อไป
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        {createRoom && (
          <div
            className="modal d-block d-flex justify-content-center"
            tabIndex={-1}
            role="dialog"
            style={{
              background: "rgba(0,0,0,.35)",
              minHeight: "100vh",
              alignItems: "flex-start",  // ชิดบน
              paddingTop: "20vh",        // ขยับลงจากบน 10% ของจอ
            }}
          >
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    สร้างผังที่นั่ง ห้อง {createRoom.roomCode}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setCreateRoom(null)}
                  />
                </div>

                <div className="modal-body">
                  <p className="mb-3">
                    ระบบจะจัดที่นั่งตามจำนวนที่นั่งต่อแถวที่กำหนดด้านล่าง และบันทึกลงฐานข้อมูล
                  </p>

                  <div className="mb-3">
                    <label className="form-label">ที่นั่งต่อแถว</label>
                    <input
                      type="number"
                      className="form-control"
                      min={5}
                      max={60}
                      value={createSeatsPerRow}
                      onChange={(e) =>
                        setCreateSeatsPerRow(
                          clamp(Number(e.target.value), 5, 60)
                        )
                      }
                    />
                    <div className="form-text">
                      ความจุห้อง: {createRoom.capacity} ที่นั่ง
                    </div>
                  </div>

                  <div className="alert alert-warning mb-0">
                    การสร้างผังใหม่อาจทับข้อมูลเดิมของห้องนี้ (ถ้ามี)
                    กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCreateRoom(null)}
                    disabled={isCreatingLayout}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={isCreatingLayout}
                    onClick={async () => {
                      if (!campaign?.id || !createRoom) return;
                      try {
                        setIsCreatingLayout(true);

                        // เรียก confirm สร้างผัง
                        await axios.post(
                          `/api/seat/campaign/${campaign.id}/room/${encodeURIComponent(
                            createRoom.roomCode
                          )}/confirm`,
                          {
                            seatsPerRow: createSeatsPerRow,
                          }
                        );

                        // โหลดผังที่ commit แล้วมาเก็บใน state
                        const res = await axios.get<SeatApiResponse>(
                          `/api/seat/campaign/${campaign.id}/room/${encodeURIComponent(
                            createRoom.roomCode
                          )}`,
                          { params: { _t: Date.now() } }
                        );

                        const data = res.data;
                        if (data.seats && data.seats.length > 0) {
                          const seatCells = mapApiSeatsToCells(data);

                          setRoomSeats((prev) => ({
                            ...prev,
                            [createRoom.roomCode]: seatCells,
                          }));
                        }

                        await Swal.fire({
                          icon: "success",
                          title: "สร้างผังที่นั่งเรียบร้อย",
                          timer: 1500,
                          showConfirmButton: false,
                        });

                        setCreateRoom(null);
                        const cid = Number(campaign.id);
                        // refresh summary count
                        dispatch(fetchRoomsByCampaignThunk(Number(campaign.id)));
                        loadAssignedCounts(cid);
                        fetchUserAssigned(cid);
                      } catch (err) {
                        console.error("create seat layout error", err);
                        Swal.fire({
                          icon: "error",
                          title: "สร้างผังไม่สำเร็จ",
                          text: "กรุณาลองใหม่อีกครั้ง",
                        });
                      } finally {
                        setIsCreatingLayout(false);
                      }
                    }}
                  >
                    {isCreatingLayout ? "กำลังสร้าง..." : "สร้างผังที่นั่ง"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ===== Modal: ผังที่นั่ง (Preview-only) ===== */}
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
            <div className="modal-dialog modal-xl modal-dialog-scrollable" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title mb-1">
                      ผังที่นั่ง ห้อง {selectedRoom.roomCode}
                    </h5>
                    <div className="small text-muted">
                      แสดงค่า seatsPerRow = {modalSeatsPerRow}
                    </div>
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
                    <div className="col-md-6">
                      <label className="form-label">
                        ค้นหา (userId / ชื่อ)
                      </label>
                      <input
                        className="form-control"
                        placeholder="เช่น 0001 / นายทดสอบ"
                        value={modalSearch}
                        onChange={(e) => setModalSearch(e.target.value)}
                      />
                    </div>

                    <div className="col-md-6 d-flex gap-2 justify-content-md-end">
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

                    <div className="btn-group ">
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        disabled={modalPage <= 1}
                        onClick={() =>
                          setModalPage((p) => Math.max(1, p - 1))
                        }
                      >
                        ก่อนหน้า
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
                        ต่อไป
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
                  {/* ไม่มีปุ่มยืนยัน/จัดใหม่แล้ว เพราะเป็น preview-only */}
                </div>
              </div>
            </div>
          </div>
        )}
        {dialogOpen && (
          <>
            <div className="modal-backdrop show" style={{ zIndex: 1050 }} />
            <div
              className="modal show"
              style={{ display: "block", zIndex: 1055 }}
              role="dialog"
              aria-modal="true"
              onMouseDown={(e) => {
                // คลิกพื้นหลังให้ปิด
                if (e.target === e.currentTarget) closeDialog();
              }}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h6 className="modal-title">
                      {editingRoom ? "แก้ไขข้อมูลห้องสอบ" : "เพิ่มห้องสอบใหม่"}
                    </h6>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={closeDialog}
                      aria-label="Close"
                    />
                  </div>

                  {/* ✅ สำคัญ: ใช้ form.handleSubmit */}
                  <form onSubmit={form.handleSubmit(handleSubmit)}>
                    <div className="modal-body">
                      {/* campaign_id ซ่อน */}
                      <input type="hidden" {...form.register("campaign_id")} />

                      {/* Room code */}
                      <div className="mb-3">
                        <label htmlFor="room-code" className="form-label">
                          รหัสห้องสอบหรือชื่อห้องสอบ
                        </label>
                        <input
                          id="room-code"
                          className="form-control"
                          placeholder="THE DECK 1"
                          {...form.register("roomCode", { required: true })}
                          disabled={Boolean(editingRoom)} // ตอนแก้ไขห้ามเปลี่ยน roomCode
                        />
                      </div>

                      {/* Capacity */}
                      <div className="mb-3">
                        <label htmlFor="room-capacity" className="form-label">
                          จำนวนที่รองรับ (คน)
                        </label>
                        <input
                          id="room-capacity"
                          type="number"
                          min={1}
                          className="form-control"
                          {...form.register("capacity", {
                            valueAsNumber: true,
                            min: 1,
                          })}
                        />
                      </div>

                      <p className="text-muted small mb-0">
                        ห้อง <strong>{form.watch("roomCode") || "(ระบุรหัสห้อง)"}</strong>
                      </p>
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={closeDialog}
                      >
                        ยกเลิก
                      </button>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={roomStatus === "loading"} // หรือใช้ isSubmitting ก็ได้
                      >
                        {editingRoom ? "บันทึก" : "เพิ่มห้องสอบ"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}



      </div>
    </div>
  );
}
