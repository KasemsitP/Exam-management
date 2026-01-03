import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from 'axios';
import { RootState } from "../index";



// (Interfaces - เหมือนเดิม)
export interface Bag {
    id: string;
    bag_no: string;
    campaignId: string;
    sessionId: string;
    sessionLabel: string;
    subjectCode?: string;
    subjectName?: string;
    capacity: number;
    scanned: string[];
    status: "draft" | "ready" | "incomplete";
    scannedCount?: number;
}

export interface BagStats {
    total: number;
    completed: number;
    inProgress: number;
    scanned: number;
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
    bag_no: string;
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
    inBags: Record<string, BagPayloadRecord[]>;
}
interface BagPayloadRecord {
    id: number;
    sessionId: number;
    bagNo: number;
    seqInBag: number | null;
    status: string;
    userCode: string;
    fullName: string;
    qrPayload: string;
}




const initialState: BagsState = {
    bags: {},
    status: "idle",
    error: null,
    defaultCapacity: 30,
    stats: {},
    inBags: {},
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
            const rows: any[] = response.data;

            const mapped: Bag[] = rows.map((row) => ({
                id: String(row.id),                         // ใช้ id เป็น string
                bag_no: String(row.bag_no),
                campaignId: String(row.campaignId ?? campaignId),
                sessionId: String(row.sessionId),
                sessionLabel: row.sessionLabel,
                capacity: row.capacity,
                scanned: [],                                // เริ่มต้นว่าง ๆ สำหรับ modal สแกน
                status: row.status as Bag["status"],
                scannedCount: row.scannedCount ?? 0,       // ✅ map มาตรง ๆ
            }));
            console.log(mapped)

            return mapped;
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


interface ScannedPayloadParams {
    campaignId: number;
    sessionId: number;
    bagNo: number;
}

export const ScannedPayloadThunk = createAsyncThunk<
    BagPayloadRecord[],
    ScannedPayloadParams,
    { rejectValue: string }
>(
    "bags/ScannedCount",
    async ({ bagNo, campaignId, sessionId }, { rejectWithValue }) => {
        try {
            console.log(bagNo, campaignId, sessionId)
            const response = await axios.get<BagPayloadRecord[]>(
                `/api/bags/${bagNo}/booklets`,
                {
                    params: { campaignId, sessionId } // query params
                }
            );
            console.log(response)
            return response.data as BagPayloadRecord[];
        } catch (error: unknown) {
            return rejectWithValue("ไม่สามารถดึงข้อมูลได้");
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
            console.log(payload)
            const response = await axios.post("/api/bags/finalize-and-link", payload);
            console.log(response)
            return response.data as FinalizeLinkResponse;
        } catch (error: unknown) {
            return rejectWithValue("Finalize failed");
        }
    }
);


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
            if (!state.stats[campaignId]) state.stats[campaignId] = { total: 0, completed: 0, inProgress: 0, scanned: 0 };
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
                    if (!state.stats[campaignId]) state.stats[campaignId] = { total: 0, completed: 0, inProgress: 0, scanned: 0 };
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

                const campaignId = String(action.meta.arg);

                const newBags: Record<string, Bag> = {};
                let stats: BagStats = { total: 0, completed: 0, inProgress: 0, scanned: 0 };

                action.payload.forEach((bag) => {
                    newBags[bag.id] = bag;

                    stats.total++;
                    if (bag.status === "ready") stats.completed++;
                    if (bag.status === "draft") stats.inProgress++;
                    stats.scanned += bag.scannedCount ?? 0; // รวมจำนวนสแกนทั้งหมดใน campaign นี้
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
            })
            .addCase(ScannedPayloadThunk.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(ScannedPayloadThunk.fulfilled, (state, action) => {
                state.status = "succeeded";


                //ดึงข้อมูลมาจาก thunk ตอนที่ส่ง argument เข้าไปใน createThunk โดยใช้ action.meta.arg
                const { bagNo, campaignId, sessionId } = action.meta.arg;

                // ทำ key เพื่อสำหรับกัข้อมูลชนกัน
                const key = `${campaignId}:${sessionId}:${bagNo}`;

                state.inBags[key] = action.payload.map((row) => ({
                    id: row.id,
                    sessionId: row.sessionId,
                    bagNo: row.bagNo,
                    seqInBag: row.seqInBag,
                    status: row.status,
                    userCode: row.userCode,
                    fullName: row.fullName,
                    qrPayload: row.qrPayload,
                }));
            })
            .addCase(ScannedPayloadThunk.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload as string;
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
export const selectBagsSlice = (state: RootState) => state.bags;

export const selectDefaultBagCapacity = (state: RootState) =>
  state.bags.defaultCapacity;

export const selectAllBagsAsArray = (state: RootState) =>
  Object.values(state.bags.bags);

export const selectBagsForCampaign =
  (campaignId: string | null) =>
  (state: RootState) => {
    if (!campaignId) return [];
    return Object.values(state.bags.bags).filter(
      (bag) => bag.campaignId === campaignId
    );
  };

export const selectBagById =
  (campaignId: string, bagId: string) =>
  (state: RootState) => {
    const bag = state.bags.bags[bagId];
    if (bag && bag.campaignId === campaignId) {
      return bag;
    }
    return undefined;
  };

// ⭐ แนะนำให้คืนโครงสร้าง BagStats ให้ครบทุก field เสมอ
export const selectBagStatsForCampaign =
  (campaignId: string | null) =>
  (state: RootState): BagStats => {
    if (!campaignId || !state.bags.stats[campaignId]) {
      return { total: 0, completed: 0, inProgress: 0, scanned: 0 };
    }
    return state.bags.stats[campaignId];
  };

export const selectBookletsInBag =
  (campaignId: number, sessionId: number, bagNo: number) =>
  (state: RootState) => {
    const key = `${campaignId}:${sessionId}:${bagNo}`;
    return state.bags.inBags[key] ?? [];
  };

export { bagsSlice };

