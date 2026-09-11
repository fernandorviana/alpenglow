import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/**
 * Only the React hooks rules, including the React Compiler's, on the library
 * and on the site. They are what `eslint-config-next` runs in a consumer's
 * project, and a component copied in from the registry becomes code that
 * project lints — so it has to pass them here first. The site is not copied
 * anywhere, but it is a Next app like the ones that lint it: it was left out
 * once, and two effects that set state accumulated in `Nav` and `ThemeToggle`.
 * Types and formatting are `tsc`'s and the reviewer's.
 */
export default tseslint.config(
  { ignores: ['*', '!src/', '!app/'] },
  {
    files: ['{src,app}/**/*.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser },
    ...reactHooks.configs.flat['recommended-latest'],
  },
);
