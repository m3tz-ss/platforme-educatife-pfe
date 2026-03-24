-- =============================================================================
-- Données de démo : étudiant + encadrant + tâches / commentaires / évaluation
-- Base : PostgreSQL (projet : DB_CONNECTION=pgsql)
--
-- Comptes (mot de passe pour tous : user123) :
--   Étudiant   : crestiano@student.tn
--   Encadrant  : messi@endadr.fr
--   RH (offre) : seed-rh@demo.tn
--
-- Exécution :
--   psql -U postgres -d gestion_stage -f database/seeders/sql/demo_encadrant_postgresql.sql
--   (ou copier-coller dans DBeaver / pgAdmin et exécuter tout le script)
-- =============================================================================

BEGIN;

-- Hash bcrypt (cost 12) du mot de passe : user123
-- Régénérer avec : php database/seeders/sql/generate_password_hash.php

DELETE FROM encadrant_evaluations
WHERE application_id IN (
  SELECT a.id FROM applications a
  INNER JOIN users s ON s.id = a.student_id AND s.email = 'crestiano@student.tn'
  INNER JOIN users enc ON enc.id = a.encadrant_id AND enc.email = 'messi@endadr.fr'
);

DELETE FROM encadrant_comments
WHERE application_id IN (
  SELECT a.id FROM applications a
  INNER JOIN users s ON s.id = a.student_id AND s.email = 'crestiano@student.tn'
  INNER JOIN users enc ON enc.id = a.encadrant_id AND enc.email = 'messi@endadr.fr'
);

DELETE FROM encadrant_tasks
WHERE application_id IN (
  SELECT a.id FROM applications a
  INNER JOIN users s ON s.id = a.student_id AND s.email = 'crestiano@student.tn'
  INNER JOIN users enc ON enc.id = a.encadrant_id AND enc.email = 'messi@endadr.fr'
);

DELETE FROM applications
WHERE student_id IN (SELECT id FROM users WHERE email = 'crestiano@student.tn');

DELETE FROM offers
WHERE title = 'Stage Dev — Démo seed MyStage'
  AND enterprise_id IN (SELECT id FROM users WHERE email = 'seed-rh@demo.tn');

DELETE FROM users WHERE email IN ('crestiano@student.tn', 'messi@endadr.fr', 'seed-rh@demo.tn');

INSERT INTO users (name, email, password, type, role, company_name, created_at, updated_at)
VALUES (
  'RH Seed',
  'seed-rh@demo.tn',
  '$2y$12$4akR1a9Ozw.yX4MFcgV8DemxSLOISu.XTtFSB//F9zk1tMaqE6miC',
  'enterprise',
  'rh',
  'TechCorp Demo',
  NOW(),
  NOW()
);

INSERT INTO users (name, email, password, type, role, school, field, graduation_year, created_at, updated_at)
VALUES (
  'Cristiano Étudiant',
  'crestiano@student.tn',
  '$2y$12$4akR1a9Ozw.yX4MFcgV8DemxSLOISu.XTtFSB//F9zk1tMaqE6miC',
  'student',
  NULL,
  'Université de Tunis',
  'Informatique',
  2026,
  NOW(),
  NOW()
);

INSERT INTO users (name, email, password, type, role, manager_id, company_name, position, created_at, updated_at)
SELECT
  'Lionel Encadrant',
  'messi@endadr.fr',
  '$2y$12$4akR1a9Ozw.yX4MFcgV8DemxSLOISu.XTtFSB//F9zk1tMaqE6miC',
  'enterprise',
  'encadrant',
  u.id,
  'TechCorp Demo',
  'Encadrant technique',
  NOW(),
  NOW()
FROM users u
WHERE u.email = 'seed-rh@demo.tn';

INSERT INTO offers (
  title, domain, location, duration, start_date, available_places,
  description, requirements, advantages, enterprise_id, created_at, updated_at
)
SELECT
  'Stage Dev — Démo seed MyStage',
  'Informatique',
  'Paris / Hybride',
  '6 mois',
  '2025-09-01',
  2,
  'Développement d’applications web (Laravel + React).',
  'PHP, Laravel, JavaScript, React.',
  'Télétravail partiel, mentoring.',
  u.id,
  NOW(),
  NOW()
FROM users u
WHERE u.email = 'seed-rh@demo.tn';

INSERT INTO applications (student_id, offer_id, status, encadrant_id, created_at, updated_at)
SELECT s.id, o.id, 'acceptee', e.id, NOW(), NOW()
FROM users s
CROSS JOIN users e
INNER JOIN offers o ON o.title = 'Stage Dev — Démo seed MyStage'
  AND o.enterprise_id = (SELECT id FROM users WHERE email = 'seed-rh@demo.tn' LIMIT 1)
WHERE s.email = 'crestiano@student.tn'
  AND e.email = 'messi@endadr.fr';

INSERT INTO encadrant_tasks (application_id, encadrant_id, title, description, status, due_date, sort_order, created_at, updated_at)
SELECT
  a.id,
  a.encadrant_id,
  v.title,
  v.description,
  v.status,
  v.due_date,
  v.sort_order,
  NOW(),
  NOW()
FROM applications a
INNER JOIN users st ON st.id = a.student_id AND st.email = 'crestiano@student.tn'
CROSS JOIN (
  VALUES
    ('Mettre en place l’environnement local', 'Installer PHP, Composer, Node, cloner le dépôt Git.', 'todo', DATE '2025-04-15', 0),
    ('Premier module API REST', 'Implémenter 3 endpoints CRUD documentés.', 'in_progress', DATE '2025-04-30', 1),
    ('Revue de code avec l’encadrant', 'Session de revue de la PR principale.', 'done', DATE '2025-05-10', 2)
) AS v(title, description, status, due_date, sort_order);

INSERT INTO encadrant_comments (application_id, encadrant_id, body, created_at, updated_at)
SELECT a.id, a.encadrant_id, c.body, NOW(), NOW()
FROM applications a
INNER JOIN users st ON st.id = a.student_id AND st.email = 'crestiano@student.tn'
CROSS JOIN (
  VALUES
    ('Très bon démarrage sur la structure du projet. Documenter les variables d’environnement.'),
    ('À améliorer : tests unitaires sur le service de candidatures. On en reparle vendredi.')
) AS c(body);

INSERT INTO encadrant_evaluations (application_id, encadrant_id, score, final_decision, notes, created_at, updated_at)
SELECT
  a.id,
  a.encadrant_id,
  15.5,
  'valide',
  'Bon niveau technique et communication. Quelques ajustements sur les tests automatisés.',
  NOW(),
  NOW()
FROM applications a
INNER JOIN users st ON st.id = a.student_id AND st.email = 'crestiano@student.tn';

COMMIT;
