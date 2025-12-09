import { useEffect, useMemo, useState } from "react";
import QR from "qrcode";
import pdfMake from "pdfmake/build/pdfmake";
import vfs_th from "../../../../build/vfs_th";
import { useToast } from "@/components/ui/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import {
  selectActiveCampaign,
  selectActiveCampaignSessions,
} from "@/store/slices/examData.slice";
import {
  fetchUserSessionsForSession,
  selectAllUserSessions,
  selectUserSessionsStatus,
  clearUserSessions,
  UserSessionData,
} from "@/store/slices/userSessions.slice";

/* -------------------------------------------------------------------------- */
/*  pdfMake + Thai fonts                                                      */
/* -------------------------------------------------------------------------- */

(pdfMake as any).vfs = vfs_th;
(pdfMake as any).fonts = {
  THSarabun: {
    normal: "THSarabunNew.ttf",
    bold: "THSarabunNew-Bold.ttf",
    italics: "THSarabunNew-Italic.ttf",
    bolditalics: "THSarabunNew-BoldItalic.ttf",
  },
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
};

/* -------------------------------------------------------------------------- */
/*  Types & Utils                                                             */
/* -------------------------------------------------------------------------- */

export type RowItem = {
  firstName: string;
  lastName: string;
  userCode: string;
  roomName: string | null;
  qr_payload: string | null;
  __absIndex?: number;
};

export const QR_SIZE = 96; // ขนาด QR บนหน้าเว็บ
export const QR_BOX = 110;
export const ROWS_PER_PAGE = 6;

const chunk = <T,>(arr: T[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

const BLANK_USER: UserSessionData = {
  user_session_id: 0,
  user_id: 0,
  userCode: "",
  firstName: "",
  lastName: "",
  roomName: null,
  qr_payload: null,
};

const padTo = <T,>(arr: T[], size: number, filler: T) =>
  arr.length >= size
    ? arr
    : [...arr, ...Array.from({ length: size - arr.length }, () => filler)];

const getErrorMessage = (error: unknown) => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Unexpected error occurred";
};

async function makeQR(value: string, size = 300): Promise<string> {
  if (!value) return "";
  return QR.toDataURL(value, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
  });
}

function cellText(text: string, opts: any = {}) {
  return { text, ...opts };
}

/* -------------------------------------------------------------------------- */
/*  PDF Export                                                                */
/* -------------------------------------------------------------------------- */

export async function exportSignSheetsPDF({
  rows,
  course,
  org,
  sessionText,
  rowsPerPage = ROWS_PER_PAGE,
  fileName = "ใบเซ็นชื่อผู้เข้าสอบ.pdf",
  useThaiFont = false,
}: {
  rows: RowItem[];
  course: string;
  org: string;
  sessionText: string;
  rowsPerPage?: number;
  fileName?: string;
  useThaiFont?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const pages: RowItem[][] = chunk(rows, rowsPerPage).map((p, i) => {
    while (p.length < rowsPerPage) {
      p.push({
        firstName: "",
        lastName: "",
        userCode: "",
        roomName: null,
        qr_payload: null,
      });
    }
    p.forEach((r, j) => (r.__absIndex = i * rowsPerPage + j + 1));
    return p;
  });

  const content: any[] = [];

  for (let pageNo = 1; pageNo <= totalPages; pageNo++) {
    const pageRows = pages[pageNo - 1];

    // Header
    content.push(
      {
        text: `ใบเซ็นชื่อสอบวิชา ${course}`,
        bold: true,
        fontSize: 16,
        alignment: "center",
        margin: [0, 0, 0, 4],
      },
      {
        text: `${sessionText}  ณ ${org}`,
        alignment: "center",
        margin: [0, 0, 0, 2],
      },
      {
        text: `${rows.length} คน | หน้า ${pageNo}/${totalPages}`,
        alignment: "center",
        color: "#666",
        fontSize: 9,
        margin: [0, 0, 0, 8],
      }
    );

    // Table header
    const tableBody: any[] = [];
    tableBody.push([
      cellText("ลำดับ", { bold: true, alignment: "center" }),
      cellText("ชื่อ-นามสกุล / รหัส / ห้อง", { bold: true }),
      cellText("คิวอาร์โค้ดภาคผนวก", { bold: true, alignment: "center" }),
      cellText("คิวอาร์โค้ดภาคผนวก", { bold: true, alignment: "center" }),
    ]);

    for (const r of pageRows) {
      const isBlank = !r.userCode && !r.firstName;

      const infoCell = isBlank
        ? [{ text: " " }]
        : [
            { text: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() },
            {
              text: `เลขที่นั่งสอบ ${r.userCode || "-"}`,
              fontSize: 9,
              color: "#666",
            },
            {
              text: `ห้องสอบ ${r.roomName ?? "-"}`,
              fontSize: 9,
              color: "#666",
            },
            {
              text: "ลายเซ็น..................................................",
              fontSize: 9,
              color: "#666",
              margin: [0, 4, 0, 0],
            },
          ];

      let qrDataURL_CheckIn = "";
      if (!isBlank && r.qr_payload) {
        qrDataURL_CheckIn = await makeQR(r.qr_payload, 350);
      }

      const qrCell_CheckIn = isBlank
        ? { text: " " }
        : qrDataURL_CheckIn
        ? { image: qrDataURL_CheckIn, width: 95, alignment: "center" }
        : {
            text: "NULL (ยังไม่เข้ารหัส)",
            color: "#c00000",
            bold: true,
            alignment: "center",
            fontSize: 9,
          };

      const qrCell_CheckOut = isBlank
        ? { text: " " }
        : qrDataURL_CheckIn
        ? { image: qrDataURL_CheckIn, width: 95, alignment: "center" }
        : {
            text: "NULL (ยังไม่เข้ารหัส)",
            color: "#c00000",
            bold: true,
            alignment: "center",
            fontSize: 9,
          };

      tableBody.push([
        { text: String(r.__absIndex), alignment: "center" },
        { stack: infoCell },
        qrCell_CheckIn,
        qrCell_CheckOut,
      ]);
    }

    content.push({
      table: {
        headerRows: 1,
        widths: [40, "*", 120, 120],
        body: tableBody,
      },
      layout: {
        hLineWidth: () => 0.7,
        vLineWidth: () => 0.7,
        hLineColor: () => "#000",
        vLineColor: () => "#000",
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 6,
        paddingBottom: () => 6,
      },
      dontBreakRows: true,
    });

    if (pageNo < totalPages) {
      content.push({ text: "", pageBreak: "after" });
    }
  }

  const docDefinition: any = {
    pageSize: "A4",
    pageMargins: [25, 28, 25, 28],
    content,
    defaultStyle: {
      fontSize: 11,
      font: useThaiFont ? "THSarabun" : undefined,
    },
  };

  // pdfMake.createPdf(docDefinition).download(fileName);
   pdfMake.createPdf(docDefinition).open();
}

/* -------------------------------------------------------------------------- */
/*  Hook: useSignSheetsPage                                                   */
/* -------------------------------------------------------------------------- */

export function useSignSheetsPage() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const activeCampaign = useAppSelector(selectActiveCampaign);
  const sessions = useAppSelector(selectActiveCampaignSessions) as any[];
  const userSessions = useAppSelector(selectAllUserSessions);
  const userSessionsStatus = useAppSelector(selectUserSessionsStatus);

  const [course, setCourse] = useState("วิชา ABC123");
  const [sessionText, setSessionText] = useState("20/10/65 09:00–10:00");
  const [org, setOrg] = useState("สถาบันการศึกษา XXX");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [search, setSearch] = useState("");

  // ตั้งค่ารอบสอบเริ่มต้น
  useEffect(() => {
    if (!sessions.length) {
      setSelectedSessionId("");
      return;
    }
    if (!selectedSessionId || !sessions.some((s) => s.id === selectedSessionId)) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  // ดึง userSessions ตาม session ที่เลือก
  useEffect(() => {
    if (selectedSessionId) {
      const numericSessionId = parseInt(selectedSessionId.replace("sess-", ""));
      if (!isNaN(numericSessionId)) {
        dispatch(fetchUserSessionsForSession(numericSessionId));
      }
    }
    return () => {
      dispatch(clearUserSessions());
    };
  }, [selectedSessionId, dispatch]);

  // sync course + sessionText จาก session ที่เลือก
  useEffect(() => {
    const session = sessions.find((s) => s.id === selectedSessionId);
    if (session) {
      // ถ้ามีชื่อวิชาใน session แรกให้ override, ถ้าไม่มีก็ใช้ค่าที่มีอยู่
      setCourse((prev) => session.subjects?.[0]?.name ?? prev);
      setSessionText(
        `${new Date(session.examDate).toLocaleDateString("th-TH")} ${session.label}`
      );
    }
  }, [sessions, selectedSessionId]);

  // sync ชื่อ org จาก campaign
  useEffect(() => {
    if (activeCampaign) setOrg(activeCampaign.name);
  }, [activeCampaign]);

  // filter + pages
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return userSessions;
    return userSessions.filter((r) =>
      [r.userCode, r.firstName, r.lastName, r.roomName ?? "null"]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [userSessions, search]);

  const pages = useMemo(() => {
    const ch = chunk(filtered, ROWS_PER_PAGE);
    return ch.map((page) => padTo(page, ROWS_PER_PAGE, BLANK_USER));
  }, [filtered]);

  /* --------------------------- Export handlers --------------------------- */

  const handleExportCsv = () => {
    const header = "รหัส,ชื่อ,นามสกุล,ห้อง,qr_payload (Encrypted)";
    const lines = filtered.map((e) => {
      return [
        e.userCode,
        e.firstName,
        e.lastName,
        e.roomName ?? "-",
        e.qr_payload ?? "NULL",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [header, ...lines].join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ใบเซ็นชื่อพร้อมQR.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    if (!filtered.length) {
      toast({
        title: "ไม่พบข้อมูลผู้เข้าสอบ",
        description: "กรุณาเพิ่มข้อมูลผู้เข้าสอบก่อน Export PDF",
        variant: "destructive",
      });
      return;
    }

    try {
      await exportSignSheetsPDF({
        rows: filtered.map((r) => ({
          firstName: r.firstName,
          lastName: r.lastName,
          userCode: r.userCode,
          roomName: r.roomName ?? null,
          qr_payload: r.qr_payload ?? null,
        })),
        course,
        org,
        sessionText,
        rowsPerPage: ROWS_PER_PAGE,
        fileName: `ใบเซ็นชื่อ_${org.replaceAll(" ", "")}.pdf`,
        useThaiFont: true,
      });
    } catch (error) {
      toast({
        title: "Export PDF ล้มเหลว",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    if (!filtered.length) {
      toast({
        title: "ไม่พบข้อมูลผู้เข้าสอบ",
        description: "กรุณาเพิ่มข้อมูลผู้เข้าสอบก่อนพิมพ์",
        variant: "destructive",
      });
      return;
    }
    window.print();
  };

  return {
    // store data
    activeCampaign,
    sessions,
    userSessionsStatus,

    // state
    course,
    setCourse,
    sessionText,
    setSessionText,
    org,
    setOrg,
    selectedSessionId,
    setSelectedSessionId,
    search,
    setSearch,

    // derived
    filtered,
    pages,

    // export handlers
    handleExportCsv,
    handleExportPdf,
    handlePrint,
  };
}
