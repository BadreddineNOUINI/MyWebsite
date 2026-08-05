# Deploy Netlify via Git only (sans installation locale)

## Ce repo est deja pret

- Frontend: `index2.html`
- Config Netlify: `netlify.toml`
- Backend Function: `netlify/functions/ping.js`

## Deploiement

1. Commit + push vers ton repository Git.
2. Netlify detecte le commit et lance le deploy automatiquement.
3. Une fois en ligne, teste:
   - `/` (la page CV)
   - `/.netlify/functions/ping` (JSON backend)

## Verification depuis la page

La page contient un bloc **Backend Netlify** avec un bouton:
- `Tester /.netlify/functions/ping`

Le statut affiche:
- `OK` si la function repond
- `erreur HTTP` ou `echec de connexion` sinon

## Parametres Netlify UI (si necessaire)

- Base directory: vide
- Build command: vide
- Publish directory: `.`
- Functions directory: `netlify/functions`

Le fichier `netlify.toml` definit deja ces valeurs.
