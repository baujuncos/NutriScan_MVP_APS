import React from "react";

export default function LogoIcon({ width = 18, height = 18, color = "currentColor", strokeWidth = 2.5 }: { width?: number; height?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
