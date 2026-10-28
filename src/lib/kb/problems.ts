// #4471 split by problem: what engineering has to fix, one ticket each. Builds on causes.ts.
import { causeOf, type Cause, type Report, type Tenant } from '#lib/kb/causes';

// `parser` and `hint` flip day and month (causes.ts). A one-day move does not flip anything: the
// date lands a day early or late. Tenant and channel can't tell it apart, so the desk's reading of
// the body (desk-notes.json) decides, not the tenant.
export type Problem = Cause | 'one-day-move';
export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'one-day-move'];

export function problemOf(
  r: Pick<Report, 'id' | 'channel'>,
  t: Tenant | undefined,
  oneDayMove: readonly string[],
): Problem | null {
  if (oneDayMove.includes(r.id)) return 'one-day-move';
  return causeOf(r, t);
}

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  tenants: string[];
  channels: Record<Report['channel'], number>;
  firstSeen: string;
  lastSeen: string;
};

export function groupByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const byProblem = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of reports) {
    const problem = problemOf(r, tenantOf(r), oneDayMove) ?? 'unplaced';
    byProblem.set(problem, [...(byProblem.get(problem) ?? []), r]);
  }
  const order = (p: ProblemGroup['problem']) => (p === 'unplaced' ? PROBLEMS.length : PROBLEMS.indexOf(p));
  return [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: rs.reduce<Record<Report['channel'], number>>((n, r) => ({ ...n, [r.channel]: n[r.channel] + 1 }), {
          app: 0,
          email: 0,
          form: 0,
        }),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => order(a.problem) - order(b.problem));
}
