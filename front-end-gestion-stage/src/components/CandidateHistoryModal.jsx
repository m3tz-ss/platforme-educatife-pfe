import { Dialog, DialogHeader, DialogBody, IconButton } from "@material-tailwind/react";
import {
  XMarkIcon,
  ClockIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline";

/* ── Configs ── */
const DECISION_CONFIG = {
  valide:       { label: "Validé",       icon: CheckCircleIcon,       color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  a_ameliorer:  { label: "À améliorer",  icon: ExclamationTriangleIcon, color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200"  },
  non_conforme: { label: "Non conforme", icon: XCircleIcon,            color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200"     },
  pending:      { label: "En attente",   icon: ClockIcon,              color: "text-slate-500",   bg: "bg-slate-50",   border: "border-slate-200"   },
};

const STATUS_CONFIG = {
  nouveau:         { label: "Nouveau",       bg: "#e0f2fe", color: "#075985" },
  preselectionnee: { label: "Présélection",  bg: "#dbeafe", color: "#1d4ed8" },
  entretien:       { label: "Entretien",     bg: "#f3e8ff", color: "#6b21a8" },
  acceptee:        { label: "Acceptée",      bg: "#dcfce7", color: "#166534" },
  refusee:         { label: "Refusée",       bg: "#fee2e2", color: "#991b1b" },
  termine:         { label: "Terminé",       bg: "#e0e7ff", color: "#3730a3" },
};

/* ── ScoreStars ── */
function ScoreStars({ score }) {
  if (score === null || score === undefined)
    return <span className="text-xs text-slate-400 italic">N/A</span>;
  const filled = Math.round((score / 20) * 5);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          className={`w-3.5 h-3.5 ${i <= filled ? "text-yellow-400" : "text-slate-200"}`}
          style={i <= filled ? { fill: "#facc15" } : {}}
        />
      ))}
      <span className="ml-1 text-xs font-bold text-slate-700">{score}/20</span>
    </div>
  );
}

/* ── Main Modal ── */
export default function CandidateHistoryModal({ open, student, history, loading, onClose }) {
  if (!open) return null;

  const globalAvg = history?.global_avg_score;
  const applications = history?.applications || [];

  return (
    <Dialog open={open} handler={onClose} size="xl" className="bg-white rounded-2xl">
      {/* Header */}
      <DialogHeader className="border-b border-slate-100 p-5">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow">
              {student?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-black text-slate-900 text-base leading-tight">{student?.name}</p>
              <p className="text-xs text-slate-400">{student?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {globalAvg !== null && globalAvg !== undefined && (
              <div className="text-center bg-gradient-to-br from-violet-50 to-purple-50 border border-purple-100 rounded-xl px-4 py-2">
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Score Global</p>
                <p className={`text-2xl font-black ${globalAvg >= 14 ? "text-emerald-600" : globalAvg >= 10 ? "text-orange-500" : "text-red-500"}`}>
                  {globalAvg}<span className="text-sm font-medium text-slate-400">/20</span>
                </p>
              </div>
            )}
            <IconButton variant="text" color="blue-gray" onClick={onClose}>
              <XMarkIcon className="w-5 h-5" />
            </IconButton>
          </div>
        </div>
      </DialogHeader>

      {/* Body */}
      <DialogBody className="p-5 max-h-[72vh] overflow-y-auto bg-slate-50/40">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-purple-200 border-t-purple-500 animate-spin" />
            <p className="text-sm text-slate-400">Chargement de l'historique...</p>
          </div>
        ) : (
          <>
            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {student?.school && (
                <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">École</p>
                  <p className="text-sm font-semibold text-slate-700">{student.school}</p>
                </div>
              )}
              {student?.field && (
                <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Domaine</p>
                  <p className="text-sm font-semibold text-slate-700">{student.field}</p>
                </div>
              )}
              <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Stages effectués</p>
                <p className="text-sm font-semibold text-slate-700">
                  {history?.total_internships || 0}
                  {history?.completed_internships > 0 && (
                    <span className="text-xs text-emerald-600 ml-1">
                      ({history.completed_internships} terminé{history.completed_internships > 1 ? "s" : ""})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Skills */}
            {Array.isArray(student?.skills) && student.skills.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm mb-5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Compétences</p>
                <div className="flex flex-wrap gap-1.5">
                  {student.skills.map((sk, i) => (
                    <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                      {typeof sk === "object" ? sk.name : sk}
                      {typeof sk === "object" && sk.level && (
                        <span className="ml-1 text-blue-400">{"★".repeat(sk.level)}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* History title */}
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              Historique des stages ({applications.length})
            </p>

            {/* Empty state */}
            {applications.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
                <BriefcaseIcon className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">Aucun stage précédent</p>
                <p className="text-xs text-slate-300 mt-1">Ce candidat n'a pas encore d'historique de stage.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => {
                  const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.nouveau;
                  return (
                    <div key={app.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                      {/* Card header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <BuildingOfficeIcon className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{app.offer?.title || "Offre inconnue"}</p>
                            <p className="text-xs text-slate-400">
                              {app.offer?.enterprise?.name || "Entreprise inconnue"}
                              {app.offer?.duration && <span> · {app.offer.duration}</span>}
                              {app.offer?.location && <span> · {app.offer.location}</span>}
                            </p>
                            {(app.offer?.enterprise?.email || app.offer?.enterprise?.phone) && (
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                                {app.offer?.enterprise?.email && (
                                  <span className="flex items-center gap-1">
                                    <EnvelopeIcon className="w-3 h-3" /> {app.offer.enterprise.email}
                                  </span>
                                )}
                                {app.offer?.enterprise?.phone && (
                                  <span className="flex items-center gap-1">
                                    <PhoneIcon className="w-3 h-3" /> {app.offer.enterprise.phone}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {app.avg_score !== null && app.avg_score !== undefined && (
                            <ScoreStars score={app.avg_score} />
                          )}
                          <span
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: sc.bg, color: sc.color }}
                          >
                            {sc.label}
                          </span>
                        </div>
                      </div>

                      {/* Evaluations */}
                      {app.evaluations.length > 0 ? (
                        <div className="p-3 space-y-2">
                          {app.evaluations.map((ev, eIdx) => {
                            const dc = DECISION_CONFIG[ev.final_decision] || DECISION_CONFIG.pending;
                            const DecisionIcon = dc.icon;
                            return (
                              <div key={eIdx} className={`rounded-lg border ${dc.border} ${dc.bg} p-3`}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <DecisionIcon className={`w-4 h-4 ${dc.color}`} />
                                    <span className={`text-xs font-bold ${dc.color}`}>{dc.label}</span>
                                    {ev.evaluator && (
                                      <span className="text-[10px] text-slate-400">
                                        par {ev.evaluator.name} {ev.evaluator.email && `(${ev.evaluator.email})`}
                                        <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-black ${
                                          ev.evaluator.role === "manager" ? "bg-blue-100 text-blue-600" :
                                          (ev.evaluator.role === "rh" || ev.evaluator.role === "enterprise") ? "bg-purple-100 text-purple-600" :
                                          "bg-green-100 text-green-600"
                                        }`}>
                                          {ev.evaluator.role === "manager" ? "Manager" : (ev.evaluator.role === "rh" || ev.evaluator.role === "enterprise") ? "RH / Entreprise" : "Encadrant"}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                  <ScoreStars score={ev.score} />
                                </div>
                                {ev.notes && (
                                  <p className="text-xs text-slate-600 italic leading-relaxed">"{ev.notes}"</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="px-4 py-3 border-b border-slate-50">
                          <p className="text-xs text-slate-300 italic">Aucune évaluation pour ce stage.</p>
                        </div>
                      )}

                      {/* Comments (Feedback Encadrant) */}
                      {app.encadrant_comments && app.encadrant_comments.length > 0 && (
                        <div className="bg-slate-50/50 p-4 border-t border-slate-100">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-slate-400" />
                            Feedbacks durant le stage
                          </h4>
                          <div className="space-y-3">
                            {app.encadrant_comments.map((comment, cIdx) => (
                              <div key={cIdx} className="bg-white rounded-lg border border-slate-100 p-3 shadow-sm">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {comment.encadrant?.name || "Encadrant"} 
                                    {comment.encadrant?.email && <span className="text-slate-400 font-normal ml-1">({comment.encadrant.email})</span>}
                                    <span className="text-slate-300 ml-1">· {new Date(comment.created_at).toLocaleDateString('fr-FR')}</span>
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{comment.body}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </DialogBody>
    </Dialog>
  );
}
