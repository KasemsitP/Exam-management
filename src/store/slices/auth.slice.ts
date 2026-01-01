import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../index";
export type Role = "admin" | "manager" | "staff" | "grader";


export interface AuthUser {
  id: string;
  name: string;
  username: string;
  roles: Role[];
  avatar?: string;
  password?: string;

}

interface AuthState {
  user: AuthUser | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated" | "error";
  hydrated: boolean;
  error?: string;
}

const isAuthUser = (value: unknown): value is AuthUser => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AuthUser>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.username === "string" &&
    Array.isArray(candidate.roles)
  );
};

export const login = createAsyncThunk<
  AuthUser,
  { username: string; password: string },
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const response = await axios.post<AuthUser | Record<string, unknown> | null>(
      "/api/auth/login",
      credentials
    );
  //  console.log(response)
    if (isAuthUser(response.data)) {
      return response.data;
    }
   

    const profile = await axios.get<AuthUser>("/api/auth/me");
    if (isAuthUser(profile.data)) {
      return profile.data;
    }
    console.log(profile.data)

    throw new Error("Missing user payload");

  } catch (err: any) {
    if (axios.isAxiosError(err) && err.response) {
      return rejectWithValue(err.response.data.message || "Invalid credentials");
    }
    return rejectWithValue("Unable to login");
  }
});


export const hydrateAuth = createAsyncThunk<AuthUser | null>(
  "auth/hydrate",
  async () => {
    try {
      // เปลี่ยนจากการอ่าน Cookie (ซึ่งตอนนี้ทำไม่ได้แล้ว)
      // มาเป็นการเรียก API /me ที่เราสร้างไว้
      const response = await axios.get<AuthUser>("/api/auth/me"); // (หรือ /me)
      return response.data; // ถ้าสำเร็จ (มี Session) ก็คืนค่า user

    } catch (err: any) {
      // ถ้า API ตอบ 401 (ไม่มี Session) หรือ Error
      return null;
    }
  }
);

// 6. [แนะนำ] สร้าง `logout` thunk
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    try {
      await axios.delete("/api/auth/logout"); // (หรือ /logout)
    } catch (err) {
      console.error("Logout failed", err);
    }
    // dispatch action `clearAuth` เพื่อเคลียร์ state ฝั่ง client
    dispatch(authSlice.actions.clearAuth());
  }
);

const initialState: AuthState = {
  user: null,
  status: "idle",
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.status = "authenticated";
      state.error = undefined;
    },
    // 7. เปลี่ยน `logout` reducer
    // เป็น action ง่ายๆ สำหรับ Clear State (จะถูกเรียกโดย logout thunk)
    clearAuth: (state) => {
      state.user = null;
      state.status = "unauthenticated";
      state.error = undefined;
      state.hydrated = true;
    },
    // setUser ยังคงเดิม (เผื่อใช้)
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
      state.status = action.payload ? "authenticated" : "idle";
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "authenticated";
        state.error = undefined;
        state.hydrated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "error";              // ❗ error เฉพาะ login
        state.error = action.payload ?? "Unable to login";
        state.hydrated = true;
      })
      // Hydrate
      .addCase(hydrateAuth.pending, (state) => {
        // จะใส่ loading หรือไม่ก็ได้ (แล้วแต่ UX)
        state.status = "loading";
        state.error = undefined;             // ❗ ไม่เอา error จากครั้งก่อนมาหลอก
      })
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.hydrated = true;

        if (action.payload) {
          state.user = action.payload;
          state.status = "authenticated";
        } else {
          // ✅ ไม่มี session = ยังไม่ login (ปกติ)
          state.user = null;
          state.status = "unauthenticated";
        }
      })
      .addCase(hydrateAuth.rejected, (state) => {
        // ✅ hydrate พัง/401 ก็ถือว่าไม่ได้ login (อย่าขึ้น toast ล็อกอินผิด)
        state.user = null;
        state.status = "unauthenticated";
        state.hydrated = true;
        state.error = undefined;
      });

  },
});

// 8. Export action ใหม่
export const { setUser, clearAuth, setAuthenticated } = authSlice.actions;
export { authSlice };

// Selectors (ยังคงเดิม)
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;
