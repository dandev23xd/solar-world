const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

const make = paths => function Icon({ size = 18, ...rest }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...rest}>{paths}</svg>;
};

export const SearchIcon = make(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.5-4.5" /></>);
export const CartIcon = make(<><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.6 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L22 7H6.2" /></>);
export const TruckIcon = make(<><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>);
export const TrendIcon = make(<><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>);
export const ChartIcon = make(<><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></>);
export const ReceiptIcon = make(<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>);
export const PanelIcon = make(<><rect x="3" y="4" width="18" height="12" rx="1" /><path d="M3 10h18M9 4v12M15 4v12M12 16v4M8 20h8" /></>);
export const BoltIcon = make(<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />);
export const BatteryIcon = make(<><rect x="2" y="7" width="17" height="10" rx="2" /><path d="M22 11v2M6 10v4M10 10v4" /></>);
export const PlugIcon = make(<><path d="M9 2v6M15 2v6" /><path d="M6 8h12v3a6 6 0 0 1-12 0V8z" /><path d="M12 17v5" /></>);
export const BulbIcon = make(<><path d="M9 18h6M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" /></>);
export const PowerIcon = make(<><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M8 6V4h8v2M13 9l-3 4h4l-3 4" /></>);
export const DropIcon = make(<path d="M12 2.7l5.7 6.4a7.5 7.5 0 1 1-11.4 0L12 2.7z" />);
export const XIcon = make(<path d="M18 6L6 18M6 6l12 12" />);
export const GridIcon = make(<><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>);
export const BarsIcon = make(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />);
export const TargetIcon = make(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>);
export const UsersIcon = make(<><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 11a3 3 0 1 0 0-6M22 21c0-3-2-5-5-5.5" /></>);
export const BoxIcon = make(<><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /></>);
export const MegaphoneIcon = make(<><path d="M3 11v2a1 1 0 0 0 1 1h3l6 5V5L7 10H4a1 1 0 0 0-1 1z" /><path d="M17 8a5 5 0 0 1 0 8" /></>);
export const LogoutIcon = make(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>);

export function SunLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="15" cy="15" r="7" fill="#F2A516" />
      <g stroke="#F2A516" strokeWidth="2.2" strokeLinecap="round">
        <line x1="15" y1="2" x2="15" y2="5" /><line x1="15" y1="25" x2="15" y2="28" />
        <line x1="2" y1="15" x2="5" y2="15" /><line x1="25" y1="15" x2="28" y2="15" />
        <line x1="5.8" y1="5.8" x2="8" y2="8" /><line x1="22" y1="22" x2="24.2" y2="24.2" />
        <line x1="5.8" y1="24.2" x2="8" y2="22" /><line x1="22" y1="8" x2="24.2" y2="5.8" />
      </g>
    </svg>
  );
}