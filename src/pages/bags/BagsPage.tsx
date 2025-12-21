// src/pages/bags/BagsPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { useToast } from "@/components/ui/use-toast";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
} from "@/store/slices/examData.slice";

import {
  bagScanAdded,
  bagScanRemoved,
  bagScansCleared,
  bagCapacityUpdated,
  selectBagsForCampaign,
  selectBagById,
  selectDefaultBagCapacity,
  selectBagStatsForCampaign,
  bulkCreateBagsThunk,
  finalizeAndLinkBagThunk,
  selectBagsSlice,
  fetchBagsForCampaignThunk,
  deleteBagThunk,
  selectBookletsInBag,
  ScannedPayloadThunk,
} from "@/store/slices/bags.slice";

import BagsHeader from "./components/BagsHeader";
import BagsTable from "./components/BagsTable";
import ModalBackdrop from "./components/ModalBackdrop";
import CreateBagModal from "./components/CreateBagModal";
import ComposeBagModal from "./components/ComposeBagModal";
import type { CreateBagForm } from "./bags.types";

// ปรับ payload ให้เทียบเท่ากันเสมอ
const normalizePayload = (s: string) => s.trim();

export default function BagsPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const activeCampaign = useAppSelector(selectActiveCampaign);
  const sessions = useAppSelector(selectActiveCampaignSessions);
  const bags = useAppSelector(
    selectBagsForCampaign(activeCampaign?.id ?? null)
  );
  const bagStats = useAppSelector(
    selectBagStatsForCampaign(activeCampaign?.id ?? null)
  );
  const defaultCapacity = useAppSelector(selectDefaultBagCapacity);
  const { status: bagStatus } = useAppSelector(selectBagsSlice);

  const [searchText, setSearchText] = useState("");
  const [filterSessionId, setFilterSessionId] = useState<string>("all");
  const [composeBagId, setComposeBagId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const deviceId: string | undefined = undefined;

  const createForm = useForm<CreateBagForm>();

  // Set กันซ้ำ
  const scannedSetRef = useRef<Set<string>>(new Set());
  const recentScanSetRef = useRef<Set<string>>(new Set());
  const RECENT_WINDOW_MS = 1200;

  // Reset form เมื่อเปิด modal
  useEffect(() => {
    if (!createDialogOpen) return;
    const defaultSessionId = sessions?.[0]?.id ?? "";
    createForm.reset({
      prefix: "BAG-",
      count: 120,
      sessionId:
        defaultSessionId != null ? String(defaultSessionId) : "",
      capacity: defaultCapacity,
    });
  }, [createDialogOpen, sessions, createForm, defaultCapacity]);

  // fetch bags
  useEffect(() => {
    if (activeCampaign) {
      dispatch(fetchBagsForCampaignThunk(activeCampaign.id));
    }
  }, [dispatch, activeCampaign]);

  const composeBag = useAppSelector((state) =>
    composeBagId && activeCampaign
      ? selectBagById(activeCampaign.id, composeBagId)(state)
      : null
  );

  // ถ้า bag sealed แล้ว → ดึงรายการ booklets จาก backend
  useEffect(() => {
    if (!composeBag || !activeCampaign) return;
    const status = (composeBag as any).status;
    const isSealed = status === "ready" || status === "SEALED";
    if (!isSealed) return;

    const bagNo = (composeBag as any).bag_no ?? Number(composeBag.id);
    const sessionId = Number(composeBag.sessionId);
    const campaignIdNumeric = Number(activeCampaign.id);
    console.log("bagno: ",bagNo)
    dispatch(
      ScannedPayloadThunk({
        bagNo,
        campaignId: campaignIdNumeric,
        sessionId,
      })
    );
  }, [composeBag, activeCampaign, dispatch]);

  // sync Set เมื่อเปลี่ยนถุง
  useEffect(() => {
    scannedSetRef.current = new Set(
      (composeBag?.scanned ?? []).map(normalizePayload)
    );
    recentScanSetRef.current.clear();
  }, [composeBag?.id]);

  // sync Set เมื่อ scanned list เปลี่ยน
  useEffect(() => {
    scannedSetRef.current = new Set(
      (composeBag?.scanned ?? []).map(normalizePayload)
    );
  }, [composeBag?.scanned]);
  
  // useEffect(()=>{
  //   console.log(composeBag)
  // },[composeBag])

  // ฟิลเตอร์ + ค้นหา
  const filteredBags = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    const sessionFiltered =
      filterSessionId === "all"
        ? bags
        : bags.filter(
            (bag) => String(bag.sessionId) === filterSessionId
          );

    if (!term) return sessionFiltered;

    return sessionFiltered.filter((bag) => {
      const subjectText = `${bag.subjectCode ?? ""} ${
        bag.subjectName ?? ""
      }`.toLowerCase();
      return (
        bag.id.toString().toLowerCase().includes(term) ||
        bag.sessionLabel.toLowerCase().includes(term) ||
        subjectText.includes(term)
      );
    });
  }, [bags, searchText, filterSessionId]);

  // booklets in bag
  const bookletsInBag = useAppSelector((state) => {
    if (!composeBag || !activeCampaign) return [];
    const campaignNumeric = Number(activeCampaign.id);
    const sessionNumeric = Number(composeBag.sessionId);
    const bagNo = Number(
      (composeBag as any).bag_no ?? composeBag.id
    );
    return selectBookletsInBag(
      campaignNumeric,
      sessionNumeric,
      bagNo
    )(state);
  });

  const status = composeBag ? (composeBag as any).status : undefined;
  const isSealed = status === "ready" || status === "SEALED";
  const canScan = !isSealed;

  // ------------------------------
  // Bulk Create
  // ------------------------------
  const handleBulkCreateBags = createForm.handleSubmit(
    async (values) => {
      if (!activeCampaign) {
        toast({
          title: "กรุณาเลือกสนามสอบ",
          variant: "destructive",
        });
        return;
      }
      if (!values.sessionId) {
        toast({
          title: "ต้องเลือกรอบสอบ",
          variant: "destructive",
        });
        return;
      }
      const session = sessions.find(
        (s: any) => s.id === values.sessionId
      );

      const payload = {
        campaignId: activeCampaign.id,
        sessionId: values.sessionId,
        sessionLabel: session?.label ?? "ไม่ระบุรอบสอบ",
        prefix: values.prefix,
        count: values.count,
        capacity: values.capacity,
        subjectCode: session?.subjects?.[0]?.code ?? "MIXED",
        subjectName: session?.subjects?.[0]?.name ?? "คละวิชา",
      };

      await dispatch(bulkCreateBagsThunk(payload)).unwrap();

      setCreateDialogOpen(false);
      toast({
        title: "สร้างถุงข้อสอบสำเร็จ",
        description: `สร้าง ${values.count} ถุง (Prefix: ${values.prefix})`,
      });
    }
  );

  // ------------------------------
  // Scan logic
  // ------------------------------
  const handleScan = (raw: string) => {
    if (!composeBag || !activeCampaign || !scannerEnabled) return;
    const data = normalizePayload(raw);

    if (recentScanSetRef.current.has(data)) {
      return;
    }
    recentScanSetRef.current.add(data);
    setTimeout(
      () => recentScanSetRef.current.delete(data),
      RECENT_WINDOW_MS
    );

    if (scannedSetRef.current.has(data)) {
      toast({
        title: "สแกนซ้ำ",
        description: "QR Code นี้ถูกสแกนในถุงแล้ว",
        variant: "destructive",
      });
      return;
    }

    dispatch(
      bagScanAdded({
        campaignId: activeCampaign.id,
        bagId: composeBag.id,
        code: data,
      })
    );
    scannedSetRef.current.add(data);

    setManualCode("");
    setScannerEnabled(false);
    setTimeout(() => setScannerEnabled(true), 500);
  };

  const handleManualAdd = () => {
    const v = normalizePayload(manualCode);
    if (!v) return;
    handleScan(v);
  };

  // finalize
  const handleFinalizeAndLink = async () => {
    if (!composeBag || !activeCampaign) return;
    try {
      await dispatch(
        finalizeAndLinkBagThunk({
          campaignId: activeCampaign.id,
          bag_no: composeBag.id,
          scannedCodes: composeBag.scanned,
        })
      ).unwrap();
      toast({
        title: "บันทึกข้อมูล",
        description: `ถุง ${composeBag.id} บันทึกสมุด ${composeBagId?.length ?? 0} เล่ม`,
      });
      setComposeBagId(null);
    } catch (error: any) {
      console.error("Finalize Error:", error);
      toast({
        title: "Finalize ล้มเหลว",
        description:
          error?.message ??
          "ไม่สามารถเชื่อมโยงข้อมูลกับ Backend ได้",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCode = (code: string) => {
    if (!composeBag || !activeCampaign) return;
    const n = normalizePayload(code);
    dispatch(
      bagScanRemoved({
        campaignId: activeCampaign.id,
        bagId: composeBag.id,
        code: n,
      })
    );
    scannedSetRef.current.delete(n);
  };

  const handleClearCodes = () => {
    if (!composeBag || !activeCampaign) return;
    if (window.confirm("ลบรายการสแกนทั้งหมดหรือไม่?")) {
      dispatch(
        bagScansCleared({
          campaignId: activeCampaign.id,
          bagId: composeBag.id,
        })
      );
      scannedSetRef.current.clear();
      recentScanSetRef.current.clear();
    }
  };

  const handleDeleteBag = async (bagId: string) => {
    if (!activeCampaign) return;
    if (!window.confirm(`ลบถุง ${bagId} หรือไม่?`)) return;
    try {
      await dispatch(
        deleteBagThunk({ campaignId: activeCampaign.id, bagId })
      ).unwrap();
      toast({
        title: "ลบถุงแล้ว",
        description: bagId,
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "ลบถุงล้มเหลว",
        description: error?.message ?? "API Error",
        variant: "destructive",
      });
    }
  };

  const handleCapacityChange = (value: number) => {
    if (!composeBag || !activeCampaign) return;
    if (Number.isNaN(value) || value < 1) return;
    dispatch(
      bagCapacityUpdated({
        campaignId: activeCampaign.id,
        bagId: composeBag.id,
        capacity: value,
      })
    );
  };

  // ==============================
  // Render
  // ==============================
  return (
    <div className="d-flex flex-column gap-4">
      <BagsHeader
        bagStats={bagStats}
        sessions={sessions}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        filterSessionId={filterSessionId}
        onFilterSessionChange={setFilterSessionId}
        onOpenCreateDialog={() => setCreateDialogOpen(true)}
        activeCampaignPresent={!!activeCampaign}
      />

      <BagsTable
        filteredBags={filteredBags}
        bagStatus={bagStatus}
        onOpenCompose={(bagId) => setComposeBagId(bagId)}
        onDeleteBag={handleDeleteBag}
      />

      {/* Create modal */}
      <ModalBackdrop open={createDialogOpen} />
      <CreateBagModal
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        sessions={sessions}
        createForm={createForm}
        bagStatus={bagStatus}
        onSubmit={handleBulkCreateBags}
      />

      {/* Compose modal */}
      <ModalBackdrop open={!!composeBag} />
      <ComposeBagModal
        open={!!composeBag}
        composeBag={composeBag}
        onClose={() => setComposeBagId(null)}
        canScan={canScan}
        isSealed={isSealed}
        scannerEnabled={scannerEnabled}
        deviceId={deviceId}
        manualCode={manualCode}
        onManualCodeChange={setManualCode}
        onManualAdd={handleManualAdd}
        onScan={handleScan}
        onCapacityChange={handleCapacityChange}
        onRemoveCode={handleRemoveCode}
        onClearCodes={handleClearCodes}
        onFinalize={handleFinalizeAndLink}
        bagStatus={bagStatus}
        bookletsInBag={bookletsInBag}
      />
    </div>
  );
}
