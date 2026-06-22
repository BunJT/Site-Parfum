// public/javascript/admin.js
// Rôle : génère le HTML de l'espace admin (dashboard, CRUD maisons/parfums/familles).

function renderAdmin() {
  if (!State.adminLogged) { nav('home'); return '' }

  const tabs = ['dashboard', 'maisons', 'parfums', 'non_testes', 'familles']

  return `
  <div style="max-width:1200px;margin:0 auto;padding:3rem 2rem;">

    <div style="margin-bottom:2.5rem;">
      <h1 style="font-family:'Cormorant Garamond',serif;font-size:2.5rem;margin-bottom:0.4rem;">Administration</h1>
      <p style="color:var(--text-3);font-size:0.78rem;">Gérez votre encyclopédie personnelle</p>
    </div>

    <div style="display:flex;gap:2rem;border-bottom:1px solid var(--border);margin-bottom:2.5rem;">
      ${tabs.map(t => {
      const labels = { dashboard: 'Dashboard', maisons: 'Maisons', parfums: 'Parfums', non_testes: 'Non testés', familles: 'Familles' }
      const nonTestes = DB.parfums.filter(p => p.statut === 'non_teste').length
      const badge = t === 'non_testes' && nonTestes > 0 ? `<span style="margin-left:0.4rem;font-size:0.6rem;padding:0.1rem 0.4rem;border-radius:100px;background:var(--gold-dim);color:var(--gold);border:1px solid rgba(201,169,110,0.3);">${nonTestes}</span>` : ''
      return `<button class="nav-tab ${State.adminView === t ? 'active' : ''}" onclick="setAdminView('${t}')">${labels[t] || t}${badge}</button>`
    }).join('')}
    </div>

    ${State.adminView === 'dashboard' ? renderAdminDashboard() : ''}
    ${State.adminView === 'maisons'   ? renderAdminMaisons()   : ''}
    ${State.adminView === 'parfums'   ? renderAdminParfums()   : ''}
    ${State.adminView === 'familles'   ? renderAdminFamilles()   : ''}
    ${State.adminView === 'non_testes'  ? renderAdminNonTestes()  : ''}

  </div>`
}

// ── Dashboard ─────────────────────────────────────────────

function renderAdminDashboard() {
  const stats = [
    { label: 'Maisons',  count: DB.maisons.length,  action: "setAdminView('maisons')"  },
    { label: 'Parfums',  count: DB.parfums.length,  action: "setAdminView('parfums')"  },
    { label: 'Familles', count: DB.familles.length, action: "setAdminView('familles')" },
  ]

  const derniers = [...DB.parfums].reverse().slice(0, 5)

  return `
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:3rem;">
    ${stats.map(s => `
    <div class="card" onclick="${s.action}" style="padding:1.75rem;">
      <div style="font-family:'Cormorant Garamond',serif;font-size:3rem;color:var(--gold);line-height:1;">${s.count}</div>
      <div style="font-size:0.68rem;color:var(--text-3);letter-spacing:0.28em;text-transform:uppercase;margin-top:0.35rem;">${s.label}</div>
    </div>`).join('')}
  </div>

  <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;margin-bottom:1.25rem;">Derniers ajouts</h2>
  <div style="display:flex;flex-direction:column;gap:0.5rem;">
    ${derniers.map(p => {
      const f = getFamille(p.famille_id)
      return `
      <div style="display:flex;align-items:center;gap:1rem;padding:0.9rem 1rem;background:var(--bg-card);border:1px solid var(--border);border-radius:6px;">
        <span style="font-family:'Cormorant Garamond',serif;font-size:1rem;">${p.nom}</span>
        <span style="font-size:0.72rem;color:var(--text-3);">${p.maison_nom || ''}</span>
        ${f ? `<span class="badge badge-gold" style="margin-left:auto;">${familleDot(f.nom)} ${f.nom}</span>` : ''}
      </div>`
    }).join('')}
  </div>`
}

// ── Maisons ───────────────────────────────────────────────

function renderAdminMaisons() {
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
    <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.75rem;">Maisons (${DB.maisons.length})</h2>
    <button class="btn btn-gold" onclick="openModal('addMaison')">+ Ajouter</button>
  </div>
  <div style="display:flex;flex-direction:column;gap:0.75rem;">
    ${DB.maisons.map(m => {
      const parfums = getParfumsOf(m.id)
      const count   = parfums.length
      return `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;overflow:hidden;">

        <!-- En-tête maison cliquable -->
        <div
          style="display:flex;align-items:center;gap:1rem;padding:1.1rem 1.25rem;cursor:pointer;transition:background 0.15s;"
          onmouseover="this.style.background='var(--bg-card-hover)'"
          onmouseout="this.style.background='transparent'"
          onclick="toggleMaisonAdmin(${m.id})"
        >
          <!-- Chevron -->
          <svg id="chevron-${m.id}" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            style="color:var(--text-3);flex-shrink:0;transition:transform 0.2s;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>

          <div style="flex:1;">
            <span style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;">${m.nom}</span>
            ${m.origine ? `<span style="font-size:0.7rem;color:var(--text-3);margin-left:0.75rem;">${m.origine}</span>` : ''}
          </div>

          <span style="font-size:0.75rem;color:var(--text-3);">${count} parfum${count > 1 ? 's' : ''}</span>

          <!-- Boutons — stoppe la propagation pour ne pas toggler -->
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();openModal('editMaison', ${m.id})">Modifier</button>
          <button class="btn btn-danger  btn-sm" onclick="event.stopPropagation();confirmDelete('maison', ${m.id})">Supprimer</button>
        </div>

        <!-- Liste des parfums dépliable -->
        <div id="maison-parfums-${m.id}" style="display:none;border-top:1px solid var(--border);">
          ${count === 0
            ? `<p style="padding:1rem 1.25rem;color:var(--text-3);font-size:0.8rem;font-style:italic;">Aucun parfum dans cette maison</p>`
            : parfums.map(p => {
                const familles = p.familles || []
                return `
                <div style="display:flex;align-items:center;gap:1rem;padding:0.85rem 1.25rem 0.85rem 3rem;border-bottom:1px solid var(--border);">
                  <div style="flex:1;">
                    <span style="font-size:0.9rem;">${p.nom}</span>
                    ${p.concentration ? `<span style="font-size:0.68rem;color:var(--text-3);margin-left:0.6rem;">${p.concentration}</span>` : ''}
                  ${p.statut === 'non_teste' ? `<span style="font-size:0.62rem;color:var(--gold);margin-left:0.4rem;">(Non testé)</span>` : ''}
                  </div>
                  <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                    ${familles.map(f => `<span class="badge badge-gold" style="font-size:0.62rem;"><span class="famille-dot" style="background:${f.couleur || '#9A8A78'};"></span>${f.nom}</span>`).join('')}
                  </div>
                  <button class="btn btn-outline btn-sm" onclick="openModal('editParfum', ${p.id})">Modifier</button>
                  <button class="btn btn-danger  btn-sm" onclick="confirmDelete('parfum', ${p.id})">Supprimer</button>
                </div>`
              }).join('')
          }
          <div style="padding:0.75rem 1.25rem 0.75rem 3rem;">
            <button class="btn btn-outline btn-sm" onclick="openModal('addParfum', ${m.id})">+ Ajouter un parfum</button>
          </div>
        </div>

      </div>`
    }).join('')}
  </div>`
}

function toggleMaisonAdmin(id) {
  const panel   = document.getElementById(`maison-parfums-${id}`)
  const chevron = document.getElementById(`chevron-${id}`)
  if (!panel) return
  const isOpen = panel.style.display !== 'none'
  panel.style.display  = isOpen ? 'none' : 'block'
  chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)'
}

// ── Parfums ───────────────────────────────────────────────

function renderAdminParfums() {
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
    <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.75rem;">Parfums (${DB.parfums.length})</h2>
    <button class="btn btn-gold" onclick="openModal('addParfum')">+ Ajouter</button>
  </div>
  <div style="display:flex;flex-direction:column;gap:0.6rem;">
    ${DB.parfums.map(p => {
      const f = getFamille(p.famille_id)
      return `
      <div style="display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;">
        <div style="flex:1;">
          <span style="font-family:'Cormorant Garamond',serif;font-size:1rem;">${p.nom}</span>
          <span style="font-size:0.72rem;color:var(--text-3);margin-left:0.75rem;">${p.maison_nom || ''}</span>
        </div>
        ${f ? `<span class="badge badge-gold">${familleDot(f.nom)} ${f.nom}</span>` : ''}
        ${p.concentration ? `<span class="badge badge-outline">${p.concentration}</span>` : ''}
        ${p.gamme_prix ? `<span class="badge badge-outline">${p.gamme_prix} €</span>` : ''}
        ${p.coup_qp ? `<span style="font-size:0.65rem;padding:0.2rem 0.6rem;border-radius:100px;background:var(--gold);color:#0d0b09;font-weight:500;">Q/P</span>` : ''}
        ${p.statut === 'non_teste' ? `<span style="font-size:0.65rem;padding:0.2rem 0.6rem;border-radius:100px;border:1px solid rgba(201,169,110,0.3);color:var(--gold);background:rgba(201,169,110,0.08);">Non testé</span>` : ''}
        <button class="btn btn-outline btn-sm" onclick="openModal('editParfum', ${p.id})">Modifier</button>
        <button class="btn btn-danger  btn-sm" onclick="confirmDelete('parfum', ${p.id})">Supprimer</button>
      </div>`
    }).join('')}
  </div>`
}

// ── Familles olfactives ───────────────────────────────────

function renderAdminFamilles() {
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
    <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.75rem;">Familles olfactives (${DB.familles.length})</h2>
    <button class="btn btn-gold" onclick="openModal('addFamille')">+ Ajouter</button>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:0.75rem;">
    ${DB.familles.map(f => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:0.9rem 1.1rem;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;">
      <div style="display:flex;align-items:center;gap:0.6rem;flex:1;">
        <span style="width:12px;height:12px;border-radius:50%;background:${f.couleur || getFamilleColor(f.nom)};display:inline-block;flex-shrink:0;"></span>
        <span style="font-size:0.875rem;">${f.nom}</span>
      </div>
      <div style="display:flex;gap:0.5rem;">
        <button class="btn btn-outline btn-sm" onclick="openModal('editFamille', ${f.id})">Modifier</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('famille', ${f.id})" style="padding:0.3rem 0.65rem;">×</button>
      </div>
    </div>`).join('')}
  </div>`
}


// ── Non testés ────────────────────────────────────────────

function renderAdminNonTestes() {
  const nonTestes = DB.parfums.filter(p => p.statut === 'non_teste')

  return `
  <div style="margin-bottom:1.5rem;">
    <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.75rem;margin-bottom:0.4rem;">Parfums non testés (${nonTestes.length})</h2>
    <p style="font-size:0.78rem;color:var(--text-3);">Ces parfums seront marqués "Non testé personnellement" pour les visiteurs.</p>
  </div>

  ${nonTestes.length === 0 ? `
  <div style="text-align:center;padding:4rem 0;color:var(--text-3);">
    <p style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-style:italic;margin-bottom:0.5rem;">Tout a été testé !</p>
    <p style="font-size:0.8rem;">Aucun parfum n'est marqué comme non testé.</p>
  </div>` : `
  <div style="display:flex;flex-direction:column;gap:0.6rem;">
    ${nonTestes.map(p => {
      const familles = p.familles || []
      return `
      <div style="display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;">
        <div style="flex:1;">
          <span style="font-family:'Cormorant Garamond',serif;font-size:1rem;">${p.nom}</span>
          <span style="font-size:0.72rem;color:var(--text-3);margin-left:0.75rem;">${p.maison_nom || ''}</span>
        </div>
        <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
          ${familles.map(f => `<span class="badge badge-gold" style="font-size:0.62rem;"><span class="famille-dot" style="background:${f.couleur || '#9A8A78'};"></span>${f.nom}</span>`).join('')}
        </div>
        <!-- Bouton rapide pour marquer comme testé -->
        <button
          class="btn btn-outline btn-sm"
          onclick="marquerCommeteste(${p.id})"
          style="white-space:nowrap;border-color:var(--gold);color:var(--gold);"
        >✓ Marquer comme testé</button>
        <button class="btn btn-outline btn-sm" onclick="openModal('editParfum', ${p.id})">Modifier</button>
      </div>`
    }).join('')}
  </div>`}`
}