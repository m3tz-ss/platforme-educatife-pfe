import { Button, Input, Typography, Card } from "@material-tailwind/react";

export default function CreateOffer() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Typography variant="h4" className="mb-6">
        Nouvelle offre de stage
      </Typography>

      <Card className="p-6 space-y-4">
        <Input label="Titre de l'offre" />
        <Input label="Localisation" />
        <Input label="Durée" />
        <textarea
          className="w-full border rounded p-2"
          placeholder="Description"
          rows={4}
        />

        <Button color="blue" fullWidth>
          Enregistrer
        </Button>
      </Card>
    </div>
  );
}