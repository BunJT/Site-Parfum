// public/javascript/header.js
// Rôle : génère le HTML du header présent sur toutes les pages.

function renderHeader() {
  const isHome  = State.view === 'home'
  const isAdmin = State.view === 'admin'

  return `
  <header style="border-bottom:1px solid var(--border);position:sticky;top:0;background:rgba(13,11,9,0.96);backdrop-filter:blur(12px);z-index:50;">
    <div style="max-width:1200px;margin:0 auto;padding:1.25rem 2rem;display:flex;align-items:center;gap:2rem;">

      <!-- Logo -->
      <button onclick="nav('home')" style="background:none;border:none;cursor:pointer;text-align:left;flex-shrink:0;">
        <div style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:var(--gold);font-style:italic;letter-spacing:0.1em;">
          Parfumerie
        </div>
        <div style="font-size:0.6rem;color:var(--text-3);letter-spacing:0.38em;text-transform:uppercase;margin-top:1px;">
          Encyclopédie personnelle
        </div>
      </button>

      <!-- Barre de recherche avec suggestions (accueil uniquement) -->
      ${isHome ? `
      <div style="position:relative;flex:1;max-width:420px;margin-left:auto;" id="search-wrap">
        <svg style="position:absolute;left:0.85rem;top:50%;transform:translateY(-50%);color:var(--text-3);width:15px;height:15px;z-index:1;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          class="field"
          type="search"
          id="search-input"
          placeholder="Rechercher un parfum, une maison…"
          value="${State.search}"
          oninput="onSearch(this.value);showSuggestions(this.value)"
          onfocus="showSuggestions(this.value)"
          onblur="hideSuggestionsDelayed()"
          autocomplete="off"
          style="padding-left:2.5rem;padding-right:${State.search ? '2.25rem' : '1rem'};"
        />
        <!-- Bouton clear -->
        ${State.search ? `
        <button onclick="clearSearch()" style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-3);font-size:1rem;line-height:1;padding:0;" title="Effacer">×</button>
        ` : ''}
        <!-- Dropdown suggestions -->
        <div id="search-suggestions" style="display:none;position:absolute;top:calc(100% + 6px);left:0;right:0;background:#181410;border:1px solid var(--border-light);border-radius:8px;overflow:hidden;z-index:200;box-shadow:0 8px 24px rgba(0,0,0,0.5);"></div>
      </div>` : ''}

      <!-- Zone droite -->
      <div style="margin-left:${isHome ? '0' : 'auto'};display:flex;align-items:center;gap:0.75rem;">
        ${State.adminLogged ? `<span class="admin-pill">Admin</span>` : ''}
        <button
          class="btn btn-ghost"
          onclick="${State.adminLogged ? (isAdmin ? "nav('home')" : "nav('admin')") : "openModal('login')"}"
        >
          ${State.adminLogged ? (isAdmin ? '← Site' : 'Admin') : '⚙'}
        </button>
        ${State.adminLogged && isAdmin ? `
        <button class="btn btn-ghost" style="color:#e07070;" onclick="logout()">Déconnexion</button>` : ''}
      </div>

    </div>
  </header>`
}

// ── Suggestions de recherche ──────────────────────────────

function showSuggestions(val) {
  const box = document.getElementById('search-suggestions')
  if (!box) return
  const q = val.trim().toLowerCase()

  if (!q) { box.style.display = 'none'; return }

  // Cherche dans les parfums et les maisons
  const parfumsMatch = DB.parfums
    .filter(p => p.nom.toLowerCase().includes(q))
    .slice(0, 6)

  const maisonsMatch = DB.maisons
    .filter(m => m.nom.toLowerCase().includes(q) && !parfumsMatch.some(p => p.maison_nom === m.nom))
    .slice(0, 3)

  if (parfumsMatch.length === 0 && maisonsMatch.length === 0) {
    box.innerHTML = `<div style="padding:0.9rem 1rem;font-size:0.8rem;color:var(--text-3);font-style:italic;">Aucun résultat</div>`
    box.style.display = 'block'
    return
  }

  let html = ''

  if (maisonsMatch.length > 0) {
    html += `<div style="padding:0.5rem 1rem 0.25rem;font-size:0.62rem;color:var(--text-3);letter-spacing:0.2em;text-transform:uppercase;">Maisons</div>`
    html += maisonsMatch.map(m => `
      <div
        onmousedown="selectSuggestion('${escapeHtml(m.nom)}')"
        style="display:flex;align-items:center;gap:0.75rem;padding:0.65rem 1rem;cursor:pointer;transition:background 0.1s;"
        onmouseover="this.style.background='var(--bg-card-hover)'"
        onmouseout="this.style.background='transparent'"
      >
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color:var(--text-3);flex-shrink:0;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
        <span style="font-size:0.875rem;">${highlightMatch(m.nom, q)}</span>
      </div>`).join('')
  }

  if (parfumsMatch.length > 0) {
    html += `<div style="padding:0.5rem 1rem 0.25rem;font-size:0.62rem;color:var(--text-3);letter-spacing:0.2em;text-transform:uppercase;${maisonsMatch.length ? 'border-top:1px solid var(--border);margin-top:0.25rem;' : ''}">Parfums</div>`
    html += parfumsMatch.map(p => {
      const familles = p.familles || []
      return `
      <div
        onmousedown="goParfum(${p.id});hideSuggestions()"
        style="display:flex;align-items:center;gap:0.75rem;padding:0.65rem 1rem;cursor:pointer;transition:background 0.1s;"
        onmouseover="this.style.background='var(--bg-card-hover)'"
        onmouseout="this.style.background='transparent'"
      >
        ${p.image_base64
          ? `<img src="${p.image_base64}" style="width:28px;height:28px;border-radius:4px;object-fit:cover;flex-shrink:0;"/>`
          : `<div style="width:28px;height:28px;border-radius:4px;background:var(--bg-card-hover);flex-shrink:0;display:flex;align-items:center;justify-content:center;">
               <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color:var(--border-light);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
             </div>`
        }
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.875rem;">${highlightMatch(p.nom, q)}</div>
          <div style="font-size:0.68rem;color:var(--text-3);">${p.maison_nom || ''}</div>
        </div>
        ${familles[0] ? `<span style="font-size:0.62rem;color:var(--text-2);flex-shrink:0;">${familles[0].nom}</span>` : ''}
      </div>`
    }).join('')
  }

  box.innerHTML = html
  box.style.display = 'block'
}

function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query)
  if (idx === -1) return text
  return text.slice(0, idx)
    + `<strong style="color:var(--gold);font-weight:500;">${text.slice(idx, idx + query.length)}</strong>`
    + text.slice(idx + query.length)
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'")
}

function selectSuggestion(nom) {
  const input = document.getElementById('search-input')
  if (input) input.value = nom
  onSearch(nom)
  hideSuggestions()
}

function hideSuggestions() {
  const box = document.getElementById('search-suggestions')
  if (box) box.style.display = 'none'
}

function hideSuggestionsDelayed() {
  // Délai pour laisser le temps au onmousedown de se déclencher
  setTimeout(hideSuggestions, 150)
}

function clearSearch() {
  const input = document.getElementById('search-input')
  if (input) input.value = ''
  onSearch('')
  hideSuggestions()
  input?.focus()
}