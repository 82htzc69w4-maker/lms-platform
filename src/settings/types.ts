export type ThemeMode = 'dark' | 'light' | 'system';

export type BrandingSettings = {
  companyName: string;
  systemName: string;
  /** Data URL (e.g. "data:image/png;base64,...") or null if no logo uploaded yet */
  logoDataUrl: string | null;
  theme: ThemeMode;
};

export const DEFAULT_BRANDING: BrandingSettings = {
  companyName: 'Bohs Consultants',
  systemName: 'Bohs LMS',
  logoDataUrl: null,
  theme: 'dark',
};
