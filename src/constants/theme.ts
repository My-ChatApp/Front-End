export const THEMES = ['light', 'dark', 'cupcake', 'retro', 'valentine', 'nord'] as const;

export type ThemeId = (typeof THEMES)[number];

export const DEFAULT_THEME: ThemeId = 'dark';

export const THEME_OPTIONS: {
  id: ThemeId;
  label: string;
  description: string;
}[] = [
  {
    id: 'light',
    label: 'Light',
    description: 'Sáng, giao diện Discord-style',
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Tối, dễ nhìn ban đêm',
  },
  {
    id: 'cupcake',
    label: 'Cupcake',
    description: 'Pastel nhẹ, tông ấm',
  },
  {
    id: 'retro',
    label: 'Retro',
    description: 'Cổ điển, xanh lá nhẹ',
  },
  {
    id: 'valentine',
    label: 'Valentine',
    description: 'Hồng pastel, dịu mắt',
  },
  {
    id: 'nord',
    label: 'Nord',
    description: 'Xanh xám Bắc Âu, trầm',
  },
];

export const isAllowedTheme = (id: string | null | undefined): id is ThemeId =>
  THEMES.includes(id as ThemeId);

export const normalizeTheme = (id: string | null | undefined): ThemeId =>
  isAllowedTheme(id) ? id : DEFAULT_THEME;
