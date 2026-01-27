\# 🛠️ Plateforme Mobile : Logistique \& Raccordement - Îles du Ponant



Ce dépôt contient deux outils métiers destinés aux agents de terrain pour faciliter la remontée d'informations techniques et logistiques.



\## 📋 Sommaire

\* \[Aperçu des Modules](#-aperçu-des-modules)

\* \[Architecture Serverless (Vercel)](#-architecture-serverless-vercel)

\* \[Configuration \& Sécurité](#-configuration--sécurité)

\* \[Cahier de Recette (Tests)](#-cahier-de-recette-tests)

\* \[Déploiement](#-déploiement)



---



\## 🔍 Aperçu des Modules



\### 1. Bon de Livraison (`index.html`)

Permet de notifier la réception ou l'envoi de colis. 

\- \*\*Destinations :\*\* Brest, Ouessant, Molène, Sein, Chausey, Glénan.

\- \*\*Fonctionnalités :\*\* Capture photo en direct du matériel et du bon de commande, description textuelle.



\### 2. Étude de Raccordement (`raccordement.html`)

Formulaire technique dédié aux relevés d'infrastructure.

\- \*\*Données :\*\* Coordonnées, spécifications techniques et photos de situation.



---



\## 🏗️ Architecture Serverless (Vercel)



L'application utilise une architecture \*\*Serverless\*\* pour garantir sécurité et légèreté.







\* \*\*Frontend :\*\* Hébergé sur GitHub Pages (statique).

\* \*\*Backend (API) :\*\* Fonctions Node.js hébergées sur \*\*Vercel\*\*. 

&nbsp;   \* L'API fait le pont entre le formulaire et le service d'envoi d'emails.

&nbsp;   \* Elle gère la conversion des images et la sécurisation des envois.

\* \*\*Service Mail :\*\* \[Resend](https://resend.com) est utilisé pour le routage final vers les boîtes Outlook de l'entreprise.



---



\## 🔐 Configuration \& Sécurité



Le projet étant \*\*public\*\*, aucune clé de sécurité n'est stockée dans le code source. 



\### Variables d'environnement (à configurer sur Vercel) :

| Variable | Usage |

| :--- | :--- |

| `RESEND\_API\_KEY` | Clé secrète pour l'envoi d'emails via Resend. |

| `DEST\_MAIL` | Adresse email de réception des formulaires. |



\### Sécurité CORS :

L'API est configurée pour n'autoriser que les requêtes provenant du domaine officiel des Îles du Ponant, empêchant toute utilisation malveillante de l'API par des tiers.



---



\## 🧪 Cahier de Recette (Tests)



| ID | Module | Test | Résultat attendu | État |

| :--- | :--- | :--- | :--- | :---: |

| \*\*T01\*\* | Global | Validation `required` | Bloque l'envoi si un champ est vide. | ✅ |

| \*\*T02\*\* | Caméra | Capture photo | Affiche la miniature et permet la suppression. | ✅ |

| \*\*T03\*\* | API | Envoi de données | Statut 200 (Succès) et réinitialisation du formulaire. | ✅ |

| \*\*T04\*\* | Email | Réception Outlook | Mail reçu avec photos jointes et sujet correct. | ✅ |

| \*\*T05\*\* | Outlook | Règle de tri | Le mail "DESTINATION Ouessant" va dans le dossier dédié. | ✅ |



---



\## 🚀 Déploiement



1\.  \*\*Frontend :\*\* Automatisé via GitHub Pages. Chaque "Push" sur la branche `main` met à jour le site.

2\.  \*\*Backend :\*\* Déployé sur Vercel. 

&nbsp;   \* Lier le dépôt GitHub à Vercel.

&nbsp;   \* Configurer les Variables d'Environnement dans les paramètres Vercel.

&nbsp;   \* Le dossier `/api` est automatiquement détecté comme fonctions Serverless.



---

\*Projet interne - Logistique technique des Îles du Ponant.\*

