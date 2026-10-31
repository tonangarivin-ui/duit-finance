'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'dark' | 'vanilla';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('fin.theme');
    setTheme(saved === 'vanilla' ? 'vanilla' : 'dark');
  }, []);

  const pick = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('fin.theme', t);
    document.documentElement.dataset.theme = t === 'vanilla' ? 'vanilla' : '';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'vanilla' ? '#F6F1E7' : '#08090B');
  };

  const opts: { key: Theme; label: string; Icon: typeof Moon }[] = [
    { key: 'dark', label: 'Dark', Icon: Moon },
    { key: 'vanilla', label: 'Vanila', Icon: Sun },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {opts.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => pick(key)}
          aria-pressed={theme === key}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold ${
            theme === key ? 'bg-gold text-onaccent' : 'bg-chip text-dim'
          }`}
        >
          <Icon size={15} aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
