// server.js
// Rôle : serveur Express qui expose l'API REST et sert les fichiers statiques.

require('dotenv').config()

const express            = require('express')
const session            = require('express-session')
const rateLimit          = require('express-rate-limit')
const path               = require('path')
const { run, get, all, init } = require('./database')

const app  = express()
const PORT = process.env.PORT || 3000
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

// Vérification des variables d'environnement critiques au démarrage
if (!ADMIN_PASSWORD) {
  console.error('❌ ADMIN_PASSWORD manquant. Définis-le dans .env (local) ou les variables Railway (prod).')
  process.exit(1)
}
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) {
  console.error('❌ SESSION_SECRET manquant ou trop court (16 caractères minimum).')
  process.exit(1)
}

// Limite de taille pour une image base64 (≈ 2.7 Mo une fois encodée pour 2 Mo de fichier)
const MAX_IMAGE_LENGTH = 3_000_000

app.set('trust proxy', 1)
app.use(express.json({ limit: '10mb' }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,       // inaccessible depuis JS
    secure: process.env.NODE_ENV === 'production', // HTTPS en prod
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
  }
}))

function requireAdmin(req, res, next) {
  if (!req.session?.adminLogged) {
    return res.status(401).json({ error: 'Non autorisé' })
  }
  next()
}

// ══════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                  // 10 tentatives max par IP
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

app.post('/api/login', loginLimiter, (req, res) => {
  const { password } = req.body
  if (password === ADMIN_PASSWORD) {
    req.session.adminLogged = true
    res.json({ success: true })
  } else {
    res.status(401).json({ error: 'Mot de passe incorrect' })
  }
})

app.post('/api/logout', (req, res) => {
  req.session.destroy()
  res.json({ success: true })
})

app.get('/api/session', (req, res) => {
  res.json({ adminLogged: !!req.session?.adminLogged })
})

// ══════════════════════════════════════════════════════════
// FAMILLES
// ══════════════════════════════════════════════════════════

app.get('/api/familles', async (req, res) => {
  try { res.json(await all(`SELECT * FROM familles ORDER BY nom`)) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/familles', requireAdmin, async (req, res) => {
  const { nom, couleur } = req.body
  if (!nom) return res.status(400).json({ error: 'Nom requis' })
  try {
    const r = await run(`INSERT INTO familles (nom, couleur) VALUES (?, ?)`, [nom, couleur || '#8B7355'])
    res.status(201).json({ id: r.lastID, nom, couleur: couleur || '#8B7355' })
  } catch { res.status(409).json({ error: 'Cette famille existe déjà' }) }
})

app.put('/api/familles/:id', requireAdmin, async (req, res) => {
  const { nom, couleur } = req.body
  if (!nom) return res.status(400).json({ error: 'Nom requis' })
  try {
    await run(`UPDATE familles SET nom = ?, couleur = ? WHERE id = ?`, [nom, couleur || '#8B7355', req.params.id])
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/familles/:id', requireAdmin, async (req, res) => {
  try {
    await run(`DELETE FROM parfum_familles WHERE famille_id = ?`, [req.params.id])
    await run(`DELETE FROM familles WHERE id = ?`, [req.params.id])
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ══════════════════════════════════════════════════════════
// MAISONS
// ══════════════════════════════════════════════════════════

app.get('/api/maisons', async (req, res) => {
  try {
    const maisons = await all(`SELECT * FROM maisons ORDER BY nom`)
    const parfums = await all(`
      SELECT p.id, p.nom, p.maison_id, p.concentration, p.statut, p.gamme_prix, p.coup_qp, p.avis_perso,
             p.description, p.note_tete, p.note_coeur, p.note_fond, p.image_base64,
             m.nom AS maison_nom
      FROM parfums p
      LEFT JOIN maisons m ON m.id = p.maison_id
      ORDER BY p.nom
    `)

    // Attache les familles à chaque parfum
    for (const p of parfums) {
      const familles = await all(`
        SELECT f.id, f.nom, f.couleur, pf.ordre FROM familles f
        INNER JOIN parfum_familles pf ON pf.famille_id = f.id
        WHERE pf.parfum_id = ?
        ORDER BY pf.ordre ASC
      `, [p.id])
      p.familles = familles
    }

    res.json(maisons.map(m => ({ ...m, parfums: parfums.filter(p => p.maison_id === m.id) })))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/maisons/:id', async (req, res) => {
  try {
    const m = await get(`SELECT * FROM maisons WHERE id = ?`, [req.params.id])
    if (!m) return res.status(404).json({ error: 'Introuvable' })
    res.json(m)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/maisons', requireAdmin, async (req, res) => {
  const { nom, origine, description } = req.body
  if (!nom) return res.status(400).json({ error: 'Nom requis' })
  try {
    const r = await run(`INSERT INTO maisons (nom, origine, description) VALUES (?, ?, ?)`, [nom, origine||null, description||null])
    res.status(201).json({ id: r.lastID, nom, origine, description })
  } catch { res.status(409).json({ error: 'Cette maison existe déjà' }) }
})

app.put('/api/maisons/:id', requireAdmin, async (req, res) => {
  const { nom, origine, description } = req.body
  if (!nom) return res.status(400).json({ error: 'Nom requis' })
  try {
    await run(`UPDATE maisons SET nom=?, origine=?, description=? WHERE id=?`, [nom, origine||null, description||null, req.params.id])
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/maisons/:id', requireAdmin, async (req, res) => {
  try { await run(`DELETE FROM maisons WHERE id=?`, [req.params.id]); res.json({ success: true }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// ══════════════════════════════════════════════════════════
// PARFUMS
// ══════════════════════════════════════════════════════════

app.get('/api/parfums', async (req, res) => {
  try {
    const { search, maison } = req.query
    let q = `
      SELECT p.id, p.nom, p.maison_id, p.concentration, p.statut, p.gamme_prix, p.coup_qp, p.avis_perso,
             p.description, p.note_tete, p.note_coeur, p.note_fond, p.image_base64,
             m.nom AS maison_nom
      FROM parfums p
      LEFT JOIN maisons m ON m.id = p.maison_id
      WHERE 1=1`
    const params = []
    if (search) { q += ` AND (p.nom LIKE ? OR m.nom LIKE ?)`; params.push(`%${search}%`, `%${search}%`) }
    if (maison) { q += ` AND p.maison_id = ?`; params.push(parseInt(maison)) }
    q += ` ORDER BY p.nom`

    const parfums = await all(q, params)
    for (const p of parfums) {
      p.familles = await all(`
        SELECT f.id, f.nom, f.couleur, pf.ordre FROM familles f
        INNER JOIN parfum_familles pf ON pf.famille_id = f.id
        WHERE pf.parfum_id = ?
        ORDER BY pf.ordre ASC
      `, [p.id])
    }
    res.json(parfums)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/parfums/:id', async (req, res) => {
  try {
    const p = await get(`
      SELECT p.*, m.nom AS maison_nom
      FROM parfums p
      LEFT JOIN maisons m ON m.id = p.maison_id
      WHERE p.id = ?`, [req.params.id])
    if (!p) return res.status(404).json({ error: 'Introuvable' })
    p.familles = await all(`
      SELECT f.id, f.nom, f.couleur FROM familles f
      INNER JOIN parfum_familles pf ON pf.famille_id = f.id
      WHERE pf.parfum_id = ?
    `, [p.id])
    res.json(p)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/parfums', requireAdmin, async (req, res) => {
  const { nom, maison_id, famille_ids, concentration, description,
          note_tete, note_coeur, note_fond, image_base64, statut, gamme_prix,
          coup_qp, avis_perso } = req.body
  if (!nom || !maison_id) return res.status(400).json({ error: 'Nom et maison requis' })
  if (image_base64 && image_base64.length > MAX_IMAGE_LENGTH) {
    return res.status(413).json({ error: 'Image trop lourde (max 2 Mo).' })
  }
  try {
    const r = await run(`
      INSERT INTO parfums (nom, maison_id, concentration, description, note_tete, note_coeur, note_fond, image_base64, statut, gamme_prix, coup_qp, avis_perso)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [nom, maison_id, concentration||null, description||null,
        note_tete||null, note_coeur||null, note_fond||null, image_base64||null, statut||'teste', gamme_prix||null,
        coup_qp ? 1 : 0, avis_perso||null])

    // Liaison familles
    if (famille_ids?.length) {
      for (let i = 0; i < famille_ids.length; i++) {
        await run(`INSERT OR IGNORE INTO parfum_familles (parfum_id, famille_id, ordre) VALUES (?, ?, ?)`, [r.lastID, famille_ids[i], i])
      }
    }
    res.status(201).json({ id: r.lastID })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/parfums/:id', requireAdmin, async (req, res) => {
  const { nom, maison_id, famille_ids, concentration, description,
          note_tete, note_coeur, note_fond, image_base64, statut, gamme_prix,
          coup_qp, avis_perso } = req.body
  if (!nom || !maison_id) return res.status(400).json({ error: 'Nom et maison requis' })
  if (image_base64 && image_base64.length > MAX_IMAGE_LENGTH) {
    return res.status(413).json({ error: 'Image trop lourde (max 2 Mo).' })
  }
  try {
    await run(`
      UPDATE parfums SET nom=?, maison_id=?, concentration=?, description=?,
        note_tete=?, note_coeur=?, note_fond=?, image_base64=?, statut=?, gamme_prix=?,
        coup_qp=?, avis_perso=?
      WHERE id=?
    `, [nom, maison_id, concentration||null, description||null,
        note_tete||null, note_coeur||null, note_fond||null,
        image_base64 !== undefined ? image_base64 : null,
        statut||'teste', gamme_prix||null, coup_qp ? 1 : 0, avis_perso||null, req.params.id])

    // Remplace toutes les liaisons familles
    await run(`DELETE FROM parfum_familles WHERE parfum_id = ?`, [req.params.id])
    if (famille_ids?.length) {
      for (let i = 0; i < famille_ids.length; i++) {
        await run(`INSERT OR IGNORE INTO parfum_familles (parfum_id, famille_id, ordre) VALUES (?, ?, ?)`, [req.params.id, famille_ids[i], i])
      }
    }
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/parfums/:id/statut', requireAdmin, async (req, res) => {
  const { statut } = req.body
  if (!['teste', 'non_teste'].includes(statut)) return res.status(400).json({ error: 'Statut invalide' })
  try {
    await run(`UPDATE parfums SET statut = ? WHERE id = ?`, [statut, req.params.id])
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/parfums/:id', requireAdmin, async (req, res) => {
  try { await run(`DELETE FROM parfums WHERE id=?`, [req.params.id]); res.json({ success: true }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Démarrage ─────────────────────────────────────────────

init().then(() => {
  app.listen(PORT, "0.0.0.0", () => console.log(`✓ Parfumerie démarrée sur le port ${PORT}`))
}).catch(err => {
  console.error('Erreur BDD :', err)
  process.exit(1)
})