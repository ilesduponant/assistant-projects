// template.js
const generateHTMLReport = (data) => {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport - ${data.noDossier}</title>
    <style>
        /* Intégration de ton CSS */
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f9;
            color: #333;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        main {
            width: 100%;
            max-width: 800px;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }

        header { text-align: center; margin-bottom: 20px; width: 100%; }

        h1 { color: #007bff; margin-bottom: 10px; font-size: 1.5rem; }
        h3 { margin-bottom: 15px; border-bottom: 2px solid #007bff; padding-bottom: 5px; }

        .info-card { margin-bottom: 20px; }
        
        .row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }

        .label { font-weight: bold; color: #555; }
        .val { font-weight: normal; color: #000; flex-grow: 1; margin-left: 10px; }

        /* Bouton copier inspiré de ton style de bouton */
        .btn-copy {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 5px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            width: auto; /* override du width 100% des boutons standards */
            margin-bottom: 0;
        }

        .btn-copy:hover { background-color: #0056b3; }

        .photo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }

        .photo-item {
            border: 1px solid #ccc;
            border-radius: 5px;
            padding: 10px;
            background: #fff;
            text-align: center;
        }

        .photo-item img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            margin-bottom: 8px;
        }

        .signature-section {
            margin-top: 30px;
            text-align: right;
        }

        .signature-img {
            max-width: 200px;
            border: 1px solid #eee;
            margin-top: 10px;
        }

        footer { margin-top: 30px; font-size: 0.8rem; color: #888; }

        hr {
            border: none;
            height: 3px;
            background-color: #007bff;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <header>
        <h1>Rapport d'Intervention</h1>
    </header>

    <main>
        <section class="info-card">
            <h3>Informations Dossier</h3>
            <div class="row">
                <span class="label">N° Dossier :</span>
                <span class="val" id="dossier">${data.noDossier}</span>
                <button class="btn-copy" onclick="cp('dossier')">Copier</button>
            </div>
            <div class="row">
                <span class="label">Client :</span>
                <span class="val" id="client">${data.nomCli} ${data.prenomCli}</span>
                <button class="btn-copy" onclick="cp('client')">Copier</button>
            </div>
            <div class="row">
                <span class="label">Adresse :</span>
                <span class="val" id="adresse">${data.adresseCli}, ${data.cpCli} ${data.villeCli}</span>
                <button class="btn-copy" onclick="cp('adresse')">Copier</button>
            </div>
        </section>

        <hr>

        <section>
            <h3>Photos (${data.photos.length})</h3>
            <div class="photo-grid">
                ${data.photos.map((p, i) => `
                    <div class="photo-item">
                        <img src="photo_${i}.png">
                        <p><strong>${p.label || 'Photo ' + (i + 1)}</strong></p>
                    </div>
                `).join('')}
            </div>
        </section>

        <section class="signature-section">
            <h3>Signature</h3>
            <img src="signature.png" class="signature-img">
            <p><small>Validé numériquement</small></p>
        </section>
    </main>

    <footer>
        Généré le ${new Date().toLocaleDateString('fr-FR')} - Assistant Projets
    </footer>

    <script>
        function cp(id) {
            const text = document.getElementById(id).innerText;
            navigator.clipboard.writeText(text).then(() => {
                const btn = event.target;
                const oldText = btn.innerText;
                btn.innerText = "Copié !";
                btn.style.backgroundColor = "#28a745";
                setTimeout(() => {
                    btn.innerText = oldText;
                    btn.style.backgroundColor = "#007bff";
                }, 1500);
            });
        }
    </script>
</body>
</html>`;
};
