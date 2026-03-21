import {
  Dialog,
  DialogHeader,
  DialogBody,
  Typography,
} from "@material-tailwind/react";
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function InterviewHistoryModal({
  open,
  onClose,
  applicationId,
}) {
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    if (open) {
      api
        .get(`/enterprise/applications/${applicationId}/interviews`)
        .then((res) => setInterviews(res.data));
    }
  }, [open, applicationId]);

  return (
    <Dialog open={open} handler={onClose}>
      <DialogHeader>Historique des entretiens</DialogHeader>

      <DialogBody>
        {interviews.length === 0 ? (
          <Typography>Aucun entretien</Typography>
        ) : (
          interviews.map((i) => (
            <div key={i.id} className="mb-4 border-b pb-2">
              <Typography>
                📅 {i.date} à {i.time}
              </Typography>
              <Typography>
                📊 Résultat : {i.result ?? "—"}
              </Typography>
              {i.comment && (
                <Typography className="text-sm text-gray-600">
                  📝 {i.comment}
                </Typography>
              )}
            </div>
          ))
        )}
      </DialogBody>
    </Dialog>
  );
}