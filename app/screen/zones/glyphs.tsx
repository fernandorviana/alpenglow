import type { ReactNode, SVGProps } from 'react';

/**
 * The few glyphs the screen needs, drawn as the Scheduler page's Video and
 * Person are: a 16 grid, a 1.5 stroke in the text's colour, hidden from
 * assistive technology — whatever holds one names it.
 */
function Glyph({ children, ...rest }: { children: ReactNode } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Today = () => (
  <Glyph>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4.75V8l2.25 1.5" />
  </Glyph>
);

export const CalendarGlyph = () => (
  <Glyph>
    <rect x="2" y="3" width="12" height="11" rx="1.5" />
    <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
  </Glyph>
);

export const Clients = () => (
  <Glyph>
    <circle cx="6" cy="5.5" r="2.5" />
    <path d="M1.5 13.5c0-2.5 2-3.75 4.5-3.75s4.5 1.25 4.5 3.75" />
    <path d="M10.5 3.25a2.5 2.5 0 010 4.5M12 9.9c1.5.4 2.5 1.5 2.5 3.6" />
  </Glyph>
);

export const Messages = () => (
  <Glyph>
    <path d="M2.5 3.5h11a1 1 0 011 1v6.5a1 1 0 01-1 1H7l-3 2.5V12H2.5a1 1 0 01-1-1V4.5a1 1 0 011-1z" />
  </Glyph>
);

export const Reports = () => (
  <Glyph>
    <path d="M2 14h12" />
    <path d="M4 11.5V8M8 11.5V4M12 11.5V6.5" />
  </Glyph>
);

export const Settings = () => (
  <Glyph>
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />
  </Glyph>
);

export const Bell = () => (
  <Glyph>
    <path d="M4 11.5V7a4 4 0 018 0v4.5l1 1H3l1-1z" />
    <path d="M6.5 14.25a1.5 1.5 0 003 0" />
  </Glyph>
);

export const Video = () => (
  <Glyph>
    <rect x="1.5" y="4" width="9" height="8" rx="1.5" />
    <path d="M10.5 7l4-2v6l-4-2" />
  </Glyph>
);

export const Search = () => (
  <Glyph>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" />
  </Glyph>
);

export const Previous = () => (
  <Glyph>
    <path d="M10 3.5L5.5 8l4.5 4.5" />
  </Glyph>
);

export const Next = () => (
  <Glyph>
    <path d="M6 3.5l4.5 4.5L6 12.5" />
  </Glyph>
);

export const Plus = () => (
  <Glyph>
    <path d="M8 3v10M3 8h10" />
  </Glyph>
);

export const Check = () => (
  <Glyph>
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
  </Glyph>
);

export const Cross = () => (
  <Glyph>
    <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" />
  </Glyph>
);

/** The details drawer: a panel opening at the side. */
export const OpenPanel = () => (
  <Glyph>
    <rect x="2" y="3" width="12" height="10" rx="1.5" />
    <path d="M9.5 3v10" />
  </Glyph>
);

/** The practice's mark: a ridge with the light still on its peak, 20 as the brand is drawn. */
export const Ridge = () => (
  <Glyph width="20" height="20">
    <path d="M1 13.5l4.5-6.5 3 4 2.5-3.5 4 6z" />
    <path d="M9.5 3.25h.01" strokeWidth="2" />
  </Glyph>
);
