import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileUpload, accepts, formatSize, type UploadFile } from './FileUpload';
import styles from './FileUpload.module.css';
import { readCss, block } from '../../test/css';
import { axeViolations } from '../../test/axe';

const file = (name: string, type = 'application/pdf', size = 1000) => {
  const f = new File(['x'.repeat(Math.min(size, 10))], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};
const input = () => screen.getByLabelText(/Choose/) as HTMLInputElement;
const choose = (files: File[]) => fireEvent.change(input(), { target: { files } });
const dragEvent = (types: string[] = ['Files'], files: File[] = []) => ({
  dataTransfer: { types, files, dropEffect: 'none' },
});

describe('FileUpload — the zone', () => {
  it('is a file input named by the words, with accept, multiple and name from the props', () => {
    render(<FileUpload onAdd={() => {}} accept="image/*,.pdf" multiple name="documents" hint="Under 5 MB." />);
    const control = input();
    expect(control).toHaveAttribute('type', 'file');
    expect(control).toHaveAccessibleName('Choose files or drag and drop');
    expect(control).toHaveAccessibleDescription('Under 5 MB.');
    expect(control).toHaveAttribute('accept', 'image/*,.pdf');
    expect(control).toHaveAttribute('multiple');
    expect(control).toHaveAttribute('name', 'documents');
  });

  it('says "Choose a file" alone, and takes only the first file, without multiple', () => {
    const onAdd = vi.fn();
    render(<FileUpload onAdd={onAdd} />);
    expect(input()).toHaveAccessibleName('Choose a file or drag and drop');
    expect(input()).not.toHaveAttribute('multiple');
    choose([file('a.pdf'), file('b.pdf')]);
    expect(onAdd).toHaveBeenCalledExactlyOnceWith([expect.objectContaining({ name: 'a.pdf' })]);
  });

  it('hands the accepted files to onAdd and shows the refused ones as failed cards with the reason', () => {
    const onAdd = vi.fn();
    const onReject = vi.fn();
    render(<FileUpload onAdd={onAdd} onReject={onReject} accept="image/*" maxSize={5_000_000} multiple />);
    const big = file('huge.png', 'image/png', 9_000_000);
    const wrong = file('scan.pdf');
    const fine = file('ok.png', 'image/png');
    choose([big, wrong, fine]);
    expect(onAdd).toHaveBeenCalledExactlyOnceWith([fine]);
    expect(onReject).toHaveBeenCalledExactlyOnceWith([
      { file: big, reason: 'size' },
      { file: wrong, reason: 'type' },
    ]);
    expect(screen.getByText('Larger than 5 MB')).toBeInTheDocument();
    expect(screen.getByText('Not a supported type')).toBeInTheDocument();
    // A refused card goes away on its ×.
    fireEvent.click(screen.getByRole('button', { name: 'Remove scan.pdf' }));
    expect(screen.queryByText('Not a supported type')).toBeNull();
    expect(screen.getByText('Larger than 5 MB')).toBeInTheDocument();
  });

  it('clears the input after a choice, so the same file can be chosen again', () => {
    const onAdd = vi.fn();
    render(<FileUpload onAdd={onAdd} />);
    choose([file('a.pdf')]);
    expect(input().value).toBe('');
  });

  it('marks the root while files are dragged over, unmarks it when they leave, and adds on drop', () => {
    const onAdd = vi.fn();
    const { container } = render(<FileUpload onAdd={onAdd} multiple />);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.dragEnter(root, dragEvent());
    expect(root).toHaveClass(styles.over!);
    fireEvent.dragLeave(root);
    expect(root).not.toHaveClass(styles.over!);
    // Entering a child fires enter again and leaving it fires leave, both
    // reaching the root: the drag is still over until the count is back.
    fireEvent.dragEnter(root, dragEvent());
    fireEvent.dragEnter(root.querySelector('span')!, dragEvent());
    fireEvent.dragLeave(root.querySelector('span')!);
    expect(root).toHaveClass(styles.over!);
    const dropped = [file('a.pdf'), file('b.pdf')];
    fireEvent.drop(root, dragEvent(['Files'], dropped));
    expect(root).not.toHaveClass(styles.over!);
    expect(onAdd).toHaveBeenCalledExactlyOnceWith(dropped);
  });

  it('ignores a drag that carries no files, and every drag while disabled', () => {
    const onAdd = vi.fn();
    const { container, rerender } = render(<FileUpload onAdd={onAdd} />);
    const root = container.firstElementChild as HTMLElement;
    fireEvent.dragEnter(root, dragEvent(['text/plain']));
    expect(root).not.toHaveClass(styles.over!);
    fireEvent.drop(root, dragEvent(['text/plain'], [file('a.pdf')]));
    expect(onAdd).not.toHaveBeenCalled();
    rerender(<FileUpload onAdd={onAdd} disabled />);
    expect(input()).toBeDisabled();
    fireEvent.dragEnter(root, dragEvent());
    expect(root).not.toHaveClass(styles.over!);
    fireEvent.drop(root, dragEvent(['Files'], [file('a.pdf')]));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('shows the upload inside a single-file zone, as drawn, and the card below otherwise', () => {
    const files: UploadFile[] = [{ id: '1', name: 'xplodingplastix.jpg', status: 'uploading', progress: 40 }];
    const { rerender } = render(<FileUpload onAdd={() => {}} files={files} hint="Under 5 MB." />);
    expect(screen.getByText('Uploading xplodingplastix.jpg')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).toBeNull();
    // The hint is not shown then, and the input, named by the words it
    // shows, points at no missing id.
    const control = screen.getByLabelText('Uploading xplodingplastix.jpg');
    expect(control).toHaveAttribute('type', 'file');
    expect(control).not.toHaveAttribute('aria-describedby');
    rerender(<FileUpload onAdd={() => {}} files={files} multiple />);
    expect(screen.getByRole('progressbar', { name: 'Uploading xplodingplastix.jpg' })).toHaveAttribute('value', '40');
  });

  it('takes the three shapes, the variant on the root and the parts named apart from it', () => {
    const { container, rerender } = render(<FileUpload onAdd={() => {}} variant="compact" hint="PDF only." />);
    expect(container.firstElementChild).toHaveClass(styles.compact!);
    expect(input()).toHaveAccessibleName('Choose a file');
    expect(input()).toHaveAccessibleDescription('PDF only.');
    rerender(<FileUpload onAdd={() => {}} variant="tile" label="Add a document" />);
    expect(container.firstElementChild).toHaveClass(styles.tile!);
    expect(screen.getByLabelText('Add a document')).toHaveAttribute('type', 'file');
    rerender(<FileUpload onAdd={() => {}} className="mine" />);
    expect(container.firstElementChild).toHaveClass(styles.zone!, 'mine');
    // The root carries .zone and its label .drop: a root styled as its own
    // label drew a second dashed box around the list, seen in the browser.
    expect(container.firstElementChild).not.toHaveClass(styles.drop!);
    expect(container.querySelector('label')).toHaveClass(styles.drop!);
  });
});

describe('FileUpload — the cards', () => {
  const FILES: UploadFile[] = [
    { id: 'a', name: 'ID card.pdf', size: 1_234_000, type: 'application/pdf', status: 'done', href: '/files/a.pdf' },
    { id: 'b', name: 'Consent.pdf', status: 'uploading' },
    { id: 'c', name: 'scan.heic', size: 300, status: 'failed', error: 'The server refused it' },
    { id: 'd', name: 'notes.txt', size: 12 },
  ];

  it('shows the type and size, a Download link when done, the bar while uploading, the error and Retry when failed', () => {
    const onRetry = vi.fn();
    const onRemove = vi.fn();
    render(<FileUpload onAdd={() => {}} files={FILES} multiple onRetry={onRetry} onRemove={onRemove} />);
    const download = screen.getByRole('link', { name: 'Download' });
    expect(download).toHaveAttribute('href', '/files/a.pdf');
    expect(download.parentElement).toHaveTextContent('PDF · 1.2 MB · Download');
    expect(screen.getByRole('progressbar', { name: 'Uploading Consent.pdf' })).not.toHaveAttribute('value');
    expect(screen.getByText(/The server refused it/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledExactlyOnceWith(FILES[2]);
    expect(screen.getByText('TXT · 12 B')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove notes.txt' }));
    expect(onRemove).toHaveBeenCalledExactlyOnceWith(FILES[3]);
  });

  it('draws no × without onRemove, and no Retry without onRetry', () => {
    render(<FileUpload onAdd={() => {}} files={FILES} multiple />);
    expect(screen.queryByRole('button', { name: /Remove/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });
});

describe('FileUpload — helpers', () => {
  it('formats a size the way a person says it', () => {
    expect(formatSize(12)).toBe('12 B');
    expect(formatSize(340_000)).toBe('340 kB');
    expect(formatSize(1_234_000)).toBe('1.2 MB');
    expect(formatSize(5_000_000)).toBe('5 MB');
    expect(formatSize(2_500_000_000)).toBe('2.5 GB');
  });

  it('matches accept by extension, by family and by type, and takes everything without one', () => {
    expect(accepts(file('a.PDF', 'application/pdf'), '.pdf')).toBe(true);
    expect(accepts(file('a.png', 'image/png'), 'image/*')).toBe(true);
    expect(accepts(file('a.png', 'image/png'), 'application/pdf')).toBe(false);
    expect(accepts(file('a.png', 'image/png'), ' .pdf , image/* ')).toBe(true);
    expect(accepts(file('a.png', 'image/png'), undefined)).toBe(true);
  });
});

describe('FileUpload — stylesheet', () => {
  const css = readCss('src/components/FileUpload/FileUpload.module.css');

  it('draws the dashed edge from border/strong and the dragged-over zone on the accent tint', () => {
    expect(block(css, '\n.drop {')).toMatch(/dashed var\(--ap-color-border-strong\)/);
    expect(block(css, '\n.square {')).toMatch(/dashed var\(--ap-color-border-strong\)/);
    const over = block(css, '.over .drop,\n.over .square');
    expect(over).toContain('--ap-color-border-accent');
    expect(over).toContain('--ap-color-surface-accent-subtle');
  });

  it('draws the ring on the zone for the input focused off screen inside it', () => {
    expect(block(css, '.drop:has(:focus-visible)')).toContain('--ap-color-border-focus');
  });
});

describe('FileUpload — axe', () => {
  it('has no violations in the three shapes, with cards of every status', async () => {
    const files: UploadFile[] = [
      { id: 'a', name: 'ID card.pdf', size: 1_234_000, status: 'done', href: '/a.pdf' },
      { id: 'b', name: 'Consent.pdf', status: 'uploading', progress: 30 },
      { id: 'c', name: 'scan.heic', status: 'failed', error: 'Refused' },
    ];
    const { container } = render(
      <div>
        <FileUpload
          onAdd={() => {}}
          hint="PNG, JPEG or GIF under 5 MB."
          files={files}
          multiple
          onRemove={() => {}}
          onRetry={() => {}}
        />
        <FileUpload onAdd={() => {}} variant="compact" hint="PDF only." />
        <FileUpload onAdd={() => {}} variant="tile" />
        <FileUpload onAdd={() => {}} disabled />
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
