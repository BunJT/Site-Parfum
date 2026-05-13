// database.js
// Rôle : ouvre la base SQLite, crée les tables si elles n'existent pas.
// Aucune donnée initiale — tout est ajouté via le site.

const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('parfumerie.db')

// ── Promisification ───────────────────────────────────────

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err)
      else resolve({ lastID: this.lastID, changes: this.changes })
    })
  })
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

// ── Création des tables ───────────────────────────────────

async function init() {
  await run(`PRAGMA foreign_keys = ON`)

  await run(`
    CREATE TABLE IF NOT EXISTS familles (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      nom     TEXT NOT NULL UNIQUE,
      couleur TEXT DEFAULT '#8B7355'
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS maisons (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nom         TEXT NOT NULL UNIQUE,
      origine     TEXT,
      description TEXT
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS parfums (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nom           TEXT NOT NULL,
      maison_id     INTEGER NOT NULL REFERENCES maisons(id) ON DELETE CASCADE,
      concentration TEXT,
      description   TEXT,
      note_tete     TEXT,
      note_coeur    TEXT,
      note_fond     TEXT,
      image_base64  TEXT,
      statut        TEXT DEFAULT 'teste'
    )
  `)

  // Table de liaison parfum ↔ familles (plusieurs familles par parfum)
  await run(`
    CREATE TABLE IF NOT EXISTS parfum_familles (
      parfum_id  INTEGER NOT NULL REFERENCES parfums(id) ON DELETE CASCADE,
      famille_id INTEGER NOT NULL REFERENCES familles(id) ON DELETE CASCADE,
      PRIMARY KEY (parfum_id, famille_id)
    )
  `)

  // ── Migrations ────────────────────────────────────────────
  // Ajoute les colonnes manquantes sans toucher aux données existantes.

  const colonnesFamilles = await all(`PRAGMA table_info(familles)`)
  const nomsColonnesFamilles = colonnesFamilles.map(c => c.name)
  if (!nomsColonnesFamilles.includes('couleur')) {
    await run(`ALTER TABLE familles ADD COLUMN couleur TEXT DEFAULT '#8B7355'`)
    console.log('✓ Migration : colonne couleur ajoutée à familles')
  }

  const colonnesParfums = await all(`PRAGMA table_info(parfums)`)
  const nomsColonnesParfums = colonnesParfums.map(c => c.name)
  if (nomsColonnesParfums.includes('famille_id')) {
    // Migre les famille_id existants vers la table de liaison puis supprime la colonne
    // SQLite ne supporte pas DROP COLUMN avant v3.35, on recrée la table proprement
    const parfumsExistants = await all(`SELECT id, famille_id FROM parfums WHERE famille_id IS NOT NULL`)
    for (const p of parfumsExistants) {
      await run(`INSERT OR IGNORE INTO parfum_familles (parfum_id, famille_id) VALUES (?, ?)`, [p.id, p.famille_id])
    }
    console.log(`✓ Migration : ${parfumsExistants.length} liaison(s) famille migrée(s) vers parfum_familles`)
  }
  if (nomsColonnesParfums.includes('annee')) {
    console.log('✓ Migration : colonne annee ignorée (dépréciée)')
  }

  const colonnesParfums2 = await all(`PRAGMA table_info(parfums)`)
  const nomsParfums2 = colonnesParfums2.map(c => c.name)
  if (!nomsParfums2.includes('statut')) {
    await run(`ALTER TABLE parfums ADD COLUMN statut TEXT DEFAULT 'teste'`)
    console.log('✓ Migration : colonne statut ajoutée à parfums')
  }

  const colonnesParfums3 = await all(`PRAGMA table_info(parfums)`)
  const nomsParfums3 = colonnesParfums3.map(c => c.name)
  if (!nomsParfums3.includes('gamme_prix')) {
    await run(`ALTER TABLE parfums ADD COLUMN gamme_prix TEXT DEFAULT NULL`)
    console.log('✓ Migration : colonne gamme_prix ajoutée')
  }

  console.log('✓ Base de données prête')
}

module.exports = { db, run, get, all, init }