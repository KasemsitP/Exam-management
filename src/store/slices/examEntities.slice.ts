import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type TimestampString = string;

interface Identifiable {
  id: string;
}

export interface UserEntity extends Identifiable {
  userCode: string;
  fullName: string;
}

export interface SubjectEntity extends Identifiable {
  code: string;
  name: string;
}

export interface ExamSiteEntity extends Identifiable {
  name: string;
  note?: string;
}

export interface CampaignKeyEntity extends Identifiable {
  campaignId: string;
  key?: string;
  algor: string;
  iv: string;
  active: boolean;
  createdAt: TimestampString;
}

export interface ExamCampaignEntity extends Identifiable {
  code: string;
  name?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  note?: string;
}

export interface SessionEntity extends Identifiable {
  sessionCode: string;
  examDate: string;
  campaignId: string;
  siteId: string;
  dayNo: number;
  title?: string;
}

export const makeSessionSubjectId = (sessionId: string, subjectId: string) =>
  `${sessionId}::${subjectId}`;

export interface SessionSubjectEntity extends Identifiable {
  sessionId: string;
  subjectId: string;
  startAt: TimestampString;
  endAt: TimestampString;
  questionCount: number;
  questionRange?: string;
  orderNo: number;
}

export const makeExamRoomId = (sessionId: string, roomCode: string) => `${sessionId}::${roomCode}`;

export interface ExamRoomEntity extends Identifiable {
  sessionId: string;
  roomCode: string;
  capacity: number;
}

export const makeRoomSeatId = (
  campaignId: string,
  siteId: string,
  roomCode: string,
  seatCode: string
) => `${campaignId}::${siteId}::${roomCode}::${seatCode}`;

export interface RoomSeatEntity extends Identifiable {
  campaignId: string;
  siteId: string;
  roomCode: string;
  seatCode: string;
  rowNo: number;
  colNo: number;
}

export interface FamilyGroupEntity extends Identifiable {
  campaignId: string;
  label?: string;
  lastNameNorm?: string;
}

export interface UserCampaignEntity extends Identifiable {
  userId: string;
  campaignId: string;
  familyGroupId?: string;
  finalScore?: number;
}

export interface UserSessionEntity extends Identifiable {
  userCampaignId: string;
  campaignId: string;
  sessionId: string;
  siteId: string;
  qrPayload?: string;
  roomCode?: string;
  seatCode?: string;
  assigned: boolean;
}

export const makeBagId = (sessionId: string, bagNo: number) => `${sessionId}::${bagNo}`;

export interface BagEntity extends Identifiable {
  sessionId: string;
  bagNo: number;
  sidStart?: string;
  sidEnd?: string;
  countItems: number;
  status: "CREATED" | "ISSUED" | "RETURNED";
  createdAt: TimestampString;
}

export interface BookletEntity extends Identifiable {
  sessionId: string;
  userSessionId: string;
  bagNo?: number;
  seqInBag?: number;
  status: "PRINTED" | "PACKAGED" | "SCANNED" | "GRADED";
  createdAt: TimestampString;
}

export interface BookletSubjectEntity extends Identifiable {
  bookletId: string;
  subjectId: string;
  sessionId: string;
  sectionNo: number;
  qStart: number;
  qCount: number;
}

export interface GraderEntity extends Identifiable {
  campaignId?: string;
  name: string;
  active: boolean;
  accountId?: string;
}

export interface GradingSlotEntity extends Identifiable {
  bookletSubjectId: string;
  questionNo: number;
  graderOrder: number;
  status: "OPEN" | "ASSIGNED" | "COMPLETED" | "DISPUTED";
  graderId?: string;
}

export interface GradingScoreEntity extends Identifiable {
  slotId: string;
  score: number;
  enteredBy: string;
  enteredAt: TimestampString;
}

export interface RoleEntity extends Identifiable {
  code: string;
  name: string;
  active: boolean;
}

export interface AccountEntity extends Identifiable {
  username: string;
  passwordHash: string;
  fullName: string;
  email?: string;
  active: boolean;
  roleId: string;
}

export interface BagLogEntity extends Identifiable {
  sessionId?: string;
  bagNo?: number;
  action: "ISSUE" | "RETURN" | "TRANSFER";
  graderId?: string;
  operatorId?: string;
  atTime: TimestampString;
  note?: string;
}

export interface ActivityLogEntity extends Identifiable {
  eventTime: TimestampString;
  actorType: "ACCOUNT" | "GRADER" | "SYSTEM";
  accountId?: string;
  graderId?: string;
  action: string;
  objectType?: string;
  objectId?: string;
  details?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

type EntitiesMap = {
  users: UserEntity;
  subjects: SubjectEntity;
  examSites: ExamSiteEntity;
  campaignKeys: CampaignKeyEntity;
  examCampaigns: ExamCampaignEntity;
  sessions: SessionEntity;
  sessionSubjects: SessionSubjectEntity;
  examRooms: ExamRoomEntity;
  roomSeats: RoomSeatEntity;
  familyGroups: FamilyGroupEntity;
  userCampaigns: UserCampaignEntity;
  userSessions: UserSessionEntity;
  bags: BagEntity;
  booklets: BookletEntity;
  bookletSubjects: BookletSubjectEntity;
  graders: GraderEntity;
  gradingSlots: GradingSlotEntity;
  gradingScores: GradingScoreEntity;
  roles: RoleEntity;
  accounts: AccountEntity;
  bagLogs: BagLogEntity;
  activityLogs: ActivityLogEntity;
};

type TableKey = keyof EntitiesMap;
type AnyEntity = EntitiesMap[keyof EntitiesMap];

export type ExamEntitiesState = {
  [K in TableKey]: Record<string, EntitiesMap[K]>;
};

const createInitialState = (): ExamEntitiesState => ({
  users: {},
  subjects: {},
  examSites: {},
  campaignKeys: {},
  examCampaigns: {},
  sessions: {},
  sessionSubjects: {},
  examRooms: {},
  roomSeats: {},
  familyGroups: {},
  userCampaigns: {},
  userSessions: {},
  bags: {},
  booklets: {},
  bookletSubjects: {},
  graders: {},
  gradingSlots: {},
  gradingScores: {},
  roles: {},
  accounts: {},
  bagLogs: {},
  activityLogs: {},
});

const initialState = createInitialState();

const ensureBucket = <K extends TableKey>(
  state: ExamEntitiesState,
  table: K
): Record<string, EntitiesMap[K]> => state[table] as Record<string, EntitiesMap[K]>;

const upsertMany = (bucket: Record<string, AnyEntity>, entities: AnyEntity[]) => {
  entities.forEach((entity) => {
    bucket[entity.id] = { ...(bucket[entity.id] ?? {}), ...entity };
  });
};

const examEntitiesSlice = createSlice({
  name: "examEntities",
  initialState,
  reducers: {
    entitiesHydrated: (state, action: PayloadAction<Partial<ExamEntitiesState>>) => {
      Object.entries(action.payload).forEach(([table, value]) => {
        if (!value) return;
        const key = table as TableKey;
        state[key] = value as never;
      });
    },
    entitiesUpserted: (
      state,
      action: PayloadAction<{ table: TableKey; entities: AnyEntity[] }>
    ) => {
      const bucket = ensureBucket(state, action.payload.table);
      upsertMany(bucket as Record<string, AnyEntity>, action.payload.entities);
    },
    entityRemoved: (state, action: PayloadAction<{ table: TableKey; id: string }>) => {
      const bucket = ensureBucket(state, action.payload.table);
      delete bucket[action.payload.id];
    },
    tableReplaced: (state, action: PayloadAction<{ table: TableKey; entities: AnyEntity[] }>) => {
      const next: Record<string, AnyEntity> = {};
      action.payload.entities.forEach((entity) => {
        next[entity.id] = entity;
      });
      state[action.payload.table] = next as never;
    },
    tableCleared: (state, action: PayloadAction<TableKey>) => {
      state[action.payload] = {} as never;
    },
    entitiesCleared: () => createInitialState(),
  },
});

export const {
  entitiesHydrated,
  entitiesUpserted,
  entityRemoved,
  tableReplaced,
  tableCleared,
  entitiesCleared,
} = examEntitiesSlice.actions;

export { examEntitiesSlice };

type RootStateForEntities = { examEntities: ExamEntitiesState };

export const selectTableEntities =
  <K extends TableKey>(table: K) =>
  (state: RootStateForEntities): EntitiesMap[K][] =>
    Object.values(state.examEntities[table] as Record<string, EntitiesMap[K]>);

export const selectEntityById =
  <K extends TableKey>(table: K, id: string) =>
  (state: RootStateForEntities): EntitiesMap[K] | null =>
    (state.examEntities[table] as Record<string, EntitiesMap[K]>)[id] ?? null;

export const selectSessionsByCampaignId =
  (campaignId: string) =>
  (state: RootStateForEntities): SessionEntity[] =>
    Object.values(state.examEntities.sessions).filter(
      (session) => session.campaignId === campaignId
    );

export const selectSessionSubjectsBySessionId =
  (sessionId: string) =>
  (state: RootStateForEntities): SessionSubjectEntity[] =>
    Object.values(state.examEntities.sessionSubjects).filter(
      (item) => item.sessionId === sessionId
    );

export const selectRoomSeatsForRoom =
  (campaignId: string, siteId: string, roomCode: string) =>
  (state: RootStateForEntities): RoomSeatEntity[] =>
    Object.values(state.examEntities.roomSeats).filter(
      (seat) =>
        seat.campaignId === campaignId && seat.siteId === siteId && seat.roomCode === roomCode
    );

export const selectUserSessionsByCampaign =
  (campaignId: string) =>
  (state: RootStateForEntities): UserSessionEntity[] =>
    Object.values(state.examEntities.userSessions).filter(
      (session) => session.campaignId === campaignId
    );

export const selectBagsForSession =
  (sessionId: string) =>
  (state: RootStateForEntities): BagEntity[] =>
    Object.values(state.examEntities.bags).filter((bag) => bag.sessionId === sessionId);

export const selectBookletsBySession =
  (sessionId: string) =>
  (state: RootStateForEntities): BookletEntity[] =>
    Object.values(state.examEntities.booklets).filter((booklet) => booklet.sessionId === sessionId);

export const selectGradingSlotsForBookletSubject =
  (bookletSubjectId: string) =>
  (state: RootStateForEntities): GradingSlotEntity[] =>
    Object.values(state.examEntities.gradingSlots).filter(
      (slot) => slot.bookletSubjectId === bookletSubjectId
    );

export const selectGradingScoresForSlot =
  (slotId: string) =>
  (state: RootStateForEntities): GradingScoreEntity[] =>
    Object.values(state.examEntities.gradingScores).filter((score) => score.slotId === slotId);
