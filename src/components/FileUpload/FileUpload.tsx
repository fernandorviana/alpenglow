'use client';

import { useId, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent as ReactDragEvent, ReactNode } from 'react';
import { Link } from '../Link/Link';
import { Loader } from '../Loader/Loader';
import { Progress } from '../Progress/Progress';
import hidden from '../visuallyHidden.module.css';
import styles from './FileUpload.module.css';

export type UploadStatus = 'ready' | 'uploading' | 'done' | 'failed';

export type UploadFile = {
  id: string;
  name: string;
  /** Bytes. */
  size?: number;
  /** The MIME type, or an extension; shown as the type. */
  type?: string;
  /** `ready` is chosen and not sent; the default. */
  status?: UploadStatus;
  /** 0–100 while uploading. Left out, the bar is indeterminate. */
  progress?: number;
  /** Why it failed. */
  error?: string;
  /** Where the uploaded file is, for the Download link. */
  href?: string;
};

export type UploadRejection = { file: File; reason: 'type' | 'size' };

export const fileUploadVariants = ['zone', 'compact', 'tile'] as const;
export type FileUploadVariant = (typeof fileUploadVariants)[number];

export type FileUploadProps = {
  /** The words that open the picker. "Choose a file", or "Choose files" with `multiple`. */
  label?: string;
  /** After the label: "or drag and drop". */
  dropLabel?: string;
  /** "We support PNG, JPEG and GIF under 5 MB." */
  hint?: ReactNode;
  /** The input's `accept`, and what a dropped file is checked against. */
  accept?: string;
  /** Bytes. A larger file is refused and shown as failed. */
  maxSize?: number;
  multiple?: boolean;
  /** The list, the caller's, with each file's status. */
  files?: readonly UploadFile[];
  /** The accepted files, chosen or dropped. The caller uploads them. */
  onAdd: (files: File[]) => void;
  onRemove?: (file: UploadFile) => void;
  onRetry?: (file: UploadFile) => void;
  /** What was refused, and why; the component shows them too. */
  onReject?: (rejected: UploadRejection[]) => void;
  /** `zone` is the drawn dialog, `compact` a button with the hint beside, `tile` the drawn "+". */
  variant?: FileUploadVariant;
  disabled?: boolean;
  name?: string;
  className?: string;
  removeLabel?: string;
  retryLabel?: string;
  downloadLabel?: string;
  uploadingLabel?: string;
  rejectionLabel?: (reason: 'type' | 'size', file: File) => string;
};

/** Carbon's cloud--upload, document and close, on the 32 grid. Apache-2.0, © IBM. */
const CLOUD = [
  'M11 18 12.41 19.41 15 16.83 15 29 17 29 17 16.83 19.59 19.41 21 18 16 13 11 18z',
  'M23.5,22H23V20h.5a4.5,4.5,0,0,0,.36-9L23,11l-.1-.82a7,7,0,0,0-13.88,0L9,11,8.14,11a4.5,4.5,0,0,0,.36,9H9v2H8.5A6.5,6.5,0,0,1,7.2,9.14a9,9,0,0,1,17.6,0A6.5,6.5,0,0,1,23.5,22Z',
];
const DOCUMENT = [
  'M25.7,9.3l-7-7C18.5,2.1,18.3,2,18,2H8C6.9,2,6,2.9,6,4v24c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V10C26,9.7,25.9,9.5,25.7,9.3 z M18,4.4l5.6,5.6H18V4.4z M24,28H8V4h8v6c0,1.1,0.9,2,2,2h6V28z',
  'M10 22H22V24H10z',
  'M10 16H22V18H10z',
];
const CLOSE =
  'M17.4141 16 24 9.4141 22.5859 8 16 14.5859 9.4143 8 8 9.4141 14.5859 16 8 22.5859 9.4143 24 16 17.4141 22.5859 24 24 22.5859 17.4141 16z';
const PLUS = 'M17 15 17 8 15 8 15 15 8 15 8 17 15 17 15 24 17 24 17 17 24 17 24 15z';

/** "1.2 MB", "340 kB", "12 B". */
export function formatSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1e6) return `${Math.round(bytes / 100) / 10} kB`;
  if (bytes < 1e9) return `${Math.round(bytes / 1e5) / 10} MB`;
  return `${Math.round(bytes / 1e8) / 10} GB`;
}

/** "PDF" from "application/pdf", ".pdf" or "report.pdf". */
function typeOf(file: UploadFile): string | undefined {
  if (file.type) {
    const sub = file.type.includes('/') ? file.type.split('/')[1]! : file.type.replace(/^\./, '');
    return sub.split('+')[0]!.toUpperCase();
  }
  const ext = file.name.split('.').pop();
  return ext && ext !== file.name ? ext.toUpperCase() : undefined;
}

/** Whether a file matches an `accept` list: ".pdf", "image/*", "application/pdf". */
export function accepts(file: File, accept: string | undefined): boolean {
  if (!accept) return true;
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
    .some((token) => {
      if (token.startsWith('.')) return name.endsWith(token);
      if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
      return type === token;
    });
}

const hasFiles = (event: ReactDragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files');

type Refused = { id: string; name: string; size: number; reason: string };

/**
 * Files chosen or dropped, and the list of what became of them. A real file
 * input, the zone its label, so the keyboard opens the picker and `accept`
 * and `multiple` are the input's; the component checks what arrives
 * against `accept` and `maxSize`, hands the rest to `onAdd`, and does no
 * network of its own. docs/superpowers/specs/2026-09-22-file-upload-design.md.
 */
export function FileUpload({
  label,
  dropLabel = 'or drag and drop',
  hint,
  accept,
  maxSize,
  multiple = false,
  files = [],
  onAdd,
  onRemove,
  onRetry,
  onReject,
  variant = 'zone',
  disabled = false,
  name,
  className,
  removeLabel = 'Remove',
  retryLabel = 'Retry',
  downloadLabel = 'Download',
  uploadingLabel = 'Uploading',
  rejectionLabel = (reason, file) =>
    reason === 'type' ? 'Not a supported type' : `Larger than ${formatSize(maxSize ?? file.size)}`,
}: FileUploadProps) {
  const uid = useId();
  const words = label ?? (multiple ? 'Choose files' : 'Choose a file');
  const [over, setOver] = useState(false);
  const [refused, setRefused] = useState<Refused[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const counter = useRef(0);

  const take = (list: FileList | File[] | null | undefined) => {
    if (!list || disabled) return;
    const chosen = multiple ? Array.from(list) : Array.from(list).slice(0, 1);
    const accepted: File[] = [];
    const rejected: UploadRejection[] = [];
    for (const file of chosen) {
      if (!accepts(file, accept)) rejected.push({ file, reason: 'type' });
      else if (maxSize !== undefined && file.size > maxSize) rejected.push({ file, reason: 'size' });
      else accepted.push(file);
    }
    if (rejected.length) {
      // Built outside the updater: StrictMode runs an updater twice, and a
      // counter stepped inside it would step twice.
      const shown = rejected.map(({ file, reason }) => ({
        id: `${uid}-refused-${counter.current++}`,
        name: file.name,
        size: file.size,
        reason: rejectionLabel(reason, file),
      }));
      setRefused((r) => [...r, ...shown]);
      onReject?.(rejected);
    }
    if (accepted.length) onAdd(accepted);
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    take(event.target.files);
    // Cleared, so the same file can be chosen again after being removed.
    event.target.value = '';
  };

  // The drag enters and leaves every child, each pair reaching the root;
  // only the leave that brings the count back to nothing is the drag going.
  const depth = useRef(0);
  const onDragEnter = (event: ReactDragEvent<HTMLDivElement>) => {
    if (!hasFiles(event) || disabled) return;
    event.preventDefault();
    depth.current += 1;
    setOver(true);
  };
  const onDragOver = (event: ReactDragEvent<HTMLDivElement>) => {
    if (!hasFiles(event) || disabled) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };
  const onDragLeave = () => {
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setOver(false);
  };
  const onDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    depth.current = 0;
    setOver(false);
    take(event.dataTransfer.files);
  };

  // The drawn single-file zone shows the upload inside itself, and the hint
  // goes with the words, so the input is described by nothing then.
  const uploading = !multiple && variant === 'zone' ? files.find((file) => file.status === 'uploading') : undefined;
  const hintShown = Boolean(hint) && !uploading;

  const input = (
    <input
      ref={inputRef}
      type="file"
      className={hidden.hidden}
      name={name}
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      // Named by the words alone: the hint is inside the same label and
      // would otherwise be read as part of the name.
      aria-labelledby={`${uid}-words`}
      aria-describedby={hintShown ? `${uid}-hint` : undefined}
      onChange={onChange}
    />
  );

  const card = (file: UploadFile) => {
    const status = file.status ?? 'ready';
    const type = typeOf(file);
    const size = file.size !== undefined ? formatSize(file.size) : undefined;
    return (
      <li key={file.id} className={[styles.card, status === 'failed' && styles.failed].filter(Boolean).join(' ')}>
        <span className={styles.docIcon} aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="currentColor" focusable="false">
            {DOCUMENT.map((d) => (
              <path key={d} d={d} />
            ))}
          </svg>
        </span>
        <span className={styles.body}>
          <span className={styles.name}>{file.name}</span>
          {status === 'uploading' ? (
            <Progress label={`${uploadingLabel} ${file.name}`} value={file.progress} hideLabel />
          ) : status === 'failed' ? (
            <span className={styles.error}>
              {file.error ?? 'Upload failed'}
              {onRetry && (
                <>
                  {' · '}
                  <button type="button" className={styles.retry} onClick={() => onRetry(file)}>
                    {retryLabel}
                  </button>
                </>
              )}
            </span>
          ) : (
            <span className={styles.meta}>
              {[type, size].filter(Boolean).join(' · ')}
              {status === 'done' && file.href && (
                <>
                  {type || size ? ' · ' : ''}
                  <Link href={file.href} download>
                    {downloadLabel}
                  </Link>
                </>
              )}
            </span>
          )}
        </span>
        {onRemove && (
          <button
            type="button"
            className={styles.remove}
            aria-label={`${removeLabel} ${file.name}`}
            disabled={disabled}
            onClick={() => onRemove(file)}
          >
            <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">
              <path d={CLOSE} />
            </svg>
          </button>
        )}
      </li>
    );
  };

  const refusedCard = (item: Refused) => (
    <li key={item.id} className={`${styles.card} ${styles.failed}`}>
      <span className={styles.docIcon} aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="currentColor" focusable="false">
          {DOCUMENT.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{item.name}</span>
        <span className={styles.error}>{item.reason}</span>
      </span>
      <button
        type="button"
        className={styles.remove}
        aria-label={`${removeLabel} ${item.name}`}
        disabled={disabled}
        onClick={() => setRefused((r) => r.filter((x) => x.id !== item.id))}
      >
        <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">
          <path d={CLOSE} />
        </svg>
      </button>
    </li>
  );

  const showList = files.length > 0 || refused.length > 0;

  return (
    <div
      className={[styles.root, styles[variant], over && styles.over, disabled && styles.disabled, className]
        .filter(Boolean)
        .join(' ')}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {variant === 'tile' ? (
        <label className={styles.square}>
          {input}
          <span id={`${uid}-words`} className={hidden.hidden}>
            {words}
          </span>
          <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false" className={styles.plus}>
            <path d={PLUS} />
          </svg>
        </label>
      ) : variant === 'compact' ? (
        <div className={styles.line}>
          <label className={styles.button}>
            {input}
            <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">
              {CLOUD.map((d) => (
                <path key={d} d={d} />
              ))}
            </svg>
            <span id={`${uid}-words`}>{words}</span>
          </label>
          <span className={styles.aside}>
            {dropLabel}
            {hint && (
              <>
                {' · '}
                <span id={`${uid}-hint`}>{hint}</span>
              </>
            )}
          </span>
        </div>
      ) : (
        <label className={styles.drop}>
          {input}
          <span className={styles.icon} aria-hidden="true">
            {uploading ? (
              <Loader size="md" />
            ) : (
              <svg viewBox="0 0 32 32" fill="currentColor" focusable="false">
                {CLOUD.map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
            )}
          </span>
          {uploading ? (
            <span id={`${uid}-words`} className={styles.words}>
              {uploadingLabel} {uploading.name}
            </span>
          ) : (
            <>
              <span id={`${uid}-words`} className={styles.words}>
                <span className={styles.choose}>{words}</span> {dropLabel}
              </span>
              {hint && (
                <span id={`${uid}-hint`} className={styles.hint}>
                  {hint}
                </span>
              )}
            </>
          )}
        </label>
      )}
      {showList && (
        <ul className={styles.list}>
          {files.filter((file) => file !== uploading).map(card)}
          {refused.map(refusedCard)}
        </ul>
      )}
    </div>
  );
}
