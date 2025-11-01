import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";

export interface ExamRoom {
  sessionId: string;
  roomCode: string;
  capacity: number;
  seatRows?: number;
  seatColumns?: number;
}

export interface RoomSeat {
  sessionId: string;
  roomCode: string;
  seatCode: string;
  rowNo: number;
  colNo: number;
}

interface ExamRoomsState {
  rooms: ExamRoom[];
  seats: RoomSeat[];
}

const toRowLabel = (index: number): string => {
  let value = index;
  let label = "";
  while (value >= 0) {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  }
  return label;
};

const generateSeatsForRoom = (
  sessionId: string,
  roomCode: string,
  rows: number,
  cols: number
): RoomSeat[] => {
  const seats: RoomSeat[] = [];
  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    for (let colIndex = 0; colIndex < cols; colIndex += 1) {
      const rowNo = rowIndex + 1;
      const colNo = colIndex + 1;
      const seatCode = `${toRowLabel(rowIndex)}${String(colNo).padStart(2, "0")}`;
      seats.push({
        sessionId,
        roomCode,
        seatCode,
        rowNo,
        colNo,
      });
    }
  }
  return seats;
};

const initialRooms: ExamRoom[] = [
  { sessionId: "sess-y68-t2-d1", roomCode: "MAIN-401", capacity: 48, seatRows: 6, seatColumns: 8 },
  { sessionId: "sess-y68-t2-d1", roomCode: "MAIN-402", capacity: 42, seatRows: 6, seatColumns: 7 },
  { sessionId: "sess-y68-t2-d2", roomCode: "MAIN-501", capacity: 36, seatRows: 6, seatColumns: 6 },
];

const initialSeats: RoomSeat[] = initialRooms.flatMap((room) =>
  room.seatRows && room.seatColumns
    ? generateSeatsForRoom(room.sessionId, room.roomCode, room.seatRows, room.seatColumns)
    : []
);

const initialState: ExamRoomsState = {
  rooms: initialRooms,
  seats: initialSeats,
};

interface RoomUpsertPayload {
  sessionId: string;
  roomCode: string;
  capacity: number;
  seatRows?: number;
  seatColumns?: number;
  regenerateLayout?: boolean;
}

const examRoomsSlice = createSlice({
  name: "examRooms",
  initialState,
  reducers: {
    roomUpserted: (state, action: PayloadAction<RoomUpsertPayload>) => {
      const payload = action.payload;
      const existing = state.rooms.find(
        (room) => room.sessionId === payload.sessionId && room.roomCode === payload.roomCode
      );

      const sanitizeCapacity = Math.max(1, Math.floor(payload.capacity));

      if (existing) {
        existing.capacity = sanitizeCapacity;
        if (payload.seatRows && payload.seatColumns) {
          existing.seatRows = payload.seatRows;
          existing.seatColumns = payload.seatColumns;
        }
      } else {
        state.rooms.push({
          sessionId: payload.sessionId,
          roomCode: payload.roomCode,
          capacity: sanitizeCapacity,
          seatRows: payload.seatRows,
          seatColumns: payload.seatColumns,
        });
      }

      const shouldRegenerate =
        payload.regenerateLayout && payload.seatRows && payload.seatColumns
          ? payload.seatRows > 0 && payload.seatColumns > 0
          : false;

      if (shouldRegenerate) {
        state.seats = state.seats.filter(
          (seat) =>
            !(
              seat.sessionId === payload.sessionId && seat.roomCode === payload.roomCode
            )
        );
        state.seats.push(
          ...generateSeatsForRoom(
            payload.sessionId,
            payload.roomCode,
            payload.seatRows!,
            payload.seatColumns!
          )
        );
      }
    },
    roomRemoved: (
      state,
      action: PayloadAction<{ sessionId: string; roomCode: string }>
    ) => {
      state.rooms = state.rooms.filter(
        (room) =>
          !(
            room.sessionId === action.payload.sessionId &&
            room.roomCode === action.payload.roomCode
          )
      );
      state.seats = state.seats.filter(
        (seat) =>
          !(
            seat.sessionId === action.payload.sessionId &&
            seat.roomCode === action.payload.roomCode
          )
      );
    },
    seatsManuallyReplaced: (
      state,
      action: PayloadAction<{
        sessionId: string;
        roomCode: string;
        seats: Array<Omit<RoomSeat, "sessionId" | "roomCode">>;
      }>
    ) => {
      const { sessionId, roomCode, seats } = action.payload;
      state.seats = state.seats.filter(
        (seat) => !(seat.sessionId === sessionId && seat.roomCode === roomCode)
      );
      state.seats.push(
        ...seats.map((seat) => ({
          sessionId,
          roomCode,
          seatCode: seat.seatCode || `SEAT-${nanoid(4)}`,
          rowNo: seat.rowNo,
          colNo: seat.colNo,
        }))
      );
    },
  },
});

export const { roomUpserted, roomRemoved, seatsManuallyReplaced } = examRoomsSlice.actions;
export { examRoomsSlice };

export const selectRoomsBySession =
  (sessionId: string | null) =>
  (state: { examRooms: ExamRoomsState }): ExamRoom[] => {
    if (!sessionId) return [];
    return state.examRooms.rooms
      .filter((room) => room.sessionId === sessionId)
      .sort((a, b) => a.roomCode.localeCompare(b.roomCode));
  };

export const selectRoomSeats =
  (sessionId: string | null, roomCode: string | null) =>
  (state: { examRooms: ExamRoomsState }): RoomSeat[] => {
    if (!sessionId || !roomCode) return [];
    return state.examRooms.seats
      .filter(
        (seat) => seat.sessionId === sessionId && seat.roomCode === roomCode
      )
      .sort((a, b) => {
        if (a.rowNo === b.rowNo) return a.colNo - b.colNo;
        return a.rowNo - b.rowNo;
      });
  };

export const selectRoomSummary =
  (sessionId: string | null) =>
  (state: { examRooms: ExamRoomsState }) => {
    const rooms = selectRoomsBySession(sessionId)(state);
    const totalCapacity = rooms.reduce((total, room) => total + room.capacity, 0);
    const totalSeats = rooms.reduce((total, room) => {
      if (!room.seatRows || !room.seatColumns) return total;
      return total + room.seatRows * room.seatColumns;
    }, 0);
    return {
      totalRooms: rooms.length,
      totalCapacity,
      totalSeats,
    };
  };
