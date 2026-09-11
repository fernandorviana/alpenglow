/**
 * A control's height: 32, 40 or 48px. Button and the control box — Input,
 * Select, DatePicker — share it, and vocabulary.test.ts holds their two
 * stylesheets to the same values. Other components measure other things
 * (a Loader's diameter, an Avatar's width) and keep size names of their own.
 */
export type ControlSize = 'sm' | 'md' | 'lg';
