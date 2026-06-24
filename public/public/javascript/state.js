// public/javascript/state.js
// Rôle : objet unique qui centralise tout l'état de l'application.

const FAMILLE_COLORS = {
  'Boisé':      '#8B7355', 'Oriental':   '#C4874B', 'Floral':    '#C47B8A',
  'Frais':      '#5B9AA8', 'Fougère':    '#6B8C5A', 'Chypré':    '#7A6B4F',
  'Aromatique': '#7B8C6B', 'Aquatique':  '#4A8BA8', 'Gourmand':  '#B8855A',
  'Cuir':       '#8C6B4A', 'Musqué':     '#9A8A7A', 'Hespéridé': '#C4A84B',
}

const State = {
  // ── Navigation ──
  view:      'home',        // 'home' | 'maison' | 'parfum' | 'admin'
  adminView: 'dashboard',   // 'dashboard' | 'maisons' | 'parfums' | 'familles'

  // ── Session ──
  adminLogged: false,

  // ── Sélections actives ──
  selectedMaisonId: null,
  selectedParfumId: null,
  selectedParfum:   null,   // objet complet chargé depuis /api/parfums/:id (avec image_base64)

  // ── Filtres page d'accueil ──
  search:        '',
  familleFilter: null,
  prixFilter:    null,   // null | "0-100" | "100-200" | "200-300" | "300+"

  // ── Modales ──
  modal:         null,
  editTarget:    null,
  confirmAction: null,
  confirmMsg:    '',

  // ── Historique de navigation ──
  // Sauvegarde l'état de la page précédente pour pouvoir y revenir
  previousScroll:   0,      // position Y du scroll avant navigation
  previousView:     null,   // vue précédente
  previousSearch:   '',     // recherche active
  previousFamille:  null,   // filtre famille actif
  previousOpenedMaisons: [], // ids des maisons ouvertes en mode liste
}