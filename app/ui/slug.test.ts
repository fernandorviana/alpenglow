import { describe, it, expect } from 'vitest';
import { slug, tokenId } from './slug';

describe('slug', () => {
  it('lower-cases, drops punctuation, joins on hyphens', () => {
    expect(slug('Variants and tones')).toBe('variants-and-tones');
    expect(slug('The Dialog’s title wraps')).toBe('the-dialogs-title-wraps');
  });

  it('folds accents', () => {
    expect(slug('Café au lait')).toBe('cafe-au-lait');
  });

  it('collapses runs of space and hyphen', () => {
    expect(slug('Rest, focus,  error — states')).toBe('rest-focus-error-states');
  });
});

describe('tokenId', () => {
  it('is the token name with the slash turned into a hyphen', () => {
    // A slash is punctuation to `slug` and would vanish, giving `surfaceraised`.
    expect(tokenId('surface/raised')).toBe('surface-raised');
    expect(tokenId('interactive/on-accent')).toBe('interactive-on-accent');
  });
});
