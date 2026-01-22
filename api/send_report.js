const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const dest_mail = process.env.DEST_MAIL;

export default async function handler(req, res) {
    // 1. Configuration des Headers CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://ilesduponant.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. Gestion de la requête de pré-vérification (Preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { nomCli, prenomCli, npCli, ile, no_dossier, zip_data } = req.body;

        // 3. Envoi via Resend
        const data = await resend.emails.send({
            from: 'Branchement <onboarding@resend.dev>',
            to: [dest_mail],
            subject: `BRANCHEMENT ${nomCli} - ${no_dossier}`,
            html: `<p>Informations pour l'étude de branchement <strong>${npCli}</strong>.</p><p>Dossier n°${no_dossier}</p>`,
            attachments: [
                {
                    filename: `Raccordement_${nomCli}_${ile}.zip`,
                    content: zip_data, //base64
                },
            ],
        });

        return res.status(200).json({ status: 'success', id: data.id });
    } catch (error) {
        console.error("Erreur Resend:", error);
        return res.status(500).json({ error: error.message });
    }
}
