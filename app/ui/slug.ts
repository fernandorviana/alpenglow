/** `Variants and tones` → `variants-and-tones`. Accents fold, punctuation goes. */
export const slug = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');

/**
 * `surface/raised` → `surface-raised`: the id its row takes on the Colour
 * page, and the hash a search hit for the token lands on. Not `slug(token)`
 * alone — a slash is punctuation there and would vanish.
 */
export const tokenId = (token: string) => slug(token.replace(/\//g, ' '));
