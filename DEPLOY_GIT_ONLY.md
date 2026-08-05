# Deploy Git only - CV Manager

## Objectif

Déployer sans installation locale via push Git vers Netlify.

## Étapes

1. Pousser ce code sur le repository connecté à Netlify.
2. Dans Netlify UI, renseigner les variables d'environnement du README.
3. Relancer un deploy si nécessaire.
4. Tester:
   - `/` (CV public par défaut)
   - `/admin.html` (back-office)

## Identifiants admin

- Login: `ADMIN_USERNAME`
- Mot de passe: celui correspondant à `ADMIN_PASSWORD_HASH` (ou `ADMIN_PASSWORD`)

## Sanity checks post-deploy

1. Connexion admin OK
2. Création d'un CV OK
3. Ajout/réorganisation des blocs OK
4. Publication + CV par défaut OK
5. Page publique affiche le bon CV
6. Téléchargement PDF OK

## Notes infra

- Si `DATABASE_URL` est défini: stockage SQL prioritaire
- Sinon: fallback Netlify Blobs
