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

// Affiche un écran de chargement pendant que l'API répond
function renderLoading() {
  document.getElementById('app').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:1rem;">
      <div style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:var(--gold);font-style:italic;">Parfumerie</div>
      <div style="font-size:0.72rem;color:var(--text-3);letter-spacing:0.3em;">Chargement…</div>
    </div>
  `
}

// Lance l'app une fois le DOM prêt
document.addEventListener('DOMContentLoaded', async () => {
  renderLoading()

  // Restaure la session admin si elle existait avant le refresh
  if (restoreAdminSession()) {
    // Vérifie que le mot de passe est toujours valide côté serveur
    const check = await fetch('/api/maisons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': localStorage.getItem('admin_pw') },
      body: JSON.stringify({ __check: true })
    })
    if (check.status !== 401) {
      State.adminLogged = true
    } else {
      // Mot de passe invalide, on nettoie
      setAdminPassword(null)
    }
  }

  // Réinitialise proprement les filtres à chaque chargement
  // pour éviter tout état résiduel après refresh
  State.familleFilter = []
  State.prixFilter    = null
  State.search        = ''
  State.view          = 'home'

  await loadAll()
  render()
})