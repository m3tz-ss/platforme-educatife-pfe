import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  Button,
  Select,
  Option,
  Textarea,
  IconButton,
} from "@material-tailwind/react";
import { useEffect, useState } from "react";
import api from "../../services/api";
import { ChatBubbleBottomCenterTextIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function InterviewHistoryModal({
  open,
  onClose,
  applicationId,
}) {
  const [interviews, setInterviews] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [updateData, setUpdateData] = useState({ result: "pending", comment: "" });
  const [loading, setLoading] = useState(false);

  const fetchInterviews = () => {
    if (applicationId) {
      api
        .get(`/enterprise/applications/${applicationId}/interviews`)
        .then((res) => setInterviews(res.data));
    }
  };

  useEffect(() => {
    if (open) {
      fetchInterviews();
    } else {
      setEditingId(null);
    }
  }, [open, applicationId]);

  const handleStartEdit = (i) => {
    setEditingId(i.id);
    setUpdateData({ result: i.result || "pending", comment: i.comment || "" });
  };

  const handleUpdate = async (id) => {
    try {
      setLoading(true);
      await api.patch(`/enterprise/interviews/${id}/result`, updateData);
      setEditingId(null);
      fetchInterviews();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resultLabels = {
    accepted: { label: "Accepté", color: "text-green-600 bg-green-50" },
    rejected: { label: "Refusé", color: "text-red-600 bg-red-50" },
    pending: { label: "En attente", color: "text-purple-600 bg-purple-50" },
  };

  return (
    <Dialog open={open} handler={onClose} size="sm">
      <DialogHeader className="flex justify-between items-center border-b border-gray-100">
        <Typography variant="h5">Historique des entretiens</Typography>
        <IconButton variant="text" color="blue-gray" onClick={onClose}>
            <XMarkIcon className="w-5 h-5" />
        </IconButton>
      </DialogHeader>

      <DialogBody className="max-h-[60vh] overflow-y-auto">
        {interviews.length === 0 ? (
          <div className="text-center py-8">
            <Typography color="gray">Aucun entretien enregistré pour cette candidature.</Typography>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((i) => (
                <div key={i.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <Typography className="font-bold text-gray-900">
                                📅 {i.date} à {i.time}
                            </Typography>
                            <Typography variant="small" className="text-gray-500">
                                Lieu : {i.location || "Non spécifié"}
                            </Typography>
                        </div>
                        {editingId !== i.id && (
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${resultLabels[i.result || 'pending'].color}`}>
                                {resultLabels[i.result || 'pending'].label}
                            </span>
                        )}
                    </div>

                    {editingId === i.id ? (
                        <div className="space-y-3 mt-4 bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                            <Select 
                                label="Résultat" 
                                value={updateData.result}
                                onChange={(val) => setUpdateData({...updateData, result: val})}
                            >
                                <Option value="pending">En attente</Option>
                                <Option value="accepted">Accepter</Option>
                                <Option value="rejected">Refuser</Option>
                            </Select>
                            <Textarea 
                                label="Commentaire" 
                                value={updateData.comment}
                                onChange={(e) => setUpdateData({...updateData, comment: e.target.value})}
                            />
                            <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="text" color="red" onClick={() => setEditingId(null)}>Annuler</Button>
                                <Button size="sm" color="blue" onClick={() => handleUpdate(i.id)} disabled={loading}>
                                    {loading ? "Enregistrement..." : "Enregistrer"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {i.comment && (
                                <div className="mt-2 bg-white/50 p-3 rounded-lg flex gap-2 items-start border border-gray-100">
                                    <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <Typography variant="small" className="text-gray-600 italic">
                                        {i.comment}
                                    </Typography>
                                </div>
                            )}
                            <div className="mt-3 flex justify-end">
                                <Button 
                                    size="sm" 
                                    variant="text" 
                                    color="blue" 
                                    className="flex items-center gap-1"
                                    onClick={() => handleStartEdit(i)}
                                >
                                    Modifier le statut
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            ))}
          </div>
        )}
      </DialogBody>
      <DialogFooter className="border-t border-gray-100">
          <Button variant="text" color="blue-gray" onClick={onClose}>Fermer</Button>
      </DialogFooter>
    </Dialog>
  );
}