# Fonctionnement Technique du Système d'Emails

Ce document détaille l'architecture et la logique technique derrière l'envoi des emails sur la plateforme MyStage.

## 1. Architecture Laravel
Le système repose sur deux composants majeurs de Laravel :
*   **Mailables (`app/Mail`)** : Classes dédiées à la construction de l'email (sujet, contenu HTML, pièces jointes).
*   **Notifications (`app/Notifications`)** : Système transverse permettant d'envoyer un message via plusieurs canaux simultanément (Base de données pour le centre de notifications et Mail pour l'envoi externe).

## 2. Envoi Asynchrone (Queues)
Pour garantir une expérience utilisateur fluide, les emails ne sont pas envoyés instantanément pendant que l'utilisateur attend.
*   **Méthode `queue()`** : Au lieu d'utiliser `send()`, la plateforme utilise `queue()`.
*   **Background Workers** : L'email est placé dans une "file d'attente" (Laravel Queue) et envoyé en arrière-plan par un processus séparé. Cela permet à l'interface de répondre en quelques millisecondes, même si le serveur de mail est lent.

## 3. Logique de Ciblage (Routing)
Le système identifie intelligemment les destinataires en fonction des rôles :
*   **Candidature** : Envoie un email au **RH** créateur de l'offre ET à son **Manager**.
*   **Statut** : Envoie un email directement à l'**Étudiant** concerné.
*   **Supervision** : Envoie un email à l'**Encadrant** technique lors d'une nouvelle affectation.

## 4. Templates et Design
*   **HTML Dynamique** : Les emails sont générés avec des templates HTML/Blade.
*   **Logique de Style** : Les couleurs et icônes changent dynamiquement selon le contenu (ex: une classe CSS différente pour un refus ou une acceptation).
*   **Données injectées** : Les informations (nom du stagiaire, titre de l'offre, lien vers le dashboard) sont injectées dynamiquement dans le template avant l'envoi.

## 5. Exemple de Flux (Workflow technique)
1.  Le RH clique sur "Accepter" dans l'interface React.
2.  L'API Laravel reçoit la requête et appelle `ApplicationService::updateStatus()`.
3.  Le service met à jour la base de données.
4.  Le service déclenche `Mail::to($student->email)->queue(new ApplicationStatusUpdatedMail(...))`.
5.  L'API répond "Succès" au frontend.
6.  En arrière-plan, le worker récupère l'email et l'envoie via le serveur SMTP.

---
*Cette architecture robuste assure que personne ne manque une information critique tout en maintenant des performances optimales.*
