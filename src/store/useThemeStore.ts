import { create } from 'zustand';
import { DEFAULT_THEME, normalizeTheme, type ThemeId } from '@/constants/theme';

const STORAGE_KEY = 'chat-theme';

const readStoredTheme = (): ThemeId => {
  try {
    return normalizeTheme(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_THEME;
  }
};

const initialTheme = readStoredTheme();

try {
  localStorage.setItem(STORAGE_KEY, initialTheme);
} catch {
  // ignore quota / private mode
}

interface ThemeState {
  theme: ThemeId;
  setTheme: (nextTheme: string) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,
  setTheme: (nextTheme) => {
    const theme = normalizeTheme(nextTheme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
    set({ theme });
  },
}));
