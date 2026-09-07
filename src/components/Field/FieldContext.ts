'use client';

import { createContext, useContext } from 'react';

export type FieldContextValue = {
  /** id the control must carry so the label's htmlFor resolves. */
  controlId: string;
  /** Space-separated ids of the description and error, or undefined. */
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
};

export const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * Read the surrounding Field, if there is one.
 *
 * Controls stay usable on their own — a bare Input still works — so this
 * returns null rather than throwing. Props passed directly to a control always
 * win over the context, because the caller is being more specific than the
 * wrapper.
 */
export function useField(): FieldContextValue | null {
  return useContext(FieldContext);
}
