// #4471 split by problem: what engineering has to fix, one ticket each. Builds on causes.ts.
import { groupByCause, type Cause, type Report, type Tenant } from '#lib/kb/causes';

// `parser` and `hint` flip day and month (causes.ts). A one-day move does not flip anything: the
// date lands a day early or late. Tenant and channel can't tell it apart, so the desk files those
// reports under their cause and reads them apart in the body (desk-notes.json). Both stay true
// here: every report counts once under its cause, and one-day moves get a row of their own on top.
export type Problem = Cause | 'one-day-move';

export type ProblemRow = {
  problem: Problem | 'unplaced';
  reports: Report[];
  // For one-day-move: the causes these reports are also counted under.
  alsoIn: Cause[];
  tenants: string[];
  channels: Record<Report['channel'], number>;
  firstSeen: string;
  lastSeen: string;
};

function row(problem: ProblemRow['problem'], rs: Report[], alsoIn: Cause[] = []): ProblemRow {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    alsoIn,
    tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
    channels: rs.reduce<Record<Report['channel'], number>>((n, r) => ({ ...n, [r.channel]: n[r.channel] + 1 }), {
      app: 0,
      email: 0,
      form: 0,
    }),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

export function problemRows(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemRow[] {
  const groups = groupByCause(reports, tenantOf);
  const rows = groups.map((g) => row(g.cause, g.reports));
  const moved = groups.flatMap((g) => g.reports.filter((r) => oneDayMove.includes(r.id)).map((r) => [g.cause, r] as const));
  if (moved.length) {
    const alsoIn = [...new Set(moved.flatMap(([c]) => (c === 'unplaced' ? [] : [c])))];
    rows.push(row('one-day-move', moved.map(([, r]) => r), alsoIn));
  }
  return rows;
}
