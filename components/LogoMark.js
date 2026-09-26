// The OPD Check-in mark: a plus split by a heartbeat line, the site's blue-700
// above and blue-400 below. The same drawing as app/icon.svg (the browser tab
// icon), minus the white tile the tab needs on dark browser themes. It is
// decorative: the product name always sits next to it as text.
export function LogoMark({ className }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={className}>
      <defs>
        <clipPath id="logo-above-the-line">
          <path d="M0 0H32V16H20L17.5 8.5L14 20.5L11.5 13L9.5 16H0Z" />
        </clipPath>
      </defs>
      <g className="fill-blue-400">
        <rect x="11" y="3" width="10" height="26" rx="2.5" />
        <rect x="3" y="11" width="26" height="10" rx="2.5" />
      </g>
      <g className="fill-blue-700" clipPath="url(#logo-above-the-line)">
        <rect x="11" y="3" width="10" height="26" rx="2.5" />
        <rect x="3" y="11" width="26" height="10" rx="2.5" />
      </g>
      <path
        d="M1 16H9.5L11.5 13L14 20.5L17.5 8.5L20 16H31"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
