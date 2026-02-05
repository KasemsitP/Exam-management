// src/pages/exam/hooks/useExamRooms.ts
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
} from "@/store/slices/examData.slice";
import {
  fetchRoomsByCampaignThunk,
  saveRoomThunk,
  deleteRoomThunk,
  selectExamRoomsSlice,
} from "@/store/slices/examRooms.slice";


export interface RoomFormValues {
  campaign_id: string;
  roomCode: string;
  capacity: number;
}
export const useExamRooms = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const activeCampaign = useAppSelector(selectActiveCampaign);
  const sessions = useAppSelector(selectActiveCampaignSessions) ?? [];

  const { rooms = [], status: roomStatus } = useAppSelector(selectExamRoomsSlice);
  const [searchTerm, setSearchTerm] = useState("");


  useEffect(() => {
    if (!activeCampaign) return;
    dispatch(fetchRoomsByCampaignThunk(Number(activeCampaign.id)));
  }, [dispatch, activeCampaign]);

useEffect(() => {
 // console.log("rooms raw:", rooms);
}, [rooms]);


  const filteredRooms = useMemo(() => {
    const campaignId = activeCampaign?.id;
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
  }, [rooms, activeCampaign, searchTerm]);

  const summary = useMemo(() => {
    const totalRooms = filteredRooms.length;
    const totalCapacity = filteredRooms.reduce(
      (sum, r) => sum + (Number(r.capacity) || 0),
      0
    );
    return { totalRooms, totalCapacity };
  }, [filteredRooms]);

  // -------- Modal state ----------
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomFormValues | null>(null);

  const openCreate = () => {
    setEditingRoom(null);
    setDialogOpen(true);
  };

  const openEdit = (room: RoomFormValues) => {
    setEditingRoom(room);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRoom(null);
  };

  // -------- Actions ----------
  const handleRemove = async (campaign_id: string, roomCode: string) => {
    if (!window.confirm(`ยืนยันลบห้องสอบ ${roomCode} หรือไม่`)) return;

    try {
      await dispatch(deleteRoomThunk({ campaign_id, roomCode })).unwrap();
      toast({ title: "ลบห้องสอบแล้ว", description: roomCode });
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
      toast({
        title: "จำนวนที่รองรับต้องมากกว่า 0",
        variant: "destructive",
      });
      return;
    }

    const payload: RoomFormValues = {
      campaign_id:
        values.campaign_id || (activeCampaign ? String(activeCampaign.id) : ""),
      roomCode,
      capacity,
    };

    if (!payload.campaign_id) {
      toast({
        title: "ไม่พบข้อมูลรอบสอบ",
        description: "กรุณาเลือกแคมเปญก่อน",
        variant: "destructive",
      });
      return;
    }

    try {
      await dispatch(saveRoomThunk(payload)).unwrap();

      toast({
        title: editingRoom ? "บันทึกห้องสอบเรียบร้อย" : "เพิ่มห้องสอบสำเร็จ",
        description: `${roomCode} รองรับ ${capacity.toLocaleString()} คน`,
      });

      dispatch(fetchRoomsByCampaignThunk(Number(activeCampaign.id)));

      closeDialog();
    } catch (error: any) {
      toast({
        title: "บันทึกล้มเหลว",
        description: error?.message ?? "API Error",
        variant: "destructive",
      });
    }
  };



  return {
    activeCampaign,
    sessions,
    summary,
    filteredRooms,
    loading: roomStatus === "loading",
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
