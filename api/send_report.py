from http.server import BaseHTTPRequestHandler
import json
import os
import resend

ALLOWED_ORIGIN = "https://ilesduponant.github.io"

class handler(BaseHTTPRequestHandler):

    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data)

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
                ]
            }

            resend.Emails.send(params)

            self.send_response(200)
            self._set_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success"}).encode())

        except Exception as e:
            self.send_response(500)
            self._set_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

