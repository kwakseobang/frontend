interface BackChevronIconProps {
  size?: number;
  stroke?: string;
}

export function BackChevronIcon({ size = 18, stroke = "var(--color-text-quaternary)" }: BackChevronIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
