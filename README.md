# 🚀 Portfolio d'Ingénieur Polyglotte

## 🗺️ Ce que contient ce dépôt

```text
.
├── ARCHITECTURE.md        # 🧠 Modèles MongoDB + Graph Neo4j
├── API_ROUTES.md          # 📜 Contrat d'API entre le backend et vos frontends
├── docker-compose.yml     # MongoDB + Neo4j 
├── justfile               # just up · just seed · just dev · just test
├── backend/               # ⚙️ API FastAPI
│   └── src/portfolio_api/
│       ├── core/          #   configuration 
│       ├── db/            #   connexions MongoDB / Neo4j 
│       ├── models/        #   modèles Pydantic = contrat API_ROUTES.md
│       ├── repositories/  #   requêtes MongoDB (CRUD + agrégations) et Cypher
│       ├── services/      #   orchestration multi-bases
│       ├── api/           #   routes FastAPI
│       └── scripts/seed.py#   peuplement depuis data/
├── data/                  # 📇 
│   ├── candidats/candidats.json
│   └── projets/projets.json
└── frontends/             # 🎨  Vite & ReactJs
```

## ⚡ Démarrage

```bash
cp .env.example .env
just up          # MongoDB (localhost:27018) + Neo4j (http://localhost:7475, bolt 7688)
just install     # uv sync (backend)
just dev         # API sur http://localhost:8000/docs
just test        # tests du backend
npm install      # Télécharge les packages du front (frontend)
npm run dev      # Front React sur http://localhost:3000
```

> Neo4j Browser : http://localhost:7475 — connexion `bolt://localhost:7688`, identifiants `neo4j` / `password`.
> Front ReactJs : http://localhost:3000
> API Swagger UI : http://localhost:8000/docs

