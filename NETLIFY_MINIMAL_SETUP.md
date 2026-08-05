# Configuration minimale Netlify (Front + Backend)

## 1) Prerequis

- Node.js installe
- Compte Netlify

## 2) Installer la CLI et se connecter

```powershell
npm install -g netlify-cli
netlify login
```

## 3) Lier le dossier a un site Netlify

```powershell
netlify init
```

Tu peux choisir:
- creer un nouveau site, ou
- lier un site existant

## 4) Lancer en local (front + functions)

```powershell
netlify dev
```

Ensuite:
- Front: http://localhost:8888/
- API test: http://localhost:8888/.netlify/functions/ping

## 5) Deployer

```powershell
netlify deploy
netlify deploy --prod
```

## Ce que fait cette config

- `netlify.toml`
- publication du front depuis la racine du projet
- functions backend dans `netlify/functions`
- redirection `/` vers `/index2.html`

- `netlify/functions/ping.js`
- endpoint backend minimal qui retourne un JSON de sante
