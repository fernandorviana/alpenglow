import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/**
 * Only the React hooks rules, including the React Compiler's, and only on the
 * library. They are what `eslint-config-next` runs in a consumer's project, and
 * a component copied in from the registry becomes code that project lints — so
 * it has to pass them here first. Types and formatting are `tsc`'s and the
 * reviewer's.
 */
export default tseslint.config(
  { ignores: ['*', '!src/'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser },
    ...reactHooks.configs.flat['recommended-latest'],
  },
);
