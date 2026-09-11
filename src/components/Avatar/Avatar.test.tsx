import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Avatar, AvatarGroup, initials } from './Avatar';
import { Loader } from '../Loader/Loader';

describe('initials', () => {
  it('takes the first and last words, never a middle one', () => {
    expect(initials('Leonor Viana')).toBe('LV');
    expect(initials('Ana Maria Sousa Costa')).toBe('AC');
  });

  it('handles a single name', () => {
    expect(initials('Leonor')).toBe('L');
  });

  it('takes a whole first character, not half of a surrogate pair', () => {
    // A name can start with a character outside the Basic Multilingual Plane:
    // an emoji, or a CJK Extension B ideograph. One UTF-16 unit of it is not a letter.
    expect(initials('\u{1D504}nna Smith')).toBe('\u{1D504}S');
    expect(initials('\u{1F600} Face')).toBe('\u{1F600}F');
  });

  it('survives extra whitespace and an empty name', () => {
    expect(initials('  Leonor   Viana  ')).toBe('LV');
    expect(initials('   ')).toBe('');
  });
});

describe('Avatar', () => {
  it('shows the image with the person as its alt text', () => {
    render(<Avatar name="Leonor Viana" src="/leonor.jpg" />);
    expect(screen.getByRole('img', { name: 'Leonor Viana' })).toBeInTheDocument();
  });

  it('falls back to initials, and still says who it is', () => {
    // The initials are decoration — two letters are not a name to a screen
    // reader — so the full name is present for one to read.
    render(<Avatar name="Leonor Viana" />);
    expect(screen.getByText('LV')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Leonor Viana')).toBeInTheDocument();
  });

  it('falls back to initials when the image fails to load', () => {
    // An expired signed URL or a deleted upload must not leave the browser's
    // broken-image glyph in the circle.
    render(<Avatar name="Leonor Viana" src="/gone.jpg" />);
    fireEvent.error(screen.getByRole('img', { name: 'Leonor Viana' }));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('LV')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Leonor Viana')).toBeInTheDocument();
  });

  describe('status', () => {
    it('carries a label, not just a colour', () => {
      // Drawn, status was colour and nothing else: available and busy were the
      // same to anyone who cannot separate green from red, and to every reader.
      render(<Avatar name="Leonor Viana" status="busy" />);
      expect(screen.getByRole('img', { name: 'Busy' })).toBeInTheDocument();
    });

    it('names each state in words', () => {
      const states = [
        ['available', 'Available'],
        ['busy', 'Busy'],
        ['inMeeting', 'In an appointment'],
        ['idle', 'Idle'],
        ['away', 'Away'],
      ] as const;
      for (const [status, label] of states) {
        const { unmount } = render(<Avatar name="A B" status={status} />);
        expect(screen.getByRole('img', { name: label })).toBeInTheDocument();
        unmount();
      }
    });

    it('renders no dot when there is no status', () => {
      render(<Avatar name="Leonor Viana" />);
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });
});

describe('AvatarGroup', () => {
  it('says how many are not shown, in words', () => {
    render(
      <AvatarGroup overflow={3}>
        <Avatar name="Leonor Viana" />
        <Avatar name="Ana Costa" />
      </AvatarGroup>,
    );
    expect(screen.getByText('+3')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('and 3 more')).toBeInTheDocument();
  });

  it('renders no counter at zero', () => {
    render(
      <AvatarGroup overflow={0}>
        <Avatar name="Leonor Viana" />
      </AvatarGroup>,
    );
    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
  });
});

describe('Loader', () => {
  it('announces what is being waited for when given a label', () => {
    render(<Loader label="Loading appointments" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading appointments');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('is decoration without a label', () => {
    // Inside a button that already carries aria-busy, a second announcement
    // repeats what the button said.
    const { container } = render(<Loader />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).not.toHaveAttribute('role');
  });

  it('draws both arcs', () => {
    const { container } = render(<Loader />);
    expect(container.querySelectorAll('circle')).toHaveLength(2);
  });
});
