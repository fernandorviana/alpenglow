'use client';

import { useEffect, useState } from 'react';
import { Checkmark, Copy } from '@carbon/icons-react';

/**
 * Copies a code block. The label turns to "Copied" for two seconds, with
 * the icon; the live region says it, since a changed label is not announced.
 */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      className="codeCopy"
      aria-label={copied ? 'Copied' : 'Copy code'}
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => setCopied(true));
      }}
    >
      {copied ? <Checkmark size={16} /> : <Copy size={16} />}
      <span className="codeCopyLive" aria-live="polite">
        {copied ? 'Copied' : ''}
      </span>
    </button>
  );
}
