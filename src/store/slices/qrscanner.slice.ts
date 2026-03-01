import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../index"; // (ต้อง Import RootState)

export interface QRverification {
  user_session_id: number;
  session_id: number;
  user_id: number;
  userCode: string;
  firstName: string;
  lastName: string;
  roomName: string | null;
  qr_payload: string | null;
  rowNo: number | null
  session_code: string
  subjectName: string
  campaignName: string

}


export interface userQR {
  user_session_id: number;
  session_id: number;
  user_id: number;
  userCode: string;
  firstName: string;
  lastName: string;
  roomName: string | null;
  qr_payload: string | null;
  rowNo: number | null
  session_code: string
  subjectName: string
  campaignName: string
}

interface VerifyQrPayload {
  qrPayload: string;   // (Base64 string)
  campaignId: string; // (e.g., "camp-1")
}

// (Backend ควรตอบกลับเป็น UserSessionData)
type VerifyQrResponse = QRverification

interface ProctorState {
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  scannedUser: QRverification | null;
}

const initialState: ProctorState = {
  status: "idle",
  error: null,
  scannedUser: null,
};

// ------------------------------
// Thunk (API Call)
// ------------------------------
export const verifyQrCodeThunk = createAsyncThunk<
  VerifyQrResponse,
  VerifyQrPayload,
  { rejectValue: string }
>(
  "proctor/verifyQr",
  async (payload, { rejectWithValue }) => {
    try {
      console.log(payload)
      const response = await axios.post("/api/verify/qr-payload", payload);
      console.log("Response from QR verification API:", response.data);
      return response.data as VerifyQrResponse;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message ?? "Verify failed");
      }
      return rejectWithValue("Verify failed");
    }
  }
);

// ------------------------------
// Slice
// ------------------------------
const qrSlice = createSlice({
  name: "qr",
  initialState,
  reducers: {
    clearScanResult: (state) => {
      state.status = "idle";
      state.error = null;
      state.scannedUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(verifyQrCodeThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.scannedUser = null;
      })
      .addCase(verifyQrCodeThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.scannedUser = action.payload;
      })
      .addCase(verifyQrCodeThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed";
      });
  },
});

export const { clearScanResult } = qrSlice.actions;

// ------------------------------
// Selectors
// ------------------------------
export const selectProctorScanState = (state: RootState) => state.qr;

export { qrSlice }