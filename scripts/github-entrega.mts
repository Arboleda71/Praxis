/** Publica el PR autorizado y consulta CI usando Git Credential Manager, sin imprimir ni guardar credenciales. */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
const accion = process.argv[2] ?? 'check';
try {
  const remote = git('remote', 'get-url', 'origin');
  const repo = remote.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/)?.[1];
  if (!repo) throw new Error('origin no apunta a un repositorio de GitHub.');
  let secreto = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!secreto) {
    // GCM puede tener varias cuentas: resolver la del propietario del repositorio
    // evita un selector interactivo cuando ya existe esa credencial.
    const salida = execFileSync('git', ['credential', 'fill'], { input: `protocol=https\nhost=github.com\nusername=${repo.split('/')[0]}\n\n`, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' } });
    secreto = salida.split(/\r?\n/).find(l => l.startsWith('password='))?.slice(9);
  }
  if (!secreto) throw new Error('No hay credencial de GitHub disponible. Autentica Git Credential Manager o configura GH_TOKEN en el entorno.');
  const api = async (path: string, body?: unknown, method = body ? 'POST' : 'GET') => {
    const r = await fetch(`https://api.github.com/repos/${repo}${path}`, { method, headers: { Authorization: `Bearer ${secreto}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`GitHub devolvió HTTP ${r.status} en ${path.split('?')[0]}. Comprueba permisos de repositorio y Actions.`);
    return r.json();
  };
  if (accion === 'check') {
    const r = await api(''); console.log(JSON.stringify({ repositorio: r.full_name, puedeSubir: r.permissions?.push, puedeAdministrar: r.permissions?.admin }));
  } else if (accion === 'pr') {
    const branch = git('branch', '--show-current');
    const existentes = await api(`/pulls?head=${encodeURIComponent(repo.split('/')[0] + ':' + branch)}&state=open`);
    if (existentes.length) {
      const r = await api(`/pulls/${existentes[0].number}`, { title: 'feat: completar Praxis con CV, supresión, administración y cierre del MVP', body: readFileSync('specs/014-praxis-completo/pr.md', 'utf8') }, 'PATCH');
      console.log(JSON.stringify({ numero: r.number, url: r.html_url, estado: r.state }));
    }
    else {
      const r = await api('/pulls', { title: 'feat: completar Praxis con CV, supresión, administración y cierre del MVP', head: branch, base: 'main', body: readFileSync('specs/014-praxis-completo/pr.md', 'utf8') });
      console.log(JSON.stringify({ numero: r.number, url: r.html_url, estado: r.state }));
    }
  } else if (accion === 'ci') {
    const sha = git('rev-parse', 'HEAD');
    const r = await api(`/actions/runs?head_sha=${sha}&per_page=10`);
    console.log(JSON.stringify(r.workflow_runs.map((v: { id: number; name: string; status: string; conclusion: string | null; html_url: string; head_sha: string }) => ({ id: v.id, nombre: v.name, estado: v.status, resultado: v.conclusion, url: v.html_url, sha: v.head_sha })), null, 2));
  } else if (accion === 'estado-pr' && /^\d+$/.test(process.argv[3] ?? '')) {
    const r = await api(`/pulls/${process.argv[3]}`);
    console.log(JSON.stringify({ numero: r.number, url: r.html_url, estado: r.state, fusionado: r.merged, fusionable: r.mergeable, estadoFusion: r.mergeable_state, base: r.base.ref, rama: r.head.ref, sha: r.head.sha }, null, 2));
  } else if (accion === 'merge' && /^\d+$/.test(process.argv[3] ?? '')) {
    const r = await api(`/pulls/${process.argv[3]}`);
    if (r.base.ref !== 'main' || r.head.ref !== git('branch', '--show-current') || r.head.sha !== git('rev-parse', 'HEAD') || r.head.repo.full_name !== repo)
      throw new Error('El PR no corresponde al commit local y a main; no se fusiona.');
    const checks = await api(`/commits/${r.head.sha}/check-runs`);
    if (!checks.check_runs.length || checks.check_runs.some((c: { status: string; conclusion: string }) => c.status !== 'completed' || !['success', 'neutral', 'skipped'].includes(c.conclusion)))
      throw new Error('Los checks del commit aún no están aprobados; no se fusiona.');
    const resultado = await api(`/pulls/${r.number}/merge`, { sha: r.head.sha, merge_method: 'merge' }, 'PUT');
    console.log(JSON.stringify(resultado));
  } else if (accion === 'logs' && /^\d+$/.test(process.argv[3] ?? '')) {
    const r = await fetch(`https://api.github.com/repos/${repo}/actions/jobs/${process.argv[3]}/logs`, { headers: { Authorization: `Bearer ${secreto}`, Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`No se pudieron leer logs del job: HTTP ${r.status}.`);
    console.log((await r.text()).split('\n').slice(-160).join('\n'));
  } else if (accion === 'jobs' && /^\d+$/.test(process.argv[3] ?? '')) {
    const r = await api(`/actions/runs/${process.argv[3]}/jobs`);
    console.log(JSON.stringify(r.jobs.map((j: { id: number; name: string; status: string; conclusion: string; steps: unknown[] }) => ({ id: j.id, nombre: j.name, estado: j.status, resultado: j.conclusion, pasos: j.steps })), null, 2));
  } else throw new Error('Usa check, pr, ci, jobs/logs/estado-pr/merge <id>.');
} catch (e) {
  console.error(e instanceof Error && !('cmd' in e) ? e.message : 'No se pudo obtener la credencial de GitHub sin interacción. Autentica Git Credential Manager o configura GH_TOKEN en el entorno.');
  process.exitCode = 1;
}
