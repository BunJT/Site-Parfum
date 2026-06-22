// public/javascript/home.js
// Rôle : génère le HTML de la page d'accueil.
// Deux modes d'affichage : liste (minimaliste) et grille (visuel).

// ── Persistance du mode d'affichage ──────────────────────

function getDisplayMode() {
  return localStorage.getItem('display_mode') || 'grid'
}

function setDisplayMode(mode) {
  localStorage.setItem('display_mode', mode)
  document.getElementById('main-content').innerHTML = renderHome()
}

// ── Rendu principal ───────────────────────────────────────

function renderHome() {
  const search    = State.search.toLowerCase()
  const familleIds = State.familleFilter || []
  const mode      = getDisplayMode()

  const prixFilter  = State.prixFilter

  const maisonsFiltrees = DB.maisons
    .map(m => ({
      ...m,
      parfums: (m.parfums || []).filter(p => {
        const matchSearch  = !search || p.nom.toLowerCase().includes(search) || m.nom.toLowerCase().includes(search)
        // 1 famille sélectionnée → le parfum doit la contenir (parmi d'autres possible)
        // Plusieurs familles → le parfum doit les contenir TOUTES (ET)
        const parfumFamilleIds = (p.familles || []).map(f => f.id)
        const matchFamille = familleIds.length === 0
          || (familleIds.length === 1
            ? parfumFamilleIds.includes(familleIds[0])
            : familleIds.every(id => parfumFamilleIds.includes(id)))
        const matchPrix    = !prixFilter || p.gamme_prix === prixFilter
        return matchSearch && matchFamille && matchPrix
      }),
    }))
    .filter(m => {
      if (!search && familleIds.length === 0) return true
      return (search && m.nom.toLowerCase().includes(search)) || m.parfums.length > 0
    })
    .map(m => ({
      ...m,
      // Trie les parfums : ceux avec la famille filtrée en position dominante (0) d'abord
      parfums: familleIds.length > 0
        ? [...m.parfums].sort((a, b) => {
            const aIdx = (a.familles || []).findIndex(f => familleIds.includes(f.id))
            const bIdx = (b.familles || []).findIndex(f => familleIds.includes(f.id))
            return aIdx - bIdx
          })
        : m.parfums
    }))

  return `
  <div style="max-width:1200px;margin:0 auto;padding:3rem 2rem;">

    <!-- Hero -->
    ${!search && familleIds.length === 0 ? `
    <div style="text-align:center;margin-bottom:4rem;">
      <p style="font-size:0.65rem;letter-spacing:0.45em;text-transform:uppercase;color:var(--gold);margin-bottom:1.5rem;">Ma sélection</p>
      <h1 style="font-family:'Cormorant Garamond',serif;font-size:clamp(3rem,7vw,5.5rem);line-height:1;margin-bottom:1.5rem;">
        Une curation<br/><em style="color:var(--gold);">personnelle</em>
      </h1>
      <p style="color:var(--text-2);font-size:0.875rem;letter-spacing:0.1em;">
        ${DB.maisons.length} maisons &nbsp;·&nbsp; ${DB.parfums.length} parfums référencés
      </p>
    </div>` : ''}

    <!-- Barre filtres + toggle -->
    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:2.5rem;flex-wrap:wrap;">

      <!-- Filtres familles + prix -->
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;flex:1;align-items:center;">

        <!-- Familles -->
        ${DB.familles.map(f => `
          <button class="filter-pill ${familleIds.includes(f.id) ? 'active' : ''}" onclick="setFamilleFilter(${f.id})">
            <span style="width:7px;height:7px;border-radius:50%;background:${f.couleur || '#9A8A78'};display:inline-block;flex-shrink:0;"></span>
            ${f.nom}
          </button>
        `).join('')}

        <!-- Séparateur -->
        ${DB.familles.length ? `<span style="width:1px;height:16px;background:var(--border-light);margin:0 0.15rem;flex-shrink:0;"></span>` : ''}

        <!-- Prix -->
        ${['0-100','100-200','200-300','300+'].map(g => `
          <button class="filter-pill ${prixFilter === g ? 'active' : ''}" onclick="setPrixFilter('${g}')">
            ${g} €
          </button>
        `).join('')}

        <!-- Effacer filtres -->
        ${(familleIds.length > 0 || search || prixFilter) ? `
        <button
          onclick="clearAllFilters()"
          style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.35rem 0.85rem;border-radius:100px;font-size:0.72rem;letter-spacing:0.08em;cursor:pointer;border:1px solid rgba(180,50,50,0.3);background:rgba(180,50,50,0.08);color:#e07070;font-family:'Jost',sans-serif;transition:all 0.15s;"
          onmouseover="this.style.background='rgba(180,50,50,0.15)'"
          onmouseout="this.style.background='rgba(180,50,50,0.08)'"
        >× Effacer les filtres</button>` : ''}
      </div>

      <!-- Toggle vue -->
      <div style="display:flex;gap:0.25rem;background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:3px;flex-shrink:0;">
        <!-- Vue liste -->
        <button
          onclick="setDisplayMode('list')"
          title="Vue liste"
          style="background:${mode === 'list' ? 'var(--border-light)' : 'transparent'};border:none;cursor:pointer;border-radius:4px;padding:0.4rem 0.6rem;transition:background 0.15s;display:flex;align-items:center;">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color:${mode === 'list' ? 'var(--text)' : 'var(--text-3)'};">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <!-- Vue grille -->
        <button
          onclick="setDisplayMode('grid')"
          title="Vue grille"
          style="background:${mode === 'grid' ? 'var(--border-light)' : 'transparent'};border:none;cursor:pointer;border-radius:4px;padding:0.4rem 0.6rem;transition:background 0.15s;display:flex;align-items:center;">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color:${mode === 'grid' ? 'var(--text)' : 'var(--text-3)'};">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
          </svg>
        </button>
      </div>

    </div>

    <!-- Contenu -->
    ${maisonsFiltrees.length === 0
      ? renderEmptyState()
      : mode === 'list'
        ? `<div style="display:flex;flex-direction:column;gap:0.5rem;">${maisonsFiltrees.map(renderMaisonList).join('')}</div>`
        : `<div style="display:flex;flex-direction:column;gap:4rem;">${maisonsFiltrees.map(renderMaisonGrid).join('')}</div>`
    }

  </div>`
}

// ══════════════════════════════════════════════════════════
// MODE LISTE
// ══════════════════════════════════════════════════════════

function renderMaisonList(m) {
  const count = m.parfums.length
  return `
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;overflow:hidden;">

    <!-- En-tête cliquable -->
    <div
      style="display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;cursor:pointer;transition:background 0.15s;"
      onmouseover="this.style.background='var(--bg-card-hover)'"
      onmouseout="this.style.background='transparent'"
      onclick="toggleMaisonList(${m.id})"
    >
      <svg id="list-chevron-${m.id}" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor"
        style="color:var(--text-3);flex-shrink:0;transition:transform 0.2s;">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
      <span style="font-family:'Cormorant Garamond',serif;font-size:1.3rem;flex:1;">${m.nom}</span>
      ${m.origine ? `<span style="font-size:0.68rem;color:var(--text-3);letter-spacing:0.2em;text-transform:uppercase;">${m.origine}</span>` : ''}
      <span style="font-size:0.72rem;color:var(--text-3);">${count} parfum${count > 1 ? 's' : ''}</span>
    </div>

    <!-- Parfums dépliables -->
    <div id="list-parfums-${m.id}" style="display:none;border-top:1px solid var(--border);">
      ${count === 0
        ? `<p style="padding:0.9rem 1.25rem 0.9rem 2.75rem;color:var(--text-3);font-size:0.8rem;font-style:italic;">Aucun parfum</p>`
        : m.parfums.map(p => {
            const familles = p.familles || []
            return `
            <div
              onclick="goParfum(${p.id})"
              style="display:flex;align-items:center;gap:1rem;padding:0.8rem 1.25rem 0.8rem 2.75rem;border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.15s;"
              onmouseover="this.style.background='var(--bg-card-hover)'"
              onmouseout="this.style.background='transparent'"
            >
              <div style="flex:1;display:flex;align-items:center;gap:0.6rem;">
                <span style="font-size:0.95rem;">${p.nom}</span>
                ${p.coup_qp ? `<span style="font-size:0.6rem;padding:0.15rem 0.5rem;border-radius:100px;background:var(--gold);color:#0d0b09;font-weight:500;">Rapport Q/P</span>` : ''}
                ${p.statut === 'non_teste' ? `<span style="font-size:0.6rem;padding:0.15rem 0.5rem;border-radius:100px;background:rgba(201,169,110,0.1);color:var(--gold);border:1px solid rgba(201,169,110,0.25);">Non testé</span>` : ''}
              </div>
              <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                ${familles.map(f => `
                  <span style="display:inline-flex;align-items:center;gap:0.3rem;font-size:0.65rem;color:var(--text-2);">
                    <span style="width:6px;height:6px;border-radius:50%;background:${f.couleur || '#9A8A78'};display:inline-block;"></span>
                    ${f.nom}
                  </span>`).join('')}
              </div>
              ${p.concentration ? `<span style="font-size:0.68rem;color:var(--text-3);">${p.concentration}</span>` : ''}
              ${p.gamme_prix ? `<span style="font-size:0.68rem;color:var(--text-2);padding:0.15rem 0.5rem;border:1px solid var(--border-light);border-radius:100px;">${p.gamme_prix} €</span>` : ''}
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color:var(--text-3);flex-shrink:0;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>`
          }).join('')
      }
    </div>

  </div>`
}

function toggleMaisonList(id) {
  const panel   = document.getElementById(`list-parfums-${id}`)
  const chevron = document.getElementById(`list-chevron-${id}`)
  if (!panel) return
  const isOpen = panel.style.display !== 'none'
  panel.style.display     = isOpen ? 'none' : 'block'
  chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)'
}

// ══════════════════════════════════════════════════════════
// MODE GRILLE
// ══════════════════════════════════════════════════════════

function renderMaisonGrid(m) {
  return `
  <section>
    <div style="display:flex;align-items:baseline;gap:1rem;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid var(--border);">
      <button
        onclick="goMaison(${m.id})"
        style="background:none;border:none;cursor:pointer;font-family:'Cormorant Garamond',serif;font-size:1.9rem;color:var(--text);transition:color 0.2s;"
        onmouseover="this.style.color='var(--gold)'"
        onmouseout="this.style.color='var(--text)'"
      >${m.nom}</button>
      ${m.origine ? `<span style="font-size:0.68rem;color:var(--text-3);letter-spacing:0.25em;text-transform:uppercase;">${m.origine}</span>` : ''}
      <span style="margin-left:auto;font-size:0.75rem;color:var(--text-3);">
        ${m.parfums.length} parfum${m.parfums.length > 1 ? 's' : ''}
      </span>
    </div>
    ${m.parfums.length > 0
      ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.9rem;">
           ${m.parfums.map(renderParfumCard).join('')}
         </div>`
      : `<p style="color:var(--text-3);font-size:0.8rem;font-style:italic;">Aucun parfum dans cette maison</p>`
    }
  </section>`
}

function renderParfumCard(p) {
  const familles = p.familles || []
  return `
  <div class="card" onclick="goParfum(${p.id})" style="padding:0;overflow:hidden;display:flex;flex-direction:column;">

    <!-- Image format flacon -->
    <div style="width:100%;aspect-ratio:2/3;background:var(--bg-card-hover);overflow:hidden;flex-shrink:0;">
      ${p.image_base64
        ? `<img
             src="${p.image_base64}"
             alt="${p.nom}"
             style="width:100%;height:100%;object-fit:cover;object-position:center top;transition:transform 0.4s ease;"
             onmouseover="this.style.transform='scale(1.05)'"
             onmouseout="this.style.transform='scale(1)'"
           />`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
             <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color:var(--border-light);">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
             </svg>
           </div>`
      }
    </div>

    <!-- Infos -->
    <div style="padding:0.7rem;flex:1;display:flex;flex-direction:column;gap:0.4rem;">
      <h3 style="font-family:'Cormorant Garamond',serif;font-size:0.95rem;line-height:1.2;">${p.nom}</h3>
      ${p.coup_qp ? `<span style="font-size:0.6rem;padding:0.2rem 0.55rem;border-radius:100px;background:var(--gold);color:#0d0b09;font-weight:500;letter-spacing:0.05em;align-self:flex-start;">Rapport Q/P</span>` : ''}
      ${p.statut === 'non_teste' ? `<span style="font-size:0.6rem;padding:0.2rem 0.55rem;border-radius:100px;background:rgba(201,169,110,0.1);color:var(--gold);border:1px solid rgba(201,169,110,0.25);letter-spacing:0.05em;align-self:flex-start;">Non testé</span>` : ''}
      <div style="display:flex;gap:0.3rem;flex-wrap:wrap;align-items:center;margin-top:auto;">
        ${familles.slice(0,2).map(f => `
          <span style="display:inline-flex;align-items:center;gap:0.25rem;font-size:0.6rem;color:var(--text-2);">
            <span style="width:5px;height:5px;border-radius:50%;background:${f.couleur || '#9A8A78'};display:inline-block;flex-shrink:0;"></span>
            ${f.nom}
          </span>`).join('')}
        ${p.concentration ? `<span style="font-size:0.6rem;color:var(--text-3);margin-left:auto;">${p.concentration.replace('Eau de ', 'E.d.')}</span>` : ''}
      </div>
    </div>

  </div>`
}

// ── États vides ───────────────────────────────────────────

function renderEmptyState() {
  return `
  <div style="text-align:center;padding:5rem 0;">
    <p style="font-family:'Cormorant Garamond',serif;font-size:2rem;font-style:italic;color:var(--text-3);margin-bottom:0.5rem;">Aucun résultat</p>
    <p style="color:var(--text-3);font-size:0.8rem;">Essayez un autre terme de recherche</p>
  </div>`
}