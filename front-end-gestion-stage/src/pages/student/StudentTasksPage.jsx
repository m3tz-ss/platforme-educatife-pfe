import { useEffect, useState, useMemo } from "react";
import { Typography, Card, CardBody, Button, Select, Option, Textarea } from "@material-tailwind/react";
import api from "../../services/api";
import BaseLayout from "../../components/layout/BaseLayout";
import { StudentSidebarHeader } from "../../components/layout/SidebarHeaders";
import { getStudentMenuItems } from "../../config/sidebarConfig";
import StudentNotificationBell from "../../components/student/StudentNotificationBell";

const STATUS_OPTS = [
  { value: "todo", label: "À faire" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Terminé" },
];

export default function StudentTasksPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [supervision, setSupervision] = useState(null);
  const [loadingSup, setLoadingSup] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get("/my-applications")
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setApplications(raw);
      })
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const withEnc = applications.filter((a) => a.encadrant_id || a.encadrant);
    if (withEnc.length && selectedId == null) {
      setSelectedId(withEnc[0].id);
    }
  }, [applications, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingSup(true);
    api
      .get(`/student/applications/${selectedId}/supervision`)
      .then((res) => setSupervision(res.data))
      .catch(() => setSupervision(null))
      .finally(() => setLoadingSup(false));
  }, [selectedId]);

  const appsWithEncadrant = useMemo(
    () => applications.filter((a) => a.encadrant_id || a.encadrant),
    [applications]
  );

  const loadSupervision = () => {
    if (!selectedId) return;
    setLoadingSup(true);
    api
      .get(`/student/applications/${selectedId}/supervision`)
      .then((res) => setSupervision(res.data))
      .finally(() => setLoadingSup(false));
  };

  const patchStatus = async (taskId, status) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await api.patch(`/student/applications/${selectedId}/tasks/${taskId}/status`, { status });
      loadSupervision();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const sendComment = async (taskId) => {
    const body = (commentDrafts[taskId] || "").trim();
    if (!body || !selectedId) return;
    setBusy(true);
    try {
      await api.post(`/student/applications/${selectedId}/tasks/${taskId}/comments`, { body });
      setCommentDrafts((d) => ({ ...d, [taskId]: "" }));
      loadSupervision();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const encName = supervision?.encadrant?.name || "—";
  const encEmail = supervision?.encadrant?.email;

  const sidebarExtra = (
    <div className="bg-blue-50 rounded-lg p-4">
      <Typography variant="small" className="text-blue-gray-600 mb-1">Espace étudiant</Typography>
      <Typography variant="small" className="text-blue-gray-700">
        Mettez à jour vos tâches et échangez avec votre encadrant.
      </Typography>
    </div>
  );

  return (
    <BaseLayout
      title="Mes tâches"
      headerSubtitle="Suivi avec votre encadrant"
      menuItems={getStudentMenuItems({ applications: applications.length })}
      sidebarHeader={<StudentSidebarHeader />}
      sidebarExtra={sidebarExtra}
      headerActions={
        <>
          <StudentNotificationBell />
        </>
      }
    >
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {loading ? (
          <Typography className="text-blue-gray-500">Chargement…</Typography>
        ) : appsWithEncadrant.length === 0 ? (
          <Card className="border border-blue-gray-100">
            <CardBody>
              <Typography className="text-blue-gray-700">
                Aucune candidature avec un encadrant assigné pour l’instant. Les tâches apparaîtront lorsqu’une
                entreprise vous affectera un encadrant.
              </Typography>
            </CardBody>
          </Card>
        ) : (
          <>
            <Card className="border border-blue-100 bg-gradient-to-r from-blue-50/80 to-white">
              <CardBody className="py-4">
                <Typography variant="small" className="font-bold text-blue-800 uppercase tracking-wide">
                  Votre encadrant
                </Typography>
                <Typography variant="h5" className="font-bold text-blue-gray-900 mt-1">
                  {encName}
                </Typography>
                {encEmail && (
                  <Typography variant="small" className="text-blue-gray-600 mt-1">
                    {encEmail}
                  </Typography>
                )}
              </CardBody>
            </Card>

            <div className="max-w-md">
              <Select
                label="Candidature / offre"
                value={selectedId ? String(selectedId) : ""}
                onChange={(v) => setSelectedId(Number(v))}
              >
                {appsWithEncadrant.map((a) => (
                  <Option key={a.id} value={String(a.id)}>
                    {a.offer?.title || `Candidature #${a.id}`}
                  </Option>
                ))}
              </Select>
            </div>

            {loadingSup ? (
              <Typography className="text-blue-gray-500">Chargement des tâches…</Typography>
            ) : supervision && (
              <div className="space-y-6">
                {(supervision.tasks || []).length === 0 ? (
                  <Typography className="text-blue-gray-500">Aucune tâche pour cette candidature.</Typography>
                ) : (
                  (supervision.tasks || []).map((task) => {
                    const tc = task.task_comments || task.taskComments || [];
                    return (
                      <Card key={task.id} className="border border-blue-gray-100 shadow-sm">
                        <CardBody className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                              <Typography variant="h6" className="font-bold text-blue-gray-900">
                                {task.title}
                              </Typography>
                              {task.description && (
                                <Typography variant="small" className="text-blue-gray-600 mt-2 whitespace-pre-wrap">
                                  {task.description}
                                </Typography>
                              )}
                              {task.due_date && (
                                <Typography variant="small" className="text-blue-gray-500 mt-2">
                                  Échéance : {task.due_date}
                                </Typography>
                              )}
                            </div>
                            <div className="w-full sm:w-48 shrink-0">
                              <Select
                                label="Statut"
                                value={task.status}
                                onChange={(v) => patchStatus(task.id, v)}
                                disabled={busy}
                              >
                                {STATUS_OPTS.map((o) => (
                                  <Option key={o.value} value={o.value}>
                                    {o.label}
                                  </Option>
                                ))}
                              </Select>
                            </div>
                          </div>

                          <div className="border-t border-blue-gray-100 pt-3">
                            <Typography variant="small" className="font-bold text-blue-gray-800 mb-2">
                              Commentaires sur cette tâche
                            </Typography>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {tc.length === 0 ? (
                                <Typography variant="small" className="text-blue-gray-400">
                                  Aucun commentaire pour l’instant.
                                </Typography>
                              ) : (
                                tc.map((c) => (
                                  <div
                                    key={c.id}
                                    className="rounded-lg bg-blue-gray-50/80 px-3 py-2 text-sm"
                                  >
                                    <span className="font-semibold text-blue-gray-800">
                                      {c.user?.name || "Utilisateur"}
                                    </span>
                                    <span className="text-blue-gray-400 text-xs ml-2">
                                      {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                                    </span>
                                    <p className="text-blue-gray-700 mt-1 whitespace-pre-wrap">{c.body}</p>
                                  </div>
                                ))
                              )}
                            </div>
                            <div className="mt-3 flex flex-col gap-2">
                              <Textarea
                                label="Votre commentaire"
                                value={commentDrafts[task.id] || ""}
                                onChange={(e) =>
                                  setCommentDrafts((d) => ({ ...d, [task.id]: e.target.value }))
                                }
                                rows={3}
                              />
                              <Button
                                size="sm"
                                color="blue"
                                disabled={busy || !(commentDrafts[task.id] || "").trim()}
                                onClick={() => sendComment(task.id)}
                              >
                                Enregistrer le commentaire
                              </Button>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </BaseLayout>
  );
}
