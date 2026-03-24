import {
  HomeIcon,
  BriefcaseIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  PlusIcon,
  CheckCircleIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

/**
 * Menu items pour l'espace étudiant
 */
export function getStudentMenuItems(counts = {}) {
  return [
    { icon: HomeIcon, label: "Tableau de bord", path: "/student", badge: null },
    { icon: BriefcaseIcon, label: "Offres de stage", path: "/student/offers", badge: counts.offers ?? null },
    { icon: CheckCircleIcon, label: "Mes candidatures", path: "/student/applications", badge: counts.applications ?? null },
    { icon: ClipboardDocumentListIcon, label: "Mes tâches", path: "/student/tasks", badge: null },
    { icon: BookmarkIcon, label: "Offres sauvegardées", path: "/student/saved", badge: null },
    { icon: ChatBubbleLeftIcon, label: "Messages", path: "/student/messages", badge: null },
    { icon: UserCircleIcon, label: "Mon profil", path: "/student/profile", badge: null },
  ];
}

/**
 * Menu items pour l'espace entreprise (manager, rh, encadrant)
 */
export function getEnterpriseMenuItems(counts = {}, role = "rh") {
  const base = [
    { icon: HomeIcon, label: "Tableau de bord", path: "/enterprise", badge: null },
    { icon: PlusIcon, label: "Publier une offre", path: "/enterprise/publish", badge: null },
    { icon: BriefcaseIcon, label: "Mes offres", path: "/enterprise/offersliste", badge: counts.offers ?? null },
    { icon: CheckCircleIcon, label: "Candidatures", path: "/enterprise/condidateurliste", badge: counts.applications ?? null },
    { icon: ChatBubbleLeftIcon, label: "Entretiens", path: "/enterprise/enterview", badge: counts.interviewApps ?? null },
    { icon: UserCircleIcon, label: "Mon profil", path: "/enterprise/profile", badge: null },
  ];
  if (role === "manager") {
    base.splice(2, 0, { icon: UsersIcon, label: "Gestion équipe", path: "/enterprise/manager", badge: null });
  }
  return base;
}
