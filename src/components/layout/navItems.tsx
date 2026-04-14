// layout/navItems.ts
import {
  LayoutDashboard,
  CalendarDays,
  FolderKanban,
  ClipboardCheck,
  HandCoins,
  PackageCheck,
  DownloadCloud,
  KeyRound,
  FilePenLine,
  Users,
  GraduationCap,
  Search as SearchIcon,
  QrCode,
  LucideIcon,
  BookOpen,
  User2Icon,
  ClipboardMinus,
  RotateCcw,
  Settings,
  House,
  FileCheck,
} from "lucide-react";
import type { Permission } from "@/lib/rbac";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  permissions?: Permission[];
  notRequiredCampaignActive?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
      {
    to: "/home",
    label: "หน้าแรก",
    icon: House,
    notRequiredCampaignActive: true
  },

    {
    to: "/subject",
    label: "จัดการรายวิชา",
    icon: BookOpen,
    permissions: ["manage_subjects"],
    notRequiredCampaignActive: true
  },
  {
    to: "/campaign-sessions",
    label: "จัดการรอบสอบ",
    icon: CalendarDays,
    permissions: ["manage_sessions"],
    notRequiredCampaignActive: true
  },
  {
    to: "/accounts",
    label: "จัดการบัญชีผู้ใช้",
    icon: Users,
    permissions: ["manage_accounts"],
    notRequiredCampaignActive: true
  },


  { to: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard , permissions: ["dashboard"]},

    {
    to: "/import-csv",
    label: "นำเข้าข้อมูล",
    icon: DownloadCloud,
    permissions: ["importcsv"],
  },

    {
    to: "/keys",
    label: "เข้ารหัสข้อมูลสอบ",
    icon: KeyRound,
    permissions: ["manage_keys"],
  },

  {
    to: "/seat-allocation",
    label: "จัดที่นั่งสอบ",
    icon: FolderKanban,
    permissions: ["allocate_seats"],
  },
  // {
  //   to: "/exam-rooms",
  //   label: "ห้องสอบ",
  //   icon: ClipboardCheck,
  //   permissions: ["manage_rooms"],
  // },

  {
    to: "/bags",
    label: "ถุงข้อสอบ",
    icon: PackageCheck,
    permissions: ["manage_bags"],
  },
    {
    to: "/sign-sheets",
    label: "ใบบันทึกการสอบ",
    icon: FilePenLine,
    permissions: ["view_sessions"],
  },
  // {
  //   to: "/bag-handover",
  //   label: "ส่งมอบถุง",
  //   icon: HandCoins,
  //   permissions: ["manage_bagshandover"],
  // },
    {
    to: "/grading-station",
    label: "บันทึกคะแนน",
    icon: GraduationCap,
    permissions: ["grade_exams"],
  },
  //   {
  //   to: "/grading-recheck",
  //   label: "ตรวจคะแนน",
  //   icon: GraduationCap,
  //   permissions: ["grade_exams"],
  // },
  {
    to: "/score-review",
    label: "ใบสรุปคะแนน",
    icon: ClipboardCheck,
    permissions: ["view_reports"],
  },
  // {
  //   to: "/user-search",
  //   label: "ค้นหาผู้ใช้",
  //   icon: SearchIcon,
  //   permissions: ["manage_users", "view_sessions"],
  // },
  {
    to: "/graders",
    label: "จัดการผู้ตรวจข้อสอบ",
    icon: User2Icon,
    permissions: ["manage_graders"],
  },
    {
    to: "/subject-ranking-export",
    label: "ออกใบสรุป",
    icon: ClipboardMinus,
    permissions: ["manage_grading"],
  },
  {
    to: "/qrscanner",
    label: "สแกนคิวอาร์โค้ด",
    icon: QrCode,
    permissions: ["view_qr"],
  },
  {
    to: "/grader-score-summary",
    label: "พิมพ์สรุปคะแนน",
    icon: FileCheck,
    permissions: ["grade_exams"],
  },
  {
    to: "/admin-reset",
    label: "รีเซ็ตคะแนน",
    icon: RotateCcw,
    permissions: ["manage_grading"],
  },
  {
    to: "/settings",
    label: "ตั้งค่ารอบสอบ",
    icon: Settings,
    permissions: ["manage_settings"],
  },
];
