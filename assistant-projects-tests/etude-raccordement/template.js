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

.copy-zone {
    display: inline-block;
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #fff;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
}

.copy-zone:hover {
    border-color: #007bff;
    background-color: #f0f7ff;
}

.copy-zone:active {
    transform: scale(0.98);
    background-color: #e0eefb;
}

.copy-zone.copied::after {
    content: "Copié !";
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    background: #28a745;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    pointer-events: none;
}
    </style>
</head>
<body>
    <header>
        <h1>Rapport d'Intervention</h1>
    </header>

    <main>
        <section class="info-card">
            <h3>Informations Dossier & Client</h3>
            <div class="row">
                <span class="label">N° Dossier :</span>
                <span class="val"><span class="copy-zone" onclick="cp(this)">${data.noDossier}</span></span>      
            </div>
            <div class="row">
                <span class="label">Client :</span>
                <span class="val">
                    <span class="copy-zone" onclick="cp(this)">${data.nomCli}</span> 
                    <span class="copy-zone" onclick="cp(this)">${data.prenomCli}</span>
                </span>
            </div>
            <div class="row">
                <span class="label">Adresse :</span>
                <span class="val">
                    <span class="copy-zone" onclick="cp(this)">${data.adresseCli}</span>, 
                    <span class="copy-zone" onclick="cp(this)">${data.cpCli}</span> 
                    <span class="copy-zone" onclick="cp(this)">${data.villeCli}</span>
                </span>
            </div>
            ${data.complementAdrCli ? `<div class="row"><span class="label">Complément :</span><span class="val"><span class="copy-zone" onclick="cp(this)">${data.complementAdrCli}</span></span></div>` : ''}
        </section>

        <section class="info-card">
            <h3>Données Réseau</h3>
            <div class="row">
                <span class="label">Dipôle :</span>
                <span class="val">N° <span class="copy-zone" onclick="cp(this)">${data.noDipole}</span> (Amont : <span class="copy-zone" onclick="cp(this)">${data.distAmont}</span>m)</span>
            </div>
            <div class="row">
                <span class="label">Point GPS :</span>
                <span class="val"><span class="copy-zone" onclick="cp(this)">${data.gps}</span></span>
            </div>
            <div class="row">
                <span class="label">Poste HTA/BT :</span>
                <span class="val">${data.nomPosteHTABT} (<span class="copy-zone" onclick="cp(this)">${data.codeGDOPosteHTABT}</span>)</span>
            </div>
            <div class="row">
                <span class="label">Départ BT :</span>
                <span class="val">${data.nomDepartBT} (<span class="copy-zone" onclick="cp(this)">${data.codeGDODepartBT}</span>)</span>
            </div>
        </section>

        <section class="info-card">
            <h3>Technique & Chiffrage</h3>
            <div class="row">
                <span class="label">Technique :</span>
                <span class="val">${data.techBranchement} (${data.typeBranchement})</span>
            </div>
            <div class="row">
                <span class="label">Longueurs :</span>
                <span class="val">Public: <span class="copy-zone" onclick="cp(this)">${data.longDomainePublic}</span>m / Privé: <span class="copy-zone" onclick="cp(this)">${data.longDomainePrive}</span>m</span>
            </div>
            <div class="row">
                <span class="label">Alimentation :</span>
                <span class="val">${data.nbPhasesConso} - ${data.puissanceRaccordement}</span>
            </div>
            <div class="row">
                <span class="label">Domaine / IRVE :</span>
                <span class="val">${data.domaineIntervention} / ${data.IRVE} (Schéma validé : ${data.schemaIRVE})</span>
            </div>
        </section>

        <section class="info-card">
            <h3>Détails des Travaux</h3>
            <div class="row">
                <span class="label">Habitation +2 ans :</span>
                <span class="val">${data.localHabitation}</span>
            </div>
            <div class="row">
                <span class="label">Charge demandeur :</span>
                <span class="val">${data.travauxChargeDemandeur}</span>
            </div>
            
            ${data.travauxChargeDemandeur === 'Oui' ? `
                <div style="margin-top:10px; padding:10px; background:#f9f9f9; border-radius:5px;">
                    <p><strong>Dates :</strong> Prévue le ${formatDate(data.datePrevue)} / Réelle le ${formatDate(data.dateReelle)}</p>
                    <p><strong>Actions réalisées :</strong><br>${data.listeTravaux || 'Aucune'}</p>
                    ${data.commTravaux ? `<p><strong>Commentaires :</strong><br><em><span class="copy-zone" onclick="cp(this)">${data.commTravaux}</span></em></p>` : ''}
                </div>
            ` : ''}
        </section>

        <hr>

        <section>
            <h3>Photos (${data.photos.length})</h3>
            <div class="photo-grid">
                ${data.photos.map((p, i) => `
                    <div class="photo-item">
                        <img src="photo_${i}.png">
                        <p><strong>${p.label || 'Photo ' + (i + 1)}</strong></p>
                        <p><small class="copy-zone" onclick="cp(this)">${p.gps || 'Pas de coordos'}</small></p>
                    </div>
                `).join('')}
            </div>
        </section>

        <section class="signature-section">
            <h3>Signature de l'agent</h3>
            <img src="signature.png" class="signature-img">
            <p><small>Document validé numériquement le ${new Date().toLocaleDateString('fr-FR')}</small></p>
        </section>
    </main>

    <footer>
        Généré par Assistant Projets EDF - 2026
    </footer>

    <script>
    function cp(element) {
        const text = element.innerText || element.textContent;
        if (!text || text === "N/A") return;
        navigator.clipboard.writeText(text).then(() => {
            element.classList.add('copied');
            const originalColor = element.style.color;
            element.style.color = "#28a745";
            setTimeout(() => {
                element.classList.remove('copied');
                element.style.color = originalColor;
            }, 1000);
        }).catch(err => {
            console.error('Erreur :', err);
        });
    }
    const formatDate = (dateStr) => {
      if (!dateStr) return "N/A";
      const [year, month, day] = dateStr.split('-');
      return ${day}/${month}/${year};
    };
    </script>
</body>
</html>`;
};
