import os
import json
import resend

def handler(event, context):
    # 1. Gestion du CORS (pour autoriser les appels depuis ton site)
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            }
        }

    if event['httpMethod'] != 'POST':
        return {'statusCode': 405, 'body': 'Method Not Allowed'}

    # 2. Initialisation Resend (La clé sera dans l'interface Netlify)
    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key:
        return {
            'statusCode': 500, 
            'body': json.dumps({"error": "Clé API manquante sur le serveur"})
        }
    
    resend.api_key = api_key

    try:
        # 3. Extraction des données
        body = json.loads(event['body'])
        nom_client = body.get('nom_client', 'Inconnu')
        no_dossier = body.get('no_dossier', 'Sans Numero')
        zip_data = body.get('zip_data') # On utilise la clé définie dans ton script.js

        if not zip_data:
            return {'statusCode': 400, 'body': json.dumps({"error": "Données ZIP manquantes"})}

        # 4. Envoi via Resend
        params = {
            "from": "Rapports <onboarding@resend.dev>",
            "to": ["eryuv1829@gmail.com"],
            "subject": f"Rapport Dossier: {no_dossier} - {nom_client}",
            "html": f"""
                <h3>Nouveau Rapport d'Intervention</h3>
                <p><strong>Client :</strong> {nom_client}</p>
                <p><strong>N° Dossier :</strong> {no_dossier}</p>
                <hr>
                <p>Ceci est un envoi automatique depuis la plateforme d'étude.</p>
            """,
            "attachments": [
                {
                    "filename": f"rapport_{no_dossier}.zip",
                    "content": zip_data
                }
            ]
        }

        email = resend.Emails.send(params)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "message": "Email envoyé avec succès !",
                "id": email.get('id')
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"error": str(e)})
        }