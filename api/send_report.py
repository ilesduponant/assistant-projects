from http.server import BaseHTTPRequestHandler
import json
import os
import resend

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        # Indispensable pour autoriser les requêtes provenant de ton site GitHub
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data)
            resend.api_key = os.environ.get("RESEND_API_KEY")
            
            nom_client = body.get('nom_client', 'Inconnu')
            no_dossier = body.get('no_dossier', 'Sans Numero')
            zip_data = body.get('zip_data')

            # Envoi via Resend
            params = {
                "from": "Rapports <onboarding@resend.dev>",
                "to": ["eryuv1829@gmail.com"],
                "subject": f"Rapport: {no_dossier} - {nom_client}",
                "html": f"<strong>Nouveau rapport reçu</strong><br>Dossier: {no_dossier}<br>Client: {nom_client}",
                "attachments": [
                    {
                        "filename": f"photos_{no_dossier}.zip",
                        "content": list(zip_data) if isinstance(zip_data, bytes) else zip_data
                    }
                ]
            }
            
            resend.Emails.send(params)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success"}).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())