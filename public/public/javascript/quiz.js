// public/javascript/quiz.js
// Rôle : quiz de recommandation basé sur les goûts olfactifs.
// L'ordre de sélection des familles = ordre de préférence (1ère = préférée).

const QuizState = {
  step: 1,            // 1 = aimées, 2 = évitées, 3 = budget, 4 = résultats
  aimees:  [],        // ids des familles préférées, DANS L'ORDRE de préférence (max 4)
  evitees: [],        // ids des familles à éviter
  budget:  [],        // tranches de prix (1 à 4)
}

const GAMMES = ['0-100', '100-200', '200-300', '300+']
const MAX_PAR_LISTE = 5

function openQuiz() {
  QuizState.step    = 1
  QuizState.aimees  = []
  QuizState.evitees = []
  QuizState.budget  = []
  State.view = 'quiz'
  render()
  window.scrollTo(0, 0)
}

function renderQuiz() {
  return `
  <div style="max-width:760px;margin:0 auto;padding:3rem 2rem;">

    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:3rem;justify-content:center;">
      ${[1, 2, 3].map(n => `
        <div style="width:${QuizState.step === n ? '28px' : '8px'};height:8px;border-radius:100px;background:${QuizState.step >= n ? 'var(--gold)' : 'var(--border-light)'};transition:all 0.3s;"></div>
      `).join('')}
    </div>

    ${QuizState.step === 1 ? renderQuizStep1() : ''}
    ${QuizState.step === 2 ? renderQuizStep2() : ''}
    ${QuizState.step === 3 ? renderQuizStep3() : ''}
    ${QuizState.step === 4 ? renderQuizResults() : ''}

  </div>`
}

// ── Étape 1 : familles préférées (ordonnées) ─────────────

function renderQuizStep1() {
  const restantes = DB.familles.filter(f => !QuizState.aimees.includes(f.id))

  return `
  <div style="text-align:center;">
    <p style="font-size:0.65rem;letter-spacing:0.4em;text-transform:uppercase;color:var(--gold);margin-bottom:1rem;">Étape 1 sur 3</p>
    <h1 style="font-family:'Cormorant Garamond',serif;font-size:clamp(2rem,5vw,3rem);margin-bottom:0.75rem;">Quelles ambiances vous plaisent ?</h1>
    <p style="color:var(--text-2);font-size:0.875rem;margin-bottom:0.6rem;">Choisissez de 1 à 4 familles olfactives ${QuizState.aimees.length > 0 ? `· <span style="color:var(--gold);">${QuizState.aimees.length}/4</span>` : ''}</p>
    <p style="color:var(--gold);font-size:0.95rem;margin-bottom:2.5rem;">L'ordre compte — choisissez d'abord votre <strong>préférée</strong></p>
  </div>

  ${QuizState.aimees.length > 0 ? `
  <div style="display:flex;flex-direction:column;gap:0.5rem;max-width:380px;margin:0 auto 1.75rem;">
    ${QuizState.aimees.map((id, idx) => {
      const f = DB.familles.find(x => x.id === id)
      if (!f) return ''
      return `
      <div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 1rem;border-radius:8px;border:1px solid var(--gold);background:var(--gold-dim);">
        <span style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:var(--gold);color:#0d0b09;font-size:0.72rem;font-weight:600;flex-shrink:0;">${idx + 1}</span>
        <span style="width:8px;height:8px;border-radius:50%;background:${f.couleur || '#9A8A78'};flex-shrink:0;"></span>
        <span style="flex:1;font-size:0.85rem;color:var(--gold);">${f.nom}</span>
        <span style="font-size:0.6rem;color:var(--text-3);">${idx === 0 ? 'Préférée' : ''}</span>
        <button onclick="quizToggleAimee(${id})" style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:1rem;line-height:1;padding:0 2px;">×</button>
      </div>`
    }).join('')}
  </div>` : ''}

  ${QuizState.aimees.length < 4 ? `
  <div style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;margin-bottom:3rem;">
    ${restantes.map(f => `
      <button onclick="quizToggleAimee(${f.id})"
        style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;border-radius:100px;border:1px solid var(--border-light);background:transparent;color:var(--text-2);cursor:pointer;font-family:'Jost',sans-serif;font-size:0.8rem;transition:all 0.15s;"
        onmouseover="this.style.borderColor='var(--gold)';this.style.color='var(--gold)'"
        onmouseout="this.style.borderColor='var(--border-light)';this.style.color='var(--text-2)'">
        <span style="width:8px;height:8px;border-radius:50%;background:${f.couleur || '#9A8A78'};"></span>
        ${f.nom}
      </button>
    `).join('')}
  </div>` : `<p style="text-align:center;color:var(--text-3);font-size:0.8rem;margin-bottom:3rem;">Maximum atteint — retirez-en une pour en changer</p>`}

  <div style="display:flex;justify-content:center;gap:1rem;">
    <button class="btn btn-ghost" onclick="nav('home')">Annuler</button>
    <button class="btn btn-gold" onclick="quizNext()" ${QuizState.aimees.length === 0 ? 'disabled style="opacity:0.4;cursor:default;"' : ''}>Continuer →</button>
  </div>`
}

// ── Étape 2 : familles à éviter ──────────────────────────

function renderQuizStep2() {
  const dispo = DB.familles.filter(f => !QuizState.aimees.includes(f.id) && !QuizState.evitees.includes(f.id))

  return `
  <div style="text-align:center;">
    <p style="font-size:0.65rem;letter-spacing:0.4em;text-transform:uppercase;color:var(--gold);margin-bottom:1rem;">Étape 2 sur 3</p>
    <h1 style="font-family:'Cormorant Garamond',serif;font-size:clamp(2rem,5vw,3rem);margin-bottom:0.75rem;">Des ambiances à éviter ?</h1>
    <p style="color:var(--text-2);font-size:0.875rem;margin-bottom:0.6rem;">Optionnel</p>
    <p style="color:#e0809a;font-size:0.95rem;margin-bottom:2.5rem;">Ces familles seront <strong>pénalisées</strong>, pas exclues</p>
  </div>

  ${QuizState.evitees.length > 0 ? `
  <div style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;margin-bottom:1.5rem;">
    ${QuizState.evitees.map(id => {
      const f = DB.familles.find(x => x.id === id)
      if (!f) return ''
      return `
      <button onclick="quizToggleEvitee(${id})"
        style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;border-radius:100px;border:1px solid #c46;background:rgba(200,70,90,0.1);color:#e0809a;cursor:pointer;font-family:'Jost',sans-serif;font-size:0.8rem;">
        <span style="width:8px;height:8px;border-radius:50%;background:${f.couleur || '#9A8A78'};"></span>
        ${f.nom} <span style="font-size:0.9rem;">×</span>
      </button>`
    }).join('')}
  </div>` : ''}

  <div style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;margin-bottom:3rem;">
    ${dispo.map(f => `
      <button onclick="quizToggleEvitee(${f.id})"
        style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;border-radius:100px;border:1px solid var(--border-light);background:transparent;color:var(--text-2);cursor:pointer;font-family:'Jost',sans-serif;font-size:0.8rem;transition:all 0.15s;"
        onmouseover="this.style.borderColor='#c46';this.style.color='#e0809a'"
        onmouseout="this.style.borderColor='var(--border-light)';this.style.color='var(--text-2)'">
        <span style="width:8px;height:8px;border-radius:50%;background:${f.couleur || '#9A8A78'};"></span>
        ${f.nom}
      </button>
    `).join('')}
  </div>

  <div style="display:flex;justify-content:center;gap:1rem;">
    <button class="btn btn-ghost" onclick="quizPrev()">← Retour</button>
    <button class="btn btn-gold" onclick="quizNext()">Continuer →</button>
  </div>`
}

// ── Étape 3 : budget (1 à 4) ─────────────────────────────

function renderQuizStep3() {
  return `
  <div style="text-align:center;">
    <p style="font-size:0.65rem;letter-spacing:0.4em;text-transform:uppercase;color:var(--gold);margin-bottom:1rem;">Étape 3 sur 3</p>
    <h1 style="font-family:'Cormorant Garamond',serif;font-size:clamp(2rem,5vw,3rem);margin-bottom:0.75rem;">Votre budget ?</h1>
    <p style="color:var(--text-2);font-size:0.875rem;margin-bottom:0.6rem;">Jusqu'à 4 tranches</p>
    <p style="color:var(--gold);font-size:0.95rem;margin-bottom:2.5rem;">Sélectionnez <strong>au moins une</strong> tranche</p>
  </div>

  <div style="display:flex;flex-wrap:wrap;gap:0.75rem;justify-content:center;margin-bottom:3rem;">
    ${GAMMES.map(g => {
      const actif = QuizState.budget.includes(g)
      return `
      <button onclick="quizToggleBudget('${g}')"
        style="padding:0.75rem 1.5rem;border-radius:100px;border:1px solid ${actif ? 'var(--gold)' : 'var(--border-light)'};background:${actif ? 'var(--gold-dim)' : 'transparent'};color:${actif ? 'var(--gold)' : 'var(--text-2)'};cursor:pointer;font-family:'Jost',sans-serif;font-size:0.85rem;transition:all 0.15s;">
        ${g} €
      </button>`
    }).join('')}
  </div>

  <div style="display:flex;justify-content:center;gap:1rem;">
    <button class="btn btn-ghost" onclick="quizPrev()">← Retour</button>
    <button class="btn btn-gold" onclick="quizFinish()" ${QuizState.budget.length === 0 ? 'disabled style="opacity:0.4;cursor:default;"' : ''}>Voir mes parfums →</button>
  </div>`
}

// ── Calcul des scores ────────────────────────────────────
//
// Principe : l'ordre de préférence de l'utilisateur (aimees[0] = préférée)
// et l'ordre des familles dans le parfum (dominante en premier) comptent tous deux.
//
// Pour chaque famille commune :
//   poidsUser   = nb de familles choisies - rang dans le choix user  (préférée = max)
//   poidsParfum = nb de familles du parfum - rang dans le parfum      (dominante = max)
//   contribution = poidsUser * poidsParfum
// Plus deux positions fortes coïncident, plus la contribution est élevée.
// → récompense l'alignement des ordres ET le nombre de familles communes.

function computeQuizScores() {
  const aimees  = QuizState.aimees   // ordonnées par préférence
  const evitees = QuizState.evitees
  const budget  = QuizState.budget
  const nbAimees = aimees.length

  const tous = []
  DB.maisons.forEach(m => (m.parfums || []).forEach(p => tous.push(p)))

  const scored = tous.map(p => {
    const familles = p.familles || []
    const nbFam = familles.length
    let score = 0
    let communes = 0
    let aDominanteAimee = false

    familles.forEach((f, idxParfum) => {
      if (aimees.includes(f.id)) {
        communes++
        const rangUser   = aimees.indexOf(f.id)          // 0 = préférée
        const poidsUser   = nbAimees - rangUser           // préférée = poids max
        const poidsParfum = nbFam - idxParfum             // dominante = poids max
        score += poidsUser * poidsParfum
        if (idxParfum === 0) aDominanteAimee = true
      }
      if (evitees.includes(f.id)) {
        score -= 2  // pénalité modérée
      }
    })

    return { parfum: p, score, communes, aDominanteAimee }
  })

  // Garde les parfums avec un score positif et au moins une famille commune
  let filtres = scored.filter(s => s.score > 0 && s.communes > 0)

  // Filtre budget (toujours renseigné : min 1 tranche)
  if (budget.length > 0) {
    filtres = filtres.filter(s => s.parfum.gamme_prix && budget.includes(s.parfum.gamme_prix))
  }

  // Tri : score décroissant, puis nombre de familles communes en départage
  filtres.sort((a, b) => (b.score - a.score) || (b.communes - a.communes))

  // Séparation : dominante aimée = fidèle, sinon se rapproche
  const fideles = filtres.filter(s => s.aDominanteAimee).slice(0, MAX_PAR_LISTE)
  const proches = filtres.filter(s => !s.aDominanteAimee).slice(0, MAX_PAR_LISTE)

  return { fideles, proches }
}

function renderQuizResults() {
  const { fideles, proches } = computeQuizScores()
  const aucun = fideles.length === 0 && proches.length === 0

  return `
  <div style="text-align:center;margin-bottom:2.5rem;">
    <p style="font-size:0.65rem;letter-spacing:0.4em;text-transform:uppercase;color:var(--gold);margin-bottom:1rem;">Vos recommandations</p>
    <h1 style="font-family:'Cormorant Garamond',serif;font-size:clamp(2rem,5vw,3.5rem);margin-bottom:1.5rem;">Voici ma sélection pour vous</h1>

    <!-- Rappel des critères -->
    <div style="display:flex;flex-direction:column;gap:0.75rem;align-items:center;margin-bottom:1.5rem;">
      <div style="display:flex;flex-wrap:wrap;gap:0.4rem;justify-content:center;align-items:center;">
        <span style="font-size:0.7rem;color:var(--text-3);letter-spacing:0.15em;text-transform:uppercase;margin-right:0.25rem;">Vos préférences</span>
        ${QuizState.aimees.map((id, idx) => {
          const f = DB.familles.find(x => x.id === id)
          if (!f) return ''
          return `<span style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.25rem 0.7rem;border-radius:100px;border:1px solid var(--gold);background:var(--gold-dim);color:var(--gold);font-size:0.72rem;">
            <span style="font-size:0.62rem;opacity:0.7;">${idx + 1}</span>
            <span style="width:6px;height:6px;border-radius:50%;background:${f.couleur || '#9A8A78'};"></span>
            ${f.nom}
          </span>`
        }).join('')}
      </div>
      ${QuizState.evitees.length > 0 ? `
      <div style="display:flex;flex-wrap:wrap;gap:0.4rem;justify-content:center;align-items:center;">
        <span style="font-size:0.7rem;color:var(--text-3);letter-spacing:0.15em;text-transform:uppercase;margin-right:0.25rem;">À éviter</span>
        ${QuizState.evitees.map(id => {
          const f = DB.familles.find(x => x.id === id)
          if (!f) return ''
          return `<span style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.25rem 0.7rem;border-radius:100px;border:1px solid rgba(200,70,90,0.3);background:rgba(200,70,90,0.08);color:#e0809a;font-size:0.72rem;text-decoration:line-through;text-decoration-thickness:1px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${f.couleur || '#9A8A78'};"></span>
            ${f.nom}
          </span>`
        }).join('')}
      </div>` : ''}
    </div>

    <button class="btn btn-ghost" onclick="openQuiz()">↻ Recommencer</button>
  </div>

  ${aucun ? `
  <div style="text-align:center;padding:3rem 0;">
    <p style="font-family:'Cormorant Garamond',serif;font-size:1.75rem;font-style:italic;color:var(--text-3);margin-bottom:1rem;">Aucun parfum ne correspond</p>
    <p style="color:var(--text-3);font-size:0.875rem;">Essayez d'élargir vos critères ou votre budget.</p>
    <button class="btn btn-gold" onclick="openQuiz()" style="margin-top:1.5rem;">Recommencer le quiz</button>
  </div>` : `

    ${fideles.length > 0 ? `
    <section style="margin-bottom:3.5rem;">
      <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.6rem;margin-bottom:0.4rem;">Le plus fidèle à vos goûts</h2>
      <p style="color:var(--text-3);font-size:0.78rem;margin-bottom:1.5rem;">Vos ambiances préférées y sont dominantes et bien ordonnées</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.9rem;">
        ${fideles.map(s => renderParfumCard(s.parfum)).join('')}
      </div>
    </section>` : ''}

    ${proches.length > 0 ? `
    <section>
      <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.6rem;margin-bottom:0.4rem;">Se rapproche de vos goûts</h2>
      <p style="color:var(--text-3);font-size:0.78rem;margin-bottom:1.5rem;">Vos ambiances y sont présentes, en touches plus discrètes</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.9rem;">
        ${proches.map(s => renderParfumCard(s.parfum)).join('')}
      </div>
    </section>` : ''}
  `}`
}

// ── Actions ──────────────────────────────────────────────

function quizToggleAimee(id) {
  const idx = QuizState.aimees.indexOf(id)
  if (idx === -1) {
    if (QuizState.aimees.length >= 4) return
    QuizState.aimees.push(id)   // ajoute à la fin → ordre de préférence
  } else {
    QuizState.aimees.splice(idx, 1)
  }
  render()
}

function quizToggleEvitee(id) {
  const idx = QuizState.evitees.indexOf(id)
  if (idx === -1) QuizState.evitees.push(id)
  else            QuizState.evitees.splice(idx, 1)
  render()
}

function quizToggleBudget(g) {
  const idx = QuizState.budget.indexOf(g)
  if (idx === -1) QuizState.budget.push(g)
  else            QuizState.budget.splice(idx, 1)
  render()
}

function quizNext() {
  if (QuizState.step === 1 && QuizState.aimees.length === 0) return
  QuizState.step++
  render()
  window.scrollTo(0, 0)
}

function quizPrev() {
  QuizState.step--
  render()
  window.scrollTo(0, 0)
}

function quizFinish() {
  if (QuizState.budget.length === 0) return
  QuizState.step = 4
  render()
  window.scrollTo(0, 0)
}