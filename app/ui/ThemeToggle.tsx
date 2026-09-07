'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';

type Choice = 'system' | 'light' | 'dark';

const KEY = 'alpenglow-theme';

function apply(choice: Choice) {
  const root = document.documentElement;
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice);
}

function read(): Choice {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // Private windows and blocked site data both throw here. Fall through.
  }
  return 'system';
}

/**
 * Three states, not two. The system's CSS defines dark twice — once behind
 * prefers-color-scheme for viewers who have not chosen, and once behind
 * [data-theme] for viewers who have. A two-state toggle cannot express
 * "follow the system", which is the state most people are actually in.
 */
export function ThemeToggle() {
  const [choice, setChoice] = useState<Choice>('system');

  useEffect(() => {
    const initial = read();
    setChoice(initial);
    apply(initial);
  }, []);

  function choose(next: Choice) {
    setChoice(next);
    apply(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Preference simply will not persist. The page still works.
    }
  }

  return (
    <div role="group" aria-label="Colour theme" style={{ display: 'flex', gap: 4 }}>
      {(['system', 'light', 'dark'] as const).map((option) => (
        <Button
          key={option}
          size="sm"
          variant={choice === option ? 'solid' : 'ghost'}
          tone="neutral"
          aria-pressed={choice === option}
          onClick={() => choose(option)}
        >
          {option === 'system' ? 'System' : option === 'light' ? 'Light' : 'Dark'}
        </Button>
      ))}
    </div>
  );
}
