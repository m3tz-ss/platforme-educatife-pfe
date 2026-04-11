# 🤖 Guide : Système IA de Recommandation avec Gemini API

## Vue d'ensemble

Ce guide explique comment le système IA de recommandation de stages fonctionne de bout en bout — de la lecture des données jusqu'à l'affichage dans l'interface.

---

## 1. Comment Gemini lit les données

### 1.1 Données envoyées à Gemini

Le backend collecte les informations suivantes **avant** chaque appel API :

```
┌─────────────────────────────────────────────┐
│ PROFIL ÉTUDIANT (table users)               │
│ ─────────────────────────────────────────── │
│ • name            → Nom complet             │
│ • field           → Domaine d'études        │
│ • school          → Établissement           │
│ • skills (JSON)   → ["Python","React",...] │
│ • bio             → Présentation libre      │
└─────────────────────────────────────────────┘
            +
┌─────────────────────────────────────────────┐
│ OFFRES DISPONIBLES (table offers)           │
│ ─────────────────────────────────────────── │
│ • id, title, domain, location, duration    │
│ • description (300 premiers chars)          │
│ • requirements (200 premiers chars)         │
│ • advantages (150 premiers chars)           │
│ • enterprise.name                           │
│ ─────────────────────────────────────────── │
│ Limité aux 30 dernières offres             │
│ (économie de tokens / quota)               │
└─────────────────────────────────────────────┘
```

### 1.2 Format du prompt envoyé

```
Tu es un expert en recrutement et orientation professionnelle.
Analyse le profil d'un étudiant et recommande les meilleures offres de stage.

PROFIL ÉTUDIANT :
- Nom: [name]
- Domaine d'études: [field]
- Établissement: [school]
- Compétences: [skill1, skill2, ...]
- Bio/Présentation: [bio]

OFFRES DISPONIBLES (JSON):
[{ "id": 1, "title": "...", "domain": "...", ... }, ...]

INSTRUCTIONS :
1. Analyse la compatibilité entre le profil et chaque offre
2. Sélectionne les 5 meilleures offres
3. Calcule un score de compatibilité de 0 à 100
4. Explique brièvement pourquoi (en français, max 80 mots)

RÉPONDS UNIQUEMENT avec un tableau JSON valide, sans markdown :
[{"offer_id": X, "score": Y, "reason": "Z"}, ...]
```

### 1.3 Configuration de l'appel API

| Paramètre | Valeur | Raison |
|-----------|--------|--------|
| `temperature` | `0.3` | Réponses déterministes et cohérentes |
| `maxOutputTokens` | `1024` | Économie de quota |
| Modèle | `gemini-1.5-flash` | Rapide et économique |

---

## 2. Comment Gemini répond

### 2.1 Format de réponse attendu

Gemini retourne un tableau JSON pur :

```json
[
  {
    "offer_id": 12,
    "score": 92,
    "reason": "Parfaitement adapté à votre profil Python et Machine Learning. L'offre chez TechCorp correspond exactement à votre domaine d'IA et à vos compétences TensorFlow."
  },
  {
    "offer_id": 7,
    "score": 78,
    "reason": "Votre maîtrise de React et Node.js correspond aux exigences principales. Le domaine web frontend est aligné avec votre parcours en développement."
  },
  ...
]
```

### 2.2 Nettoyage de la réponse

Gemini peut parfois encapsuler sa réponse dans des backticks markdown (` ```json ... ``` `). Le backend nettoie automatiquement :

```php
$text = preg_replace('/^```json\s*/i', '', $text);
$text = preg_replace('/^```\s*/i', '', $text);
$text = preg_replace('/\s*```$/i', '', $text);
```

### 2.3 Gestion des erreurs API

| Code HTTP | Signification | Action |
|-----------|--------------|--------|
| `200` | Succès | Parser le JSON |
| `429` | Quota dépassé | Passer à la clé suivante |
| `401` | Clé invalide | Log erreur, clé suivante |
| `500` | Erreur serveur | Log erreur, clé suivante |

---

## 3. Économie du quota

### 3.1 Système de cache

Les recommandations sont stockées dans le **cache Laravel** pendant **2 heures** :

```php
$cacheKey = 'ai_recommendations_' . $user->id;

// Lecture cache
$cached = Cache::get($cacheKey);
if ($cached) return $cached; // Pas d'appel Gemini !

// Sauvegarde après appel
Cache::put($cacheKey, $recommendations, 7200); // 7200s = 2h
```

**Impact** : Si 100 étudiants consultent leur dashboard dans la même journée, seulement **~12 appels Gemini** sont effectués (1 par étudiant toutes les 2h max).

### 3.2 Invalidation du cache

Le cache est automatiquement invalidé quand l'étudiant met à jour ses skills :

```php
// Dans ProfileController::updateSkills()
cache()->forget('ai_recommendations_' . $user->id);
```

### 3.3 Limitation des données

Pour économiser les tokens :
- Maximum **30 offres** envoyées à Gemini
- Description limitée à **300 caractères**
- Requirements limités à **200 caractères**
- Advantages limités à **150 caractères**

---

## 4. Système de fallback (3 clés API)

```
                  ┌──────────────┐
                  │ Appel Gemini │
                  └──────┬───────┘
                         │
                    Clé API 1 (GEMINI_API_KEY_1)
                         │
              ┌──────────▼──────────┐
              │  Quota dépassé ?    │
              └──────────┬──────────┘
                   Oui   │    Non
                    ┌────┘    └────► Retourner résultat ✅
                    ▼
               Clé API 2 (GEMINI_API_KEY_2)
                    │
              ┌─────▼──────────────┐
              │  Quota dépassé ?   │
              └─────┬──────────────┘
                Oui │    Non
                 ┌──┘    └────► Retourner résultat ✅
                 ▼
            Clé API 3 (GEMINI_API_KEY_3)
                 │
         ┌───────▼──────────────┐
         │  Quota dépassé ?     │
         └───────┬──────────────┘
             Oui │    Non
              ┌──┘    └────► Retourner résultat ✅
              ▼
         Toutes les clés épuisées
              ▼
         Retourner erreur: "api_quota_exceeded" ❌
```

---

## 5. Comment traduire la réponse en interface

### 5.1 Structure de la réponse API backend

```json
{
  "recommendations": [
    {
      "offer_id": 12,
      "score": 92,
      "reason": "Explication...",
      "offer": {
        "id": 12,
        "title": "Développeur React",
        "domain": "Informatique",
        "location": "Tunis",
        "duration": "3 mois",
        "description": "...",
        "requirements": "...",
        "advantages": "...",
        "available_places": 2,
        "start_date": "2026-06-01",
        "enterprise": {
          "id": 5,
          "name": "TechCorp"
        }
      }
    }
  ],
  "cached": false
}
```

### 5.2 Correspondance réponse → interface

| Champ JSON | Composant React | Affichage |
|-----------|----------------|----------|
| `score` | Barre de progression + chiffre | `92 / 100` en blanc sur carte gradient |
| `reason` | Zone italique translucide | `💡 Explication...` |
| `offer.title` | Titre carte | `Développeur React` |
| `offer.enterprise.name` | Sous-titre | `🏢 TechCorp` |
| `offer.location` | Badge | `📍 Tunis` |
| `offer.duration` | Badge | `⏱️ 3 mois` |
| `index === 0` | Badge spécial | `⭐ Meilleure correspondance` |
| `cached: true` | Texte header | `📦 Résultats en cache` |

### 5.3 Gestion des états d'erreur dans l'interface

```
ERROR CODE              AFFICHAGE UI
───────────────────────────────────────────────────────────────
profile_incomplete  →   Banner orange avec bouton "Compléter mon profil →"
api_quota_exceeded  →   Banner rouge "⚠️ Gemini API Failed" + bouton Réessayer
no_offers           →   Message neutre "Aucune offre disponible"
generic             →   Message neutre + bouton Réessayer
```

### 5.4 Flux complet côté frontend

```javascript
// 1. Appel API au chargement du dashboard
const fetchAIRecommendations = async () => {
  setAiLoading(true);
  const res = await api.get("/ai/recommendations");
  setAiRecommendations(res.data.recommendations);
  setAiCached(res.data.cached);
};

// 2. Affichage conditionnel
if (aiLoading)                      → <AISkeleton />        // Animation shimmer
if (aiError === 'profile_incomplete') → <BannerOrange />     // Compléter profil
if (aiError === 'api_quota_exceeded') → <BannerRouge />      // API Failed
if (aiRecommendations.length > 0)   → <AIRecommendationCards /> // Cartes colorées
```

---

## 6. Configuration `.env`

```env
# Clé principale
GEMINI_API_KEY_1=AIzaSy...

# Clé de secours 1 (si quota clé 1 dépassé)
GEMINI_API_KEY_2=AIzaSy...

# Clé de secours 2 (si quota clé 2 dépassé)
GEMINI_API_KEY_3=AIzaSy...

# Durée du cache en secondes (7200 = 2 heures)
GEMINI_CACHE_TTL=7200
```

---

## 7. Lancer le système

### Backend
```bash
# 1. Appliquer la migration skills
php artisan migrate

# 2. Vider le cache de config
php artisan config:clear

# 3. Démarrer le serveur
php artisan serve
```

### Frontend
```bash
cd front-end-gestion-stage
npm run dev
```

### Tester l'API
```bash
# Obtenir des recommandations
curl -X GET http://localhost:8000/api/ai/recommendations \
  -H "Authorization: Bearer TOKEN_SANCTUM"

# Mettre à jour les skills
curl -X PUT http://localhost:8000/api/user/skills \
  -H "Authorization: Bearer TOKEN_SANCTUM" \
  -H "Content-Type: application/json" \
  -d '{"skills": ["Python", "Machine Learning", "TensorFlow"]}'
```

---

## 8. Quota Gemini gratuit

| Plan | Gemini 1.5 Flash | Recommandation |
|------|-----------------|----------------|
| Gratuit | 15 req/min, 1M tokens/jour | ✅ Suffisant avec cache |
| Avec cache 2h | ~12 req/jour per user | ✅ OK pour dev/test |
| Production | Passer à plan payant | 💳 Selon usage réel |

> [!TIP]
> Avec le cache 2h et 3 clés API différentes, vous avez théoriquement ~3M tokens/jour disponibles gratuitement.
