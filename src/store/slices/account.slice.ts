import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../index";

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
  role_name?: string; // จาก JOIN
  role_code?: string; // จาก JOIN
  campaign_id?: number
}

interface AccountsState {
  accounts: Record<string, Account>; // all accounts (admin/staff/ฯลฯ)
  roles: Role[];
  graders: Account[];                // รายชื่อผู้ตรวจที่ filter ตาม campaign แล้ว
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;

  gradersStatus: "idle" | "loading" | "succeeded" | "failed";
  gradersError: string | null;
}

const initialState: AccountsState = {
  accounts: {},
  roles: [],
  graders: [],
  status: "idle",
  error: null,
  gradersStatus: "idle",
  gradersError: null,
};

/** ดึงบัญชีทุกประเภท (ไม่ filter campaign) */
export const fetchAccountsThunk = createAsyncThunk<
  Account[],
  void,
  { rejectValue: string }
>("accounts/fetch", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("/api/accounts");
    return response.data as Account[];
  } catch {
    return rejectWithValue("Failed to fetch accounts");
  }
});

export const fetchAccountsGradersThunk = createAsyncThunk<
  Account[],
  number,
  { rejectValue: string }
>(
  "accounts/fetchGradersByCampaign",
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/accounts/graders/${campaignId}`);
      console.log(response)
      return response.data as Account[];
    } catch {
      return rejectWithValue("Failed to fetch graders for this campaign");
    }
  }
);

/** ดึง Roles ทั้งหมด */
export const fetchRolesThunk = createAsyncThunk<
  Role[],
  void,
  { rejectValue: string }
>("accounts/fetchRoles", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get("/api/roles");
    return response.data as Role[];
  } catch {
    return rejectWithValue("Failed to fetch roles");
  }
});

interface CreateAccountPayload {
  username: string;
  password: string;
  full_name: string;
  email: string;
  role: number; // role_id
  campaignId?: number
}

export const createAccountThunk = createAsyncThunk<
  Account,
  CreateAccountPayload,
  { rejectValue: string }
>("accounts/create", async (payload, { rejectWithValue }) => {
  try {


    const username = payload.username.trim();

    const usernameRegex = /^[a-zA-Z0-9]{4,20}$/;

    if (!usernameRegex.test(username)) {
      return rejectWithValue(
        "Username ต้องมีเฉพาะตัวอักษรอังกฤษและตัวเลข (4-20 ตัว)"
      );
    }
    const response = await axios.post("/api/auth/register", payload);
    const newId = response.data.id;

    const account: Account = {
      id: newId,
      username: payload.username,
      full_name: payload.full_name,
      email: payload.email ?? "",
      role_id: payload.role,
      active: true,
      campaign_id: payload.campaignId
    };

    return account;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.message ?? "Create failed");
    }
    return rejectWithValue("Create failed");
  }
});

export const RevokeAccountThunk = createAsyncThunk<
  Account,
  number,
  { rejectValue: string }
>(
  "accounts/revoke",
  async (accountId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/api/auth/accounts/${accountId}/revoke`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message ?? "revoke failed");
      }
      return rejectWithValue("revoke failed");
    }
  }
);


export const UnrevokeAccountThunk = createAsyncThunk<
  Account,
  number,
  { rejectValue: string }
>(
  "accounts/unrevoke",
  async (accountId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/api/auth/accounts/${accountId}/unrevoke`);
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message ?? "unrevoke failed");
      }
      return rejectWithValue("unrevoke failed");
    }
  }
);

interface UpdateAccountPayload {
  id: number;
  full_name: string;
  email: string;
  role_id: number;
  active: boolean;
  newPassword?: string;
}

export const updateAccountThunk = createAsyncThunk<
  Account,
  UpdateAccountPayload,
  { rejectValue: string }
>("accounts/update", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.put(`/api/accounts/${payload.id}`, payload);
    return response.data as Account;
  } catch {
    return rejectWithValue("Update failed");
  }
});

export const deleteAccountThunk = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("accounts/delete", async (id, { rejectWithValue }) => {
  try {
    await axios.delete(`/api/accounts/${id}`);
    return id;
  } catch {
    return rejectWithValue("Delete failed");
  }
});

const accountsSlice = createSlice({
  name: "accounts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // ---------- FETCH ACCOUNTS (ทั้งหมด) ----------
    builder
      .addCase(fetchAccountsThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
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
      });

    // ---------- FETCH ROLES ----------
    builder.addCase(fetchRolesThunk.fulfilled, (state, action) => {
      state.roles = action.payload;
    });

    // ---------- CREATE ----------
    builder.addCase(createAccountThunk.fulfilled, (state, action) => {
      const newAccount = action.payload;
      state.accounts[newAccount.id] = newAccount;
    });

    // ---------- UPDATE ----------
    builder.addCase(updateAccountThunk.fulfilled, (state, action) => {
      const updatedAccount = action.payload;
      state.accounts[updatedAccount.id] = updatedAccount;
    });

    // ---------- DELETE ----------
    builder.addCase(deleteAccountThunk.fulfilled, (state, action) => {
      const id = action.payload;
      delete state.accounts[id];
    });

    // ---------- FETCH GRADERS BY CAMPAIGN ----------
    builder
      .addCase(fetchAccountsGradersThunk.pending, (state) => {
        state.gradersStatus = "loading";
        state.gradersError = null;
      })
      .addCase(fetchAccountsGradersThunk.fulfilled, (state, action) => {
        state.gradersStatus = "succeeded";
        // backend ส่งมาเฉพาะผู้ตรวจของ campaign นั้นแล้ว → เก็บตรง ๆ
        state.graders = action.payload;
      })
      .addCase(fetchAccountsGradersThunk.rejected, (state, action) => {
        state.gradersStatus = "failed";
        state.gradersError = action.payload ?? "Failed to fetch graders";
        state.graders = [];
      });
  },
});

// ---------- SELECTORS ----------
export const selectAccountsSlice = (state: RootState) => state.accounts;

export const selectAllAccounts = (state: RootState) => {
  return Object.values(state.accounts.accounts)
    .filter((acc) => acc.role_code !== "GRADER") // ตัดผู้ตรวจออก
    .sort((a, b) => a.id - b.id);
};

export const selectAllRoles = (state: RootState) => {
  return state.accounts.roles.filter((role) => role.code !== "GRADER");
};

export const selectGraderRole = (state: RootState) => {
  return state.accounts.roles.filter((role) => role.code === "GRADER");
};

export const selectGraderAccounts = (state: RootState) => {
  return [...state.accounts.graders].sort((a, b) => a.id - b.id);
};

export { accountsSlice };
