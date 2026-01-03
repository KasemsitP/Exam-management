// src/store/slices/examRooms.slice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {RootState } from "../index"
import axios from "axios";

export interface ExamRoom {
  campaign_id: number; 
  roomCode: string;
  capacity: number;
}

interface ExamRoomsState {
  rooms: ExamRoom[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ExamRoomsState = {
  rooms: [],
  status: "idle",
  error: null,
};

export const fetchRoomsByCampaignThunk = createAsyncThunk<
  ExamRoom[],       
  number,      
  { rejectValue: string }
>("examRooms/fetchByCampaign", async (campaignId, { rejectWithValue }) => {
  try {
    const res = await axios.get(
      `/api/exam-rooms/campaign/${campaignId}`
    );
  // console.log(res.data)
const rooms = res.data.map((r: any) => ({
  campaign_id: r.campaignId, 
  roomCode: r.roomCode,
  capacity: r.capacity,
}));
console.log(rooms)
return rooms;
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(err.response?.data?.message ?? "Fetch rooms failed");
    }
    return rejectWithValue("Fetch rooms failed");
  }
});

// ✅ บันทึก / แก้ไขห้อง
export const saveRoomThunk = createAsyncThunk<
  ExamRoom,         // return type
  { campaign_id: string; roomCode: string; capacity: number },
  { rejectValue: string }
>("examRooms/save", async (payload, { rejectWithValue }) => {
  try {
    const res = await axios.post<ExamRoom>("/api/exam-rooms", payload);
    // ⬇️ แก้จาก res.data.room เป็น res.data
    return res.data;
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(err.response?.data?.message ?? "Save room failed");
    }
    return rejectWithValue("Save room failed");
  }
});

// ✅ ลบห้อง
export const deleteRoomThunk = createAsyncThunk<
  { campaign_id: string; roomCode: string },       // what reducer will receive
  { campaign_id: string; roomCode: string },
  { rejectValue: string }
>("examRooms/delete", async (payload, { rejectWithValue }) => {
  try {
    const { campaign_id, roomCode } = payload;
    await axios.delete(`/api/exam-rooms/${campaign_id}/${roomCode}`);
    return payload;
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(err.response?.data?.message ?? "Delete room failed");
    }
    return rejectWithValue("Delete room failed");
  }
});

const examRoomsSlice = createSlice({
  name: "examRooms",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchRoomsByCampaignThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchRoomsByCampaignThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.rooms = action.payload; 
      })
      .addCase(fetchRoomsByCampaignThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Fetch rooms failed";
      })

      // save
      .addCase(saveRoomThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(saveRoomThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        const room = action.payload; // ✅ type = ExamRoom ไม่ใช่ unknown
        const idx = state.rooms.findIndex(
          (r) =>
            r.campaign_id === room.campaign_id &&
            r.roomCode === room.roomCode
        );
        if (idx !== -1) {
          state.rooms[idx] = room;
        } else {
          state.rooms.push(room);
        }
      })
      .addCase(saveRoomThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Save room failed";
      })

      // delete
      .addCase(deleteRoomThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteRoomThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { campaign_id, roomCode } = action.payload;
        state.rooms = state.rooms.filter(
          (r) =>
            String(r.campaign_id) !== String(campaign_id) ||
            r.roomCode !== roomCode
        );
      })
      .addCase(deleteRoomThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Delete room failed";
      });
  },
});

export const selectExamRoomsSlice = (state: RootState) => state.examRooms;
export {examRoomsSlice}
