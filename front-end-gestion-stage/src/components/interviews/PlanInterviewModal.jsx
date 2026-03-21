import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Input,
  Typography,
} from "@material-tailwind/react";
import { useState, useEffect } from "react";
import api from "../../services/api";

export default function PlanInterviewModal({
  open,
  onClose,
  applicationId,
  onSuccess,
}) {
  const [form, setForm] = useState({
    date: "",
    time: "",
    location: "",
    meeting_link: "",
  });

  const [loading, setLoading] = useState(false);

  // ✅ Reset formulaire à chaque ouverture
  useEffect(() => {
    if (open) {
      setForm({
        date: "",
        time: "",
        location: "",
        meeting_link: "",
      });
    }
  }, [open]);

  if (!open) return null; // ✅ Fix warning Material Tailwind

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.date || !form.time) {
      alert("Veuillez renseigner la date et l'heure de l'entretien.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/enterprise/interviews", {
        application_id: applicationId,
        ...form,
      });
      onSuccess(); // rafraîchit la liste
      onClose();   // ferme le modal
    } catch (e) {
      console.error("Erreur backend:", e.response?.data || e.message);
      alert(e.response?.data?.message || "Erreur lors de la planification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} handler={onClose}>
      <DialogHeader>Planifier un entretien</DialogHeader>

      <DialogBody className="flex flex-col gap-4">
        <Typography className="text-sm text-gray-600">
          Remplissez les informations de l’entretien
        </Typography>

        <Input
          type="date"
          name="date"
          label="Date"
          value={form.date}
          onChange={handleChange}
        />
        <Input
          type="time"
          name="time"
          label="Heure"
          value={form.time}
          onChange={handleChange}
        />
        <Input
          name="location"
          label="Lieu (présentiel)"
          value={form.location}
          onChange={handleChange}
        />
        <Input
          name="meeting_link"
          label="Lien visio"
          value={form.meeting_link}
          onChange={handleChange}
        />
      </DialogBody>

      <DialogFooter className="gap-2">
        <Button variant="text" onClick={onClose}>
          Annuler
        </Button>
        <Button
          color="blue"
          onClick={handleSubmit}
          disabled={loading || !form.date || !form.time}
        >
          {loading ? "Planification..." : "Confirmer"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}