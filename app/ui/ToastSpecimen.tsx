import type { ReactNode } from 'react';
import { Close } from '@carbon/icons-react';

/**
 * A toast at rest, as a picture: the real one only exists inside the Toaster,
 * in the top layer, for a few seconds. Built from the same tokens as
 * Toast.module.css, for the anatomy on /toast and the card on /components.
 */
export function ToastSpecimen({ icon, action, children }: { icon?: ReactNode; action?: string; children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--ap-spacing-100)',
        boxSizing: 'border-box',
        minHeight: 'var(--ap-spacing-600)',
        padding: 'var(--ap-spacing-100) var(--ap-spacing-100) var(--ap-spacing-100) var(--ap-spacing-200)',
        borderRadius: 'var(--ap-radius-xl)',
        background: 'var(--ap-color-surface-inverse)',
        color: 'var(--ap-color-text-inverse)',
        boxShadow: 'var(--ap-elevation-lg)',
        fontSize: 'var(--ap-text-body-md-size)',
        lineHeight: 'var(--ap-text-body-md-line-height)',
        fontWeight: 'var(--ap-font-weight-medium)',
      }}
    >
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      <span>{children}</span>
      {action && (
        <span
          style={{
            padding: '0 var(--ap-spacing-100)',
            fontWeight: 'var(--ap-font-weight-semibold)',
            textDecoration: 'underline',
            textUnderlineOffset: 'var(--ap-spacing-050)',
          }}
        >
          {action}
        </span>
      )}
      <span style={{ display: 'inline-flex', padding: 'var(--ap-spacing-075)' }}>
        <Close size={20} />
      </span>
    </span>
  );
}
