// src/pages/exam/hooks/useExamRooms.ts
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
} from "@/store/slices/examData.slice";
import {
  fetchRoomsBySessionThunk,
  saveRoomThunk,
  deleteRoomThunk,
  selectRoomSummary,
  selectRoomsBySession,
  selectExamRoomsSlice,
} from "@/store/slices/examRooms.slice";

export interface RoomFormValues {
  sessionId: string;
  roomCode: string;
  capacity: number;
  applyToAllSessions?: boolean;
}

interface EditingRoom {
  sessionId: string;
  roomCode: string;
  capacity: number;
}

export const useExamRooms = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const activeCampaign = useAppSelector(selectActiveCampaign);
  const sessions = useAppSelector(selectActiveCampaignSessions) ?? [];
  const { status: roomStatus } = useAppSelector(selectExamRoomsSlice);

  // -------- Session selection ----------
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    sessions[0]?.id ?? null
  );

  useEffect(() => {
    if (!sessions.length) {
      setSelectedSessionId(null);
      return;
    }

    setSelectedSessionId((current) => {
      if (!current || !sessions.some((s: any) => s.id === current)) {
        return sessions[0].id;
      }
      return current;
    });
  }, [sessions]);

  // -------- Fetch rooms when session changes ----------
  useEffect(() => {
    if (selectedSessionId) {
      dispatch(fetchRoomsBySessionThunk(selectedSessionId));
    }
  }, [selectedSessionId, dispatch]);

  // -------- Data/selectors ----------
  const rooms =
    useAppSelector(selectRoomsBySession(selectedSessionId ?? "")) ?? [];

  const summary =
    useAppSelector(selectRoomSummary(selectedSessionId ?? "")) ?? {
      totalRooms: 0,
      totalCapacity: 0,
    };

  // -------- Search/filter ----------
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRooms = useMemo(() => {
    if (!searchTerm.trim()) return rooms;
    const term = searchTerm.trim().toLowerCase();
    return rooms.filter((r: any) =>
      r.roomCode.toLowerCase().includes(term)
    );
  }, [rooms, searchTerm]);

  // -------- Modal state ----------
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<EditingRoom | null>(null);

  const openCreate = () => {
    setEditingRoom(null);
    setDialogOpen(true);
  };

  const openEdit = (room: { sessionId: string; roomCode: string; capacity: number }) => {
    setEditingRoom(room);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRoom(null);
  };

  // -------- Actions ----------
  const handleRemove = async (sessionId: string, roomCode: string) => {
    if (!window.confirm(`ยืนยันลบห้องสอบ ${roomCode} หรือไม่`)) return;

    try {
      await dispatch(deleteRoomThunk({ sessionId, roomCode })).unwrap();
      toast({ title: "ลบห้องสอบแล้ว", description: roomCode });

      if (
        editingRoom &&
        editingRoom.sessionId === sessionId &&
        editingRoom.roomCode === roomCode
      ) {
        closeDialog();
      }
    } catch (error: any) {
      toast({
        title: "ลบล้มเหลว",
        description: error?.message ?? "API Error",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (values: RoomFormValues) => {
    const roomCode = values.roomCode.trim();
    if (!roomCode) {
      toast({ title: "กรุณาระบุรหัสห้องสอบ", variant: "destructive" });
      return;
    }

    const capacity = Number(values.capacity);
    if (Number.isNaN(capacity) || capacity <= 0) {
      toast({ title: "จำนวนที่รองรับต้องมากกว่า 0", variant: "destructive" });
      return;
    }

    // Bulk add
    if (values.applyToAllSessions && !editingRoom) {
      toast({
        title: "กำลังเพิ่มห้องสอบ (ทุกเซสชัน)…",
        description: `เพิ่ม ${roomCode} ทั้งหมด ${sessions.length} เซสชัน`,
      });

      const jobs = sessions.map((session: any) =>
        dispatch(
          saveRoomThunk({ sessionId: session.id, roomCode, capacity })
        ).unwrap()
      );

      try {
        await Promise.all(jobs);
        toast({
          title: "สำเร็จ",
          description: `${roomCode} ถูกเพิ่มใน ${sessions.length} เซสชัน`,
        });

        if (selectedSessionId) {
          dispatch(fetchRoomsBySessionThunk(selectedSessionId));
        }

        closeDialog();
      } catch (error: any) {
        toast({
          title: "เพิ่มแบบกลุ่มล้มเหลว",
          description: error?.message ?? "API Error",
          variant: "destructive",
        });
      }

      return;
    }

    // Single add / edit
    const sessionIdForSave = values.sessionId;
    if (!sessionIdForSave) {
      toast({ title: "กรุณาเลือกเซสชัน", variant: "destructive" });
      return;
    }

    try {
      await dispatch(
        saveRoomThunk({ sessionId: sessionIdForSave, roomCode, capacity })
      ).unwrap();

      toast({
        title: editingRoom ? "บันทึกห้องสอบเรียบร้อย" : "เพิ่มห้องสอบสำเร็จ",
        description: `${roomCode} รองรับ ${capacity.toLocaleString()} คน`,
      });

      closeDialog();
    } catch (error: any) {
      toast({
        title: "บันทึกล้มเหลว",
        description: error?.message ?? "API Error",
        variant: "destructive",
      });
    }
  };

  const selectedSessionLabel = useMemo(() => {
    if (!selectedSessionId) return "-";
    const session = sessions.find((s: any) => s.id === selectedSessionId);
    return session?.label ?? session?.note ?? "-";
  }, [selectedSessionId, sessions]);

  return {
    activeCampaign,
    sessions,
    rooms,
    summary,
    filteredRooms,
    roomStatus,
    loading: roomStatus === "loading",
    selectedSessionId,
    setSelectedSessionId,
    selectedSessionLabel,
    searchTerm,
    setSearchTerm,
    modal: {
      open: dialogOpen,
      editingRoom,
      openCreate,
      openEdit,
      close: closeDialog,
    },
    handleRemove,
    handleSubmit,
  };
};
