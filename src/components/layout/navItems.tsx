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
  User2Icon
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
    to: "/subject",
    label: "จัดการรายวิชา",
    icon: BookOpen,
    permissions: ["manage_sessions"],
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


  { to: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },

  {
    to: "/seat-allocation",
    label: "จัดที่นั่งสอบ",
    icon: FolderKanban,
    permissions: ["allocate_seats"],
  },
  {
    to: "/exam-rooms",
    label: "ห้องสอบ",
    icon: ClipboardCheck,
    permissions: ["manage_rooms"],
  },

  {
    to: "/bags",
    label: "ถุงข้อสอบ",
    icon: PackageCheck,
    permissions: ["manage_bags"],
  },
  {
    to: "/bag-handover",
    label: "ส่งมอบถุง",
    icon: HandCoins,
    permissions: ["manage_bags"],
  },
  {
    to: "/import-csv",
    label: "นำเข้าข้อมูล",
    icon: DownloadCloud,
    permissions: ["import_subjects"],
  },
  {
    to: "/keys",
    label: "รหัสผ่าน / คีย์",
    icon: KeyRound,
    permissions: ["manage_keys"],
  },
  {
    to: "/sign-sheets",
    label: "ใบบันทึกการสอบ",
    icon: FilePenLine,
    permissions: ["view_sessions"],
  },
  {
    to: "/grading-station",
    label: "บันทึกคะแนน",
    icon: GraduationCap,
    permissions: ["grade_exams"],
  },
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
    to: "/qrscanner",
    label: "สแกนคิวอาร์โค้ด",
    icon: QrCode,
    permissions: ["view_qr"],
  },
];
