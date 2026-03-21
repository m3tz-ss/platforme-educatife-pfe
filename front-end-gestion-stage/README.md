# Front-end Gestion de Stages

Interface React (Material Tailwind) pour la plateforme MyStage.

## Démarrage

```bash
npm install
npm run dev
```

- Interface : http://localhost:5173
- L'API Laravel (port 8000) est proxifiée automatiquement via Vite

## Scripts

- `npm run dev` : serveur de développement
- `npm run build` : build production
- `npm run preview` : prévisualiser le build

## Configuration

Créez `.env` (copie de `.env.example`) si besoin :

- `VITE_API_URL` : URL de l'API (par défaut `/api` avec le proxy en dev)

## Depuis la racine du projet

```bash
npm run dev:front    # Lancer le frontend
npm run build:front  # Build du frontend
npm run dev:all      # Laravel + React en parallèle
```
