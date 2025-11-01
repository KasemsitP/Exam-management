import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SeatParticipant {
  id: string;
  name: string;
  sessionId: string;
  subjectCode: string;
  familyId?: string;
}

export interface SeatRoom {
  id: string;
  name: string;
  rows: number;
  columns: number;
}

export interface SeatAssignment {
  id: string;
  roomId: string;
  seatLabel: string;
  participantId: string | null;
}

export interface SeatViolation {
  id: string;
  type: "EMPTY_SEAT" | "FAMILY" | "SUBJECT_SPLIT";
  message: string;
  severity: "info" | "warning" | "critical";
}

interface SeatsState {
  rooms: SeatRoom[];
  participants: SeatParticipant[];
  assignments: SeatAssignment[];
  violations: SeatViolation[];
  allocating: boolean;
  exporting: boolean;
  lastSeed: number | null;
  lastAllocatedAt?: string;
}

const rooms: SeatRoom[] = [
  { id: "main-401", name: "Main Hall 401", rows: 6, columns: 8 },
  { id: "main-402", name: "Main Hall 402", rows: 6, columns: 7 },
  { id: "main-501", name: "Main Hall 501", rows: 6, columns: 6 },
];

const participants: SeatParticipant[] = [
  { id: "cand-0001", name: "Arthit K.", familyId: "FG-001", subjectCode: "LAW101", sessionId: "sess-y68-t2-d1" },
  { id: "cand-0002", name: "Busaba L.", familyId: "FG-001", subjectCode: "LAW101", sessionId: "sess-y68-t2-d1" },
  { id: "cand-0003", name: "Chakri M.", familyId: "FG-002", subjectCode: "LAW101", sessionId: "sess-y68-t2-d1" },
  { id: "cand-0004", name: "Duangjai S.", familyId: "FG-002", subjectCode: "LAW215", sessionId: "sess-y68-t2-d1" },
  { id: "cand-0005", name: "Ekachai T.", subjectCode: "LAW215", sessionId: "sess-y68-t2-d1" },
  { id: "cand-0006", name: "Fahkrada U.", subjectCode: "LAW101", sessionId: "sess-y68-t2-d1" },
  { id: "cand-0007", name: "Ganon V.", subjectCode: "LAW205", sessionId: "sess-y68-t2-d2" },
  { id: "cand-0008", name: "Hathairat W.", subjectCode: "LAW205", sessionId: "sess-y68-t2-d2" },
  { id: "cand-0009", name: "Irada X.", subjectCode: "LAW320", sessionId: "sess-y68-t2-d2" },
  { id: "cand-0010", name: "Jariya Y.", subjectCode: "LAW320", sessionId: "sess-y68-t2-d2" },
  { id: "cand-0011", name: "Kornchai Z.", familyId: "FG-003", subjectCode: "LAW101", sessionId: "sess-y68-t2-d1" },
  { id: "cand-0012", name: "Latthika AA.", familyId: "FG-003", subjectCode: "LAW101", sessionId: "sess-y68-t2-d1" },
  { id: "cand-0013", name: "Manit BB.", subjectCode: "LAW215", sessionId: "sess-y68-t2-d1" },
  { id: "cand-0014", name: "Noparat CC.", subjectCode: "LAW205", sessionId: "sess-y68-t2-d2" },
  { id: "cand-0015", name: "Ornanong DD.", subjectCode: "LAW320", sessionId: "sess-y68-t2-d2" },
];

const createSeatAssignments = (): SeatAssignment[] => {
  const assignments: SeatAssignment[] = [];
  rooms.forEach((room) => {
    for (let row = 0; row < room.rows; row += 1) {
      for (let col = 0; col < room.columns; col += 1) {
        const seatLabel = `${String.fromCharCode(65 + row)}${col + 1}`;
        assignments.push({
          id: `${room.id}-${seatLabel}`,
          roomId: room.id,
          seatLabel,
          participantId: null,
        });
      }
    }
  });
  return assignments;
};

const initialState: SeatsState = {
  rooms,
  participants,
  assignments: createSeatAssignments(),
  violations: [],
  allocating: false,
  exporting: false,
  lastSeed: null,
  lastAllocatedAt: undefined,
};

const pseudoRandom = (seed: number) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

export const runSeatAllocation = createAsyncThunk<
  { assignments: SeatAssignment[]; violations: SeatViolation[]; seed: number },
  { seed: number; sessionId: string }
>("seats/runAllocation", async ({ seed, sessionId }, { getState }) => {
  const state = (getState() as { seats: SeatsState }).seats;
  const random = pseudoRandom(seed);

  const eligibleParticipants = state.participants.filter(
    (participant) => participant.sessionId === sessionId
  );

  const shuffled = [...eligibleParticipants];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const updatedAssignments = state.assignments.map<SeatAssignment>((assignment) => ({
    ...assignment,
    participantId: null,
  }));

  const seatsForSession = updatedAssignments.filter((assignment) =>
    state.rooms.some((room) => room.id === assignment.roomId)
  );

  shuffled.forEach((participant, index) => {
    if (index < seatsForSession.length) {
      seatsForSession[index].participantId = participant.id;
    }
  });

  const violations: SeatViolation[] = [];

  const familyMap = new Map<string, string[]>();
  seatsForSession.forEach((seat) => {
    if (!seat.participantId) return;
    const participant = eligibleParticipants.find((p) => p.id === seat.participantId);
    if (!participant?.familyId) return;
    const key = `${seat.roomId}-${seat.seatLabel.charAt(0)}`;
    const list = familyMap.get(key) ?? [];
    list.push(participant.familyId);
    familyMap.set(key, list);
  });

  familyMap.forEach((families, key) => {
    const duplicates = families.filter((value, index) => families.indexOf(value) !== index);
    if (duplicates.length > 0) {
      violations.push({
        id: `family-${key}`,
        type: "FAMILY",
        severity: "warning",
        message: `Family members detected in the same row (${duplicates.join(", ")})`,
      });
    }
  });

  const emptySeats = seatsForSession.filter((seat) => !seat.participantId).length;
  if (emptySeats > 0) {
    violations.push({
      id: "empty-seats",
      type: "EMPTY_SEAT",
      severity: "info",
      message: `${emptySeats} seats remain unassigned.`,
    });
  }

  const subjectByRoom = new Map<string, Set<string>>();
  seatsForSession.forEach((seat) => {
    if (!seat.participantId) return;
    const participant = eligibleParticipants.find((p) => p.id === seat.participantId);
    if (!participant) return;
    const set = subjectByRoom.get(seat.roomId) ?? new Set<string>();
    set.add(participant.subjectCode);
    subjectByRoom.set(seat.roomId, set);
  });

  subjectByRoom.forEach((subjects, roomId) => {
    if (subjects.size < 2) return;
    violations.push({
      id: `subject-${roomId}`,
      type: "SUBJECT_SPLIT",
      severity: "warning",
      message: `Room ${roomId} hosts multiple subjects: ${Array.from(subjects).join(", ")}`,
    });
  });

  return { assignments: updatedAssignments, violations, seed };
});

const seatsSlice = createSlice({
  name: "seats",
  initialState,
  reducers: {
    seatAssignmentsCleared: (state) => {
      state.assignments = createSeatAssignments();
      state.violations = [];
      state.lastSeed = null;
      state.lastAllocatedAt = undefined;
    },
    seatExportStarted: (state) => {
      state.exporting = true;
    },
    seatExportFinished: (state) => {
      state.exporting = false;
    },
    seatAssignmentManuallyEdited: (
      state,
      action: PayloadAction<{ assignmentId: string; participantId: string | null }>
    ) => {
      const assignment = state.assignments.find((item) => item.id === action.payload.assignmentId);
      if (assignment) {
        assignment.participantId = action.payload.participantId;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runSeatAllocation.pending, (state) => {
        state.allocating = true;
      })
      .addCase(runSeatAllocation.fulfilled, (state, action) => {
        state.allocating = false;
        state.assignments = action.payload.assignments;
        state.violations = action.payload.violations;
        state.lastSeed = action.payload.seed;
        state.lastAllocatedAt = new Date().toISOString();
      })
      .addCase(runSeatAllocation.rejected, (state) => {
        state.allocating = false;
      });
  },
});

export const {
  seatAssignmentManuallyEdited,
  seatAssignmentsCleared,
  seatExportFinished,
  seatExportStarted,
} = seatsSlice.actions;

export { seatsSlice };

export const selectSeatRooms = (state: { seats: SeatsState }) => state.seats.rooms;
export const selectSeatAssignments = (state: { seats: SeatsState }) => state.seats.assignments;
export const selectSeatParticipants = (state: { seats: SeatsState }) => state.seats.participants;
export const selectSeatViolations = (state: { seats: SeatsState }) => state.seats.violations;
export const selectSeatAllocationMeta = (state: { seats: SeatsState }) => ({
  allocating: state.seats.allocating,
  exporting: state.seats.exporting,
  lastSeed: state.seats.lastSeed,
  lastAllocatedAt: state.seats.lastAllocatedAt,
});
