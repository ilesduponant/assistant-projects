from http.server import BaseHTTPRequestHandler
import json
import os
import resend

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # 1. Gestion du contenu
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data)
            
            # 2. Config Resend
            resend.api_key = os.environ.get("RESEND_API_KEY")
            
            # 3. Préparation des données (comme avant)
            nom_client = body.get('nom_client', 'Inconnu')
            no_dossier = body.get('no_dossier', 'Sans Numero')
            zip_data = body.get('zip_data')

            # 4. Envoi Email
            params = {
                "from": "Rapports <onboarding@resend.dev>",
                "to": ["eryuv1829@gmail.com"],
                "subject": f"Rapport Vercel: {no_dossier} - {nom_client}",
                "html": f"<p>Dossier {no_dossier} reçu via Vercel.</p>",
                "attachments": [{"filename": f"rapport_{no_dossier}.zip", "content": zip_data}]
            }
            resend.Emails.send(params)

            # 5. Réponse Succès
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"message": "OK"}).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_OPTIONS(self):
        # Gestion du CORS pour le navigateur
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()