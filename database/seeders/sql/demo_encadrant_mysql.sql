-- =============================================================================
-- Même jeu de données que demo_encadrant_postgresql.sql, adapté à MySQL / MariaDB.
-- Mot de passe pour tous les comptes : user123 (hash bcrypt ci-dessous).
--
-- mysql -u root -p gestion_stage < database/seeders/sql/demo_encadrant_mysql.sql
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

DELETE et FROM encadrant_evaluations et
INNER JOIN applications a ON a.id = et.application_id
INNER JOIN users s ON s.id = a.student_id AND s.email = 'crestiano@student.tn'
INNER JOIN users enc ON enc.id = a.encadrant_id AND enc.email = 'messi@endadr.fr';

DELETE ec FROM encadrant_comments ec
INNER JOIN applications a ON a.id = ec.application_id
INNER JOIN users s ON s.id = a.student_id AND s.email = 'crestiano@student.tn'
INNER JOIN users enc ON enc.id = a.encadrant_id AND enc.email = 'messi@endadr.fr';

DELETE tk FROM encadrant_tasks tk
INNER JOIN applications a ON a.id = tk.application_id
INNER JOIN users s ON s.id = a.student_id AND s.email = 'crestiano@student.tn'
INNER JOIN users enc ON enc.id = a.encadrant_id AND enc.email = 'messi@endadr.fr';

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
  SELECT 'Mettre en place l’environnement local' AS title, 'Installer PHP, Composer, Node, cloner le dépôt Git.' AS description, 'todo' AS status, DATE('2025-04-15') AS due_date, 0 AS sort_order
  UNION ALL
  SELECT 'Premier module API REST', 'Implémenter 3 endpoints CRUD documentés.', 'in_progress', DATE('2025-04-30'), 1
  UNION ALL
  SELECT 'Revue de code avec l’encadrant', 'Session de revue de la PR principale.', 'done', DATE('2025-05-10'), 2
) AS v;

INSERT INTO encadrant_comments (application_id, encadrant_id, body, created_at, updated_at)
SELECT a.id, a.encadrant_id, c.body, NOW(), NOW()
FROM applications a
INNER JOIN users st ON st.id = a.student_id AND st.email = 'crestiano@student.tn'
CROSS JOIN (
  SELECT 'Très bon démarrage sur la structure du projet. Documenter les variables d’environnement.' AS body
  UNION ALL
  SELECT 'À améliorer : tests unitaires sur le service de candidatures. On en reparle vendredi.'
) AS c;

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

SET FOREIGN_KEY_CHECKS = 1;
