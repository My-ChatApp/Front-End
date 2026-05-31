import { useEffect, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { THEME_OPTIONS } from '@/constants/theme';
import type { ThemeId } from '@/constants/theme';
import { useThemeStore } from '@/store/useThemeStore';

export const ThemeSettingsSection = () => {
  const { theme, setTheme } = useThemeStore();
  const [previewTheme, setPreviewTheme] = useState<ThemeId>(theme);

  useEffect(() => {
    setPreviewTheme(theme);
  }, [theme]);

  const previewLabel =
    THEME_OPTIONS.find((option) => option.id === previewTheme)?.label ?? previewTheme;
  const hasPendingChange = previewTheme !== theme;

  return (
    <section className="me-profile-card mb-4 overflow-hidden p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--discord-active)] text-[var(--discord-accent)]">
          <Palette className="size-5" />
        </div>
        <div>
          <div className="discord-section-title mb-0.5">Giao diện</div>
          <h3 className="text-base font-semibold text-[var(--discord-text)]">Chủ đề chat</h3>
          <p className="text-xs text-[var(--discord-text-muted)]">
            Chọn chủ đề, xem trước, rồi nhấn Áp dụng.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {THEME_OPTIONS.map((option) => {
          const isPreview = previewTheme === option.id;
          const isApplied = theme === option.id;

          return (
            <button
              key={option.id}
              type="button"
              className={`rounded-xl border p-3 text-left transition-all ${
                isPreview
                  ? 'border-[var(--discord-accent)] bg-[var(--discord-active)] shadow-lg'
                  : 'border-[var(--discord-border)] bg-[var(--discord-hover)] hover:bg-[var(--discord-active)]'
              }`}
              onClick={() => setPreviewTheme(option.id)}
            >
              <div className="theme-preview relative mb-3 h-16 overflow-hidden rounded-lg" data-theme={option.id}>
                <div className="absolute inset-0 grid grid-cols-[18px_1fr]">
                  <div style={{ backgroundColor: 'var(--discord-sidebar)' }} />
                  <div className="p-1.5" style={{ backgroundColor: 'var(--discord-chat)' }}>
                    <div
                      className="mb-1 h-3 rounded"
                      style={{ backgroundColor: 'var(--discord-panel-strong)' }}
                    />
                    <div className="grid grid-cols-4 gap-1">
                      <div className="h-8 rounded bg-primary" />
                      <div className="h-8 rounded bg-secondary" />
                      <div className="h-8 rounded bg-accent" />
                      <div className="h-8 rounded bg-neutral" />
                    </div>
                  </div>
                </div>
                {isPreview ? (
                  <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-content">
                    <Check className="size-3" />
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-[var(--discord-text)]">
                  {option.label}
                </span>
                {isApplied && !hasPendingChange ? (
                  <span className="rounded bg-[var(--discord-active)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--discord-accent)]">
                    Đang dùng
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-[var(--discord-text-muted)]">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      <div
        className="theme-preview mt-4 overflow-hidden rounded-xl border p-4"
        data-theme={previewTheme}
        style={{
          borderColor: 'var(--discord-border)',
          backgroundColor: 'var(--discord-app)',
        }}
      >
        <div className="mb-3 text-sm font-semibold" style={{ color: 'var(--discord-text)' }}>
          Xem trước — {previewLabel}
        </div>
        <div
          className="flex items-stretch overflow-hidden rounded-lg border"
          style={{ borderColor: 'var(--discord-border)' }}
        >
          <div className="w-16 p-2" style={{ backgroundColor: 'var(--discord-rail)' }}>
            <div
              className="mb-2 size-8 rounded-xl"
              style={{ backgroundColor: 'var(--discord-accent)' }}
            />
            <div
              className="size-8 rounded-xl"
              style={{ backgroundColor: 'var(--discord-sidebar)' }}
            />
          </div>
          <div className="w-40 p-3" style={{ backgroundColor: 'var(--discord-sidebar)' }}>
            <div className="mb-2 h-3 w-20 rounded" style={{ backgroundColor: 'var(--discord-hover)' }} />
            <div
              className="mb-1 h-2.5 w-24 rounded"
              style={{ backgroundColor: 'var(--discord-active)' }}
            />
            <div className="h-2.5 w-16 rounded" style={{ backgroundColor: 'var(--discord-hover)' }} />
          </div>
          <div className="flex-1 p-3" style={{ backgroundColor: 'var(--discord-chat)' }}>
            <div className="mb-2 h-3 w-24 rounded" style={{ backgroundColor: 'var(--discord-hover)' }} />
            <div
              className="h-16 rounded"
              style={{ backgroundColor: 'var(--discord-panel-strong)' }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTheme(previewTheme)}
          disabled={!hasPendingChange}
          className="me-action-btn me-action-btn--primary w-auto px-4 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Áp dụng
        </button>
        <button
          type="button"
          onClick={() => setPreviewTheme(theme)}
          disabled={!hasPendingChange}
          className="me-action-btn me-action-btn--secondary w-auto px-4 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Hoàn tác
        </button>
      </div>
    </section>
  );
};
