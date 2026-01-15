from http.server import BaseHTTPRequestHandler
import json
import os
import resend

class handler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        # Autorise spécifiquement ton origine GitHub
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data)
            
            resend.api_key = os.environ.get("RESEND_API_KEY")
            
            nom_client = body.get('nom_client', 'Inconnu')
            no_dossier = body.get('no_dossier', 'Sans Numero')
            zip_data = body.get('zip_data')

            params = {
                "from": "Rapports <onboarding@resend.dev>",
                "to": ["eryuv1829@gmail.com"],
                "subject": f"Rapport: {no_dossier} - {nom_client}",
                "html": f"<p>Dossier {no_dossier} reçu pour {nom_client}.</p>",
                "attachments": [{"filename": f"chantier_{no_dossier}.zip", "content": zip_data}]
            }
            
            resend.Emails.send(params)
            
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "success"}).encode())

        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": str(e)}).encode())
