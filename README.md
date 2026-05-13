# Parfumerie — Encyclopédie personnelle

## Lancement

```bash
# 1. Installe les dépendances (une seule fois)
npm install

# 2. Lance le serveur
npm run dev      # avec rechargement automatique (nodemon)
# ou
npm start        # sans rechargement automatique

# 3. Ouvre dans le navigateur
http://localhost:3000
```

## Architecture

```
parfumerie/
├── server.js        ← API REST Express (routes /api/...)
├── database.js      ← SQLite : création des tables + données initiales
├── parfumerie.db    ← Base de données (générée au 1er lancement)
├── package.json
└── public/          ← Front-end servi statiquement
    ├── index.html
    ├── css/
    │   └── styles.css
    └── javascript/
        ├── state.js          État global de l'app
        ├── db.js             Cache local + fonctions fetch
        ├── helpers.js        Fonctions utilitaires pures
        ├── header.js         Vue : en-tête
        ├── home.js           Vue : accueil
        ├── maison.js         Vue : détail maison
        ├── parfum.js         Vue : détail parfum
        ├── admin.js          Vue : espace admin
        ├── modals.js         Vue : toutes les modales
        ├── actions.js        Actions : navigation + CRUD via fetch
        ├── tailwind.config.js
        └── app.js            Point d'entrée + moteur de rendu
```

## Admin

Mot de passe par défaut : `admin`  
À changer dans `server.js` → `const ADMIN_PASSWORD = 'admin'`

## Notes

- Les données survivent aux rechargements (SQLite).
- Les images sont stockées en base64 dans la base de données.
- Taille max par image : 2 Mo.
