/**
 * Inline SVG icon set.
 *
 * Hand-rolled rather than pulling in an icon package: it keeps the bundle small
 * and the deployment free of another dependency to install.
 */

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function Svg({ size = 18, children, ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...base}
      {...rest}
    >
      {children}
    </svg>
  );
}

export const BoltIcon = (p) => (
  <Svg {...p}><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z" /></Svg>
);

export const GridIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </Svg>
);

export const BoxIcon = (p) => (
  <Svg {...p}>
    <path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z" />
    <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
  </Svg>
);

export const CartIcon = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
    <path d="M2 3h2.2l2.6 12.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 2-1.6L21 8H6" />
  </Svg>
);

export const WalletIcon = (p) => (
  <Svg {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h12.5a1.5 1.5 0 0 1 0 3H5a2 2 0 0 0-2 2z" />
    <path d="M3 10v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H5" />
    <circle cx="17" cy="13.5" r="1.1" />
  </Svg>
);

export const ChartIcon = (p) => (
  <Svg {...p}>
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <path d="M7 15V9M12 15V5M17 15v-4" />
  </Svg>
);

export const TagIcon = (p) => (
  <Svg {...p}>
    <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2.8 12V4.8A2 2 0 0 1 4.8 2.8H12a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.8z" />
    <circle cx="7.5" cy="7.5" r="1.3" />
  </Svg>
);

export const PlusIcon = (p) => (<Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>);
export const CheckIcon = (p) => (<Svg {...p}><path d="m4 12.5 5 5L20 6.5" /></Svg>);
export const CloseIcon = (p) => (<Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>);
export const SearchIcon = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>
);
export const PencilIcon = (p) => (
  <Svg {...p}>
    <path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16z" />
    <path d="m14.5 5.5 4 4" />
  </Svg>
);
export const TrashIcon = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V4.8A.8.8 0 0 1 9.8 4h4.4a.8.8 0 0 1 .8.8V7" />
    <path d="M6.5 7l.8 12.3a1.8 1.8 0 0 0 1.8 1.7h5.8a1.8 1.8 0 0 0 1.8-1.7L17.5 7" />
    <path d="M10.5 11v6M13.5 11v6" />
  </Svg>
);
export const LogoutIcon = (p) => (
  <Svg {...p}>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 17l-5-5 5-5M5 12h11" />
  </Svg>
);
export const SunIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6" />
  </Svg>
);
export const MoonIcon = (p) => (
  <Svg {...p}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" /></Svg>
);
export const AlertIcon = (p) => (
  <Svg {...p}>
    <path d="M10.3 3.9 2.6 17.2A1.9 1.9 0 0 0 4.3 20h15.4a1.9 1.9 0 0 0 1.7-2.8L13.7 3.9a1.9 1.9 0 0 0-3.4 0z" />
    <path d="M12 9v4.5M12 17h.01" />
  </Svg>
);
export const InfoIcon = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Svg>
);
export const TrendUpIcon = (p) => (
  <Svg {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></Svg>
);
export const TrendDownIcon = (p) => (
  <Svg {...p}><path d="m3 7 6 6 4-4 8 8" /><path d="M21 17h-6v-6" /></Svg>
);
export const MenuIcon = (p) => (<Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>);
export const RefreshIcon = (p) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 0 1-15.6 6.1L3 16" />
    <path d="M3 12a9 9 0 0 1 15.6-6.1L21 8" />
    <path d="M21 4v4h-4M3 20v-4h4" />
  </Svg>
);
export const PrintIcon = (p) => (
  <Svg {...p}>
    <path d="M7 8V4h10v4" />
    <rect x="3" y="8" width="18" height="8" rx="2" />
    <path d="M7 16h10v4H7z" />
  </Svg>
);
export const UserIcon = (p) => (
  <Svg {...p}><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></Svg>
);
export const DownloadIcon = (p) => (
  <Svg {...p}><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5" /><path d="M4 20h16" /></Svg>
);
export const ReceiptIcon = (p) => (
  <Svg {...p}>
    <path d="M5 3h14v18l-3.5-2-3.5 2-3.5-2L5 21z" />
    <path d="M9 8h6M9 12h6" />
  </Svg>
);
