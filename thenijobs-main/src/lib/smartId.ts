export type SmartIdProfileType = 'job_seeker' | 'employer' | 'business_owner';

export type SmartIdPalette = 'emerald' | 'cyan' | 'violet' | 'amber' | 'slate';
export type SmartIdBackground = 'aurora' | 'carbon' | 'grid' | 'plain';
export type SmartIdStyle = 'glass' | 'solid' | 'minimal';

export interface SmartIdTheme {
  palette: SmartIdPalette;
  background: SmartIdBackground;
  style: SmartIdStyle;
  accentColor: string;
}

const DEFAULT_THEME: SmartIdTheme = {
  palette: 'emerald',
  background: 'aurora',
  style: 'glass',
  accentColor: '#10b981',
};

const PALETTE_ACCENTS: Record<SmartIdPalette, string> = {
  emerald: '#10b981',
  cyan: '#06b6d4',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  slate: '#94a3b8',
};

const ID_PREFIX: Record<SmartIdProfileType, string> = {
  job_seeker: 'TJ-SEEK',
  employer: 'TJ-EMP',
  business_owner: 'TJ-BIZ',
};

function hashForId(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(7, '0').slice(0, 7);
}

export function generateTheniJobsId(
  stableId: string,
  type: SmartIdProfileType,
): string {
  return `${ID_PREFIX[type]}-${hashForId(`${type}:${stableId}`)}`;
}

export function slugify(value: string, fallback = 'profile'): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);

  return slug || fallback;
}

export function normalizeSmartIdTheme(theme?: Partial<SmartIdTheme> | null): SmartIdTheme {
  const palette = isPalette(theme?.palette) ? theme.palette : DEFAULT_THEME.palette;
  const background = isBackground(theme?.background) ? theme.background : DEFAULT_THEME.background;
  const style = isStyle(theme?.style) ? theme.style : DEFAULT_THEME.style;
  const accentColor = isHexColor(theme?.accentColor)
    ? theme.accentColor
    : PALETTE_ACCENTS[palette];

  return { palette, background, style, accentColor };
}

export function getPaletteAccent(palette: SmartIdPalette): string {
  return PALETTE_ACCENTS[palette];
}

function isPalette(value: unknown): value is SmartIdPalette {
  return typeof value === 'string' && value in PALETTE_ACCENTS;
}

function isBackground(value: unknown): value is SmartIdBackground {
  return value === 'aurora' || value === 'carbon' || value === 'grid' || value === 'plain';
}

function isStyle(value: unknown): value is SmartIdStyle {
  return value === 'glass' || value === 'solid' || value === 'minimal';
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}
