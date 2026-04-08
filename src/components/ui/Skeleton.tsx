import React from "react";

const shimmerStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #ececec 25%, #f5f5f5 50%, #ececec 75%)",
  backgroundSize: "200% 100%",
  animation: "skeleton-shimmer 1.4s ease-in-out infinite",
  borderRadius: 4,
  display: "inline-block",
};

const keyframes = `
  @keyframes skeleton-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

let injected = false;
function injectKeyframes() {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const style = document.createElement("style");
  style.textContent = keyframes;
  document.head.appendChild(style);
}

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ width = "100%", height = 16, className = "" }: SkeletonProps) {
  injectKeyframes();
  return <span className={className} style={{ ...shimmerStyle, width, height }} />;
}

export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  injectKeyframes();
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} style={{ padding: "10px 12px" }}>
              <Skeleton height={18} width={j === cols - 1 ? "60%" : j === 0 ? "40%" : "80%"} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
