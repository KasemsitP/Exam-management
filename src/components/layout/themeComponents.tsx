// src/layout/ThemeComponents.tsx
import React from "react";
import type { Theme } from "./theme";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function ThemedCard({
  theme,
  className = "",
  style,
  ...props
}: DivProps & { theme: Theme }) {
  return (
    <div
      {...props}
      className={`card shadow-sm ${className}`}
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 12,
        ...style,
      }}
    />
  );
}

export function ThemedPanel({
  theme,
  title,
  subtitle,
  right,
  children,
  className = "",
  bodyClassName = "",
}: {
  theme: Theme;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={`shadow-sm ${className}`}
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {(title || subtitle || right) && (
        <div
          className="d-flex align-items-start justify-content-between gap-3 px-3 px-md-4 py-3"
          style={{
            background: `linear-gradient(180deg, ${theme.surface} 0%, ${theme.cardBg} 100%)`,
            borderBottom: `1px solid ${theme.cardBorder}`,
          }}
        >
          <div>
            {title && (
              <div style={{ color: theme.text, fontWeight: 700, fontSize: 16 }}>
                {title}
              </div>
            )}
            {subtitle && (
              <div style={{ color: theme.textMuted, fontSize: 13, marginTop: 2 }}>
                {subtitle}
              </div>
            )}
          </div>

          {right && <div className="d-flex align-items-center">{right}</div>}
        </div>
      )}

      <div className={`p-3 p-md-4 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

export function ThemedSection({
  theme,
  children,
  className = "",
}: {
  theme: Theme;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={className}
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: 14,
      }}
    >
      {children}
    </section>
  );
}

// helper: inline style สำหรับ input/toolbar ให้ไม่ขาวลอย
export const themedSurfaceStyle = (theme: Theme) => ({
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  color: theme.text,
});
