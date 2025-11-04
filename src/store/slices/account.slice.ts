import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// ⭐️ (1) Interfaces
// (อ้างอิงจาก Schema 'accounts' และ 'roles' ของคุณ)
export interface Role {
  id: number;
  code: string;
  name: string;
}

export interface Account {
  id: number;
  username: string;
  full_name: string;
  email: string;
  active: boolean;
  role_id: number;
  role_name?: string; // (ได้จาก JOIN)
  role_code?: string; // (ได้จาก JOIN)
}

// (Interface สำหรับ State)
interface AccountsState {
  accounts: Record<string, Account>; // (เก็บแบบ Object)
  roles: Role[]; // (เก็บ Role ทั้งหมด)
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AccountsState = {
  accounts: {},
  roles: [],
  status: "idle",
  error: null,
};

// ⭐️ (2) Thunks (API Calls)

// (GET /api/accounts - API ที่เราต้องสร้าง)
export const fetchAccountsThunk = createAsyncThunk<
  Account[],
  void,
  { rejectValue: string }
>("accounts/fetch", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("/api/accounts");
    return response.data as Account[];
  } catch (error: unknown) {
    // ... (Error handling)
    return rejectWithValue("Failed to fetch accounts");
  }
});

// (GET /api/roles - API ที่เราต้องสร้าง)
export const fetchRolesThunk = createAsyncThunk<
  Role[],
  void,
  { rejectValue: string }
>("accounts/fetchRoles", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("/api/roles");
    return response.data as Role[];
  } catch (error: unknown) {
    // ... (Error handling)
    return rejectWithValue("Failed to fetch roles");
  }
});

// (POST /api/auth/register - ใช้ API ที่คุณมีอยู่)
// (Interface นี้ต้องตรงกับ AuthController.register)
interface CreateAccountPayload {
  username: string;
  password: string;
  full_name: string;
  email: string;
  role: number; // (ตาม AuthController.register)
}
export const createAccountThunk = createAsyncThunk<
  Account, // (สมมติว่า API Register ควร Return Account ใหม่)
  CreateAccountPayload,
  { rejectValue: string }
>(
  "accounts/create",
  async (payload, { rejectWithValue }) => {
    try {
      // ⭐️ (ใช้ Endpoint ที่คุณมีอยู่)
      const response = await axios.post("/api/auth/register", payload);
      // (หมายเหตุ: API register ของคุณไม่ได้ Return Account ใหม่)
      // (เราจึงต้องสร้างข้อมูลจำลองส่งกลับไปที่ Reducer)
      return {
        ...payload,
        id: Date.now(), // (ID จำลอง, ควรให้ API Return ID จริง)
        active: true,
        role_id: payload.role,
      } as Account;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message ?? "Create failed");
      }
      return rejectWithValue("Create failed");
    }
  }
);

// (PUT /api/accounts/:id - API ที่เราต้องสร้าง)
interface UpdateAccountPayload {
  id: number;
  full_name: string;
  email: string;
  role_id: number;
  active: boolean;
  newPassword?: string; // (ส่งรหัสใหม่ถ้ามี)
}
export const updateAccountThunk = createAsyncThunk<
  Account, // (Backend ควรอัปเดตและ Return ข้อมูลใหม่)
  UpdateAccountPayload,
  { rejectValue: string }
>(
  "accounts/update",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/accounts/${payload.id}`, payload);
      return response.data as Account;
    } catch (error: unknown) {
      // ... (Error handling)
      return rejectWithValue("Update failed");
    }
  }
);

// (DELETE /api/accounts/:id - API ที่เราต้องสร้าง)
export const deleteAccountThunk = createAsyncThunk<
  number, // (Return ID ที่ถูกลบ)
  number, // (รับ ID ที่จะลบ)
  { rejectValue: string }
>("accounts/delete", async (id, { rejectWithValue }) => {
  try {
    await axios.delete(`/api/accounts/${id}`);
    return id;
  } catch (error: unknown) {
      // ... (Error handling)
      return rejectWithValue("Delete failed");
    }
});

// ⭐️ (3) Slice
const accountsSlice = createSlice({
  name: "accounts",
  initialState,
  reducers: {
    // (Reducers ปกติ ถ้ามี)
  },
  extraReducers: (builder) => {
    builder
      // (Fetch Accounts)
      .addCase(fetchAccountsThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAccountsThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        const newAccounts: Record<string, Account> = {};
        action.payload.forEach((acc) => {
          newAccounts[acc.id] = acc;
        });
        state.accounts = newAccounts;
      })
      .addCase(fetchAccountsThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed";
      })
      // (Fetch Roles)
      .addCase(fetchRolesThunk.fulfilled, (state, action) => {
        state.roles = action.payload;
      })
      // (Create Account)
      .addCase(createAccountThunk.fulfilled, (state, action) => {
        const newAccount = action.payload;
        state.accounts[newAccount.id] = newAccount;
      })
      // (Update Account)
      .addCase(updateAccountThunk.fulfilled, (state, action) => {
        const updatedAccount = action.payload;
        state.accounts[updatedAccount.id] = updatedAccount;
      })
      // (Delete Account)
      .addCase(deleteAccountThunk.fulfilled, (state, action) => {
        const id = action.payload;
        delete state.accounts[id];
      });
  },
});

// ⭐️ (4) Selectors
type LocalRootState = {
  accounts: AccountsState;
};

export const selectAccountsSlice = (state: LocalRootState) => state.accounts;
export const selectAllAccounts = (state: LocalRootState) =>
  Object.values(state.accounts.accounts).sort((a, b) => a.id - b.id);
export const selectAllRoles = (state: LocalRootState) => state.accounts.roles;

export { accountsSlice };