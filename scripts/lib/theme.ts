export type Mode = 'light' | 'dark';
export interface Theme { mode: Mode; bg: string; card: string; ink: string; sub: string; line: string; shell: string; shade: string; accent: string; soft: string; screen: string; eye: string; onAccent: string;
  /** The accent darkened enough to pass 4.5:1 when used for text. */
  accentText: string }
/** Warm paper and cocoa, with one tangerine accent that holds in both themes. */
export const themes: Record<Mode, Theme> = {
  light: { mode: 'light', bg: '#FFF7EA', card: '#FFFDF8', ink: '#2B2017', sub: '#77675A', line: '#EAD9C3', shell: '#FFE8C4', shade: '#F3CE98', accent: '#FF6A2B', soft: '#FFD9C2', screen: '#2B2017', eye: '#FFF7EA', onAccent: '#2B2017', accentText: '#B83D0B' },
  dark: { mode: 'dark', bg: '#1C1713', card: '#27201A', ink: '#F8EDDD', sub: '#B9A894', line: '#3D3229', shell: '#F8E4C1', shade: '#E0C08C', accent: '#FF7A3D', soft: '#573222', screen: '#17120F', eye: '#FFF7EA', onAccent: '#1C1713', accentText: '#FF8A55' },
};
export const MODES: Mode[] = ['light', 'dark'];
