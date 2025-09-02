export const BLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer B */}
      <path
        d="M15 10 L55 10 C70 10 80 20 80 35 C80 45 75 52 70 55 C78 58 85 65 85 78 C85 90 75 95 60 95 L15 95 Z"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
      {/* Middle B */}
      <path
        d="M20 15 L50 15 C62 15 70 22 70 32 C70 40 65 45 62 47 C68 49 73 55 73 65 C73 75 65 80 55 80 L20 80 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Inner B */}
      <path
        d="M25 20 L45 20 C54 20 60 25 60 32 C60 37 57 40 55 42 C58 44 62 48 62 55 C62 62 56 67 48 67 L25 67 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Innermost B */}
      <path
        d="M30 25 L42 25 C48 25 52 28 52 33 C52 36 50 38 49 39 C51 40 53 43 53 47 C53 52 49 55 44 55 L30 55 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Horizontal dividers */}
      <line
        x1="20"
        y1="47"
        x2="65"
        y2="47"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="25"
        y1="42"
        x2="58"
        y2="42"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="30"
        y1="39"
        x2="51"
        y2="39"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
};
