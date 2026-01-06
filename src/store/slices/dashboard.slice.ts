
import { RootState } from "../index"
import axios from 'axios';
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface ImportStatus {
    campaign_id: number;
    session_id: number;
    session_code: string;
    users_in_campaign: number;
    users_in_session: number;
    import_status: "NOT_IMPORTED" | "PARTIAL" | "IMPORTED";
}

export interface EncryptedStatus {
    campaign_id: number;
    session_id: number;
    session_code: string;
    total_users_in_session: number;
    encrypted_users: number;
    pending_users: number;
    encryption_status: "NOT_ENCRYPTED" | "PARTIAL" | "ENCRYPTED_ALL";
}

export interface DashboardState {
    status: "idle" | "loading" | "succeeded" | "failed";
    importStatus: ImportStatus[];
    encryptedStatus: EncryptedStatus[];
    error: string | null;
}
// คะแนนเฉลี่ยต่อหัวข้อ (subject_question)
export interface QuestionAverage {
    subject_id: number;
    subject_code: string;
    subject_name: string;
    question_id: number;
    question_no: number;
    label: string;
    avg_score: number;
}

// distribution ช่วงคะแนน เช่น 0–9, 10–19, ...
export interface ScoreBucket {
    bucket_label: string; // "0–9", "10–19", ...
    min_score: number;
    max_score: number;
    count: number;
}

// จำนวนถุงข้อสอบในแต่ละ session
export interface BagCountPerSession {
    campaign_id: number;
    session_id: number;
    session_code: string;
    bag_count: number;
}

// จำนวนผู้ตรวจใน campaign
export interface GraderCount {
    campaign_id: number;
    total_graders: number;
}

// จำนวนคีย์ใน campaign
export interface KeyCount {
    campaign_id: number;
    total_keys: number;
}



export const fetchDashboardStatus = createAsyncThunk<
    {
        importStatus: ImportStatus[];
        encryptedStatus: EncryptedStatus[];
        questionAverages: QuestionAverage[];
        scoreBuckets: ScoreBucket[];
        bagCounts: BagCountPerSession[];
        graderCount: GraderCount;
        keyCount: KeyCount;
    },
    number,
    { rejectValue: string }
>("dashboard/fetchStatus", async (campaignId, { rejectWithValue }) => {
    try {
        const res = await axios.get<{
            importStatus: ImportStatus[];
            encryptedStatus: EncryptedStatus[];
            questionAverages: QuestionAverage[];
            scoreBuckets: ScoreBucket[];
            bagCounts: BagCountPerSession[];
            graderCount: GraderCount;
            keyCount: KeyCount;
        }>(`/api/keys/dashboard/${campaignId}`);

        return res.data;
    } catch (e: any) {
        return rejectWithValue("โหลดสถานะ dashboard ไม่สำเร็จ");
    }
});



export interface DashboardState {
    status: "idle" | "loading" | "succeeded" | "failed";
    importStatus: ImportStatus[];
    encryptedStatus: EncryptedStatus[];

    questionAverages: QuestionAverage[];
    scoreBuckets: ScoreBucket[];
    bagCounts: BagCountPerSession[];
    graderCount: GraderCount | null;
    keyCount: KeyCount | null;

    error: string | null;
}
const initialState: DashboardState = {
    status: "idle",
    importStatus: [],
    encryptedStatus: [],

    questionAverages: [],
    scoreBuckets: [],
    bagCounts: [],
    graderCount: null,
    keyCount: null,

    error: null,
};



const dashboardSlice = createSlice({
    name: "dashboard",
    initialState,
    reducers: {
        clearDashboard: (state) => {
            state.status = "idle";
            state.importStatus = [];
            state.encryptedStatus = [];
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardStatus.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchDashboardStatus.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.importStatus = action.payload.importStatus;
                state.encryptedStatus = action.payload.encryptedStatus;
                state.questionAverages = action.payload.questionAverages;
                state.scoreBuckets = action.payload.scoreBuckets;
                state.bagCounts = action.payload.bagCounts;
                state.graderCount = action.payload.graderCount;
                state.keyCount = action.payload.keyCount;
            })

            .addCase(fetchDashboardStatus.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? "โหลดข้อมูลไม่สำเร็จ";
            });
    },
});

export const { clearDashboard } = dashboardSlice.actions;
export { dashboardSlice };

export const selectImportStatus = (state: RootState) =>
    state.dashboard.importStatus;
export const selectEncryptedStatus = (state: RootState) =>
    state.dashboard.encryptedStatus;
export const selectDashboardStatus = (state: RootState) =>
    state.dashboard.status;


