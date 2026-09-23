import type { ISODate } from '@/components/Calendar/date';
import type { ISODateTime, SchedulerTone } from '@/components/Scheduler';

/**
 * Ridge Physio, a fictional practice. Every day is built from a seed taken
 * from its date, so it is plausible, never the same as the next, and always
 * the same as itself — screenshots, tests and axe see one screen.
 */

export const DAY: ISODate = '2026-09-17';
export const NOW: ISODateTime = '2026-09-17T11:20';

export type Practitioner = { id: string; name: string; role: string; tone: SchedulerTone; hours: { start: number; end: number } };

/** Ember is left out: against glow it is 1.01:1, the closest pair of the six. */
export const practitioners: readonly Practitioner[] = [
  { id: 'ana', name: 'Ana Ferreira', role: 'Physiotherapist', tone: 'glacier', hours: { start: 8, end: 17 } },
  { id: 'kwame', name: 'Kwame Mensah', role: 'Sports physio', tone: 'moss', hours: { start: 9, end: 18 } },
  { id: 'lin', name: 'Lin Zhao', role: 'Hydrotherapist', tone: 'amber', hours: { start: 8, end: 16 } },
  { id: 'sofia', name: 'Sofia Marques', role: 'Physiotherapist', tone: 'flare', hours: { start: 10, end: 19 } },
  { id: 'omar', name: 'Omar Haddad', role: 'Massage therapist', tone: 'glow', hours: { start: 9, end: 17 } },
];

const FIRST = ['Maya', 'Joaquim', 'Aisha', 'Tomás', 'Priya', 'Lucas', 'Ingrid', 'Mateo', 'Yuki', 'Daniel', 'Leila', 'Rui'];
const LAST = ['Costa', 'Okafor', 'Nguyen', 'Silva', 'Kowalski'];
/** Twelve first names by five last names: sixty, distinct, varied. */
export const clients: readonly string[] = FIRST.flatMap((f) => LAST.map((l) => `${f} ${l}`));

export const appointmentTypes = [
  { id: 'assessment', label: 'Assessment', minutes: 60 },
  { id: 'follow-up', label: 'Follow-up', minutes: 30 },
  { id: 'sports', label: 'Sports massage', minutes: 45 },
  { id: 'hydro', label: 'Hydrotherapy', minutes: 45 },
  { id: 'video', label: 'Video consult', minutes: 30, video: true },
] as const;

export type Status = 'confirmed' | 'pending' | 'cancelled';
export type Appointment = {
  id: string;
  client: string;
  practitionerId: string;
  typeId: string;
  start: ISODateTime;
  end: ISODateTime;
  status: Status;
  kind: 'appointment' | 'lunch' | 'external';
};

/** mulberry32: small, fast, and the same numbers on every machine. */
function random(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seedOf = (date: ISODate) => [...date].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
const at = (date: ISODate, minutes: number): ISODateTime =>
  `${date}T${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export function appointmentsFor(date: ISODate): Appointment[] {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (weekday === 0 || weekday === 6) return [];
  const rand = random(seedOf(date));
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)]!;
  const out: Appointment[] = [];
  let n = 0;

  for (const p of practitioners) {
    const lunch = (12 + (rand() < 0.5 ? 0 : 1)) * 60;
    out.push({ id: `${date}-${p.id}-lunch`, client: 'Lunch', practitionerId: p.id, typeId: 'lunch', start: at(date, lunch), end: at(date, lunch + 60), status: 'confirmed', kind: 'lunch' });

    let t = p.hours.start * 60;
    while (t < p.hours.end * 60) {
      if (t === lunch) { t += 60; continue; }
      const type = pick(appointmentTypes);
      const end = t + type.minutes;
      if (end > p.hours.end * 60 || (t < lunch && end > lunch)) { t += 15; continue; }
      // Tuned by brute-forcing appointmentsFor(DAY).length against the seed
      // for 2026-09-17: 0.44 free-slot probability lands the fixed day at
      // 35 appointments (comfortably inside [30, 36], away from both
      // edges), and 80% confirmed / 15% pending / 5% cancelled status draws
      // land it at 24 confirmed / 9 pending / 2 cancelled — all three
      // present. Other days are only checked for plausibility, not count.
      if (rand() < 0.44) { t += 30; continue; }
      const r = rand();
      const status: Status = r < 0.8 ? 'confirmed' : r < 0.95 ? 'pending' : 'cancelled';
      out.push({ id: `${date}-${++n}`, client: pick(clients), practitionerId: p.id, typeId: type.id, start: at(date, t), end: at(date, end), status, kind: 'appointment' });
      t = end;
    }
  }

  // Picking a random practitioner and then searching only their slots could
  // land on nobody with a late-afternoon appointment; picking from every
  // eligible appointment across the whole day guarantees one exists.
  const eligible = out.filter((a) => a.kind === 'appointment' && a.start >= at(date, 15 * 60));
  const ext = eligible.length > 0 ? pick(eligible) : undefined;
  if (ext) Object.assign(ext, { client: 'Team meeting', typeId: 'external', kind: 'external', status: 'confirmed' });

  return out;
}
