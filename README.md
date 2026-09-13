# Artisan Connect

Crée une application web nommée "FidèlArtisan" : un SaaS de relance automatique d'entretien client pour les artisans (chauffagistes, plombiers, garages auto, etc.).

## Authentification

- Système de connexion par email/mot de passe (via Supabase Auth)

- Pas d'inscription publique libre : les comptes artisans sont créés manuellement par l'administrateur (moi)

- Chaque artisan a un compte séparé et ne voit que ses propres données

## Base de données

Table "artisans" :

- nom_entreprise (texte)

- email (texte, unique)

- telephone (texte)

- modele_message (texte long, avec variables {{nom_client}} et {{equipement}})

- statut_abonnement (choix : essai / actif / suspendu)

Table "clients" :

- artisan_id (lien vers artisans)

- nom_client (texte)

- telephone (texte)

- email (texte)

- adresse (texte)

- type_equipement (texte)

- date_dernier_entretien (date)

- frequence_relance_mois (nombre, défaut 12)

- date_prochaine_relance (calculée automatiquement = date_dernier_entretien + frequence_relance_mois)

- statut_relance (choix : à venir / à relancer / relancé)

- priorite (calculée automatiquement selon la proximité de la date_prochaine_relance : haute si < 15 jours, moyenne si 15-30 jours, basse si > 30 jours)

- notes (texte long)

## Règles de sécurité (Row Level Security)

- Un artisan connecté ne peut voir, modifier ou supprimer QUE les clients où artisan_id correspond à son propre compte

- Un artisan connecté ne peut accéder à l'application QUE SI son statut_abonnement = "actif" (sinon message "Votre abonnement est suspendu, contactez l'administrateur")

- Quand un artisan crée un nouveau client, le champ artisan_id se remplit automatiquement avec son propre identifiant (l'artisan ne le voit pas dans le formulaire)

## Pages et fonctionnalités

1. Page de connexion (email/mot de passe)

2. Page d'accueil (dashboard) affichant :

   - Nombre de relances à venir (moins de 30 jours)

   - Nombre de relances en retard

   - Nombre total de clients

   - Liste des clients à relancer bientôt, triée par date de prochaine relance (la plus proche en premier)

3. Page "Clients" :

   - Tableau de tous les clients de l'artisan connecté, avec colonnes : nom, équipement, dernier entretien, prochaine relance, priorité, statut

   - Barre de recherche par nom, téléphone, email, type d'équipement

   - Filtres par statut et par priorité

   - Bouton "Ajouter un client" ouvrant un formulaire (nom, téléphone, email, adresse, type d'équipement, date du dernier entretien, fréquence de relance, notes)

   - Bouton "Envoyer maintenant" sur chaque ligne : déclenche l'envoi immédiat d'un email de relance à ce client, en utilisant le modele_message personnalisé de l'artisan (avec les variables {{nom_client}} et {{equipement}} remplacées par les vraies valeurs du client), et met à jour le statut_relance à "relancé"

   - Bouton pour éditer ou supprimer un client

4. Page "Mes paramètres" :

   - Permet à l'artisan de modifier son modele_message personnalisé

   - Affiche son nom d'entreprise et ses coordonnées

## Envoi d'emails

Utilise un service d'envoi d'email (via une edge function Supabase connectée à un service comme Resend ou l'API email native) pour envoyer les relances quand le bouton "Envoyer maintenant" est cliqué.

## Design

Interface simple, sobre et professionnelle, couleur principale bleu ou vert, adaptée à un usage mobile (les artisans travaillent souvent sur le terrain).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/49580636-69e7-4df9-a991-beea9b10d439).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
