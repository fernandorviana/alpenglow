import { contrast } from '@/tokens/contrast';

type Props = {
  /** Resolved hex, foreground. */
  fg: string;
  /** Resolved hex, background. */
  bg: string;
  /** Large text and non-text UI both clear at 3:1; body copy needs 4.5. */
  threshold?: number;
  /**
   * A pair that is under its floor by design — a chart step near the canvas,
   * a documented exemption — is recorded at its figure, not graded: the
   * suite holds the figure and the page says why.
   */
  recorded?: boolean;
};

/**
 * Computes the ratio at render time from the same function the test suite uses.
 * Nothing here is a number someone typed into a document and hoped stayed true.
 */
export function Ratio({ fg, bg, threshold = 4.5, recorded = false }: Props) {
  const value = contrast(fg, bg);
  const passes = value >= threshold;
  const grade = value >= 7 ? 'AAA' : value >= 4.5 ? 'AA' : value >= 3 ? '3:1' : 'Fail';

  return (
    <span className="ratio">
      {value.toFixed(2)}
      {recorded ? (
        <span className="grade gradeNote">recorded</span>
      ) : (
        <span className={`grade ${passes ? 'gradePass' : 'gradeFail'}`}>{grade}</span>
      )}
    </span>
  );
}
