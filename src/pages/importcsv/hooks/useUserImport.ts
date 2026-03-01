// hooks/useUserImport.ts
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { shuffle } from "lodash";

import { useAppDispatch, useAppSelector } from "@/store/hook";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import {
  importUsersThunk,
  selectUserImportError,
  selectUserImportStats,
  selectUserImportStatus,
} from "@/store/slices/users.slice";
import { useToast } from "@/components/ui/use-toast";
import Swal from "sweetalert2";

export const PREVIEW_ROW_OPTIONS = [5, 10, 20, 50] as const;
export const ENCODINGS = [
  { value: "utf-8", label: "UTF-8" },
  { value: "tis-620", label: "TIS-620 (Thai)" },
] as const;

export type ParsedState = {
  rows: Record<string, string>[];
  headers: string[];
};

const isExcel = (name?: string | null) => !!name && /\.(xlsx|xls)$/i.test(name ?? "");
const isCsv = (name?: string | null) => !!name && /\.csv$/i.test(name ?? "");

const trimRow = (row: Record<string, unknown>) =>
  Object.entries(row).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[String(key).trim()] = typeof value === "string" ? value.trim() : String(value ?? "");
    return acc;
  }, {});

const getErrorMessage = (error: unknown) => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Unexpected error occurred";
};

const parseWorksheet = (ws: XLSX.WorkSheet): ParsedState => {
  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
    defval: "",
    raw: false,
    dateNF: "yyyy-mm-dd HH:mm",
  });
  const rows = raw.map(trimRow);
  const headers = Object.keys(rows[0] ?? {});
  return { rows, headers };
};

export const useUserImport = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const activeCampaign = useAppSelector(selectActiveCampaign);
  const importStatus = useAppSelector(selectUserImportStatus);
  const importError = useAppSelector(selectUserImportError);
  const importStats = useAppSelector(selectUserImportStats);

  const [fileName, setFileName] = useState<string | null>(null);
  const [encoding, setEncoding] = useState<string>(ENCODINGS[0].value);
  const [previewRows, setPreviewRows] = useState<number>(PREVIEW_ROW_OPTIONS[1]);
  const [parsed, setParsed] = useState<ParsedState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [excelBuffer, setExcelBuffer] = useState<ArrayBuffer | null>(null);
  const [excelSheetNames, setExcelSheetNames] = useState<string[]>([]);
  const [excelSelectedSheet, setExcelSelectedSheet] = useState<string>("");

  const supportsImport = Boolean(activeCampaign);
  const isImporting = importStatus === "loading";

  const resetState = () => {
    setFileName(null);
    setParsed(null);
    setError(null);
    setExcelBuffer(null);
    setExcelSheetNames([]);
    setExcelSelectedSheet("");

  };

  // เมื่อเปลี่ยน campaign ให้เคลียร์ preview เพื่อลดความสับสน
  useEffect(() => {
    resetState();
  }, [activeCampaign?.id]);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = event.target.files?.[0];
    if (!file) return;
    resetState(); // reset React state ก่อน

    if (!supportsImport) {
      Swal.fire({
        icon: "error",
        title: "ยังไม่ได้เลือกแคมเปญ",
        text: "กรุณาเลือกแคมเปญที่ต้องการก่อนทำการนำเข้าข้อมูล",
        confirmButtonText: "ตกลง",
      });
      event.target.value = "";
      input.value = ""; // 🔥 reset input
      return;
    }

    setFileName(file.name);
    setError(null);

    try {
      if (isExcel(file.name)) {
        const buffer = await file.arrayBuffer();
        setExcelBuffer(buffer);

        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetNames = workbook.SheetNames ?? [];
        setExcelSheetNames(sheetNames);

        if (!sheetNames.length) {
          setParsed(null);
          setError("This Excel file does not contain any sheets.");
          return;
        }

        const firstName = sheetNames[0];
        setExcelSelectedSheet(firstName);
        const worksheet = workbook.Sheets[firstName];

        if (!worksheet) {
          setParsed(null);
          setError("Unable to read the first sheet.");
          return;
        }

        const result = parseWorksheet(worksheet);
        if (!result.rows.length) {
          setParsed(null);
          setError("The selected sheet does not contain any data rows.");
          return;
        }
        setParsed(result);
      } else if (isCsv(file.name)) {
        const text = await file.text();
        Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
          encoding,
          complete: (results) => {
            if (results.errors?.length) {
              setParsed(null);
              setError(results.errors[0]?.message ?? "Failed to parse CSV.");
              return;
            }

            const rows = (results.data ?? [])
              .map(trimRow)
              .filter((row) => Object.values(row).some(Boolean));

            const headers = Object.keys(rows[0] ?? {});
            if (!rows.length) {
              setParsed(null);
              setError("CSV file does not contain any data rows.");
              return;
            }

            setParsed({ rows, headers });
          },
        });
      } else {
        setParsed(null);
        setError("Please upload a .csv, .xlsx, or .xls file.");
      }
    } catch (e) {
      setParsed(null);
      setError(getErrorMessage(e));
    }
  };

  // เมื่อเปลี่ยน sheet ใน Excel
  useEffect(() => {
    if (!excelBuffer || !excelSelectedSheet) return;

    try {
      const workbook = XLSX.read(excelBuffer, { type: "array" });
      const worksheet = workbook.Sheets[excelSelectedSheet];
      if (!worksheet) return;
      const result = parseWorksheet(worksheet);
      setParsed(result.rows.length ? result : { rows: [], headers: [] });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, [excelBuffer, excelSelectedSheet]);

  const handleConfirm = async () => {
    if (!parsed || !activeCampaign) return;

    // --- 1. เช็คสถิตินามสกุลซ้ำ ---
    const lastNameFreq: Record<string, number> = {};
    let totalValidUsers = 0;

    parsed.rows.forEach(row => {
      const firstName = row.firstname ?? row.first_name ?? row.firstName ?? row["ชื่อ"] ?? row["first name"];
      const lastName = row.lastname ?? row.last_name ?? row.lastName ?? row["นามสกุล"] ?? row["last name"];

      if (firstName || lastName) {
        totalValidUsers++;
        if (lastName) {
          const lnKey = String(lastName).trim();
          lastNameFreq[lnKey] = (lastNameFreq[lnKey] || 0) + 1;
        }
      }
    });

    // ดึงเฉพาะนามสกุลที่ซ้ำกัน (> 1) เรียงจากมากไปน้อย
    const duplicateLastNames = Object.entries(lastNameFreq)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);

    // สร้าง HTML สำหรับ Swal.fire
    let confirmHtml = `คุณกำลังจะนำเข้าข้อมูลผู้ใช้งานจำนวน <strong>${parsed.rows.length.toLocaleString()}</strong> คน<br>เข้าสู่รอบสอบ <strong>${activeCampaign.name}</strong><br>โปรดตรวจสอบให้แน่ใจว่าข้อมูลถูกต้องก่อนดำเนินการต่อ`;

    // ถ้ามีนามสกุลซ้ำ เอา Top 5 มาแสดงเตือน
    if (duplicateLastNames.length > 0) {
      // const topDuplicates = duplicateLastNames.slice(0, 5);
      // const duplicateListHtml = topDuplicates
      //   .map(([ln, count]) => `<li>นามสกุล <b>${ln}</b> : ${count} คน</li>`)
      //   .join("");
      const duplicateListHtml = duplicateLastNames
        .map(([ln, count]) =>
          `<li>นามสกุล <b>${ln}</b> : ${count} คน</li>`
        )
        .join("");
     // const moreText = duplicateLastNames.length > 5 ? `<li>...และอื่นๆ อีก ${duplicateLastNames.length - 5} นามสกุล</li>` : "";
      confirmHtml += `
<br><br>
<div style="
  background-color: #fff3cd; 
  color: #856404; 
  border: 1px solid #ffeeba; 
  padding: 12px; 
  border-radius: 6px; 
  text-align: left; 
  font-size: 0.9em;
">
  <strong>⚠️ พบผู้เข้านามสกุลซ้ำกัน:  ${duplicateLastNames.length} คน</strong>

  <div style="
    max-height: 200px;
    overflow-y: auto;
    margin-top: 8px;
  ">
    <ul style="margin: 0; padding-left: 20px;">
      ${duplicateListHtml}
   
    </ul>
  </div>

  <div style="margin-top: 8px; font-size: 0.85em;">
    ระบบจะพยายามสลับที่นั่งให้ห่างกันโดยอัตโนมัติ
  </div>
</div>`;
    }

    const result = await Swal.fire({
      title: "ยืนยันการนำเข้าข้อมูล",
      html: confirmHtml,
      icon: duplicateLastNames.length > 0 ? "warning" : "info",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    // --- 2. สับเปลี่ยนข้อมูล (Shuffle) ก่อนส่งไป Backend ---
    const shuffledRows = parsed.rows;

    Swal.fire({
      title: "กำลังนำเข้าข้อมูล",
      text: "กรุณารอสักครู่ ระบบกำลังประมวลผล",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const importResult = await dispatch(
        importUsersThunk({
          campaignId: activeCampaign.id,
          rows: shuffledRows, // ส่งตัวที่สับเปลี่ยนแล้วไป
        })
      ).unwrap();

      const parts = [
        `ผู้เข้าสอบเดิมจำนวน ${importResult.totalUsersFound.toLocaleString()} คน`,
        `นำเข้าข้อมูลผู้สอบจำนวน ${importResult.totalCampaignLinks.toLocaleString()} คน`,
        `รวมทั้งสิ้นในรอบสอบ ${importResult.totalUsersCreated.toLocaleString()} คน`,
      ];

      Swal.fire({
        icon: "success",
        title: "นำเข้าข้อมูลสำเร็จ",
        text: parts.join(" · "),
        confirmButtonText: "ตกลง",
      });

      resetState();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "นำเข้าผู้ใช้งานไม่สำเร็จ",
        text: getErrorMessage(err),
        confirmButtonText: "ตกลง",
      });
    }
  };
  const preview = useMemo(() => {
    if (!parsed) return [];
    return parsed.rows.slice(0, previewRows);
  }, [parsed, previewRows]);

  const summaryText =
    parsed && `${parsed.rows.length.toLocaleString()} rows · ${parsed.headers.length} columns`;

  const statsParts = importStats
    ? [
      "Created " + importStats.totalUsersCreated,
      "Existing " + importStats.totalUsersFound,
      "Campaign links " + importStats.totalCampaignLinks,
    ]
    : [];

  const statsText = statsParts.length ? statsParts.join(" · ") : null;

  return {
    // slice data
    activeCampaign,
    importStatus,
    importError,
    importStats,

    // flags
    supportsImport,
    isImporting,

    // file & parsing
    fileName,
    encoding,
    setEncoding,
    previewRows,
    setPreviewRows,
    parsed,
    error,
    excelSheetNames,
    excelSelectedSheet,
    setExcelSelectedSheet,
    preview,
    summaryText,
    statsText,
    resetState,
    // actions
    handleFile,
    handleConfirm,
  };
};
