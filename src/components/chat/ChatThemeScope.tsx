import { ReactNode } from 'react';
import { useThemeStore } from '@/store/useThemeStore';

interface ChatThemeScopeProps {
  children: ReactNode;
  className?: string;
}

/** Applies chat data-theme for portals rendered outside .chat-app (e.g. document.body). */
export const ChatThemeScope = ({ children, className = '' }: ChatThemeScopeProps) => {
  const theme = useThemeStore((s) => s.theme);

  return (
    <div data-theme={theme} className={`chat-theme-scope ${className}`.trim()}>
      {children}
    </div>
  );
};
