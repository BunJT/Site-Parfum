// public/javascript/db.js
// Rôle : cache local des données chargées depuis l'API.
// DB n'est plus la source de vérité — c'est SQLite côté serveur.
// On le garde en mémoire pour éviter des requêtes à chaque rendu.

const DB = {
  familles: [],
  maisons:  [],  // inclut les parfums imbriqués (sans image)
  parfums:  [],  // liste à plat pour l'admin
}

// Mot de passe admin envoyé dans les headers des requêtes protégées
// (en prod, utiliser une vraie session/token)
function adminHeaders() {
  // Plus besoin d'envoyer le mot de passe — le cookie de session
  // est joint automatiquement par le navigateur à chaque requête
  return {
    'Content-Type': 'application/json',
  }
}

async function restoreAdminSession() {
  // Vérifie auprès du serveur si la session est toujours active
  const res = await fetch('/api/session')
  const data = await res.json()
  return data.adminLogged
}

// ── Chargement initial ────────────────────────────────────

// Charge toutes les données nécessaires au premier rendu
async function loadAll() {
  const [familles, maisons, parfums] = await Promise.all([
    fetch('/api/familles').then(r => r.json()),
    fetch('/api/maisons').then(r => r.json()),
    fetch('/api/parfums').then(r => r.json()),
  ])
  DB.familles = familles
  DB.maisons  = maisons
  DB.parfums  = parfums
}

// Recharge uniquement les maisons + parfums (après un CRUD)
async function reloadData() {
  const [maisons, parfums] = await Promise.all([
    fetch('/api/maisons').then(r => r.json()),
    fetch('/api/parfums').then(r => r.json()),
  ])
  DB.maisons = maisons
  DB.parfums = parfums
}

async function reloadFamilles() {
  DB.familles = await fetch('/api/familles').then(r => r.json())
}