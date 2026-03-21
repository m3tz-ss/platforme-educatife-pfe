import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Select,
  Option,
  Textarea,
  Typography,
} from "@material-tailwind/react";
import { useState } from "react";
import api from "../../services/api";

export default function ResultInterviewModal({
  open,
  onClose,
  interviewId,
  onSuccess,
}) {
  const [result, setResult] = useState("pending");
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    try {
      await api.patch(`/enterprise/interviews/${interviewId}/result`, {
        result,
        comment,
      });
      onSuccess();
      onClose();
    } catch {
      alert("Erreur lors de l’enregistrement");
    }
  };

  return (
    <Dialog open={open} handler={onClose}>
      <DialogHeader>Résultat de l’entretien</DialogHeader>

      <DialogBody className="flex flex-col gap-4">
        <Typography className="text-sm text-gray-600">
          Sélectionnez le résultat final
        </Typography>

        <Select label="Résultat" value={result} onChange={setResult}>
          <Option value="accepted">Accepté</Option>
          <Option value="rejected">Refusé</Option>
          <Option value="pending">En attente</Option>
        </Select>

        <Textarea
          label="Commentaire RH"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </DialogBody>

      <DialogFooter>
        <Button variant="text" onClick={onClose}>
          Annuler
        </Button>
        <Button color="green" onClick={handleSubmit}>
          Enregistrer
        </Button>
      </DialogFooter>
    </Dialog>
  );
}