import { describe, it, expect } from 'vitest';
import { motion } from './motion';

describe('motion', () => {
  it('keeps the durations the components were built with', () => {
    // The move into tokens changed nothing on screen. A new value is a
    // decision about how the interface feels, not a tidy-up.
    expect(motion.duration).toEqual({ fade: 120, travel: 140 });
  });

  it('gives what travels more time than what changes in place', () => {
    expect(motion.duration.travel).toBeGreaterThan(motion.duration.fade);
  });
});
