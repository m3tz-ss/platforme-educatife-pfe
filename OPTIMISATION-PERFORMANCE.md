# Guide d'optimisation des performances

## 1. Page React lente (ex: /student/profile)

### Causes possibles
- **Bundle JavaScript trop volumineux** (~1.4 MB) — tout chargé d'un coup
- **Appels API** (profil + candidatures) qui prennent du temps
- **Pas d'indicateur de chargement** — l'utilisateur ne sait pas si la page charge

### Solutions appliquées
- **Code splitting** : `React.lazy()` + `Suspense` — chaque page est chargée uniquement à la demande
- **Indicateur de chargement** sur la page profil étudiant
- **Appels API en parallèle** avec `Promise.all()`
- **Chunks manuels** dans Vite (vendor-react, vendor-ui) pour meilleur cache

---

## 2. Laravel `php artisan serve` très lent au démarrage

### Causes possibles

| Cause | Solution |
|-------|----------|
| **Projet dans OneDrive / Google Drive** | Déplacer le projet dans un dossier local (ex: `C:\Projets\gestion-stages`) |
| **Antivirus (Windows Defender)** | Exclure le dossier du projet des analyses en temps réel |
| **OPcache désactivé** | Activer dans `php.ini` : `opcache.enable=1` |
| **Autoload Composer non optimisé** | Exécuter : `composer dump-autoload -o` |
| **Connexion base de données** | Vérifier que PostgreSQL/MySQL est local et rapide |
| **Beaucoup de packages** | Réduire les dépendances dev si possible |

### Commandes à exécuter

```bash
# Optimiser l'autoload Composer
composer dump-autoload -o

# En production uniquement (accélère beaucoup)
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Vérifier php.ini

Ouvrez `php.ini` et assurez-vous que :

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
```

### Exclure du scan Windows Defender

1. Paramètres Windows → Mise à jour et sécurité → Sécurité Windows
2. Protection contre les virus → Gérer les paramètres
3. Exclusions → Ajouter une exclusion → Dossier
4. Sélectionner `c:\gestion-stages`

### Alternative : Laragon ou XAMPP

Pour un démarrage plus rapide en dev, envisager **Laragon** (Windows) qui précharge PHP et évite le temps de démarrage de `php artisan serve`.
