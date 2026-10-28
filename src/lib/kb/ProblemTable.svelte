<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { problemRows, type ProblemRow } from '#lib/kb/problems';

  type Ticket = { url: string; state: string };
  // tickets: problem → the ticket that tracks it, and where it stands.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Partial<Record<ProblemRow['problem'], Ticket>> } = $props();

  const rows = $derived(uniqueById(reports as Report[]));
  const merged = $derived(rows.filter((r) => r.mergedInto === ticket));
  const problems = $derived(problemRows(merged, tenantOf, notes.oneDayMove));
  const counted = $derived(problems.filter((p) => p.alsoIn.length === 0).reduce((n, p) => n + p.reports.length, 0));
  const ticketNo = (url: string) => `#${url.split('/').pop()}`;
  const channels = (p: ProblemRow) =>
    Object.entries(p.channels)
      .filter(([, n]) => n > 0)
      .map(([c, n]) => `${c} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ({reports.length} rows in the export,
  {rows.length} after duplicates) ·
  <strong>{problems.length}</strong>
  {problems.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>came in by</th><th>seen</th><th>ticket</th><th>state</th></tr>
  </thead>
  <tbody>
    {#each problems as p (p.problem)}
      {@const t = tickets[p.problem]}
      <tr class:missing={!t}>
        <td><code>{p.problem}</code></td>
        <td>
          {p.reports.length}
          {#if p.alsoIn.length}<span class="muted">also under <code>{p.alsoIn.join(', ')}</code></span>{/if}
        </td>
        <td>{p.tenants.length}</td>
        <td class="muted">{channels(p)}</td>
        <td>{p.firstSeen} → {p.lastSeen}</td>
        <td>{#if t}<a href={t.url}>{ticketNo(t.url)}</a>{:else}no ticket yet{/if}</td>
        <td>{t?.state ?? ''}</td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr><td>total</td><td>{counted}</td><td colspan="5" class="muted">each report once, under its cause</td></tr>
  </tfoot>
</table>

{#each problems as p (p.problem)}
  <details>
    <summary><code>{p.problem}</code>: {p.reports.length} reports from {p.tenants.join(', ')}</summary>
    <p class="ids">{p.reports.map((r) => r.id).join(' ')}</p>
  </details>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
  .missing td { background: var(--warn-bg); }
  .missing td:nth-last-child(2) { color: var(--warn); font-weight: 600; }
  tfoot td { font-weight: 600; }
  details { margin: 0.4rem 0; font-size: 0.9rem; }
  .ids { font: 0.8rem var(--mono); color: var(--muted); word-spacing: 0.3em; }
</style>
