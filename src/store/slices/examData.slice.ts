import { createSlice, createAsyncThunk, nanoid, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

export interface CampaignSubject {
  id: string;
  code: string;
  name: string;
  questions: number;
  bookletRange: string;
  startTime: string;
  endTime: string;
}

export interface CampaignSession {
  id: string;
  label: string;
  examDate: string;
  note?: string;
  subjects: CampaignSubject[];
}

export interface ExamCampaign {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  description?: string;
  sessions: CampaignSession[];
  note?: string;
}

type ApiBoolean = boolean | 0 | 1;

interface ApiCampaign {
  id: number;
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: ApiBoolean;
  note?: string;
}

interface ApiSession {
  id: number;
  session_code: string;
  exam_date: string;
  campaign_id: number;
  site_id: number;
  day_no: number;
  title?: string;
  note?: string;
}

interface ApiSubject {
  session_id: number;
  subject_id: number;
  start_at: string;
  end_at: string;
  question_count: number;
  question_range?: string;
  order_no: number;
  code: string;
  name: string;
}

interface ExamDataApiPayload {
  campaigns: ApiCampaign[];
  sessions: ApiSession[];
  subjects: ApiSubject[];
}

const toBool = (value: ApiBoolean): boolean =>
  typeof value === "boolean" ? value : value === 1;

const toTime = (timestamp: string): string => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    // Fallback to substring HH:mm if timestamp is not ISO
    const parts = timestamp.split("T");
    if (parts[1]) {
      return parts[1].slice(0, 5);
    }
    return timestamp.slice(0, 5);
  }
  return date.toISOString().slice(11, 16);
};

const buildCampaignId = (id: number) => `camp-${id}`;
const buildSessionId = (id: number) => `sess-${id}`;
const buildSubjectId = (sessionId: number, subjectId: number) =>
  `sess-${sessionId}-sub-${subjectId}`;
const parseCampaignId = (id: string): number => Number(id.replace("camp-", ""));
const parseSessionId = (id: string): number => Number(id.replace("sess-", ""));
const parseSubjectCompositeId = (id: string) => {
  const [sessionPart, subjectPart] = id.split("-sub-");
  const sessionId = parseSessionId(sessionPart);
  const subjectId = Number(subjectPart);
  return { sessionId, subjectId };
};

const mapApiSubject = (subject: ApiSubject): CampaignSubject => ({
  id: buildSubjectId(subject.session_id, subject.subject_id),
  code: subject.code,
  name: subject.name,
  questions: subject.question_count,
  bookletRange: subject.question_range ?? "",
  startTime: toTime(subject.start_at),
  endTime: toTime(subject.end_at),
});

const mapApiSessionToCampaignSession = (session: ApiSession): CampaignSession => ({
  id: buildSessionId(session.id),
  label: session.title ?? session.session_code,
  examDate: session.exam_date,
  note: session.note,
  subjects: [],
});

const mapApiPayloadToCampaigns = (payload: ExamDataApiPayload): ExamCampaign[] => {
  const sessionsByCampaign = new Map<number, CampaignSession[]>();
  const sessionIndex = new Map<number, CampaignSession>();

  payload.sessions.forEach((session) => {
    const converted = mapApiSessionToCampaignSession(session);
    const bucket = sessionsByCampaign.get(session.campaign_id) ?? [];
    bucket.push(converted);
    sessionsByCampaign.set(session.campaign_id, bucket);
    sessionIndex.set(session.id, converted);
  });

  payload.subjects.forEach((subject) => {
    const targetSession = sessionIndex.get(subject.session_id);
    if (!targetSession) return;
    targetSession.subjects.push(mapApiSubject(subject));
    targetSession.subjects.sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  return payload.campaigns.map<ExamCampaign>((campaign) => {
    const sessions = (sessionsByCampaign.get(campaign.id) ?? []).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
    return {
      id: buildCampaignId(campaign.id),
      code: campaign.code,
      name: campaign.name,
      startDate: campaign.start_date,
      endDate: campaign.end_date,
      isActive: toBool(campaign.is_active),
      description: campaign.note,
      note: campaign.note,
      sessions,
    };
  });
};

export const fetchInitialExamData = createAsyncThunk<
  ExamCampaign[],
  void,
  { rejectValue: string }
>("examData/fetchInitial", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get<ExamDataApiPayload>("/api/exam-data");
    return mapApiPayloadToCampaigns(response.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.message ?? "Failed to fetch exam data");
    }
    return rejectWithValue("Failed to fetch exam data");
  }
});

interface CreateCampaignInput {
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  description?: string;
}

export const createCampaignThunk = createAsyncThunk<
  ExamCampaign,
  CreateCampaignInput,
  { rejectValue: string }
>("examData/createCampaign", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.post<ApiCampaign>("/api/campaigns", {
      code: payload.code,
      name: payload.name,
      start_date: payload.startDate,
      end_date: payload.endDate,
      is_active: payload.isActive,
      note: payload.description,
    });
    return {
      id: buildCampaignId(response.data.id),
      code: response.data.code,
      name: response.data.name,
      startDate: response.data.start_date,
      endDate: response.data.end_date,
      isActive: toBool(response.data.is_active),
      description: response.data.note,
      note: response.data.note,
      sessions: [],
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.message ?? "Failed to create campaign");
    }
    return rejectWithValue("Failed to create campaign");
  }
});

export const deleteCampaignThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("examData/deleteCampaign", async (campaignId, { rejectWithValue }) => {
  try {
    await axios.delete(`/api/campaigns/${parseCampaignId(campaignId)}`);
    return campaignId;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.message ?? "Failed to delete campaign");
    }
    return rejectWithValue("Failed to delete campaign");
  }
});

interface CreateSessionInput {
  campaignId: string;
  label: string;
  examDate: string;
  note?: string;
  siteId?: number;
  dayNo?: number;
}

export const createSessionThunk = createAsyncThunk<
  { campaignId: string; session: CampaignSession },
  CreateSessionInput,
  { rejectValue: string }
>("examData/createSession", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.post<ApiSession>("/api/sessions", {
      campaign_id: parseCampaignId(payload.campaignId),
      session_code: payload.label,
      title: payload.label,
      exam_date: payload.examDate,
      site_id: payload.siteId ?? 1,
      day_no: payload.dayNo ?? 1,
    });
    return {
      campaignId: payload.campaignId,
      session: mapApiSessionToCampaignSession(response.data),
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.message ?? "Failed to create session");
    }
    return rejectWithValue("Failed to create session");
  }
});

export const deleteSessionThunk = createAsyncThunk<
  { campaignId: string; sessionId: string },
  { campaignId: string; sessionId: string },
  { rejectValue: string }
>("examData/deleteSession", async ({ campaignId, sessionId }, { rejectWithValue }) => {
  try {
    await axios.delete(`/api/sessions/${parseSessionId(sessionId)}`);
    return { campaignId, sessionId };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.message ?? "Failed to delete session");
    }
    return rejectWithValue("Failed to delete session");
  }
});

interface CreateSubjectInput {
  campaignId: string;
  sessionId: string;
  sessionDate: string | undefined;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  questions: number;
  bookletRange: string;
  orderNo?: number;
}

export const createSubjectThunk = createAsyncThunk<
  { campaignId: string; sessionId: string; subject: CampaignSubject },
  CreateSubjectInput,
  { rejectValue: string }
>("examData/createSubject", async (payload, { rejectWithValue }) => {
  const toDateTime = (date: string | undefined, time: string) => {
    if (!date) return time;
    const normalized = time.length === 5 ? `${time}:00` : time;
    return `${date} ${normalized}`;
  };
  try {
    const response = await axios.post<ApiSubject>("/api/session-subjects", {
      session_id: parseSessionId(payload.sessionId),
      code: payload.code,
      name: payload.name,
      start_at: toDateTime(payload.sessionDate, payload.startTime),
      end_at: toDateTime(payload.sessionDate, payload.endTime),
      question_count: payload.questions,
      question_range: payload.bookletRange,
      order_no: payload.orderNo ?? 1,
    });
    return {
      campaignId: payload.campaignId,
      sessionId: payload.sessionId,
      subject: mapApiSubject(response.data),
    };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.message ?? "Failed to create subject");
    }
    return rejectWithValue("Failed to create subject");
  }
});

export const deleteSubjectThunk = createAsyncThunk<
  { campaignId: string; sessionId: string; subjectId: string },
  { campaignId: string; sessionId: string; subjectId: string },
  { rejectValue: string }
>("examData/deleteSubject", async ({ campaignId, sessionId, subjectId }, { rejectWithValue }) => {
  try {
    const composite = parseSubjectCompositeId(subjectId);
    await axios.delete(`/api/session-subjects/${composite.sessionId}/${composite.subjectId}`);
    return { campaignId, sessionId, subjectId };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.message ?? "Failed to delete subject");
    }
    return rejectWithValue("Failed to delete subject");
  }
});

interface ExamDataState {
  list: ExamCampaign[];
  activeCampaignId: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ExamDataState = {
  list: [],
  activeCampaignId: null,
  status: "idle",
  error: null,
};

const examDataSlice = createSlice({
  name: "examData",
  initialState,
  reducers: {
    campaignAdded: {
      prepare: (
        payload: Omit<ExamCampaign, "id" | "sessions"> & { sessions?: CampaignSession[] }
      ) => ({
        payload: {
          ...payload,
          id: `camp-${nanoid(6)}`,
          isActive: payload.isActive ?? true,
          sessions: payload.sessions ?? [],
        },
      }),
      reducer: (state, action: PayloadAction<ExamCampaign>) => {
        state.list.push(action.payload);
        state.activeCampaignId = action.payload.id;
      },
    },
    campaignUpdated: (state, action: PayloadAction<ExamCampaign>) => {
      const index = state.list.findIndex((campaign) => campaign.id === action.payload.id);
      if (index >= 0) {
        state.list[index] = action.payload;
      }
    },
    campaignRemoved: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter((campaign) => campaign.id !== action.payload);
      if (state.activeCampaignId === action.payload) {
        state.activeCampaignId = state.list[0]?.id ?? null;
      }
    },
    campaignSelected: (state, action: PayloadAction<string | null>) => {
      state.activeCampaignId = action.payload;
    },
    sessionAdded: {
      prepare: (
        payload: { campaignId: string } & Omit<CampaignSession, "id" | "subjects">
      ) => ({
        payload: {
          ...payload,
          id: `sess-${nanoid(6)}`,
          subjects: [],
        },
      }),
      reducer: (
        state,
        action: PayloadAction<{ campaignId: string } & CampaignSession>
      ) => {
        const campaign = state.list.find((item) => item.id === action.payload.campaignId);
        if (campaign) {
          campaign.sessions.push({
            id: action.payload.id,
            label: action.payload.label,
            examDate: action.payload.examDate,
            note: action.payload.note,
            subjects: action.payload.subjects,
          });
        }
      },
    },
    sessionUpdated: (
      state,
      action: PayloadAction<{ campaignId: string; session: CampaignSession }>
    ) => {
      const campaign = state.list.find((item) => item.id === action.payload.campaignId);
      if (!campaign) return;
      const index = campaign.sessions.findIndex(
        (session) => session.id === action.payload.session.id
      );
      if (index >= 0) {
        campaign.sessions[index] = action.payload.session;
      }
    },
    sessionRemoved: (state, action: PayloadAction<{ campaignId: string; sessionId: string }>) => {
      const campaign = state.list.find((item) => item.id === action.payload.campaignId);
      if (!campaign) return;
      campaign.sessions = campaign.sessions.filter(
        (session) => session.id !== action.payload.sessionId
      );
    },
    subjectAdded: {
      prepare: (
        payload: { campaignId: string; sessionId: string } & Omit<CampaignSubject, "id">
      ) => ({
        payload: { ...payload, id: `sub-${nanoid(6)}` },
      }),
      reducer: (
        state,
        action: PayloadAction<{ campaignId: string; sessionId: string } & CampaignSubject>
      ) => {
        const campaign = state.list.find((item) => item.id === action.payload.campaignId);
        const session = campaign?.sessions.find((item) => item.id === action.payload.sessionId);
        if (session) {
          session.subjects.push({
            id: action.payload.id,
            code: action.payload.code,
            name: action.payload.name,
            questions: action.payload.questions,
            bookletRange: action.payload.bookletRange,
            startTime: action.payload.startTime,
            endTime: action.payload.endTime,
          });
        }
      },
    },
    subjectUpdated: (
      state,
      action: PayloadAction<{
        campaignId: string;
        sessionId: string;
        subject: CampaignSubject;
      }>
    ) => {
      const campaign = state.list.find((item) => item.id === action.payload.campaignId);
      const session = campaign?.sessions.find((item) => item.id === action.payload.sessionId);
      if (!session) return;
      const index = session.subjects.findIndex((subject) => subject.id === action.payload.subject.id);
      if (index >= 0) {
        session.subjects[index] = action.payload.subject;
      }
    },
    subjectRemoved: (
      state,
      action: PayloadAction<{ campaignId: string; sessionId: string; subjectId: string }>
    ) => {
      const campaign = state.list.find((item) => item.id === action.payload.campaignId);
      const session = campaign?.sessions.find((item) => item.id === action.payload.sessionId);
      if (!session) return;
      session.subjects = session.subjects.filter((subject) => subject.id !== action.payload.subjectId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialExamData.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchInitialExamData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload;
        state.activeCampaignId = action.payload[0]?.id ?? null;
      })
      .addCase(fetchInitialExamData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to fetch exam data";
      })
      .addCase(createCampaignThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(createCampaignThunk.fulfilled, (state, action) => {
        state.list.push(action.payload);
        state.activeCampaignId = action.payload.id;
      })
      .addCase(createCampaignThunk.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to create campaign";
      })
      .addCase(deleteCampaignThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteCampaignThunk.fulfilled, (state, action) => {
        state.list = state.list.filter((campaign) => campaign.id !== action.payload);
        if (state.activeCampaignId === action.payload) {
          state.activeCampaignId = state.list[0]?.id ?? null;
        }
      })
      .addCase(deleteCampaignThunk.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to delete campaign";
      })
      .addCase(createSessionThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(createSessionThunk.fulfilled, (state, action) => {
        const campaign = state.list.find((item) => item.id === action.payload.campaignId);
        if (campaign) {
          campaign.sessions.push(action.payload.session);
        }
      })
      .addCase(createSessionThunk.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to create session";
      })
      .addCase(deleteSessionThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteSessionThunk.fulfilled, (state, action) => {
        const campaign = state.list.find((item) => item.id === action.payload.campaignId);
        if (!campaign) return;
        campaign.sessions = campaign.sessions.filter(
          (session) => session.id !== action.payload.sessionId
        );
      })
      .addCase(deleteSessionThunk.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to delete session";
      })
      .addCase(createSubjectThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(createSubjectThunk.fulfilled, (state, action) => {
        const campaign = state.list.find((item) => item.id === action.payload.campaignId);
        const session = campaign?.sessions.find((item) => item.id === action.payload.sessionId);
        if (session) {
          session.subjects.push(action.payload.subject);
          session.subjects.sort((a, b) => a.startTime.localeCompare(b.startTime));
        }
      })
      .addCase(createSubjectThunk.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to create subject";
      })
      .addCase(deleteSubjectThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteSubjectThunk.fulfilled, (state, action) => {
        const campaign = state.list.find((item) => item.id === action.payload.campaignId);
        const session = campaign?.sessions.find((item) => item.id === action.payload.sessionId);
        if (!session) return;
        session.subjects = session.subjects.filter((subject) => subject.id !== action.payload.subjectId);
      })
      .addCase(deleteSubjectThunk.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to delete subject";
      });
  },
});

export const {
  campaignAdded,
  campaignRemoved,
  campaignSelected,
  campaignUpdated,
  sessionAdded,
  sessionRemoved,
  sessionUpdated,
  subjectAdded,
  subjectRemoved,
  subjectUpdated,
} = examDataSlice.actions;

export { examDataSlice };

export const selectCampaigns = (state: { examData: ExamDataState }) => state.examData.list;

export const selectActiveCampaign = (state: { examData: ExamDataState }) =>
  state.examData.list.find((campaign) => campaign.id === state.examData.activeCampaignId) ?? null;

export const selectSessionsForCampaign =
  (campaignId: string | null) =>
  (state: { examData: ExamDataState }) =>
    campaignId
      ? state.examData.list.find((campaign) => campaign.id === campaignId)?.sessions ?? []
      : [];

export const selectActiveCampaignSessions = (state: { examData: ExamDataState }) =>
  selectActiveCampaign(state)?.sessions ?? [];

export const selectSessionById =
  (campaignId: string, sessionId: string) =>
  (state: { examData: ExamDataState }) =>
    state.examData.list
      .find((campaign) => campaign.id === campaignId)
      ?.sessions.find((session) => session.id === sessionId) ?? null;

export const selectSubjectsForSession =
  (campaignId: string, sessionId: string) =>
  (state: { examData: ExamDataState }) =>
    state.examData.list
      .find((campaign) => campaign.id === campaignId)
      ?.sessions.find((session) => session.id === sessionId)?.subjects ?? [];

export const selectExamDataStatus = (state: { examData: ExamDataState }) => state.examData.status;
export const selectExamDataError = (state: { examData: ExamDataState }) => state.examData.error ?? null;
