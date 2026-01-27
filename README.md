# 🛠️ Logistique & Raccordement - Îles du Ponant

Ce projet est une plateforme ultra-légère pour les agents de terrain. Pas de base de données lourde, pas de comptes utilisateurs : on capture, on valide, et ça part directement par mail via une architecture serverless.

## 📂 Structure du projet

* **`index.html`** : Interface "Bon de Livraison" (Colis).
* **`raccordement.html`** : Interface "Étude de Raccordement" (Technique).
* **`script.js`** : Le moteur du front. Gère l'accès caméra, la compression des photos et l'appel API.
* **`api/send_colis.js`** : La fonction backend (Vercel). Reçoit les données, sécurise l'envoi et communique avec Resend.

## 🏗️ Flux de données

Le projet utilise GitHub Pages pour le front-end et Vercel pour la puissance de calcul "à la demande".

```mermaid
graph LR
    A[Agent Mobile] -->|Photos + Infos| B(script.js)
    B -->|Validation & Fetch| C{API Vercel}
    C -->|Secrets & Auth| D[Resend Service]
    D -->|Email| E[Boîte Outlook]
    E -->|Règles de tri| F[Dossiers par Île]