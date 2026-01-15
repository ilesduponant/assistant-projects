// template.js

// Cette fonction prend l'objet "data" envoyé par script.js
const generateHTMLReport = (data) => {
    
    // On prépare le listing des photos en HTML avant de l'injecter
    const photoItems = data.photos.map((p, i) => `
        <div class="img-item">
            <img src="photo_${i}.png">
            <p><strong>${p.label || 'Sans titre'}</strong></p>
            ${p.gps ? `<small style="color:gray">${p.gps}</small>` : ''}
        </div>
    `).join('');

    // On retourne la grosse chaîne de caractères (Template Literal)
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport - ${data.noDossier}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background: #f0f2f5; color: #1c1e21; }
        .container { max-width: 900px; margin: auto; }
        .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin-bottom: 25px; }
        h1 { color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
        .label { font-weight: 600; color: #606770; }
        .val { font-weight: bold; color: #1c1e21; font-size: 1.1em; }
        
        /* Bouton Copier */
        .btn-copy { 
            cursor: pointer; background: #e7f3ff; color: #1877f2; 
            border: none; padding: 8px 15px; border-radius: 6px; 
            font-weight: bold; transition: all 0.2s;
        }
        .btn-copy:hover { background: #dbeafe; transform: scale(1.05); }
        .btn-copy:active { transform: scale(0.95); }

        .img-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .img-item { background: white; padding: 15px; border-radius: 10px; border: 1px solid #e4e6eb; text-align: center; }
        img { width: 100%; border-radius: 8px; margin-bottom: 10px; }
        
        .sig-container { text-align: right; margin-top: 30px; }
        .sig-img { max-width: 200px; border-bottom: 1px solid #333; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>Rapport : ${data.noDossier}</h1>
            <div class="row">
                <span><span class="label">Client :</span> <span class="val" id="copy-cli">${data.nomCli} ${data.prenomCli}</span></span>
                <button class="btn-copy" onclick="cp('copy-cli')">Copier</button>
            </div>
            <div class="row">
                <span><span class="label">Adresse :</span> <span class="val" id="copy-addr">${data.adresseCli}, ${data.cpCli} ${data.villeCli}</span></span>
                <button class="btn-copy" onclick="cp('copy-addr')">Copier</button>
            </div>
        </div>

        <h3>Photos d'intervention</h3>
        <div class="img-grid">
            ${photoItems}
        </div>

        <div class="sig-container">
            <p class="label">Signature du client :</p>
            <img src="signature.png" class="sig-img">
        </div>
    </div>

    <script>
        // Cette fonction s'exécute CHEZ LE DESTINATAIRE (dans son navigateur)
        function cp(id) {
            const text = document.getElementById(id).innerText;
            navigator.clipboard.writeText(text).then(() => {
                const btn = event.target;
                const original = btn.innerText;
                btn.innerText = "Copié !";
                btn.style.background = "#42b72a";
                btn.style.color = "white";
                setTimeout(() => {
                    btn.innerText = original;
                    btn.style.background = "#e7f3ff";
                    btn.style.color = "#1877f2";
                }, 1500);
            });
        }
    </script>
</body>
</html>`;
};