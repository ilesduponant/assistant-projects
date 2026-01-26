const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const dest_mail = process.env.DEST_MAIL;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'https://ilesduponant.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { ile, description, files } = req.body;

        const data = await resend.emails.send({
            from: `Bon de livraison <onboarding@resend.dev>`,
            to: [dest_mail],
            subject: `DESTINATION ${ile}`,
            html: `
                <p><strong>Destination finale :</strong> ${ile}</p>
                <p><strong>Description :</strong> ${description || "Aucune description fournie"}</p>
            `,
            attachments: files.map(f => ({
                filename: f.filename,
                content: f.content, // Buffer base64
            })) 
        });

        return res.status(200).json({ status: 'success', id: data.id });
    } catch (error) {
        console.error("Erreur Resend:", error);
        return res.status(500).json({ error: error.message });
    }
}
