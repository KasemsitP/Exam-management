import { createSlice, createAsyncThunk, PayloadAction, createSelector } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../index"
import { DeleteCamp } from "../../utils/camp"


export interface CrmGrader {
  grader_id: number;
  account_id: number;
  campaign_id: number;

  session_id: number;
  session_code: string;
  exam_date: string;

  subject_id: number;
  subject_code: string;
  subject_name: string;

  grader_name: string;

  subject_question_id: number;   
  question_no: number
  question_label?: string;       
}
// export interface AssignedSubject {
//   sessionId: number;
//   sessionLabel: string;
//   subjectId: number;
//   subjectName: string;
//   questionNo: number;
//   seatNo: number; 
// }

interface GradersState {
  byCampaign: { [campaignId: number]: CrmGrader[] };
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  assignmentStatus: "idle" | "loading" | "succeeded" | "failed";
  assignmentError: string | null;
}

const initialState: GradersState = {
  byCampaign: {},
  status: "idle",
  error: null,
  assignmentStatus: "idle",
  assignmentError: null,
};

export const fetchGradersForCampaignThunk = createAsyncThunk<
  CrmGrader[],
  number,
  { rejectValue: string }
>(
  "graders/fetchForCampaign",
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/graders/campaign/${DeleteCamp(campaignId.toString())}`);
      const mappedAssignments: CrmGrader[] = response.data.map((g: any) => ({
        grader_id: g.grader_id,
        account_id: g.account_id,
        campaign_id: g.campaign_id,

        session_id: g.session_id,
        session_code: g.session_code,
        exam_date: g.exam_date,
        grader_name: g.grader_name,
        subject_id: g.subject_id,
        subject_code: g.subject_code,
        subject_name: g.subject_name,
        question_label : g.question_label,
        question_no: g.question_no,
      }));
      console.log(mappedAssignments)
      return mappedAssignments;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch graders");
    }
  }
);


// export const fetchActiveAssignmentThunk = createAsyncThunk<
//   AssignedSubject,
//   number,
//   { rejectValue: string }
// >(
//   "graders/fetchActiveAssignment",
//   async (campaignId, { rejectWithValue }) => {
//     try {
//       // (API นี้ถูกต้อง - Controller ใช้ accountId จาก Auth)
//       const response = await axios.get(`/grading/my-assignment`, {
//         params: { campaignId }
//       });
//       return response.data;
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data?.message || "Failed to fetch assignment");
//     }
//   }
// );

// (Slice - เติมเต็ม)
const gradersSlice = createSlice({
  name: "graders",
  initialState,
  reducers: {
    clearActiveAssignment: (state) => {
      state.assignmentStatus = "idle";
      state.assignmentError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // (Thunk 1: Fetch Graders)
      .addCase(fetchGradersForCampaignThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchGradersForCampaignThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        const campaignId = action.meta.arg;
        state.byCampaign[campaignId] = action.payload;
      })
      .addCase(fetchGradersForCampaignThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })

    // (Thunk 2: Fetch Assignment)
    // .addCase(fetchActiveAssignmentThunk.pending, (state) => {
    //   state.assignmentStatus = "loading";
    // })
    // .addCase(fetchActiveAssignmentThunk.fulfilled, (state, action: PayloadAction<AssignedSubject>) => {
    //   state.assignmentStatus = "succeeded";
    //   state.activeAssignment = action.payload;
    //   state.assignmentError = null;
    // })
    // .addCase(fetchActiveAssignmentThunk.rejected, (state, action) => {
    //   state.assignmentStatus = "failed";
    //   state.assignmentError = action.payload as string;
    // });
  },
});

export const { clearActiveAssignment } = gradersSlice.actions;
export const selectGradersState = (state: RootState) => state.graders;

export const selectGradersForCampaign = (campaignId: number | null) =>
  createSelector(
    [selectGradersState], // (Input selector)
    (gradersState) => {   // (Combiner)
      if (!campaignId) return [];
      return gradersState.byCampaign[campaignId] || [];
    }
  );

export const selectGradersStatus = createSelector(
  [selectGradersState],
  (gradersState) => gradersState.status
);


export const selectAssignmentStatus = createSelector(
  [selectGradersState],
  (gradersState) => gradersState.assignmentStatus
);

export const selectAssignmentError = createSelector(
  [selectGradersState],
  (gradersState) => gradersState.assignmentError
);

export const selectAssignmentsForGrader = (
  campaignId: number | null,
  accountId: number | null
) =>
  createSelector([selectGradersState], (gradersState) => {
    if (!campaignId || !accountId) return [];

    const allForCampaign = gradersState.byCampaign[campaignId] || [];

    return allForCampaign.filter(
      (row) => row.account_id === accountId
    );
  });


// export const selectGradersState = (state: RootState) => state.graders;

// export const selectGradersForCampaign = (state: RootState, campaignId: number | null) => {
//   if (!campaignId) return [];
//   return selectGradersState(state).byCampaign[campaignId] || [];
// };

// export const selectGradersStatus = (state: RootState) =>
//   selectGradersState(state).status;

// export const selectAssignmentStatus = (state: RootState) =>
//   selectGradersState(state).assignmentStatus;

// export const selectAssignmentError = (state: RootState) =>
//   selectGradersState(state).assignmentError;


export { gradersSlice };