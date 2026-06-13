import Link from "next/link";

type FlowLinkLogoProps = {
  href?: string;
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showText?: boolean;
};

function FlowLinkMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 150 118"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="16"
        y="66"
        width="92"
        height="34"
        rx="17"
        transform="rotate(-28 16 66)"
        stroke="#0E5BEA"
        strokeWidth="12"
      />
      <rect
        x="55"
        y="66"
        width="92"
        height="34"
        rx="17"
        transform="rotate(-28 55 66)"
        stroke="#08B86B"
        strokeWidth="12"
      />
      <rect
        x="56"
        y="58"
        width="42"
        height="12"
        rx="6"
        transform="rotate(-28 56 58)"
        fill="#0E1726"
        fillOpacity="0.88"
      />
      <circle cx="13" cy="91" r="9" fill="#0E5BEA" />
      <circle cx="135" cy="27" r="9" fill="#08B86B" />
      <path d="M108 38L130 47L111 62Z" fill="#0E1726" />
    </svg>
  );
}

export function FlowLinkLogo({
  href = "/",
  className = "",
  markClassName = "h-8 w-10",
  textClassName = "text-xl",
  showText = true,
}: FlowLinkLogoProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 font-black tracking-tight text-slate-950 ${className}`}
      aria-label="Flow Link"
    >
      <FlowLinkMark className={markClassName} />
      {showText ? (
        <span className={`whitespace-nowrap leading-none ${textClassName}`}>
          Flow <span className="text-blue-600">Link</span>
        </span>
      ) : null}
    </Link>
  );
}
