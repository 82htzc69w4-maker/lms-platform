export type ThemeMode = 'dark' | 'light' | 'system' | 'custom';

export type CustomColors = {
  bg?: string;
  panel?: string;
  panelAlt?: string;
  gridLine?: string;
  textPrimary?: string;
  textMuted?: string;
  hazard?: string;
  risk?: string;
  refresher?: string;
  competent?: string;
};

export type BrandingSettings = {
  companyName: string;
  systemName: string;
  /** Data URL (e.g. "data:image/png;base64,...") or null if no logo uploaded yet */
  logoDataUrl: string | null;
  theme: ThemeMode;
  customColors?: CustomColors;
};

export const DEFAULT_BRANDING: BrandingSettings = {
  companyName: 'Bohs Consultants',
  systemName: 'Bohs LMS',
  logoDataUrl: null,
  theme: 'dark',
};
