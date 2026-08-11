export function ShapeIcon({
  shape,
  color,
  size = 34,
}: {
  shape: string;
  color: string;
  size?: number;
}) {
  if (shape === "triangle") {
    return (
      <svg width={size} height={size} viewBox="0 0 34 34">
        <polygon
          points="17,3 31,29 3,29"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      </svg>
    );
  }
  if (shape === "square") {
    return (
      <svg width={size} height={size} viewBox="0 0 34 34">
        <rect
          x="3"
          y="3"
          width="28"
          height="28"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 34 34">
      <circle
        cx="17"
        cy="17"
        r="14"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}
