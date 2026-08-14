// The aperture mark is Vision AI's signature element: a set of overlapping
// blades like a camera iris. It doubles as the static logo (Sidebar) and,
// animated, as the listening indicator on the Voice page.
export default function ApertureMark({ size = 28, spin = false, className = "" }) {
  const blades = 6;
  const r = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${spin ? "animate-iris-spin-slow" : ""} ${className}`}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      {Array.from({ length: blades }).map((_, i) => {
        const angle = (360 / blades) * i;
        return (
          <path
            key={i}
            d="M50 50 L86 50 A36 36 0 0 0 68 19 Z"
            fill="currentColor"
            fillOpacity="0.9"
            transform={`rotate(${angle} 50 50)`}
            style={{ mixBlendMode: "screen" }}
          />
        );
      })}
      <circle cx="50" cy="50" r="14" fill="#0E1013" />
    </svg>
  );
}
