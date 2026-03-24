import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(
  /\/api\/?$/,
  ""
);

function storageUrl(path) {
  return path ? `${API_ORIGIN}/storage/${path}` : null;
}

const APP_STATUSES = [
  { value: "nouveau", label: "Nouveau" },
  { value: "preselectionnee", label: "Présélection" },
  { value: "entretien", label: "Entretien" },
  { value: "acceptee", label: "Accepté" },
  { value: "refusee", label: "Refusé" },
];

const TASK_STATUSES = [
  { value: "todo", label: "À faire" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Terminé" },
];

const DECISIONS = [
  { value: "pending", label: "En attente" },
  { value: "valide", label: "Validé" },
  { value: "a_ameliorer", label: "À améliorer" },
  { value: "non_conforme", label: "Non conforme" },
];

export default function EncadrantStudentDetail() {
  const { applicationId } = useParams();
  const id = Number(applicationId);

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasksRes, setTasksRes] = useState({ data: [] });
  const [commentsRes, setCommentsRes] = useState({ data: [] });
  const [evaluation, setEvaluation] = useState(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [busy, setBusy] = useState(false);

  const [evalForm, setEvalForm] = useState({
    score: "",
    final_decision: "pending",
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const flashError = (msg) => {
    setFormError(msg);
    setFormSuccess("");
    window.setTimeout(() => setFormError(""), 6000);
  };

  const flashSuccess = (msg) => {
    setFormSuccess(msg);
    setFormError("");
    window.setTimeout(() => setFormSuccess(""), 4000);
  };

  const loadDetail = useCallback(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/encadrant/supervision/applications/${id}`)
      .then((res) => setDetail(res.data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [id]);

  const loadTasks = useCallback(() => {
    if (!id) return;
    api.get(`/encadrant/applications/${id}/tasks`).then((res) => setTasksRes(res.data));
  }, [id]);

  const loadComments = useCallback(() => {
    if (!id) return;
    api.get(`/encadrant/applications/${id}/comments`).then((res) => setCommentsRes(res.data));
  }, [id]);

  const loadEvaluation = useCallback(() => {
    if (!id) return;
    api.get(`/encadrant/applications/${id}/evaluation`).then((res) => {
      const ev = res.data;
      setEvaluation(ev);
      if (ev) {
        setEvalForm({
          score: ev.score != null ? String(ev.score) : "",
          final_decision: ev.final_decision || "pending",
          notes: ev.notes || "",
        });
      }
    });
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!detail) return;
    loadTasks();
    loadComments();
    loadEvaluation();
  }, [detail, loadTasks, loadComments, loadEvaluation]);

  const patchStatus = (status) => {
    setBusy(true);
    api
      .patch(`/encadrant/supervision/applications/${id}/status`, { status })
      .then((res) => setDetail((d) => ({ ...d, status: res.data.status })))
      .finally(() => setBusy(false));
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setBusy(true);
    api
      .post(`/encadrant/applications/${id}/tasks`, {
        title: taskTitle.trim(),
        description: taskDesc.trim() || null,
        status: "todo",
      })
      .then(() => {
        setTaskTitle("");
        setTaskDesc("");
        loadTasks();
        loadDetail();
      })
      .finally(() => setBusy(false));
  };

  const updateTaskStatus = (taskId, status) => {
    setBusy(true);
    api
      .put(`/encadrant/tasks/${taskId}`, { status })
      .then(() => {
        loadTasks();
        loadDetail();
      })
      .finally(() => setBusy(false));
  };

  const deleteTask = (taskId) => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    setBusy(true);
    api
      .delete(`/encadrant/tasks/${taskId}`)
      .then(() => {
        loadTasks();
        loadDetail();
      })
      .finally(() => setBusy(false));
  };

  const addComment = (e) => {
    e.preventDefault();
    if (!commentBody.trim()) {
      flashError("Saisissez un commentaire avant d’enregistrer.");
      return;
    }
    setBusy(true);
    api
      .post(`/encadrant/applications/${id}/comments`, { body: commentBody.trim() })
      .then(() => {
        setCommentBody("");
        loadComments();
        loadDetail();
        flashSuccess("Commentaire enregistré.");
      })
      .catch((err) => {
        const msg =
          err.response?.data?.message ||
          (err.response?.data?.errors?.body && err.response.data.errors.body[0]) ||
          "Impossible d’enregistrer le commentaire.";
        flashError(typeof msg === "string" ? msg : "Erreur lors de l’enregistrement.");
      })
      .finally(() => setBusy(false));
  };

  const deleteComment = (commentId) => {
    if (!window.confirm("Supprimer ce commentaire ?")) return;
    setBusy(true);
    api
      .delete(`/encadrant/comments/${commentId}`)
      .then(() => {
        loadComments();
        loadDetail();
      })
      .finally(() => setBusy(false));
  };

  const saveEvaluation = (e) => {
    e.preventDefault();
    setBusy(true);
    api
      .put(`/encadrant/applications/${id}/evaluation`, {
        score: evalForm.score === "" ? null : Number(evalForm.score),
        final_decision: evalForm.final_decision,
        notes: evalForm.notes || null,
      })
      .then((res) => {
        setEvaluation(res.data);
        flashSuccess("Évaluation et notes enregistrées.");
      })
      .catch((err) => {
        const msg =
          err.response?.data?.message ||
          (err.response?.data?.errors && JSON.stringify(err.response.data.errors)) ||
          "Impossible d’enregistrer l’évaluation.";
        flashError(typeof msg === "string" ? msg : "Erreur de validation.");
      })
      .finally(() => setBusy(false));
  };

  if (!id) {
    return <p className="p-8 text-center text-red-600">Identifiant invalide</p>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <p className="text-slate-700">Candidature introuvable ou accès refusé.</p>
        <Link to="/enterprise/encadrant" className="mt-4 inline-block text-indigo-600 font-medium">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const s = detail.student;
  const offer = detail.offer;
  const interviews = detail.interviews || [];
  const cv = storageUrl(s?.cv_path || detail.cv);

  const tasks = tasksRes.data || [];
  const comments = commentsRes.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <Link
            to="/enterprise/encadrant"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 mb-4"
          >
            ← Retour
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{s?.name}</h1>
              <p className="text-slate-600 mt-1">{s?.email}</p>
              <p className="text-sm text-slate-500 mt-2">{s?.school} · {s?.field}</p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Statut candidature</label>
              <select
                value={detail.status}
                disabled={busy}
                onChange={(e) => patchStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 min-w-[200px]"
              >
                {APP_STATUSES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {cv && (
                <a
                  href={cv}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 font-medium hover:underline"
                >
                  Télécharger le CV
                </a>
              )}
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500 uppercase">Offre</p>
            <p className="font-semibold text-slate-900">{offer?.title}</p>
            <p className="text-sm text-slate-600 mt-1">
              {[offer?.domain, offer?.location].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {(formError || formSuccess) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              formError
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
            role="status"
          >
            {formError || formSuccess}
          </div>
        )}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Tâches</h2>
          <form onSubmit={addTask} className="rounded-2xl border border-slate-200 bg-white p-4 mb-6 space-y-3">
            <input
              placeholder="Titre de la tâche"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Description (optionnel)"
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Ajouter
            </button>
          </form>
          <ul className="space-y-3">
            {tasks.length === 0 && <p className="text-sm text-slate-500">Aucune tâche pour l’instant.</p>}
            {tasks.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex-1 min-w-[200px]">
                  <p className="font-medium text-slate-900">{t.title}</p>
                  {t.description && <p className="text-sm text-slate-600 mt-1">{t.description}</p>}
                  {t.due_date && (
                    <p className="text-xs text-slate-500 mt-1">Échéance : {t.due_date}</p>
                  )}
                </div>
                <select
                  value={t.status}
                  disabled={busy}
                  onChange={(e) => updateTaskStatus(t.id, e.target.value)}
                  className="rounded-lg border border-slate-200 text-sm px-2 py-1.5"
                >
                  {TASK_STATUSES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => deleteTask(t.id)}
                  disabled={busy}
                  className="text-sm text-rose-600 hover:underline"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Commentaires & feedback</h2>
          <form
            onSubmit={addComment}
            className="rounded-2xl border-2 border-slate-200 bg-white p-5 mb-6 space-y-4 shadow-sm"
          >
            <textarea
              placeholder="Votre commentaire ou retour pour le suivi du stagiaire…"
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="submit"
                disabled={busy}
                className="w-full sm:w-auto min-h-[44px] rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 border border-indigo-700"
              >
                Enregistrer le commentaire
              </button>
              <span className="text-xs text-slate-500">
                Cliquez sur le bouton pour sauvegarder (le simple fait de quitter la page n’enregistre pas).
              </span>
            </div>
          </form>
          <ul className="space-y-3">
            {comments.length === 0 && <p className="text-sm text-slate-500">Aucun commentaire.</p>}
            {comments.map((c) => (
              <li key={c.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex justify-between gap-2 text-xs text-slate-500">
                  <span>{c.encadrant?.name || "Encadrant"}</span>
                  <span>{c.created_at ? new Date(c.created_at).toLocaleString() : ""}</span>
                </div>
                <p className="text-sm text-slate-800 mt-2 whitespace-pre-wrap">{c.body}</p>
                <button
                  type="button"
                  onClick={() => deleteComment(c.id)}
                  disabled={busy}
                  className="mt-2 text-xs text-rose-600 hover:underline"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Évaluation de fin de stage</h2>
          <form
            onSubmit={saveEvaluation}
            className="rounded-2xl border-2 border-slate-200 bg-white p-6 space-y-4 max-w-xl shadow-sm"
          >
            <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              La <strong>note</strong>, la <strong>décision</strong> et les <strong>notes textuelles</strong> sont toutes enregistrées ensemble via le bouton vert « Enregistrer l’évaluation ».
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Note /20</label>
              <input
                type="number"
                min={0}
                max={20}
                step={0.5}
                value={evalForm.score}
                onChange={(e) => setEvalForm((f) => ({ ...f, score: e.target.value }))}
                className="w-full max-w-xs rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Décision finale</label>
              <select
                value={evalForm.final_decision}
                onChange={(e) => setEvalForm((f) => ({ ...f, final_decision: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                {DECISIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes écrites (appréciation, axes d’amélioration…)</label>
              <textarea
                value={evalForm.notes}
                onChange={(e) => setEvalForm((f) => ({ ...f, notes: e.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full sm:w-auto min-h-[48px] rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 border-2 border-emerald-700"
            >
              {evaluation ? "Mettre à jour l’évaluation et les notes" : "Enregistrer l’évaluation et les notes"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Historique des entretiens</h2>
          {interviews.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun entretien enregistré pour cette candidature.</p>
          ) : (
            <ol className="relative border-l border-slate-200 ml-3 space-y-6 pl-6">
              {interviews.map((it) => (
                <li key={it.id} className="relative">
                  <span className="absolute -left-[1.36rem] top-1.5 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-white" />
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-900">
                      {it.date} · {it.time}
                    </p>
                    {(it.location || it.meeting_link) && (
                      <p className="text-sm text-slate-600 mt-1">{it.location || it.meeting_link}</p>
                    )}
                    {it.result && <p className="text-sm mt-2">Résultat : <span className="font-medium">{it.result}</span></p>}
                    {it.comment && <p className="text-sm text-slate-700 mt-2">{it.comment}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
