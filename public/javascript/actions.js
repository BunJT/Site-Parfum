// public/javascript/actions.js
// Rôle : fonctions appelées par les événements HTML.
// Toutes les mutations (create/update/delete) passent par l'API REST.
// Après chaque mutation, on recharge les données et on re-rend.

// ── Navigation ────────────────────────────────────────────

function nav(view) {
  // Si on revient à l'accueil depuis une fiche parfum, restaure l'état précédent
  if (view === 'home' && State.previousView === 'home') {
    State.view          = 'home'
    State.search        = State.previousSearch  || ''
    State.familleFilter = State.previousFamille || []
    const scrollTo      = State.previousScroll  || 0

    // Copie les maisons à rouvrir AVANT de réinitialiser l'historique
    const maisonsARouvrir = [...(State.previousOpenedMaisons || [])]

    // Réinitialise l'historique
    State.previousView          = null
    State.previousScroll        = 0
    State.previousSearch        = ''
    State.previousFamille       = []
    State.previousOpenedMaisons = []

    render()
    // Restaure les maisons ouvertes en mode liste + le scroll
    requestAnimationFrame(() => {
      for (const id of maisonsARouvrir) {
        const panel   = document.getElementById(`list-parfums-${id}`)
        const chevron = document.getElementById(`list-chevron-${id}`)
        if (panel)   panel.style.display     = 'block'
        if (chevron) chevron.style.transform = 'rotate(90deg)'
      }
      window.scrollTo(0, scrollTo)
    })
    return
  }

  State.view          = view
  State.search        = ''
  State.familleFilter = []
  State.prixFilter    = null
  State.previousView  = null
  render()
  window.scrollTo(0, 0)
}

function goMaison(id) {
  State.selectedMaisonId = id
  State.view = 'maison'
  render()
  window.scrollTo(0, 0)
}

async function goParfum(id) {
  // ⚠ Lecture du DOM en PREMIER, avant tout await
  // car le fetch async pourrait modifier la page avant qu'on lise les panels

  State.previousScroll  = window.scrollY
  State.previousView    = State.view
  State.previousSearch  = State.search
  State.previousFamille = [...State.familleFilter]

  // Sauvegarde les maisons ouvertes en mode liste (lecture DOM synchrone)
  State.previousOpenedMaisons = DB.maisons
    .filter(m => {
      const panel = document.getElementById(`list-parfums-${m.id}`)
      return panel && panel.style.display !== 'none'
    })
    .map(m => m.id)

  // Seulement après avoir tout sauvegardé, on fait le fetch
  const parfum = await fetch(`/api/parfums/${id}`).then(r => r.json())
  State.selectedParfum   = parfum
  State.selectedParfumId = id
  State.view = 'parfum'
  render()
  window.scrollTo(0, 0)
}

function setAdminView(view) {
  State.adminView = view
  render()
}

// ── Filtres accueil ───────────────────────────────────────

function onSearch(val) {
  State.search = val
  render()
}

function setFamilleFilter(id) {
  if (!id) {
    State.familleFilter = []
  } else {
    const idx = State.familleFilter.indexOf(id)
    if (idx === -1) {
      State.familleFilter = [...State.familleFilter, id]
    } else {
      State.familleFilter = State.familleFilter.filter(f => f !== id)
    }
  }
  render()
}

function setPrixFilter(gamme) {
  State.prixFilter = State.prixFilter === gamme ? null : gamme
  render()
}

function clearAllFilters() {
  State.search        = ''
  State.familleFilter = []
  State.prixFilter    = null
  const input = document.getElementById('search-input')
  if (input) input.value = ''
  render()
}

// ── Modales ───────────────────────────────────────────────

function openModal(type, id = null) {
  State.modal      = type
  State.editTarget = id
  _pendingImageBase64 = null
  render()
  setTimeout(() => {
    document.querySelector('.modal-box input, .modal-box select, .modal-box textarea')?.focus()
  }, 50)
}

function closeModal() {
  State.modal         = null
  State.editTarget    = null
  State.confirmAction = null
  State.confirmMsg    = ''
  _pendingImageBase64 = null
  render()
}

function closeModalOnOverlay(event) {
  if (event.target.classList.contains('modal-overlay')) closeModal()
}

// ── Authentification ──────────────────────────────────────

async function doLogin() {
  const pw = document.getElementById('f-pw')?.value

  // Vérifie le mot de passe en tentant une requête protégée
  const res = await fetch('/api/maisons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-password': pw },
    body: JSON.stringify({ __check: true }) // corps invalide → 400 mais pas 401
  })

  if (res.status !== 401) {
    // Mot de passe accepté
    setAdminPassword(pw)
    State.adminLogged = true
    State.modal       = null
    State.view        = 'admin'
    render()
  } else {
    const err = document.getElementById('login-error')
    if (err) err.style.display = 'block'
  }
}

function logout() {
  State.adminLogged = false
  setAdminPassword(null)
  nav('home')
}

// ── Gestion image ─────────────────────────────────────────

let _pendingImageBase64 = null

function handleImageSelect(input) {
  const file = input.files[0]
  if (file) _readImageFile(file)
}

function handleImageDrop(event) {
  event.preventDefault()
  const file = event.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) _readImageFile(file)
}

function _readImageFile(file) {
  if (file.size > 2 * 1024 * 1024) {
    alert('Image trop lourde. Maximum 2 Mo.')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    _pendingImageBase64 = e.target.result
    const preview     = document.getElementById('img-preview')
    const previewWrap = document.getElementById('img-preview-wrap')
    const dropZone    = document.getElementById('img-drop-zone')
    if (preview)     preview.src               = _pendingImageBase64
    if (previewWrap) previewWrap.style.display = ''
    if (dropZone)    dropZone.style.display    = 'none'
  }
  reader.readAsDataURL(file)
}

function clearImagePreview() {
  _pendingImageBase64 = null
  const previewWrap = document.getElementById('img-preview-wrap')
  const dropZone    = document.getElementById('img-drop-zone')
  if (previewWrap) previewWrap.style.display = 'none'
  if (dropZone)    dropZone.style.display    = 'flex'
}

// ── CRUD Maisons ──────────────────────────────────────────

async function saveMaison(id) {
  const nom = fieldValue('f-nom')
  if (!nom) return alert('Le nom est requis.')

  const body = {
    nom,
    origine:     fieldValue('f-origine') || null,
    description: fieldValue('f-desc')    || null,
  }

  const url    = id ? `/api/maisons/${id}` : '/api/maisons'
  const method = id ? 'PUT' : 'POST'

  const res = await fetch(url, { method, headers: adminHeaders(), body: JSON.stringify(body) })
  if (!res.ok) return alert((await res.json()).error)

  await reloadData()
  closeModal()
}

// ── CRUD Parfums ──────────────────────────────────────────

// Sélection gamme de prix
function selectGammePrix(btn, valeur) {
  // Réinitialise tous les boutons prix
  ['0-100', '100-200', '200-300', '300+', 'none'].forEach(g => {
    const b = document.getElementById(`prix-${g}`)
    if (!b) return
    b.style.borderColor = 'var(--border-light)'
    b.style.background  = 'transparent'
    b.style.color       = g === 'none' ? 'var(--text-3)' : 'var(--text-2)'
  })
  // Active le bouton cliqué
  if (btn) {
    btn.style.borderColor = valeur ? 'var(--gold)' : 'var(--border-light)'
    btn.style.background  = valeur ? 'var(--gold-dim)' : 'transparent'
    btn.style.color       = valeur ? 'var(--gold)' : 'var(--text-3)'
  }
  // Met à jour le champ caché
  const input = document.getElementById('f-prix')
  if (input) input.value = valeur || ''
}

// Anime le toggle statut (non testé)
function updateToggleStyle(checkbox) {
  const track = document.getElementById('toggle-track')
  const thumb = document.getElementById('toggle-thumb')
  if (!track || !thumb) return
  if (checkbox.checked) {
    track.style.background = 'var(--gold)'
    thumb.style.left = '21px'
  } else {
    track.style.background = 'var(--border-light)'
    thumb.style.left = '3px'
  }
}

// Toggle visuel d'une famille dans le formulaire parfum
function toggleFamilleCheckbox(label, familleId) {
  const checkbox = document.getElementById(`f-famille-${familleId}`)
  if (!checkbox) return
  checkbox.checked = !checkbox.checked
  if (checkbox.checked) {
    label.style.borderColor = 'var(--gold)'
    label.style.background  = 'var(--gold-dim)'
  } else {
    label.style.borderColor = 'var(--border-light)'
    label.style.background  = 'transparent'
  }
}

async function saveParfum(id) {
  const nom      = fieldValue('f-nom')
  const maisonId = parseInt(fieldValue('f-maison'))
  if (!nom || !maisonId) return alert('Le nom et la maison sont requis.')

  // Récupère toutes les familles cochées
  const famille_ids = DB.familles
    .filter(f => document.getElementById(`f-famille-${f.id}`)?.checked)
    .map(f => f.id)

  // Résolution de l'image
  let image_base64
  const previewWrap = document.getElementById('img-preview-wrap')
  if (_pendingImageBase64) {
    image_base64 = _pendingImageBase64
  } else if (previewWrap && previewWrap.style.display !== 'none') {
    image_base64 = State.selectedParfum?.image_base64 || null
  } else {
    image_base64 = null
  }

  const statut     = document.getElementById('f-statut')?.checked ? 'non_teste' : 'teste'
  const gamme_prix = document.getElementById('f-prix')?.value || null

  const body = {
    nom,
    maison_id:     maisonId,
    famille_ids,
    concentration: fieldValue('f-conc')  || null,
    description:   fieldValue('f-desc')  || null,
    note_tete:     fieldValue('f-tete')  || null,
    note_coeur:    fieldValue('f-coeur') || null,
    note_fond:     fieldValue('f-fond')  || null,
    image_base64,
    statut,
    gamme_prix: gamme_prix || null,
  }

  const url    = id ? `/api/parfums/${id}` : '/api/parfums'
  const method = id ? 'PUT' : 'POST'

  const res = await fetch(url, { method, headers: adminHeaders(), body: JSON.stringify(body) })
  if (!res.ok) return alert((await res.json()).error)

  await reloadData()
  closeModal()
}

// ── CRUD Familles ─────────────────────────────────────────

// Met à jour l'aperçu couleur dans la modale famille
function updateCouleurPreview(val) {
  const dot = document.getElementById('couleur-dot')
  const hex = document.getElementById('couleur-hex')
  if (dot) dot.style.background = val
  if (hex) hex.textContent = val
}

// Sélectionne une couleur depuis les suggestions rapides
function selectCouleurFamille(couleur) {
  const picker = document.getElementById('f-couleur')
  if (picker) picker.value = couleur
  updateCouleurPreview(couleur)
}

async function saveFamille(id = null) {
  const nom     = fieldValue('f-nom')
  const couleur = document.getElementById('f-couleur')?.value || '#8B7355'
  if (!nom) return alert('Le nom est requis.')

  const url    = id ? `/api/familles/${id}` : '/api/familles'
  const method = id ? 'PUT' : 'POST'

  const res = await fetch(url, {
    method,
    headers: adminHeaders(),
    body: JSON.stringify({ nom, couleur }),
  })
  if (!res.ok) return alert((await res.json()).error)

  await reloadFamilles()
  closeModal()
}

// ── Statut testé/non testé ───────────────────────────────

async function marquerCommeteste(id) {
  const parfum = DB.parfums.find(p => p.id === id)
  if (!parfum) return

  const res = await fetch(`/api/parfums/${id}/statut`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify({ statut: 'teste' }),
  })
  if (!res.ok) return alert('Erreur lors de la mise à jour.')

  await reloadData()
  render()
}

// ── Suppression avec confirmation ─────────────────────────

function confirmDelete(type, id) {
  let msg = ''

  if (type === 'maison') {
    const m     = getMaison(id)
    const count = getParfumsOf(id).length
    msg = `Supprimer la maison <strong style="color:var(--text)">${m.nom}</strong> ?`
    if (count > 0)
      msg += `<br/><span style="color:#e07070;font-size:0.85em;">⚠ ${count} parfum(s) associé(s) seront également supprimés.</span>`

  } else if (type === 'parfum') {
    const p = DB.parfums.find(x => x.id === id)
    msg = `Supprimer le parfum <strong style="color:var(--text)">${p.nom}</strong> ?`

  } else if (type === 'famille') {
    const f = getFamille(id)
    msg = `Supprimer la famille <strong style="color:var(--text)">${f.nom}</strong> ?
           <br/><span style="color:#e07070;font-size:0.85em;">Les parfums liés perdront leur famille olfactive.</span>`
  }

  State.modal         = 'confirm'
  State.confirmMsg    = msg
  State.confirmAction = { type, id }
  render()
}

async function executeConfirm() {
  const { type, id } = State.confirmAction
  const urls = {
    maison:  `/api/maisons/${id}`,
    parfum:  `/api/parfums/${id}`,
    famille: `/api/familles/${id}`,
  }

  const res = await fetch(urls[type], { method: 'DELETE', headers: adminHeaders() })
  if (!res.ok) return alert('Erreur lors de la suppression.')

  if (type === 'famille') {
    await reloadFamilles()
  }
  await reloadData()
  closeModal()
}