'use client';

import { useTheme, type Theme } from './theme-provider';

const themes: { key: Theme; label: string; colors: string }[] = [
  { key: 'light', label: 'Light', colors: 'bg-[#F5F3EF] border-gray-300' },
  { key: 'dark', label: 'Dark', colors: 'bg-[#111111] border-gray-600' },
  { key: 'dark-blue', label: 'Dark Blue', colors: 'bg-[#0a1628] border-blue-800' },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {themes.map((t) => (
        <button
          key={t.key}
          onClick={() => setTheme(t.key)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium transition-all
            border
            ${theme === t.key
              ? 'ring-2 ring-[var(--dash-accent)] shadow-md'
              : 'opacity-70 hover:opacity-100'
            }
          `}
          style={{
            background: 'var(--dash-card)',
            color: 'var(--dash-text)',
            borderColor: 'var(--dash-border)',
          }}
        >
          <span className={`w-4 h-4 rounded-full border ${t.colors} flex-shrink-0`} />
          {t.label}
        </button>
      ))}
    </div>
  );
}
