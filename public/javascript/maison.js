// js/modules/views/maison.js
// Rôle : génère le HTML de la page détail d'une maison de parfum.

function renderMaisonDetail() {
  const m = getMaison(State.selectedMaisonId)
  if (!m) { nav('home'); return '' }

  const parfums = getParfumsOf(m.id)

  return `
  <div style="max-width:1200px;margin:0 auto;padding:4rem 2rem;">

    <!-- Retour -->
    <button onclick="nav('home')" style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:0.72rem;letter-spacing:0.25em;text-transform:uppercase;margin-bottom:3rem;display:flex;align-items:center;gap:0.5rem;">
      ← Retour
    </button>

    <!-- En-tête maison -->
    <div style="margin-bottom:4rem;">
      <h1 style="font-family:'Cormorant Garamond',serif;font-size:clamp(3rem,8vw,6rem);line-height:1;margin-bottom:1rem;">
        ${m.nom}
      </h1>
      ${m.origine
        ? `<p style="color:var(--gold);font-size:0.72rem;letter-spacing:0.38em;text-transform:uppercase;margin-bottom:1.25rem;">${m.origine}</p>`
        : ''}
      ${m.description
        ? `<p style="color:var(--text-2);max-width:600px;line-height:1.9;font-size:0.95rem;">${m.description}</p>`
        : ''}
    </div>

    <!-- Liste des parfums -->
    <p style="font-size:0.65rem;letter-spacing:0.32em;text-transform:uppercase;color:var(--text-3);margin-bottom:1.75rem;">
      ${parfums.length} Parfum${parfums.length > 1 ? 's' : ''}
    </p>

    ${parfums.length > 0
      ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem;">
           ${parfums.map(renderParfumCard).join('')}
         </div>`
      : `<p style="color:var(--text-3);font-style:italic;">Aucun parfum dans cette maison pour l'instant.</p>`
    }

  </div>`
}
