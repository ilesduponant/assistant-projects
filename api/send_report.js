import { Resend } from "resend";

export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "https://ilesduponant.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { nom_client, no_dossier, zip_data } = req.body;

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Rapports <onboarding@resend.dev>",
      to: ["eryuv1829@gmail.com"],
      subject: `Rapport: ${no_dossier} - ${nom_client}`,
      html: `<p>Dossier ${no_dossier} reçu pour ${nom_client}.</p>`,
      attachments: [
        {
          filename: `chantier_${no_dossier}.zip`,
          content: zip_data
        }
      ]
    });

    res.status(200).json({ status: "success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
