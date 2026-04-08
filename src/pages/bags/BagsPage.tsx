// src/pages/bags/BagsPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { useToast } from "@/components/ui/use-toast";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
  selectIsSystemLocked,
} from "@/store/slices/examData.slice";
import Swal from "sweetalert2";

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
  CreateBagAndAddQrPayload,
} from "@/store/slices/bags.slice";

import BagsHeader from "./components/BagsHeader";
import BagsTable from "./components/BagsTable";
import ModalBackdrop from "./components/ModalBackdrop";
import CreateBagModal from "./components/CreateBagModal";
import ComposeBagModal from "./components/ComposeBagModal";
import BagScannerModal from "./components/BagScannerModal";
import type { CreateBagForm } from "./bags.types";
import axios from "axios";

// ปรับ payload ให้เทียบเท่ากันเสมอ
const normalizePayload = (s: string) => s.trim();

// type ScanEntry = {
//   payload: string;
//   scannedAt: Date;
// };

export default function BagsPage() {
  const dispatch = useAppDispatch();
  const locked = useAppSelector(selectIsSystemLocked);
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
  const { status: bagStatus, submitStatus: bagSubmitStatus } =
    useAppSelector(selectBagsSlice);

  const [searchText, setSearchText] = useState("");
  const [filterSessionId, setFilterSessionId] = useState<string>("all");
  const [composeBagId, setComposeBagId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [IsScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [qrPayloads, setQrPayloads] = useState<string[]>([]);
  const [DatePayloads, setDatePaylaods] = useState<Date[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);


  const deviceId: string | undefined = undefined;

  const isLoading = bagStatus === "loading";


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
    if (!activeCampaign) {
      setIsInitialLoading(false);
      return;
    }

    const loadInitialData = async () => {
      try {
        await dispatch(fetchBagsForCampaignThunk(activeCampaign.id)).unwrap();
      } catch (error) {
        console.error('Failed to load bags:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialData();
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
    // console.log("bagno: ", bagNo)
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

      const subjectText =
        `${bag.subjectCode ?? ""} ${bag.subjectName ?? ""}`.toLowerCase();

      const formattedBagNo =
        bag.bag_no.toString().padStart(3, "0").toLowerCase();

      return (
        formattedBagNo.includes(term) ||
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
  //console.log("Booklets in bag:", bookletsInBag);

  const status = composeBag ? (composeBag as any).status : undefined;
  const isSealed = status === "ready" || status === "SEALED";
  const canScan = !isSealed;

  // ------------------------------
  // Bulk Create
  // ------------------------------
  const handleBulkCreateBags = createForm.handleSubmit(
    async (values) => {
      if (!activeCampaign) {
        Swal.fire({
          icon: "warning",
          title: "กรุณาเลือกสนามสอบ",
          confirmButtonText: "ตกลง",
        });
        return;
      }
      if (!values.sessionId) {
        await Swal.fire({
          icon: "warning",
          title: "ต้องเลือกรอบสอบ",
          confirmButtonText: "ตกลง",
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
      await dispatch(fetchBagsForCampaignThunk(activeCampaign.id));
      await Swal.fire({
        icon: "success",
        title: "สร้างถุงข้อสอบสำเร็จ",
        text: `สร้าง ${values.count} ถุง (Prefix: ${values.prefix})`,
        timer: 2000,
        showConfirmButton: false,
      });
    }
  );


  // ------------------------------
  // Scan logic
  // ------------------------------

  const handleScan = useCallback((raw: string) => {
    if (!activeCampaign || !scannerEnabled) return;
    if (qrPayloads.length >= 30) {
      Swal.fire({
        icon: "error",
        title: "จำนวนสมุดข้อสอบมากกว่า 30 เล่ม",
        text: "ไม่สามารถสแกนเพิ่มได้กรุณาตรวจสอบเล่มข้อสอบ",
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }
    const data = normalizePayload(raw);
    const dateTime = new Date();

    // เช็ค duplicate จาก ref (เร็วมาก)
    // if (recentScanSetRef.current.has(data)) return;
    // recentScanSetRef.current.add(data);
    // setTimeout(() => recentScanSetRef.current.delete(data), RECENT_WINDOW_MS);

    if (qrPayloads.includes(data)) {
      Swal.fire({
        icon: "error",
        title: "QR code นี้ถูกสแกนแล้ว",
        text: "กรุณาสแกนอีกครั้ง",
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    setQrPayloads((prev) => [...prev, data]);
    setDatePaylaods((prev) => [...prev, dateTime]);

    // Reset manual code ถ้าสแกนสำเร็จ (optional)
    setManualCode("");

    // Trick: หยุด Scanner ชั่วคราวเพื่อให้ user รู้ว่าสแกนติดแล้ว (เสียง beep หรือ ui กระพริบ)
    // setScannerEnabled(false);
    // setTimeout(() => setScannerEnabled(true), 500);

  }, [activeCampaign, scannerEnabled, qrPayloads]); // Dependencies ที่จำเป็น

  // 2. Optimize handleManualAdd
  const handleManualAdd2 = useCallback(() => {
    const v = normalizePayload(manualCode);
    if (!v) return;
    handleScan(v);
  }, [manualCode, handleScan]);

  const handleManualAdd = useCallback((code: string) => {
    const v = normalizePayload(code);
    if (!v) return;
    handleScan(v);
  }, [handleScan]);

  const handleFinalizeAndLink = async () => {
    if (!activeCampaign) return;

    const numberofBag = qrPayloads.length;

    if (numberofBag > 30) {
      Swal.fire(
        {
          icon: "error",
          title: "จำนวนสมุดข้อสอบมากกว่า 30 เล่ม",
          text: "ไม่สามารถปิดถุงนำส่งได้กรุณาตรวจสอบเล่มข้อสอบ",
        }
      )
      return;
    }

    if (numberofBag < 30) {
      const result = await Swal.fire({
        icon: "warning",
        title: "จำนวนสมุดข้อสอบน้อยกว่า 30 เล่ม",
        text: "คุณแน่ใจหรือไม่ว่าจะสร้างถุงข้อสอบนี้?",
        confirmButtonText: "ตกลง",
        cancelButtonText: "ยกเลิก",
        showCancelButton: true,
      });

      if (!result.isConfirmed) {
        return;
      }
    }
    try {
      Swal.fire({
        title: "กำลังตรวจสอบข้อมูล...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      // ==============================
      // 1️⃣ CHECK SUBJECTS
      // ==============================
      const { data } = await axios.post("/api/bags/check-subjects", {
        campaignId: Number(activeCampaign.id),
        payload: qrPayloads,
        datetime: DatePayloads,
      });
      Swal.close();
      console.log("Check subjects response:", data);


      if (!data.success) {
        await Swal.fire({
          icon: "error",
          title: "มีบางเล่มที่มีวิชาไม่ตรงกับรอบสอบ",
          text: "กรุณาตรวจสอบ QR code ที่สแกนอีกครั้ง",
        });
        return;
      }


      // ==============================
      // 2️⃣ CONFIRM
      // ==============================
      const confirm = await Swal.fire({
        icon: "warning",
        title: "ยืนยันการสร้างถุงข้อสอบ",
        html: `
        สร้างถุงข้อสอบวิชา <b>${data.subject_name.subject_name}</b><br/>
        ถุงเลขที่ <b>${data.bagNo}</b><br/>
        จำนวน <b>${qrPayloads.length}</b> เล่ม
      `,
        showCancelButton: true,
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก",
      });

      if (!confirm.isConfirmed) return;

      Swal.fire({
        title: "กำลังสร้างถุงข้อสอบ...",
        html: "กรุณารอสักครู่",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // ==============================
      // 3️⃣ CREATE BAG (Redux Thunk)
      // ==============================
      const result = await dispatch(
        CreateBagAndAddQrPayload({
          campaignId: Number(activeCampaign.id),
          payload: qrPayloads,
          datetime: DatePayloads,
          bagNo: data.bagNo,
        })
      ).unwrap();

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "บันทึกข้อมูลสำเร็จ",
        text: `สร้างถุงเลขที่ ${result.bagNo} จำนวน ${qrPayloads.length} เล่ม กรุณาปิดถุงเพื่อเตรียมนำส่ง`,
      });

      ClearAll();
      await dispatch(fetchBagsForCampaignThunk(activeCampaign.id));
      setIsScannerModalOpen(false);

    } catch (error: unknown) {
      console.error("CATCH ERROR:", error);

      let message = "เกิดข้อผิดพลาดบางอย่าง";

      // 👇 รองรับทั้ง axios error และ rejectWithValue
      if (typeof error === "string") {
        message = error;
      } else if (axios.isAxiosError(error)) {
        message =
          error.response?.data?.message ||
          error.message ||
          message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      await Swal.fire({
        icon: "error",
        title: "ผิดพลาด",
        text: message,
      });
    }
  };

  const handleRemoveCode = (code: string) => {
    if (!activeCampaign) return;
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

  const handleClearCodes = async () => {
    console.log("Clearing codes...");
    if (!activeCampaign) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบ",
      text: "ลบรายการสแกนทั้งหมดหรือไม่?",
      showCancelButton: true,
      confirmButtonText: "ลบทั้งหมด",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    setQrPayloads([]);
    setDatePaylaods([]);
    scannedSetRef.current.clear();
    recentScanSetRef.current.clear();

    await Swal.fire({
      icon: "success",
      title: "ลบเรียบร้อยแล้ว",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  const ClearAll = async () => {
    console.log("Clearing codes...");
    if (!activeCampaign) return;
    setQrPayloads([]);
    setDatePaylaods([]);
    scannedSetRef.current.clear();
    recentScanSetRef.current.clear();
  };

  const handleDeleteBag = async (bagId: string) => {
    if (!activeCampaign) return;

    const bagData = bags.find((b) => b.id === bagId);
    console.log("Bag to delete: ", bagData);

    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบ",
      text: `ลบถุงหมายเลข ${bagData?.bag_no} วิชา ${bagData?.sessionLabel} หรือไม่?`,
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      await dispatch(
        deleteBagThunk({ campaignId: activeCampaign.id, bagId })
      ).unwrap();

      await Swal.fire({
        icon: "success",
        title: "ลบถุงแล้ว",
        text: `ลบถุงหมายเลข ${bagData?.bag_no} วิชา ${bagData?.sessionLabel} เรียบร้อยแล้ว`,
        timer: 1500,
        showConfirmButton: true,
      });
      await dispatch(fetchBagsForCampaignThunk(activeCampaign.id));
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "ลบถุงล้มเหลว",
        text: error?.message ?? "API Error",
        confirmButtonText: "ตกลง",
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
    <div className="container-fluid px-3 px-sm-4 py-3 gap-4 d-flex flex-column">
      <BagsHeader
        bagStats={bagStats}
        sessions={sessions}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        filterSessionId={filterSessionId}
        onFilterSessionChange={setFilterSessionId}
        onOpenCreateDialog={() => setIsScannerModalOpen(true)}
        activeCampaignPresent={!!activeCampaign}
      />
      <ModalBackdrop open={IsScannerModalOpen} />
      <BagScannerModal
        open={IsScannerModalOpen}
        onClose={() => { setIsScannerModalOpen(false); ClearAll(); }}
        canScan={canScan}
        isSealed={isSealed}
        scannerEnabled={scannerEnabled}
        deviceId={deviceId}
        onManualAdd={handleManualAdd}
        onScan={handleScan}
        onCapacityChange={handleCapacityChange}
        onRemoveCode={handleRemoveCode}
        onClearCodes={handleClearCodes}
        onFinalize={handleFinalizeAndLink}
        scannedPayloads={qrPayloads}
        scannedDate={DatePayloads}
        bagStatus={bagStatus}
        bookletsInBag={bookletsInBag}
      />


      <BagsTable
        filteredBags={filteredBags}
        isInitialLoading={isInitialLoading}
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
        onManualAdd={handleManualAdd2}
        onScan={handleScan}
        onCapacityChange={handleCapacityChange}
        onRemoveCode={handleRemoveCode}
        onClearCodes={handleClearCodes}
        onFinalize={handleFinalizeAndLink}
        bagStatus={bagSubmitStatus}
        bookletsInBag={bookletsInBag}
        isLoading={isLoading}
      />
    </div>
  );
}
