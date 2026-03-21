# Guide BaseLayout — Structure type Django base.html

## Principe

Le composant **BaseLayout** centralise les éléments répétitifs (sidebar, header, footer) comme `base.html` en Django. Chaque page n'a plus qu'à fournir son contenu et sa configuration.

## Fichiers créés

- `src/components/layout/BaseLayout.jsx` — Layout principal avec sidebar, header, footer
- `src/components/layout/AppFooter.jsx` — Footer (variant `light` ou `dark`)
- `src/components/layout/SidebarHeaders.jsx` — En-têtes sidebar (étudiant / entreprise)
- `src/config/sidebarConfig.jsx` — Menu items par rôle

## Pages déjà refactorisées

- `StudentDashboard`
- `OffersCatalog`
- `OffersList` (entreprise)

## Utiliser BaseLayout pour une nouvelle page

### Étudiant

```jsx
import BaseLayout from "../../components/layout/BaseLayout";
import { StudentSidebarHeader } from "../../components/layout/SidebarHeaders";
import { getStudentMenuItems } from "../../config/sidebarConfig";

export default function MaPage() {
  const [offers, setOffers] = useState([]);
  const [applications, setApplications] = useState([]);

  return (
    <BaseLayout
      title="Titre de la page"
      menuItems={getStudentMenuItems({ offers: offers.length, applications: applications.length })}
      sidebarHeader={<StudentSidebarHeader />}
      sidebarExtra={
        <>
          <div className="bg-blue-50 rounded-lg p-4">...</div>
          <Button fullWidth>Support</Button>
        </>
      }
      headerActions={<IconButton>...</IconButton>}
    >
      {/* Contenu de la page uniquement */}
    </BaseLayout>
  );
}
```

### Entreprise

```jsx
import BaseLayout from "../../components/layout/BaseLayout";
import { EnterpriseSidebarHeader } from "../../components/layout/SidebarHeaders";
import { getEnterpriseMenuItems } from "../../config/sidebarConfig";

const user = JSON.parse(localStorage.getItem("user") || "{}");
const role = user.type || user.role || "rh";

return (
  <BaseLayout
    title="Titre"
    headerSubtitle={`${enterpriseName} • ${enterpriseEmail}`}
    menuItems={getEnterpriseMenuItems(
      { offers, applications, interviewApps },
      role
    )}
    sidebarHeader={
      <EnterpriseSidebarHeader
        enterpriseName={enterpriseName}
        enterpriseEmail={enterpriseEmail}
        roleConfig={currentRole}
      />
    }
    sidebarExtra={...}
  >
    {/* Contenu */}
  </BaseLayout>
);
```

## Props BaseLayout

| Prop | Type | Description |
|------|------|-------------|
| `title` | string | Titre dans le header |
| `menuItems` | array | Items du menu sidebar |
| `sidebarHeader` | node | Logo / infos (ou défaut) |
| `sidebarExtra` | node | Widget avant déconnexion |
| `headerActions` | node | Boutons à droite du header |
| `headerSubtitle` | string | Sous-titre optionnel |
| `children` | node | Contenu principal |

## Footer

- **BaseLayout** : inclut automatiquement le footer
- **Pages publiques** (Landing, AccessDenied) : `<AppFooter variant="dark" />` pour un fond sombre
