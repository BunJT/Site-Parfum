// public/javascript/helpers.js
// Rôle : fonctions pures réutilisables dans toute l'application.

function getMaison(id) {
  return DB.maisons.find(m => m.id === id) || null
}

function getFamille(id) {
  return DB.familles.find(f => f.id === id) || null
}

// Les parfums sont imbriqués dans DB.maisons (chargés avec /api/maisons)
function getParfumsOf(maisonId) {
  return getMaison(maisonId)?.parfums || []
}

function getFamilleColor(nom) {
  // Priorité à la couleur stockée en base, sinon fallback sur les couleurs par défaut
  const famille = DB.familles.find(f => f.nom === nom)
  return famille?.couleur || FAMILLE_COLORS[nom] || '#9A8A78'
}

function familleDot(nom) {
  return `<span class="famille-dot" style="background:${getFamilleColor(nom)};"></span>`
}

function fieldValue(id) {
  const el = document.getElementById(id)
  return el ? el.value.trim() : ''
}