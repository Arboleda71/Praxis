import pg from 'pg';

/**
 * Deja lista una base aislada antes de migrarla: la crea si falta y, con `exigirLibre`, se niega a seguir
 * si alguien más está conectado a ella. Dos corridas sobre la misma base se pisan los datos y los contadores
 * de intentos, y el fallo aparece lejos de su causa.
 *
 * `url` ya pasó por `validarBasePruebas`: el nombre de la base es uno de los tres permitidos.
 */
export async function prepararBase(url: string, exigirLibre = true) {
  const base = new URL(url).pathname.slice(1);
  // `praxis_test` existe siempre (la crea el contenedor): desde ella se crean y se consultan las demás.
  const admin = new URL(url);
  admin.pathname = '/praxis_test';
  const cliente = new pg.Client({ connectionString: admin.href });
  await cliente.connect();
  try {
    const existe = await cliente.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [base],
    );
    if (!existe.rowCount) await cliente.query(`CREATE DATABASE "${base}"`);
    if (!exigirLibre) return;
    const { rows } = await cliente.query(
      `SELECT coalesce(nullif(application_name, ''), 'sin nombre') AS quien, count(*)::int AS n
       FROM pg_stat_activity
       WHERE datname = $1 AND pid <> pg_backend_pid()
       GROUP BY 1`,
      [base],
    );
    if (rows.length)
      throw new Error(
        `La base ${base} está en uso (${rows
          .map((r) => `${r.n} de «${r.quien}»`)
          .join(', ')}). Cierra la otra corrida de pruebas que la usa y vuelve a intentar.`,
      );
  } finally {
    await cliente.end();
  }
}
