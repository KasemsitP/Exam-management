import { configureStore } from "@reduxjs/toolkit";
import { authSlice } from "./slices/auth.slice";
import { sessionsSlice } from "./slices/sessions.slice";
import { subjectsSlice } from "./slices/subjects.slice";
import { seatsSlice } from "./slices/seats.slice";
import { gradingSlice } from "./slices/grading.slice";
//import { campaignsSlice } from "./slices/campaigns.slice";
import { examDataSlice } from "./slices/examData.slice"
import { usersSlice } from "./slices/users.slice";
import { gradersSlice } from "./slices/graders.slice";
import { scoreReviewSlice } from "./slices/scoreReview.slice";
import { bagHandoverSlice } from "./slices/bagHandover.slice";
import { examRoomsSlice } from "./slices/examRooms.slice";
import { examEntitiesSlice } from "./slices/examEntities.slice";
import { keyManagementSlice } from "./slices/key.slice";
import { userSessionsSlice } from "./slices/userSessions.slice"; 
import {bagsSlice} from "./slices/bags.slice";
import { accountsSlice } from "./slices/account.slice";
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    sessions: sessionsSlice.reducer,
    subjects: subjectsSlice.reducer,
    seats: seatsSlice.reducer,
    bags: bagsSlice.reducer,
    grading: gradingSlice.reducer,
    //campaigns: campaignsSlice.reducer,
    examData: examDataSlice.reducer,
    users: usersSlice.reducer,
    graders: gradersSlice.reducer,
    scoreReview: scoreReviewSlice.reducer,
    bagHandover: bagHandoverSlice.reducer,
    examRooms: examRoomsSlice.reducer,
    examEntities: examEntitiesSlice.reducer,
    keyManagement: keyManagementSlice.reducer,
    userSessions: userSessionsSlice.reducer,
    accounts: accountsSlice.reducer,

    
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
     devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
