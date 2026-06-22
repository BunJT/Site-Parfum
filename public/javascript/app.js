// public/javascript/app.js
// Rôle : moteur de rendu principal + point d'entrée de l'application.
// Charge les données depuis l'API avant le premier rendu.

function render() {
  document.getElementById('app').innerHTML = `
    ${renderHeader()}
    <div id="main-content">
      ${State.view === 'home'   ? renderHome()         : ''}
      ${State.view === 'maison' ? renderMaisonDetail() : ''}
      ${State.view === 'parfum' ? renderParfumDetail() : ''}
      ${State.view === 'admin'  ? renderAdmin()        : ''}
    </div>
    ${renderModal()}
  `
}

function renderLoading() {
  document.getElementById('app').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:1rem;">
      <div style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:var(--gold);font-style:italic;">Parfumerie</div>
      <div style="font-size:0.72rem;color:var(--text-3);letter-spacing:0.3em;">Chargement…</div>
    </div>
  `
}

document.addEventListener('DOMContentLoaded', async () => {
  renderLoading()

  // Vérifie si la session est toujours active côté serveur (via cookie)
  const sessionActive = await restoreAdminSession()
  if (sessionActive) {
    State.adminLogged = true
  }

  // Réinitialise proprement les filtres à chaque chargement
  State.familleFilter = []
  State.prixFilter    = null
  State.search        = ''
  State.view          = 'home'

  await loadAll()
  render()
})