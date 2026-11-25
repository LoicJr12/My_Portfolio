# Frontend de @LoicJr12 — Portfolio 3D de Loïc KAKOU

- **Technologie** : React 19 + Vite (JavaScript), Three.js via React Three Fiber + drei (univers 3D, robot guide, graphe de compétences), d3-force-3d (placement du graphe).
- **Prérequis** : **Node.js 22 LTS** (minimum 20.19 — Node 18 ne fonctionne pas avec Vite 8), backend d'équipe lancé (`just up && just seed && just dev` à la racine du dépôt).

## Lancer

```bash
cd frontends/frontend-LoicJr12
cp .env.example .env      # VITE_API_URL et VITE_CANDIDAT_SLUG
npm install
npm run dev               # http://localhost:5173 (origine déjà autorisée par le CORS du backend)
npm run build             # version de production dans dist/ (npm run preview pour la tester)
```

## Routes de `API_ROUTES.md` consommées

| Requête | Route | Page / section |
|---|---|---|
| R1 | `GET /api/candidats/{slug}` | Accueil (nom, titre, bio, chiffres) + escale Parcours — timeline expériences / formations |
| R2 | `GET /api/candidats/{slug}/projets?competence=` | Escale Projets — filtre par compétence + pagination (et catalogue complet pour la carte « Projets » de l’accueil) |
| R3 | `GET /api/candidats/{slug}/stats` | Accueil (carte « Technos ») + escale Compétences — barres « projets par compétence » |
| R4 | `GET /api/graph/projets/{slug}/similaires?limit=` | `/projets/:slug` — carte orbitale + liste des projets similaires, sélecteur `limit` (3 / 5 / 10) |
| R5 | `GET /api/graph/competences/{slug}` | Escale Compétences — constellation 3D interactive + fiche du nœud |
| R6 | `GET /api/projets/{slug}` | `/projets/:slug` — détail complet : architecture, réalisations, technologies, équipe, liens, médias |
| R7 | `GET /api/candidats/{slug}/experiences/recente` | Escale Parcours — carte « Dernière mission » |
| R8 | `GET /api/candidats/{slug}/projets?domaine_slug=` | Escale Projets — filtre par domaine (combinable avec R2) |

Toutes les fonctions d'appel sont regroupées dans `src/api/client.js`.

## Coordonnées (escale Contact)

E-mail, téléphone, GitHub et LinkedIn se règlent dans **`src/content/contact.js`**. Une valeur à `null` masque la carte correspondante ; le LinkedIn retombe sur celui de la fiche candidat (R1) s'il n'est pas renseigné.

## Parcours du site

`/` est un voyage en 5 escales, guidé par **Nova**, un robot ailé en 3D (cliquer sur lui ou sur sa bulle fait avancer ses répliques) :
Décollage (accueil) → Parcours (R1, R7) → Compétences (R5, R3) → Projets (R2, R8) → Contact.
`/projets/:slug` affiche le détail d'un projet (R6) et ses voisins Neo4j (R4).

## Performances

- **Chargement en deux temps** : le texte s'affiche avec ~95 Ko de JavaScript compressé ; Three.js (~270 Ko compressés) est chargé juste après, l'univers apparaît en fondu.
- **À la demande** : la page projet et le graphe de compétences (avec d3-force-3d) ne sont téléchargés qu'au moment où on en a besoin.
- **Bibliothèques séparées** (`vendor-react`, `vendor-3d`, `vendor-graph`) : mises en cache par le navigateur.
- **Résolution adaptative** de la 3D (baisse automatiquement si l'appareil peine), moins d'étoiles sur mobile, graphe 3D en pause quand il n'est pas à l'écran.
- **Polices** limitées à l'alphabet latin.

## Accessibilité

- Audit automatique **axe-core : 0 erreur** sur l'accueil et sur une page projet.
- Lien « Aller au contenu », focus visible sur tous les éléments, ordre de tabulation logique (Nova en dernier).
- Alternative clavier / lecteur d'écran au graphe 3D (« Explorer la constellation sous forme de liste ») et au graphique de statistiques (« Vue tableau »).
- Respect de `prefers-reduced-motion` (voyage ralenti, pas d'effet hyper-espace, animations raccourcies).
