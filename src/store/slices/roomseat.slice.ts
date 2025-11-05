import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// (Interface นี้ต้องตรงกับ 'room_seats')
export interface RoomSeat {
  campaign_id: number;
  site_id: number;
  room_code: string;
  seat_code: string;
  row_no: number;
  col_no: number;
}

interface RoomSeatsState {
  seats: Record<string, RoomSeat>; // (Key: "room-seat")
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: RoomSeatsState = {
  seats: {},
  status: "idle",
  error: null,
};

// ⭐️ (FIX) (GET /api/room-seats/site/:siteId)
export const fetchRoomSeatsThunk = createAsyncThunk<
  RoomSeat[],
  string | number, // (siteId: "site-1" หรือ 1)
  { rejectValue: string }
>(
  "roomSeats/fetch",
  async (siteId, { rejectWithValue }) => {
    try {
      // (แปลง "site-1" -> 1)
      const siteIdNumeric = parseInt(String(siteId).replace("site-", ""));
      if (isNaN(siteIdNumeric)) throw new Error("Invalid Site ID Format");
      
      const response = await axios.get(`/api/room-seats/site/${siteIdNumeric}`);
      return response.data as RoomSeat[];
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message ?? "Fetch Room Seats failed");
      }
      return rejectWithValue("Failed to fetch Room Seats");
    }
  }
);

const roomSeatsSlice = createSlice({
  name: "roomSeats",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoomSeatsThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchRoomSeatsThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        const newMap: Record<string, RoomSeat> = {};
        action.payload.forEach(seat => {
          newMap[`${seat.room_code}-${seat.seat_code}`] = seat;
        });
        state.seats = newMap;
      })
      .addCase(fetchRoomSeatsThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed";
      });
  },
});

// (Selectors)
type LocalRootState = {
  roomSeats: RoomSeatsState;
};
export const selectAllRoomSeats = (state: LocalRootState) => 
  Object.values(state.roomSeats.seats);

export const selectRoomSeatsForSite = (siteId: string | number | null) => (state: LocalRootState) => {
  if (!siteId) return [];
  // (FIXME: Logic นี้ควร Filter ด้วย siteId จริงๆ)
  return Object.values(state.roomSeats.seats);
};

// (Selector นี้สำคัญมากสำหรับ Algorithm)
export const selectRoomSeatsMeta = (siteId: string | number | null) => (state: LocalRootState) => {
  const seats = selectRoomSeatsForSite(siteId)(state);
  if (seats.length === 0) {
    return { totalSeats: 0, columns: 1 };
  }
  const maxCol = Math.max(...seats.map(s => s.col_no));
  const columns = maxCol + 1; // (col_no เริ่มจาก 0)
  const totalSeats = seats.length;
  return { totalSeats, columns };
};


export{ roomSeatsSlice}