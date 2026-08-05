# Deploy Netlify via Git only (sans installation locale)

## Ce repo est deja pret

- Frontend: `index2.html`
- Config Netlify: `netlify.toml`
- Backend Function: `netlify/functions/ping.js`
- Storage Netlify: `@netlify/blobs` (installe automatiquement par Netlify via `package.json`)

## Deploiement

1. Commit + push vers ton repository Git.
2. Netlify detecte le commit et lance le deploy automatiquement.
3. Une fois en ligne, teste:
   - `/` (la page CV)
   - `/.netlify/functions/ping` (JSON backend)

## Donnee stockee en base Netlify

La function `ping` utilise Netlify Blobs pour stocker un compteur persistant:
- cle: `counter`
- store: `ping_data`

A chaque appel de `/.netlify/functions/ping`, la valeur augmente de `+1`.

## Verification depuis la page

La page contient un bloc **Backend Netlify** avec un bouton:
- `Tester /.netlify/functions/ping`

Le statut affiche:
- `OK` si la function repond, avec DB + valeur du compteur
- `erreur HTTP` ou `echec de connexion` sinon

Exemple de verification rapide:
1. Ouvrir `/.netlify/functions/ping` deux fois.
2. Verifier que `counter` passe de `1` a `2` (ou de `N` a `N+1`).

## Depannage Blobs

Si tu vois une erreur du type "environment has not been configured to use Netlify Blobs":

1. Ouvre le projet dans Netlify UI.
2. Va dans Site configuration > Environment variables.
3. Ajoute les variables suivantes:
   - `NETLIFY_BLOBS_SITE_ID` = Project ID (visible dans Project information)
   - `NETLIFY_BLOBS_TOKEN` = Personal Access Token Netlify
4. Relance un deploy depuis le dernier commit.

Note:
- La function tente d'abord la configuration automatique Netlify.
- Si elle n'est pas disponible, elle bascule sur ces variables d'environnement.

## Parametres Netlify UI (si necessaire)

- Base directory: vide
- Build command: vide
- Publish directory: `.`
- Functions directory: `netlify/functions`

Le fichier `netlify.toml` definit deja ces valeurs.
