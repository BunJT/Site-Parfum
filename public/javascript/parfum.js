// public/javascript/parfum.js
// Rôle : génère le HTML de la page détail d'un parfum.
// Utilise State.selectedParfum chargé depuis /api/parfums/:id (image incluse).

function renderParfumDetail() {
  const p = State.selectedParfum
  if (!p) { nav('home'); return '' }

  const familles = p.familles || []
  const hasNotes = p.note_tete || p.note_coeur || p.note_fond

  return `
  <div style="max-width:1000px;margin:0 auto;padding:4rem 2rem;">

    <!-- Retour -->
    <button
      onclick="nav('home')"
      style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:0.72rem;letter-spacing:0.25em;text-transform:uppercase;margin-bottom:3rem;display:flex;align-items:center;gap:0.5rem;"
    >← Retour</button>

    <!-- Layout principal -->
    <div style="display:grid;grid-template-columns:${p.image_base64 ? '240px 1fr' : '1fr'};gap:4rem;margin-bottom:4rem;align-items:start;">

      <!-- Image format flacon vertical -->
      ${p.image_base64 ? `
      <div style="position:sticky;top:6rem;">
        <div style="width:100%;aspect-ratio:2/3;border-radius:10px;overflow:hidden;border:1px solid var(--border);background:var(--bg-card);">
          <img
            src="${p.image_base64}"
            alt="${p.nom}"
            style="width:100%;height:100%;object-fit:cover;object-position:center;"
          />
        </div>
      </div>` : ''}

      <!-- Infos -->
      <div>
        <!-- Badges -->
        <div style="display:flex;gap:0.6rem;flex-wrap:wrap;align-items:center;margin-bottom:1.5rem;">
          ${familles.map(f => `<span class="badge badge-gold"><span class="famille-dot" style="background:${f.couleur || '#9A8A78'};"></span>${f.nom}</span>`).join('')}
          ${p.concentration ? `<span class="badge badge-outline">${p.concentration}</span>` : ''}
          ${p.statut === 'non_teste' ? `<span style="font-size:0.68rem;padding:0.2rem 0.7rem;border-radius:100px;border:1px solid var(--border-light);color:var(--text-3);font-style:italic;">Non testé personnellement</span>` : ''}
          ${p.gamme_prix ? `<span style="font-size:0.75rem;padding:0.2rem 0.7rem;border-radius:100px;border:1px solid var(--border-light);color:var(--text-2);">${p.gamme_prix} €</span>` : ''}
        </div>

        <p style="font-size:0.72rem;letter-spacing:0.28em;text-transform:uppercase;color:var(--text-3);margin-bottom:0.4rem;">
          ${p.maison_nom}
        </p>
        <h1 style="font-family:'Cormorant Garamond',serif;font-size:clamp(2.5rem,6vw,4.5rem);line-height:1.05;margin-bottom:2rem;">
          ${p.nom}
        </h1>

        ${p.description
          ? `<p style="color:var(--text-2);line-height:1.95;font-size:1rem;">${p.description}</p>`
          : ''}
      </div>

    </div>

    <!-- Pyramide olfactive -->
    ${hasNotes ? `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:2.25rem;">
      <p style="font-size:0.65rem;letter-spacing:0.32em;text-transform:uppercase;color:var(--text-3);margin-bottom:2rem;">
        Pyramide olfactive
      </p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:2rem;">
        ${p.note_tete  ? renderNoteSection('Tête',  p.note_tete)  : ''}
        ${p.note_coeur ? renderNoteSection('Cœur',  p.note_coeur) : ''}
        ${p.note_fond  ? renderNoteSection('Fond',  p.note_fond)  : ''}
      </div>
    </div>` : ''}

  </div>`
}

function renderNoteSection(label, contenu) {
  return `
  <div class="note-border">
    <p style="font-size:0.65rem;color:var(--gold);letter-spacing:0.28em;text-transform:uppercase;margin-bottom:0.65rem;">${label}</p>
    <p style="color:var(--text-2);line-height:1.75;font-size:0.875rem;">${contenu}</p>
  </div>`
}