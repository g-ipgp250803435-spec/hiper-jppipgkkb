import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'menu'
  | 'close'
  | 'sun'
  | 'moon'
  | 'chevron-right'
  | 'heart'
  | 'box'
  | 'fund'
  | 'megaphone'
  | 'check'
  | 'lock'
  | 'empty'
  | 'refresh'
  | 'search'
  | 'edit'
  | 'trash'
  | 'save'
  | 'plus'
  | 'logout'
  | 'login'
  | 'pin'
  | 'image'
  | 'user'
  | 'calendar'
  | 'language'
  | 'alert'
  | 'activity'
  | 'dashboard'
  | 'bold'
  | 'italic'
  | 'list'
  | 'list-ordered'
  | 'undo'
  | 'redo'
  | 'settings'
  | 'building'
  | 'mail'
  | 'external-link'
  | 'copy'
  | 'wallet'
  | 'briefcase'
  | 'shield'
  | 'chart'

const paths: Record<IconName, ReactNode> = {
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41" /></>,
  moon: <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" /></>,
  'chevron-right': <><path d="m9 18 6-6-6-6" /></>,
  heart: <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" /></>,
  box: <><path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="m3 8 9 5 9-5M3 8v8l9 5 9-5V8M12 13v8" /></>,
  fund: <><circle cx="12" cy="12" r="9" /><path d="M16 8.5c-.8-.8-2-1.2-4-1.2-2.2 0-3.5 1-3.5 2.4 0 3.6 7.1 1.6 7.1 5 0 1.4-1.4 2.5-3.8 2.5-1.8 0-3.2-.5-4.1-1.4M12 5v14" /></>,
  megaphone: <><path d="m3 11 14-5v12L3 13v-2Z" /><path d="M17 10h2a2 2 0 0 1 0 4h-2M6 14l1.5 5h3L9 15" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  empty: <><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
  refresh: <><path d="M20 6v5h-5M4 18v-5h5" /><path d="M18.49 9A7 7 0 0 0 6 5.5L4 8M5.51 15A7 7 0 0 0 18 18.5l2-2.5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
  trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6" /></>,
  save: <><path d="M4 4h13l3 3v13H4Z" /><path d="M8 4v6h8V4M8 20v-6h8v6" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></>,
  login: <><path d="m10 17 5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></>,
  pin: <><path d="m14 4 6 6-3 1-4 4-1 5-2-2-2-2 5-1 4-4 1-3-6-6-1 3 4 4-7 7" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 15-5-5L5 20" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  language: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>,
  alert: <><path d="M12 3 2.5 20h19Z" /><path d="M12 9v4M12 17h.01" /></>,
  activity: <><path d="M3 12h4l2-7 4 14 2-7h6" /></>,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  bold: <><path d="M7 5h6a4 4 0 0 1 0 8H7z" /><path d="M7 13h7a4 4 0 0 1 0 8H7z" /></>,
  italic: <><path d="M10 4h8M6 20h8M14 4 10 20" /></>,
  list: <><path d="M9 6h12M9 12h12M9 18h12" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
  'list-ordered': <><path d="M10 6h11M10 12h11M10 18h11" /><path d="M4 5h1v3M4 8h2M4 11h2l-2 3h2M4 17c1.5-1 3 1 1 2 2-1 .5 3-1 1" /></>,
  undo: <><path d="M9 7 4 12l5 5" /><path d="M20 17a8 8 0 0 0-11-7l-5 2" /></>,
  redo: <><path d="m15 7 5 5-5 5" /><path d="M4 17a8 8 0 0 1 11-7l5 2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 5 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 5a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.16.39.45.72.82.94.26.15.56.23.86.23H21v4h-.1a1.7 1.7 0 0 0-1.5.83Z" /></>,
  building: <><path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-4h6v4M9 10h.01M12 10h.01M15 10h.01M9 13h.01M12 13h.01M15 13h.01" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  'external-link': <><path d="M14 3h7v7M10 14 21 3" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></>,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  wallet: <><path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h16v10a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6" /><path d="M16 13h5" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20V8M2 20h22" /></>,
}

export function Icon({ name, size = 20, className = '', ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
