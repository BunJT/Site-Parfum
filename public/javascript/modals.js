// public/javascript/modals.js
// Rôle : génère le HTML de toutes les modales (login, formulaires CRUD, confirmation).

function renderModal() {
  if (!State.modal) return ''

  const content = {
    login:      renderLoginModal,
    addMaison:  renderMaisonModal,
    editMaison: renderMaisonModal,
    addParfum:  renderParfumModal,
    editParfum: renderParfumModal,
    addFamille:  renderFamilleModal,
    editFamille: renderFamilleModal,
    confirm:    renderConfirmModal,
  }[State.modal]?.() ?? ''

  return `
  <div class="modal-overlay" onclick="closeModalOnOverlay(event)">
    ${content}
  </div>`
}

// ── Connexion admin ────────────────────────────────────────

function renderLoginModal() {
  return `
  <div class="modal-box" style="max-width:400px;">
    <h2 style="font-family:'Cormorant Garamond',serif;font-size:2rem;margin-bottom:0.4rem;">Connexion</h2>
    <p style="color:var(--text-3);font-size:0.78rem;margin-bottom:2rem;">Accès administration</p>
    <div style="display:flex;flex-direction:column;gap:1rem;">
      <div>
        <label class="field-label">Mot de passe</label>
        <input class="field" type="password" id="f-pw" placeholder="••••••••" onkeydown="if(event.key==='Enter') doLogin()"/>
      </div>
      <p id="login-error" style="color:#e07070;font-size:0.78rem;display:none;">Mot de passe incorrect.</p>
      <div style="display:flex;gap:0.75rem;margin-top:0.5rem;">
        <button class="btn btn-gold" onclick="doLogin()" style="flex:1;">Connexion</button>
        <button class="btn btn-outline" onclick="closeModal()">Annuler</button>
      </div>
      <p style="color:var(--text-3);font-size:0.68rem;text-align:center;">
        Mot de passe par défaut : <code style="color:var(--gold);">admin</code>
      </p>
    </div>
  </div>`
}

// ── Formulaire maison ─────────────────────────────────────

function renderMaisonModal() {
  const isEdit = State.modal === 'editMaison'
  const m      = isEdit ? getMaison(State.editTarget) : {}

  return `
  <div class="modal-box">
    <h2 style="font-family:'Cormorant Garamond',serif;font-size:2rem;margin-bottom:2rem;">
      ${isEdit ? 'Modifier la maison' : 'Nouvelle maison'}
    </h2>
    <div style="display:flex;flex-direction:column;gap:1.1rem;">
      <div>
        <label class="field-label">Nom *</label>
        <input class="field" type="text" id="f-nom" value="${m.nom || ''}" placeholder="Ex : Chanel"/>
      </div>
      <div>
        <label class="field-label">Origine</label>
        <input class="field" type="text" id="f-origine" value="${m.origine || ''}" placeholder="Ex : France"/>
      </div>
      <div>
        <label class="field-label">Description</label>
        <textarea class="field" id="f-desc" rows="3" placeholder="Courte présentation de la maison…">${m.description || ''}</textarea>
      </div>
      <div style="display:flex;gap:0.75rem;margin-top:0.5rem;">
        <button class="btn btn-gold" onclick="saveMaison(${isEdit ? m.id : 'null'})" style="flex:1;">
          ${isEdit ? 'Sauvegarder' : 'Créer'}
        </button>
        <button class="btn btn-outline" onclick="closeModal()">Annuler</button>
      </div>
    </div>
  </div>`
}

// ── Formulaire parfum ─────────────────────────────────────

function renderParfumModal() {
  const isEdit      = State.modal === 'editParfum'
  const p           = isEdit ? DB.parfums.find(x => x.id === State.editTarget) : {}
  const famillesActives  = (p.familles || []).map(f => f.id)
  // Si on ajoute depuis une maison, State.editTarget contient l'id maison
  const maisonPreselect = !isEdit ? State.editTarget : null

  const concentrations = [
    'Eau de Toilette',
    'Eau de Parfum',
    'Parfum',
    'Extrait de Parfum',
    'Cologne',
  ]

  return `
  <div class="modal-box">
    <h2 style="font-family:'Cormorant Garamond',serif;font-size:2rem;margin-bottom:2rem;">
      ${isEdit ? 'Modifier le parfum' : 'Nouveau parfum'}
    </h2>
    <div style="display:flex;flex-direction:column;gap:1.25rem;">

      <!-- Nom -->
      <div>
        <label class="field-label">Nom *</label>
        <input class="field" type="text" id="f-nom" value="${p.nom || ''}" placeholder="Ex : N°5"/>
      </div>

      <!-- Maison -->
      <div>
        <label class="field-label">Maison *</label>
        <select class="field" id="f-maison">
          <option value="">-- Choisir --</option>
          ${DB.maisons.map(m => `
            <option value="${m.id}" ${(p.maison_id === m.id || maisonPreselect === m.id) ? 'selected' : ''}>${m.nom}</option>
          `).join('')}
        </select>
      </div>

      <!-- Familles olfactives ordonnées -->
      <div>
        <label class="field-label">Familles olfactives <span style="color:var(--text-3);font-size:0.65rem;letter-spacing:0.05em;text-transform:none;font-weight:300;">— la première est la dominante</span></label>

        <!-- Familles non sélectionnées (à ajouter) -->
        <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.75rem;">
          ${DB.familles.filter(f => !famillesActives.includes(f.id)).map(f => `
            <button type="button" onclick="addFamilleOrdre(${f.id})"
              style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.3rem 0.7rem;border:1px solid var(--border-light);border-radius:100px;background:transparent;color:var(--text-2);cursor:pointer;font-size:0.7rem;font-family:'Jost',sans-serif;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--gold)';this.style.color='var(--gold)'"
              onmouseout="this.style.borderColor='var(--border-light)';this.style.color='var(--text-2)'">
              <span style="width:7px;height:7px;border-radius:50%;background:${f.couleur || '#9A8A78'};display:inline-block;"></span>
              + ${f.nom}
            </button>
          `).join('')}
        </div>

        <!-- Familles sélectionnées ordonnées -->
        <div id="familles-ordre-list" style="display:flex;flex-direction:column;gap:0.4rem;">
          ${famillesActives.map((fid, idx) => {
            const f = DB.familles.find(x => x.id === fid)
            if (!f) return ''
            return `
            <div id="famille-ordre-${fid}" style="display:flex;align-items:center;gap:0.6rem;padding:0.5rem 0.75rem;background:var(--gold-dim);border:1px solid rgba(201,169,110,0.3);border-radius:6px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${f.couleur || '#9A8A78'};display:inline-block;flex-shrink:0;"></span>
              <span style="flex:1;font-size:0.78rem;color:var(--gold);">${f.nom}</span>
              <span style="font-size:0.6rem;color:var(--text-3);margin-right:0.25rem;">${idx === 0 ? 'Dominante' : idx === 1 ? 'Secondaire' : ''}</span>
              <div style="display:flex;flex-direction:column;gap:2px;">
                <button type="button" onclick="moveFamilleOrdre(${fid}, -1)" style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:0.7rem;line-height:1;padding:1px 4px;" ${idx === 0 ? 'disabled style="opacity:0.3;cursor:default;"' : ''}>▲</button>
                <button type="button" onclick="moveFamilleOrdre(${fid}, 1)" style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:0.7rem;line-height:1;padding:1px 4px;" ${idx === famillesActives.length - 1 ? 'disabled style="opacity:0.3;cursor:default;"' : ''}>▼</button>
              </div>
              <button type="button" onclick="removeFamilleOrdre(${fid})" style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:0.9rem;line-height:1;padding:0 2px;">×</button>
              <input type="hidden" id="f-famille-${fid}" value="${fid}" data-ordre="${idx}"/>
            </div>`
          }).join('')}
        </div>
      </div>

      <!-- Concentration -->
      <div>
        <label class="field-label">Concentration</label>
        <select class="field" id="f-conc">
          <option value="">--</option>
          ${concentrations.map(c => `
            <option ${p.concentration === c ? 'selected' : ''}>${c}</option>
          `).join('')}
        </select>
      </div>

      <!-- Image -->
      <div style="border-top:1px solid var(--border);padding-top:1rem;">
        <p style="font-size:0.65rem;letter-spacing:0.28em;text-transform:uppercase;color:var(--text-3);margin-bottom:0.75rem;">Image (optionnel)</p>
        <div id="img-preview-wrap" style="margin-bottom:0.75rem;${p.image_base64 ? '' : 'display:none;'}">
          <img id="img-preview" src="${p.image_base64 || ''}" alt="Aperçu" style="width:100%;max-height:200px;object-fit:cover;border-radius:6px;border:1px solid var(--border);"/>
          <button type="button" onclick="clearImagePreview()" style="margin-top:0.5rem;background:none;border:none;cursor:pointer;font-size:0.72rem;color:#e07070;">× Supprimer l'image</button>
        </div>
        <label id="img-drop-zone" for="f-image"
          style="${p.image_base64 ? 'display:none;' : ''}border:1px dashed var(--border-light);border-radius:6px;padding:1.5rem;text-align:center;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:0.5rem;"
          ondragover="event.preventDefault();this.style.borderColor='var(--gold)'"
          ondragleave="this.style.borderColor='var(--border-light)'"
          ondrop="handleImageDrop(event)">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color:var(--text-3);"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <span style="font-size:0.78rem;color:var(--text-3);">Glisser une image ici ou <span style="color:var(--gold);">parcourir</span></span>
          <span style="font-size:0.68rem;color:var(--text-3);">JPG, PNG, WEBP — max 2 Mo</span>
          <input type="file" id="f-image" accept="image/*" style="display:none;" onchange="handleImageSelect(this)"/>
        </label>
      </div>

      <!-- Pyramide olfactive -->
      <div style="border-top:1px solid var(--border);padding-top:1rem;">
        <p style="font-size:0.65rem;letter-spacing:0.28em;text-transform:uppercase;color:var(--text-3);margin-bottom:0.75rem;">Pyramide olfactive (optionnel)</p>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          <div>
            <label class="field-label">Notes de tête</label>
            <input class="field" type="text" id="f-tete" value="${p.note_tete || ''}" placeholder="Ex : Bergamote, Citron, Menthe"/>
          </div>
          <div>
            <label class="field-label">Notes de cœur</label>
            <input class="field" type="text" id="f-coeur" value="${p.note_coeur || ''}" placeholder="Ex : Rose, Jasmin, Iris"/>
          </div>
          <div>
            <label class="field-label">Notes de fond</label>
            <input class="field" type="text" id="f-fond" value="${p.note_fond || ''}" placeholder="Ex : Santal, Musc, Vétiver"/>
          </div>
        </div>
      </div>

      <!-- Avis personnel -->
      <div style="border-top:1px solid var(--border);padding-top:1rem;">
        <label class="field-label">Mon avis personnel <span style="color:var(--text-3);font-size:0.65rem;letter-spacing:0.05em;text-transform:none;font-weight:300;">— optionnel, visible par les visiteurs</span></label>
        <textarea class="field" id="f-avis" rows="3" placeholder="Ce que tu penses de ce parfum, à qui tu le conseillerais…">${p.avis_perso || ''}</textarea>
      </div>

      <!-- Gamme de prix -->
      <div>
        <label class="field-label">Gamme de prix</label>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          ${['0-100', '100-200', '200-300', '300+'].map(g => `
            <button
              type="button"
              id="prix-${g}"
              onclick="selectGammePrix(this, \'${g}\'  )"
              style="padding:0.4rem 1rem;border-radius:100px;font-size:0.75rem;letter-spacing:0.08em;cursor:pointer;border:1px solid ${p.gamme_prix === g ? 'var(--gold)' : 'var(--border-light)'};background:${p.gamme_prix === g ? 'var(--gold-dim)' : 'transparent'};color:${p.gamme_prix === g ? 'var(--gold)' : 'var(--text-2)'};font-family:'Jost',sans-serif;transition:all 0.15s;">${g} €</button>
          `).join('')}
          <button
            type="button"
            id="prix-none"
            onclick="selectGammePrix(this, null)"
            style="padding:0.4rem 1rem;border-radius:100px;font-size:0.75rem;cursor:pointer;border:1px solid ${!p.gamme_prix ? 'var(--border-light)' : 'var(--border)'};background:transparent;color:var(--text-3);font-family:'Jost',sans-serif;transition:all 0.15s;">Non renseigné</button>
        </div>
        <input type="hidden" id="f-prix" value="${p.gamme_prix || ''}" />
      </div>

      <!-- Statut non testé -->
      <div style="padding:1rem;background:var(--bg-card-hover);border-radius:8px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <p style="font-size:0.8rem;color:var(--text);">Parfum non testé personnellement</p>
          <p style="font-size:0.7rem;color:var(--text-3);margin-top:0.2rem;">Les visiteurs verront une mention "Non testé"</p>
        </div>
        <label style="position:relative;display:inline-block;width:40px;height:22px;cursor:pointer;">
          <input
            type="checkbox"
            id="f-statut"
            ${p.statut === 'non_teste' ? 'checked' : ''}
            style="opacity:0;width:0;height:0;"
            onchange="updateToggleStyle(this)"
          />
          <span id="toggle-track" style="position:absolute;inset:0;border-radius:100px;background:${p.statut === 'non_teste' ? 'var(--gold)' : 'var(--border-light)'};transition:background 0.2s;">
            <span style="position:absolute;top:3px;left:${p.statut === 'non_teste' ? '21px' : '3px'};width:16px;height:16px;border-radius:50%;background:white;transition:left 0.2s;" id="toggle-thumb"></span>
          </span>
        </label>
      </div>

      <!-- Pastille coup qualité-prix -->
      <div style="padding:1rem;background:var(--bg-card-hover);border-radius:8px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <p style="font-size:0.8rem;color:var(--text);">Meilleur rapport qualité-prix</p>
          <p style="font-size:0.7rem;color:var(--text-3);margin-top:0.2rem;">Affiche un badge doré "Rapport Q/P" sur le parfum</p>
        </div>
        <label style="position:relative;display:inline-block;width:40px;height:22px;cursor:pointer;">
          <input
            type="checkbox"
            id="f-coupqp"
            ${p.coup_qp ? 'checked' : ''}
            style="opacity:0;width:0;height:0;"
            onchange="updateQpToggleStyle(this)"
          />
          <span id="qp-track" style="position:absolute;inset:0;border-radius:100px;background:${p.coup_qp ? 'var(--gold)' : 'var(--border-light)'};transition:background 0.2s;">
            <span style="position:absolute;top:3px;left:${p.coup_qp ? '21px' : '3px'};width:16px;height:16px;border-radius:50%;background:white;transition:left 0.2s;" id="qp-thumb"></span>
          </span>
        </label>
      </div>

      <div style="display:flex;gap:0.75rem;margin-top:0.5rem;">
        <button class="btn btn-gold" onclick="saveParfum(${isEdit ? p.id : 'null'})" style="flex:1;">
          ${isEdit ? 'Sauvegarder' : 'Créer'}
        </button>
        <button class="btn btn-outline" onclick="closeModal()">Annuler</button>
      </div>
    </div>
  </div>`
}

// ── Formulaire famille olfactive ──────────────────────────

function renderFamilleModal() {
  const isEdit = State.modal === 'editFamille'
  const f      = isEdit ? getFamille(State.editTarget) : {}
  const couleurActuelle = f.couleur || '#8B7355'

  const couleursSuggérees = [
    '#8B7355', '#C4874B', '#C47B8A', '#5B9AA8', '#6B8C5A',
    '#7A6B4F', '#7B8C6B', '#4A8BA8', '#B8855A', '#8C6B4A',
    '#9A8A7A', '#C4A84B', '#A0728A', '#6B7A8C', '#8C8C5A'
  ]

  return `
  <div class="modal-box" style="max-width:420px;">
    <h2 style="font-family:'Cormorant Garamond',serif;font-size:2rem;margin-bottom:2rem;">
      ${isEdit ? 'Modifier la famille' : 'Nouvelle famille'}
    </h2>
    <div style="display:flex;flex-direction:column;gap:1.25rem;">

      <div>
        <label class="field-label">Nom *</label>
        <input class="field" type="text" id="f-nom" value="${f.nom || ''}" placeholder="Ex : Boisé" onkeydown="if(event.key==='Enter') saveFamille(${isEdit ? f.id : 'null'})"/>
      </div>

      <div>
        <label class="field-label">Couleur</label>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem;">
          ${couleursSuggérees.map(c => `
            <button
              type="button"
              onclick="selectCouleurFamille('${c}')"
              style="width:24px;height:24px;border-radius:50%;background:${c};border:2px solid ${c === couleurActuelle ? 'white' : 'transparent'};cursor:pointer;transition:transform 0.15s;"
              onmouseover="this.style.transform='scale(1.2)'"
              onmouseout="this.style.transform='scale(1)'"
              title="${c}"
            ></button>
          `).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <input
            type="color"
            id="f-couleur"
            value="${couleurActuelle}"
            oninput="updateCouleurPreview(this.value)"
            style="width:40px;height:40px;border:1px solid var(--border-light);border-radius:6px;cursor:pointer;background:none;padding:2px;"
          />
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <span style="width:12px;height:12px;border-radius:50%;background:${couleurActuelle};display:inline-block;" id="couleur-dot"></span>
            <span style="font-size:0.78rem;color:var(--text-2);" id="couleur-hex">${couleurActuelle}</span>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:0.75rem;margin-top:0.5rem;">
        <button class="btn btn-gold" onclick="saveFamille(${isEdit ? f.id : 'null'})" style="flex:1;">
          ${isEdit ? 'Sauvegarder' : 'Créer'}
        </button>
        <button class="btn btn-outline" onclick="closeModal()">Annuler</button>
      </div>
    </div>
  </div>`
}

// ── Confirmation ──────────────────────────────────────────

function renderConfirmModal() {
  return `
  <div class="modal-box" style="max-width:420px;">
    <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.75rem;margin-bottom:1rem;">Confirmation</h2>
    <p style="color:var(--text-2);font-size:0.875rem;line-height:1.7;margin-bottom:2rem;">${State.confirmMsg}</p>
    <div style="display:flex;gap:0.75rem;">
      <button class="btn btn-danger" onclick="executeConfirm()" style="flex:1;">Supprimer</button>
      <button class="btn btn-outline" onclick="closeModal()">Annuler</button>
    </div>
  </div>`
}