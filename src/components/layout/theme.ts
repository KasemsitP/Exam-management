// src/layout/theme.ts
import type { Role } from "@/store/slices/auth.slice";

export type Theme = {
  color: string; // role accent
  accent: string;

  headerBg: string;
  headerGradient?: string;

  mainBg: string;
  surface: string;
  border: string;

  text: string;
  textMuted: string;

  cardBg: string;
  cardBorder: string;

  buttonPrimary: string;
  buttonPrimaryHover: string;

  hover: string;
  active: string;

  success: string;
  warning: string;
  error: string;

  white : string
};

const tint = (hex: string, percent: number) =>
  `color-mix(in srgb, ${hex} ${percent}%, #ffffff)`;

const shade = (hex: string, percent: number) =>
  `color-mix(in srgb, ${hex} ${percent}%, #0f172a)`;

// Header gradient แบบ “มีโทน” แต่ไม่จัด
const makeRoleHeaderGradient = (roleHex: string) =>
  `linear-gradient(135deg,
    #ffffff 0%,
    ${tint(roleHex, 10)} 45%,
    #ffffff 100%
  )`;

// Main BG ให้ contrast และไม่ขาวล้วน + ไม่เหมือน header
const makeRoleMainBg = (roleHex: string) =>
  `linear-gradient(180deg,
    ${tint(roleHex, 6)} 0%,
    #F4F7FB 55%,
    #F4F7FB 100%
  )`;

export const BASE: Omit<
  Theme,
  | "color"
  | "accent"
  | "headerGradient"
  | "mainBg"
  | "cardBg"
  | "cardBorder"
  | "buttonPrimary"
  | "buttonPrimaryHover"
> = {
  headerBg: "#ffffff",
  surface: "#ffffff",
  border: "#d7e0ea",
  white: "#ffffff",

  text: "#0f172a",
  textMuted: "#64748b",

  hover: "rgba(15,23,42,0.04)",
  active: "rgba(15,23,42,0.07)",

  success: "#059669",
  warning: "#d97706",
  error: "#dc2626",
};

// ✅ ตามที่คุณต้องการ: Admin แดง / Key manager เหลือง (เอาไปใช้ทีหลัง) / Staff ฟ้า
// ตอนนี้ “Role-first” ก่อน
export const ROLE_COLORS: Record<Role | "DEFAULT", { color: string; accent: string }> = {
  admin: {
    color: "#9F1239",   // crimson red
    accent: "#7F1D1D",
  },

  // 🟡 Manager — Golden Amber (ไม่ชน staff)
  manager: {
    color: "#CA8A04",   // golden amber
    accent: "#A16207",
  },

  // 🔵 Staff — Royal Blue (ชัด สะอาด)
  staff: {
    color: "#1D4ED8",   // royal blue
    accent: "#1E40AF",
  },

  // 🟢 Grader — Teal Green (แยกชัดจากทุก role)
  grader: {
    color: "#0F766E",   // teal
    accent: "#115E59",
  },
  DEFAULT: { color: "#475569", accent: "#334155" },
};

export function buildThemeByRole(role: Role | "DEFAULT"): Theme {
  const roleHex = ROLE_COLORS[role]?.color ?? ROLE_COLORS.DEFAULT.color;
  const roleAccent = ROLE_COLORS[role]?.accent ?? ROLE_COLORS.DEFAULT.accent;

  return {
    ...BASE,
    color: roleHex,
    accent: roleAccent,

    headerGradient: makeRoleHeaderGradient(roleHex),
    // mainBg: makeRoleMainBg(roleHex),
    mainBg: "#F4F7FB",

    // ✅ ลด “ขาวโพลน”: card เป็น tint อ่อน ๆ
    cardBg: tint(roleHex, 7),
    cardBorder: tint(roleHex, 22),

    buttonPrimary: roleHex,
    buttonPrimaryHover: shade(roleHex, 22),
  };
}

export function pickRoleKey(roles: Role[]): Role | "DEFAULT" {
  const has = (r: Role) => roles.includes(r);
  if (has("admin")) return "admin";
  if (has("manager")) return "manager";
  if (has("staff")) return "staff";
  if (has("grader")) return "grader";
  return "DEFAULT";
}
