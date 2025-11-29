import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from 'axios';

type LocalRootState = {
    bags: BagsState;
};

// (Interfaces - เหมือนเดิม)
export interface Bag {
    id: string;
    campaignId: string;
    sessionId: string;
    sessionLabel: string;
    subjectCode?: string;
    subjectName?: string;
    capacity: number;
    scanned: string[];
    status: "draft" | "ready" | "incomplete";
}

export interface BagStats {
    total: number;
    completed: number;
    inProgress: number;
}

interface BulkCreatePayload {
    campaignId: string;
    sessionId: string;
    sessionLabel: string;
    subjectCode?: string;
    subjectName?: string;
    prefix: string;
    count: number;
    capacity: number;
}

interface FinalizeLinkPayload {
    campaignId: string;
    bagId: string;
    scannedCodes: string[];
}

interface FinalizeLinkResponse {
    bagId: string;
    bookletsCreated: number;
    status: "ready" | "incomplete";
}

interface BagsState {
    bags: Record<string, Bag>;
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
    defaultCapacity: number;
    stats: Record<string, BagStats>;
}

const initialState: BagsState = {
    bags: {},
    status: "idle",
    error: null,
    defaultCapacity: 30,
    stats: {},
};

// ========== (Thunks - API Calls) ==========

// ⭐️ (1. THUNK ใหม่: GET) ⭐️
export const fetchBagsForCampaignThunk = createAsyncThunk<
    Bag[],
    string, // (รับ campaignId)
    { rejectValue: string }
>(
    "bags/fetchForCampaign",
    async (campaignId, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/bags/campaign/${campaignId}`);
            console.log(response.data)
            return response.data as Bag[];
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                return rejectWithValue(error.response?.data?.message ?? "Fetch bags failed");
            }
            return rejectWithValue("Fetch bags failed");
        }
    }
);

export const bulkCreateBagsThunk = createAsyncThunk<
    Bag[],
    BulkCreatePayload,
    { rejectValue: string }
>(
    "bags/bulkCreate",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await axios.post("/api/bags/bulk-create", payload);
            return response.data as Bag[];
        } catch (error: unknown) {
            // ... (Error handling)
            return rejectWithValue("Bulk Create failed");
        }
    }
);

export const finalizeAndLinkBagThunk = createAsyncThunk<
    FinalizeLinkResponse,
    FinalizeLinkPayload,
    { rejectValue: string }
>(
    "bags/finalizeAndLink",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await axios.post("/api/bags/finalize-and-link", payload);
            return response.data as FinalizeLinkResponse;
        } catch (error: unknown) {
            // ... (Error handling)
            return rejectWithValue("Finalize failed");
        }
    }
);

// ⭐️ (2. THUNK ใหม่: DELETE) ⭐️
export const deleteBagThunk = createAsyncThunk<
    { bagId: string; campaignId: string }, // (สิ่งที่ Return)
    { campaignId: string; bagId: string }, // (สิ่งที่รับ)
    { rejectValue: string }
>(
    "bags/delete",
    async (payload, { rejectWithValue }) => {
        try {
            await axios.delete(`/api/bags/${payload.bagId}`);
            return payload; // (ส่ง Payload กลับไปให้ Reducer)
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                return rejectWithValue(error.response?.data?.message ?? "Delete bag failed");
            }
            return rejectWithValue("Delete bag failed");
        }
    }
);

// ========== (Slice) ==========

const bagsSlice = createSlice({
    name: "bags",
    initialState,
    reducers: {
        // ... (Reducers เดิม: bagCreated, bagRemoved, ... bagFinalized) ...
        bagCreated: (state, action: PayloadAction<Bag>) => {
            const bag = action.payload;
            state.bags[bag.id] = bag;
            const campaignId = action.payload.campaignId;
            if (!state.stats[campaignId]) state.stats[campaignId] = { total: 0, completed: 0, inProgress: 0 };
            state.stats[campaignId].total++;
            state.stats[campaignId].inProgress++;
        },
        bagRemoved: (state, action: PayloadAction<{ campaignId: string; bagId: string }>) => {
            const bag = state.bags[action.payload.bagId];
            if (!bag) return;

            // (อัปเดต Stats)
            const campaignId = bag.campaignId;
            if (state.stats[campaignId]) {
                state.stats[campaignId].total--;
                if (bag.status === 'draft') state.stats[campaignId].inProgress--;
                if (bag.status === 'ready') state.stats[campaignId].completed--;
            }

            delete state.bags[action.payload.bagId];
        },
        bagCapacityUpdated: (state, action: PayloadAction<{ campaignId: string; bagId: string; capacity: number }>) => {
            const bag = state.bags[action.payload.bagId];
            if (bag) {
                bag.capacity = action.payload.capacity;
            }
        },
        bagScanAdded: (state, action: PayloadAction<{ campaignId: string; bagId: string; code: string }>) => {
            const { bagId, code } = action.payload;
            const bag = state.bags[bagId];
            if (bag && !bag.scanned.includes(code)) {
                bag.scanned.push(code);
            }
        },
        bagScanRemoved: (state, action: PayloadAction<{ campaignId: string; bagId: string; code: string }>) => {
            const { bagId, code } = action.payload;
            const bag = state.bags[bagId];
            if (bag) {
                bag.scanned = bag.scanned.filter((c) => c !== code);
            }
        },
        bagScansCleared: (state, action: PayloadAction<{ campaignId: string; bagId: string }>) => {
            const bag = state.bags[action.payload.bagId];
            if (bag) bag.scanned = [];
        },
        bagFinalized: (state, action: PayloadAction<{ campaignId: string; bagId: string; allowIncomplete: boolean }>) => {
            const { bagId, allowIncomplete } = action.payload;
            const newStatus = allowIncomplete ? "incomplete" : "ready";
            const bag = state.bags[bagId];
            if (bag) {
                bag.status = newStatus;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // (Bulk Create)
            .addCase(bulkCreateBagsThunk.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(bulkCreateBagsThunk.fulfilled, (state, action) => {
                state.status = "succeeded";
                action.payload.forEach(bag => {
                    state.bags[bag.id] = bag;
                });
                if (action.payload.length > 0) {
                    const campaignId = action.payload[0].campaignId;
                    if (!state.stats[campaignId]) state.stats[campaignId] = { total: 0, completed: 0, inProgress: 0 };
                    state.stats[campaignId].total += action.payload.length;
                    state.stats[campaignId].inProgress += action.payload.length;
                }
            })
            .addCase(bulkCreateBagsThunk.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? "Failed to bulk create bags";
            })

            // (Finalize and Link)
            .addCase(finalizeAndLinkBagThunk.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(finalizeAndLinkBagThunk.fulfilled, (state, action) => {
                state.status = "succeeded";
                const bag = state.bags[action.payload.bagId];
                if (bag) {
                    bag.status = action.payload.status;
                    const campaignId = bag.campaignId;
                    if (state.stats[campaignId]) {
                        state.stats[campaignId].inProgress--;
                        if (action.payload.status === 'ready') {
                            state.stats[campaignId].completed++;
                        }
                    }
                }
            })
            .addCase(finalizeAndLinkBagThunk.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? "Failed to finalize bag";
            })

            // ⭐️ (3. REDUCERS ใหม่) ⭐️
            // (Fetch Bags)
            .addCase(fetchBagsForCampaignThunk.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
.addCase(fetchBagsForCampaignThunk.fulfilled, (state, action) => {
  state.status = "succeeded";

  // 👈 campaignId ที่ component ส่งมา (คือ activeCampaign.id)
  const campaignId = String(action.meta.arg);

  const newBags: Record<string, Bag> = {};
  let stats: BagStats = { total: 0, completed: 0, inProgress: 0 };

  action.payload.forEach((rawBag) => {
    const bag: Bag = {
      ...rawBag,
      id: String(rawBag.id),
      // 👈 ใช้ campaignId จาก frontend แทนค่าใน response
      campaignId,
    };

    newBags[bag.id] = bag;

    stats.total++;
    if (bag.status === "ready") stats.completed++;
    if (bag.status === "draft") stats.inProgress++;
  });

  state.bags = newBags;
  state.stats[campaignId] = stats;
})
            .addCase(fetchBagsForCampaignThunk.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? "Failed to fetch bags";
            })
            // (Delete Bag)
            .addCase(deleteBagThunk.pending, (state) => {
                state.status = "loading"; // (อาจจะใช้ status ย่อย)
            })
            .addCase(deleteBagThunk.fulfilled, (state, action) => {
                state.status = "succeeded";
                // (เรียก Reducer 'bagRemoved' ที่เราเขียนไว้)
                bagsSlice.caseReducers.bagRemoved(state, action);
            })
            .addCase(deleteBagThunk.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? "Failed to delete bag";
            });
    },
});

// ========== (Actions) ==========
export const {
    bagCreated,
    bagRemoved,
    bagCapacityUpdated,
    bagScanAdded,
    bagScanRemoved,
    bagScansCleared,
    bagFinalized,
} = bagsSlice.actions;

// ========== (Selectors) ==========
export const selectBagsSlice = (state: LocalRootState) => state.bags;
export const selectDefaultBagCapacity = (state: LocalRootState) => state.bags.defaultCapacity;
export const selectAllBagsAsArray = (state: LocalRootState) => Object.values(state.bags.bags);
export const selectBagsForCampaign = (campaignId: string | null) => (state: LocalRootState) => {
    if (!campaignId) return [];
    return Object.values(state.bags.bags).filter((bag) => bag.campaignId === campaignId);
};
export const selectBagById = (campaignId: string, bagId: string) => (state: LocalRootState) => {
    const bag = state.bags.bags[bagId];
    if (bag && bag.campaignId === campaignId) {
        return bag;
    }
    return undefined;
};
export const selectBagStatsForCampaign = (campaignId: string | null) => (state: LocalRootState) => {
    if (!campaignId || !state.bags.stats[campaignId]) {
        return { total: 0, completed: 0, inProgress: 0 };
    }
    return state.bags.stats[campaignId];
};

export { bagsSlice };

