import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../index";

export type Role = "admin" | "manager" | "staff" | "grader";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  roles: Role[];
  manager_order?: number;
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

    if (isAuthUser(response.data)) {
      return response.data;
    }

    const profile = await axios.get<AuthUser>("/api/auth/me");
    if (isAuthUser(profile.data)) {
      return profile.data;
    }

    throw new Error("Missing user payload");
  } catch (err: unknown) { //  เปลี่ยนจาก any เป็น unknown
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
      const response = await axios.get<AuthUser>("/api/auth/me");
      return response.data;
    } catch (err: unknown) { //  เปลี่ยนจาก any เป็น unknown
      return null;
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    try {
      await axios.delete("/api/auth/logout");
    } catch (err) {
      //  บน Production อาจจะไม่ต้อง log error หรือส่งไปยังระบบเก็บ Log เช่น Sentry
    }
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
    clearAuth: (state) => {
      state.user = null;
      state.status = "unauthenticated";
      state.error = undefined;
      state.hydrated = true;
    },
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
        state.status = "error";
        state.error = action.payload ?? "Unable to login";
        state.hydrated = true;
      })
      // Hydrate
      .addCase(hydrateAuth.pending, (state) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.hydrated = true;
        if (action.payload) {
          state.user = action.payload;
          state.status = "authenticated";
        } else {
          state.user = null;
          state.status = "unauthenticated";
        }
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.user = null;
        state.status = "unauthenticated";
        state.hydrated = true;
        state.error = undefined;
      });
  },
});

export const { setUser, clearAuth, setAuthenticated } = authSlice.actions;
export { authSlice };

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;