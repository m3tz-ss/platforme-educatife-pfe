import React from "react";
import {
  Typography,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Avatar,
  Progress,
} from "@material-tailwind/react";
import { EllipsisVerticalIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/solid";

// Exemple de données adaptées à ton projet
const statisticsCardsData = [
  { title: "Étudiants inscrits", value: 120, footer: "Mois courant", color: "text-blue-500" },
  { title: "Entreprises actives", value: 45, footer: "Mois courant", color: "text-green-500" },
  { title: "Offres publiées", value: 78, footer: "Mois courant", color: "text-purple-500" },
  { title: "Candidatures reçues", value: 340, footer: "Mois courant", color: "text-orange-500" },
];

const projectsTableData = [
  {
    name: "Stage Développement Web",
    img: "/img/company1.png",
    members: [
      { name: "Ali", img: "/img/student1.jpg" },
      { name: "Sara", img: "/img/student2.jpg" },
    ],
    budget: "3 000 DT",
    completion: 70,
  },
  {
    name: "Stage Data Science",
    img: "/img/company2.png",
    members: [
      { name: "Hassan", img: "/img/student3.jpg" },
      { name: "Meriem", img: "/img/student4.jpg" },
    ],
    budget: "4 500 DT",
    completion: 50,
  },
];

const ordersOverviewData = [
  { title: "Offres publiées ce mois", description: "24 nouvelles offres", icon: ClockIcon, color: "text-blue-500" },
  { title: "Candidatures reçues", description: "340 candidatures", icon: CheckCircleIcon, color: "text-green-500" },
];

export function Home() {
  return (
    <div className="mt-12">
      {/* Statistiques générales */}
      <div className="mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-4">
        {statisticsCardsData.map((stat) => (
          <Card key={stat.title} className="p-4 shadow-sm">
            <Typography className="text-blue-gray-500 text-sm">{stat.title}</Typography>
            <Typography className="text-2xl font-bold">{stat.value}</Typography>
            <Typography className={`text-xs font-medium ${stat.color}`}>{stat.footer}</Typography>
          </Card>
        ))}
      </div>

      {/* Tableau des offres */}
      <div className="mb-6 grid grid-cols-1 gap-y-12 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2 border border-blue-gray-100 shadow-sm">
          <CardHeader floated={false} shadow={false} color="transparent" className="m-0 flex items-center justify-between p-6">
            <div>
              <Typography variant="h6" color="blue-gray" className="mb-1">
                Offres publiées
              </Typography>
              <Typography variant="small" className="flex items-center gap-1 font-normal text-blue-gray-600">
                <CheckCircleIcon strokeWidth={3} className="h-4 w-4 text-blue-gray-200" />
                <strong>2 stages complétés</strong> ce mois
              </Typography>
            </div>
            <Menu placement="left-start">
              <MenuHandler>
                <IconButton size="sm" variant="text" color="blue-gray">
                  <EllipsisVerticalIcon strokeWidth={3} className="h-6 w-6" />
                </IconButton>
              </MenuHandler>
              <MenuList>
                <MenuItem>Modifier</MenuItem>
                <MenuItem>Supprimer</MenuItem>
              </MenuList>
            </Menu>
          </CardHeader>
          <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <tr>
                  {["Offre", "Candidats", "Entreprise", "Progression"].map((el) => (
                    <th key={el} className="border-b border-blue-gray-50 py-3 px-6 text-left">
                      <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                        {el}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projectsTableData.map(({ name, members, img, budget, completion }) => (
                  <tr key={name}>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-4">
                        <Avatar src={img} alt={name} size="sm" />
                        <Typography variant="small" color="blue-gray" className="font-bold">
                          {name}
                        </Typography>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      {members.map(({ name, img }, idx) => (
                        <Avatar key={name} src={img} alt={name} size="xs" variant="circular" className={idx === 0 ? "" : "-ml-2.5"} />
                      ))}
                    </td>
                    <td className="py-3 px-5">
                      <Typography variant="small" className="text-xs font-medium text-blue-gray-600">
                        {budget}
                      </Typography>
                    </td>
                    <td className="py-3 px-5">
                      <div className="w-10/12">
                        <Typography variant="small" className="mb-1 block text-xs font-medium text-blue-gray-600">
                          {completion}%
                        </Typography>
                        <Progress value={completion} variant="gradient" color={completion === 100 ? "green" : "blue"} className="h-1" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        {/* Aperçu candidatures / offres */}
        <Card className="border border-blue-gray-100 shadow-sm">
          <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6">
            <Typography variant="h6" color="blue-gray" className="mb-2">
              Aperçu des candidatures
            </Typography>
          </CardHeader>
          <CardBody className="pt-0">
            {ordersOverviewData.map(({ title, description }) => (
              <div key={title} className="flex items-start gap-4 py-3">
                <div className="relative p-1">
                  <ArrowUpIcon className="!w-5 !h-5 text-green-500" />
                </div>
                <div>
                  <Typography variant="small" color="blue-gray" className="block font-medium">
                    {title}
                  </Typography>
                  <Typography as="span" variant="small" className="text-xs font-medium text-blue-gray-500">
                    {description}
                  </Typography>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default Home;