<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { groupByProblem, type ProblemGroup } from '#lib/kb/problems';

  // tickets: problem → URL of the ticket that tracks it.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Partial<Record<ProblemGroup['problem'], string>> } = $props();

  const rows = $derived(uniqueById(reports as Report[]));
  const merged = $derived(rows.filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByProblem(merged, tenantOf, notes.oneDayMove));
  const ticketNo = (url: string) => `#${url.split('/').pop()}`;
  const channels = (g: ProblemGroup) =>
    Object.entries(g.channels)
      .filter(([, n]) => n > 0)
      .map(([c, n]) => `${c} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ({reports.length} rows in the export,
  {rows.length} after duplicates) ·
  <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>came in by</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      {@const url = tickets[g.problem]}
      <tr class:missing={!url}>
        <td><code>{g.problem}</code></td>
        <td>{g.reports.length}</td>
        <td>{g.tenants.length}</td>
        <td class="muted">{channels(g)}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if url}<a href={url}>{ticketNo(url)}</a>{:else}no ticket yet{/if}</td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr><td>total</td><td>{groups.reduce((n, g) => n + g.reports.length, 0)}</td><td colspan="4"></td></tr>
  </tfoot>
</table>

{#each groups as g (g.problem)}
  <details>
    <summary><code>{g.problem}</code>: {g.reports.length} reports from {g.tenants.join(', ')}</summary>
    <p class="ids">{g.reports.map((r) => r.id).join(' ')}</p>
  </details>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
  .missing td { background: var(--warn-bg); }
  .missing td:last-child { color: var(--warn); font-weight: 600; }
  tfoot td { font-weight: 600; }
  details { margin: 0.4rem 0; font-size: 0.9rem; }
  .ids { font: 0.8rem var(--mono); color: var(--muted); word-spacing: 0.3em; }
</style>
