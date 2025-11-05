import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from ".."; // (ต้อง Import RootState)

// ------------------------------
// Interfaces
// ------------------------------

// (Interface นี้ต้องตรงกับตาราง exam_rooms)
export interface ExamRoom {
  sessionId: string; // (Frontend ID: "sess-10")
  roomCode: string;
  capacity: number;
}

// (Payload สำหรับ Thunk)
interface SaveRoomPayload {
  sessionId: string;
  roomCode: string;
  capacity: number;
}
interface DeleteRoomPayload {
  sessionId: string;
  roomCode: string;
}

// (State Interface)
interface ExamRoomsState {
  // (เก็บห้องโดยแบ่งตาม Session ID)
  roomsBySession: Record<string, ExamRoom[]>; 
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ExamRoomsState = {
  roomsBySession: {},
  status: "idle",
  error: null,
};

// ------------------------------
// Thunks (API Calls)
// ------------------------------

export const fetchRoomsBySessionThunk = createAsyncThunk<
  ExamRoom[],
  string, // (sessionId: "sess-10")
  { rejectValue: string }
>(
  "examRooms/fetchBySession",
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/exam-rooms/session/${sessionId}`);
      return response.data as ExamRoom[];
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message ?? "Fetch rooms failed");
      }
      return rejectWithValue("Fetch rooms failed");
    }
  }
);

export const saveRoomThunk = createAsyncThunk<
  ExamRoom,
  SaveRoomPayload,
  { rejectValue: string }
>(
  "examRooms/save",
  async (payload, { rejectWithValue }) => {
    try {
      // (API นี้จะจัดการ Upsert)
      const response = await axios.post(`/api/exam-rooms`, payload);
      return response.data as ExamRoom;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message ?? "Save room failed");
      }
      return rejectWithValue("Save room failed");
    }
  }
);

export const deleteRoomThunk = createAsyncThunk<
  DeleteRoomPayload, // (ส่ง Payload เดิมกลับมา)
  DeleteRoomPayload,
  { rejectValue: string }
>(
  "examRooms/delete",
  async (payload, { rejectWithValue }) => {
    try {
      const { sessionId, roomCode } = payload;
      await axios.delete(`/api/exam-rooms/${sessionId}/${roomCode}`);
      return payload; // (ส่งกลับไปให้ Reducer)
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message ?? "Delete room failed");
      }
      return rejectWithValue("Delete room failed");
    }
  }
);

// ------------------------------
// Slice
// ------------------------------

const examRoomsSlice = createSlice({
  name: "examRooms",
  initialState,
  reducers: {
    // (Action เก่า (Client-side) ไม่ได้ใช้แล้ว)
    // roomUpserted: (state, action: PayloadAction<ExamRoom>) => { ... }
    // roomRemoved: (state, action: PayloadAction<{ sessionId: string; roomCode: string }>) => { ... }
  },
  extraReducers: (builder) => {
    builder
      // (Fetch)
      .addCase(fetchRoomsBySessionThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchRoomsBySessionThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        if (action.payload.length > 0) {
          const sessionId = action.payload[0].sessionId;
          state.roomsBySession[sessionId] = action.payload;
        } else if (action.meta.arg) {
          // (ถ้า Session นั้นไม่มีห้อง)
          state.roomsBySession[action.meta.arg] = [];
        }
      })
      .addCase(fetchRoomsBySessionThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed";
      })
      // (Save / Upsert)
      .addCase(saveRoomThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(saveRoomThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        const room = action.payload;
        const sessionId = room.sessionId;
        if (!state.roomsBySession[sessionId]) {
          state.roomsBySession[sessionId] = [];
        }
        // (เช็คว่ามีอยู่แล้วหรือยัง)
        const index = state.roomsBySession[sessionId].findIndex(
          (r) => r.roomCode === room.roomCode
        );
        if (index !== -1) {
          state.roomsBySession[sessionId][index] = room; // (Update)
        } else {
          state.roomsBySession[sessionId].push(room); // (Add)
        }
      })
      .addCase(saveRoomThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // (Delete)
      .addCase(deleteRoomThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteRoomThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { sessionId, roomCode } = action.payload;
        if (state.roomsBySession[sessionId]) {
          state.roomsBySession[sessionId] = state.roomsBySession[sessionId].filter(
            (r) => r.roomCode !== roomCode
          );
        }
      })
      .addCase(deleteRoomThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

// (Actions - ไม่มีแล้ว เพราะเราใช้ Thunks)
// export const { roomUpserted, roomRemoved } = examRoomsSlice.actions;

// ------------------------------
// Selectors
// ------------------------------
export const selectExamRoomsSlice = (state: RootState) => state.examRooms;

const selectEmptyRooms: ExamRoom[] = []; // (สำหรับ Default)

export const selectRoomsBySession = (sessionId: string | null) => (state: RootState) => {
  if (!sessionId) return selectEmptyRooms;
  return state.examRooms.roomsBySession[sessionId] ?? selectEmptyRooms;
};

export const selectRoomSummary = (sessionId: string | null) => (state: RootState) => {
  const rooms = selectRoomsBySession(sessionId)(state);
  const totalRooms = rooms.length;
  const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
  return { totalRooms, totalCapacity };
};

export {examRoomsSlice}