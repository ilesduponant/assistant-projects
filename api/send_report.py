import json
import os
import resend

ALLOWED_ORIGIN = "https://ilesduponant.github.io"

def handler(request):
    if request.method == "OPTIONS":
        return (
            "",
            200,
            {
                "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        )

    try:
        body = request.json()

        resend.api_key = os.environ.get("RESEND_API_KEY")

        nom_client = body.get("nom_client", "Inconnu")
        no_dossier = body.get("no_dossier", "Sans Numero")
        zip_data = body.get("zip_data")

        params = {
            "from": "Rapports <onboarding@resend.dev>",
            "to": ["eryuv1829@gmail.com"],
            "subject": f"Rapport: {no_dossier} - {nom_client}",
            "html": f"<p>Dossier {no_dossier} reçu pour {nom_client}.</p>",
            "attachments": [
                {"filename": f"chantier_{no_dossier}.zip", "content": zip_data}
            ],
        }

        resend.Emails.send(params)

        return (
            json.dumps({"status": "success"}),
            200,
            {
                "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                "Content-Type": "application/json",
            },
        )

    except Exception as e:
        return (
            json.dumps({"error": str(e)}),
            500,
            {
                "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
                "Content-Type": "application/json",
            },
        )

