// --- VARIABLES GLOBALES ---
const photosInput = document.getElementById("photos");
const photoPreviewContainer = document.getElementById("photo-preview");
const takePhotoButton = document.getElementById("take-photo");
const savePhotoButton = document.getElementById("save-photo");
const camera = document.getElementById("camera");
const cameraCanvas = document.getElementById("camera-canvas");
const cameraContext = cameraCanvas.getContext("2d");

let photoList = []; // { original, current, drawings, label, gps }
let hasSignature = false;

// --- GESTION DES PHOTOS & CAMERA ---
photosInput.addEventListener("change", (event) => {
    const files = Array.from(event.target.files);
    files.forEach((file) => {
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => addPhotoToPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    });
    event.target.value = "";
});

takePhotoButton.addEventListener("click", async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false
        });
        camera.srcObject = stream;
        camera.setAttribute("playsinline", true);
        camera.style.display = "block";
        savePhotoButton.style.display = "inline-block";
        camera.play();
    } catch (error) {
        alert("Erreur caméra : " + error);
    }
});

savePhotoButton.addEventListener("click", () => {
    cameraCanvas.width = camera.videoWidth;
    cameraCanvas.height = camera.videoHeight;
    cameraContext.drawImage(camera, 0, 0);
    addPhotoToPreview(cameraCanvas.toDataURL("image/png"));
    const stream = camera.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    camera.style.display = "none";
    savePhotoButton.style.display = "none";
});

function addPhotoToPreview(photoData) {
    const photoObject = {
        original: photoData,
        current: photoData,
        drawings: [],
        label: "",
        gpsLat: null,
        gpsLon: null
    };

    photoList.push(photoObject); // On ajoute à la mémoire
    renderPhotos(); // On demande l'affichage
}

function renderPhotos() {
    // On vide le conteneur actuel
    photoPreviewContainer.innerHTML = "";

    // On parcourt la liste des photos stockées
    photoList.forEach((photoObject, idx) => {
        const photoContainer = document.createElement("div");
        photoContainer.className = "photo-item";
        // Position relative indispensable pour le badge poubelle
        photoContainer.style = "position:relative; display:inline-block; margin:15px; width:140px; vertical-align:top; border:1px solid #ddd; padding:5px; background:#fff; border-radius:5px;";

        // --- 1. BOUTON POUBELLE (Badge en haut à droite) ---
        const deleteBtn = document.createElement("div");
        deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
        deleteBtn.style = "position:absolute; top:-12px; right:-12px; background:#dc3545; color:white; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.2); z-index:10;";
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm("Supprimer cette photo ?")) {
                photoList.splice(idx, 1);
                renderPhotos();
            }
        };
        photoContainer.appendChild(deleteBtn);

        // --- 2. IMAGE APERÇU ---
        const img = document.createElement("img");
        img.src = photoObject.current; 
        img.style = "width:100%; height:100px; object-fit:cover; border-radius:3px;";
        photoContainer.appendChild(img);

        // --- 3. INFOS GPS ---
        const gpsInfo = document.createElement("div");
        gpsInfo.style = "font-size:9px; color:#666; text-align:center; margin:5px 0; height:12px;";
        gpsInfo.textContent = photoObject.gpsLat ? `${photoObject.gpsLat}, ${photoObject.gpsLon}` : "Pas de GPS";
        photoContainer.appendChild(gpsInfo);

        // --- 4. CHAMP LIBELLÉ ---
        const labelInp = document.createElement("input");
        labelInp.placeholder = "Libellé...";
        labelInp.value = photoObject.label || "";
        labelInp.style = "width:100%; margin-bottom:8px; font-size:11px; padding:2px; border:1px solid #ccc; border-radius:3px;";
        labelInp.oninput = () => { photoObject.label = labelInp.value; };
        photoContainer.appendChild(labelInp);

        // --- 5. GROUPE DE BOUTONS (GPS + MODIFIER) ---
        const actionGroup = document.createElement("div");
        actionGroup.style = "display: flex; gap: 4px;";

        // Bouton GPS (Fixer position)
        const gpsBtn = document.createElement("button");
        gpsBtn.type = "button";
        gpsBtn.innerHTML = '<i data-lucide="map-pin"></i>';
        gpsBtn.style = `flex:1; height:32px; display:flex; align-items:center; justify-content:center; background:${photoObject.gpsLat ? '#28a745' : '#ffc107'}; color:white; border-radius:4px; border:none; cursor:pointer;`;
        gpsBtn.onclick = () => {
            navigator.geolocation.getCurrentPosition((pos) => {
                photoObject.gpsLat = pos.coords.latitude.toFixed(6);
                photoObject.gpsLon = pos.coords.longitude.toFixed(6);
                renderPhotos(); 
            }, () => alert("Erreur GPS"), { enableHighAccuracy: true });
        };

        // Bouton Modifier (Dessin)
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.innerHTML = '<i data-lucide="pen-line"></i>';
        editBtn.style = "flex:1; height:32px; display:flex; align-items:center; justify-content:center; background:#007bff; color:white; border-radius:4px; border:none; cursor:pointer;";
        editBtn.onclick = () => {
            openEditorInNewTab(photoObject.original, idx, photoObject.drawings);
        };

        actionGroup.appendChild(gpsBtn);
        actionGroup.appendChild(editBtn);
        photoContainer.appendChild(actionGroup);

        // On ajoute tout le container à la preview
        photoPreviewContainer.appendChild(photoContainer);
    });

    // TRÈS IMPORTANT : On relance Lucide une fois que tout le DOM est construit
    lucide.createIcons();
}// --- RÉCEPTION DE L'IMAGE ÉDITÉE ---
window.addEventListener("message", (event) => {
    // Sécurité : On vérifie que les données attendues sont présentes
    if (event.data && event.data.editedImage) {
        const idx = event.data.index;
        
        // Mise à jour de la photo spécifique dans la liste
        if (photoList[idx]) {
            // On remplace l'image actuelle par la version annotée
            photoList[idx].current = event.data.editedImage;
            
            // On sauvegarde le stack de dessins (points, formes) 
            // pour pouvoir ré-éditer sans repartir de zéro
            photoList[idx].drawings = event.data.drawings; 
            
            renderPhotos(); 
            
            console.log(`Photo ${idx} mise à jour avec succès.`);
        }
    }
}, false);

// --- SIGNATURE & INITIALISATION ---
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("signature-representant-canvas");
    const ctx = canvas.getContext("2d");
    let drawing = false;

    // Configuration du trait pour que ce soit plus fluide
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";

    const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        // On ne redimensionne que si la taille a vraiment changé 
        // pour éviter d'effacer la signature lors du scroll
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        return { 
            x: e.clientX - rect.left, 
            y: e.clientY - rect.top 
        };
    };

    canvas.addEventListener("pointerdown", (e) => {
        drawing = true;
        hasSignature = true;
        
        // Capture le pointeur pour éviter que le scroll ne reprenne
        canvas.setPointerCapture(e.pointerId);
        
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    });

    canvas.addEventListener("pointermove", (e) => {
        if (!drawing) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    });

    canvas.addEventListener("pointerup", (e) => {
        if (!drawing) return;
        drawing = false;
        canvas.releasePointerCapture(e.pointerId);
    });

    // Gestion de l'annulation (si on sort du canvas)
    canvas.addEventListener("pointercancel", (e) => {
        drawing = false;
        canvas.releasePointerCapture(e.pointerId);
    });

    document.getElementById("clear-representant").onclick = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasSignature = false;
    };
});
// --- GENERATION PDF & ENVOI ---
document.getElementById("generatePDF").onclick = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!hasSignature) return alert("⚠️ Signature obligatoire !");

    const btn = e.target;
    btn.disabled = true;
    btn.textContent = "⌛ Traitement...";

	function validateForm() {
    // 1. On récupère tous les champs qui ont l'attribut 'required'
    const requiredFields = document.querySelectorAll("[required]");
    let missingFields = [];

    requiredFields.forEach(field => {
        // On vérifie si c'est vide (on enlève les espaces avec trim)
        if (!field.value.trim()) {
            // On récupère le nom du champ pour l'alerte (via le label ou l'id)
            const label = field.previousElementSibling?.innerText || field.id;
            missingFields.push(label);
            field.style.border = "2px solid red"; // Petit retour visuel
        } else {
            field.style.border = ""; // On remet normal si c'est bon
        }
    });

    // 2. Si des champs manquent, on arrête tout
    if (missingFields.length > 0) {
        alert("⚠️ Erreur : Les champs suivants sont obligatoires :\n- " + missingFields.join("\n- "));
        return false; // Bloque la suite
    }

    return true; // Tout est OK
}
    // 1. Collecte des données
    // --- COLLECTE DES DONNÉES COMPLÈTE ---
const data = {
    // Informations client
    nomCli: document.getElementById("nomCli").value || "",
    prenomCli: document.getElementById("prenomCli").value || "",
    noDossier: document.getElementById("noDossier").value || "",
    adresseCli: document.getElementById("adresseCli").value || "",
    cpCli: document.getElementById("cpCli").value || "",
    villeCli: document.getElementById("villeCli").value || "",
    complementAdrCli: document.getElementById("complementAdrCli").value || "",
    
    // Données sur le réseau
    noDipole: document.getElementById("noDipole").value || "",
    distAmont: document.getElementById("distAmont").value || "",
    gpsLat: document.getElementById("gps-lat").value || "",
gpsLon: document.getElementById("gps-lon").value || "",    
	nomDepartBT: document.getElementById("nomDepartBT").value || "",
    codeGDODepartBT: document.getElementById("codeGDODepartBT").value || "",
    nomPosteHTABT: document.getElementById("nomPosteHTABT").value || "",
    codeGDOPosteHTABT: document.getElementById("codeGDOPosteHTABT").value || "",
    
    // Raccordement
    techBranchement: document.getElementById("techBranchement").value || "",
    typeBranchement: document.querySelector('input[name="typeBranchement"]:checked')?.value || "",
    longDomainePublic: document.getElementById("longDomainePublic").value || "",
    longDomainePrive: document.getElementById("longDomainePrive").value || "",
    trancheeEtFourreau: document.querySelector('input[name="trancheeEtFourreau"]:checked')?.value || "",
    
    // Chiffrage
    domaineIntervention: document.getElementById("domaineIntervention").value || "",
    IRVE: document.getElementById("IRVE").value || "",
    schemaIRVE: document.querySelector('input[name="schemaIRVE"]:checked')?.value || "",
    nbPhasesConso: document.querySelector('input[name="nbPhasesConso"]:checked')?.value || "",
    puissanceRaccordement: document.getElementById("puissanceRaccordement").value || "",
    puissanceSouscrite: document.getElementById("puissanceSouscrite").value || "",
    
    // Détails des travaux
    localHabitation: document.querySelector('input[name="localHabitation"]:checked')?.value || "",
    travauxChargeDemandeur: document.querySelector('input[name="travauxChargeDemandeur"]:checked')?.value || "",
    
    // Données de la section conditionnelle (Travaux charge demandeur)
    datePrevue: document.getElementById("datePrevue").value || "",
    dateReelle: document.getElementById("dateReelle").value || "",
    // Récupération des cases cochées
    listeTravaux: Array.from(document.querySelectorAll('input[name="listeTravaux"]:checked'))
        .map(cb => cb.value)
        .join(", "),
    commTravaux: document.getElementById("commTravaux").value || "",
    
    // Médias et Signature
    signature: document.getElementById("signature-representant-canvas").toDataURL(),
    photos: photoList
};
    try {
        // 2. Génération du PDF (optionnel)
        await genererPDF(data);

        // 3. Préparation du ZIP
        const zip = new JSZip();
        
        // Ajout du HTML (via template.js)
        const htmlTemplate = generateHTMLReport(data);
        zip.file("CONSULTATION.html", htmlTemplate);

        // Ajout de la signature en image pour le HTML
        const signatureBase64 = data.signature.split(',')[1];
        zip.file("signature.png", signatureBase64, { base64: true });

        // Ajout des photos
        data.photos.forEach((p, i) => {
            const base64Content = p.current.split(',')[1];
            zip.file(`photo_${i}.png`, base64Content, { base64: true });
        });

        // 4. Génération du ZIP en Base64
        const base64Zip = await zip.generateAsync({ type: "base64" });

        // 5. Envoi à l'API Vercel
        const response = await fetch('https://assistant-projects.vercel.app/api/send_report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nom_client: `${data.nomCli} ${data.prenomCli}`,
                no_dossier: data.noDossier,
                zip_data: base64Zip
            })
        });

        if (response.ok) {
            alert("✅ Rapport envoyé avec succès !");
        } else {
            const errorText = await response.text();
            alert("❌ Erreur lors de l'envoi : " + response.status);
            console.error("Détails erreur:", errorText);
        }

    } catch (err) {
        console.error("Erreur complète:", err);
        alert("❌ Erreur : " + err.message);
    } finally {
        // 6. Réactivation du bouton
        btn.disabled = false;
        btn.textContent = "Générer PDF & Envoyer";
    }
};
// --- LOGIQUE PDF ---
async function genererPDF(data) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    pdf.text(`Rapport d'intervention : ${data.nomCli}`, 20, 20);
    pdf.text(`Dossier : ${data.noDossier}`, 20, 30);
    let y = 50;
    data.photos.forEach(p => {
        if(y > 250) { pdf.addPage(); y = 20; }
        pdf.addImage(p.current, 'PNG', 20, y, 50, 40);
        pdf.text(p.label + " (" + (p.gps || "Pas de GPS") + ")", 75, y + 20);
        y += 50;
    });
    pdf.addPage();
    pdf.addImage(data.signature, 'PNG', 20, 30, 60, 30);
    pdf.save(`Rapport_${data.nomCli}.pdf`);
}

// --- HELPERS GLOBALES ---
window.syncIdentite = () => {
    document.getElementById('nomTravaux').value = document.getElementById('nomCli').value;
    document.getElementById('prenomTravaux').value = document.getElementById('prenomCli').value;
};

window.copyAdresseClient = () => {
    document.getElementById('adresseTravaux').value = document.getElementById('adresseCli').value;
    document.getElementById('cpTravaux').value = document.getElementById('cpCli').value;
    document.getElementById('villeTravaux').value = document.getElementById('villeCli').value;
};

document.getElementById('noDipole').addEventListener('input', function (e) {
    this.value = this.value.replace(/[^0-9]/g, ''); // Supprime tout ce qui n'est pas un chiffre
});

function updatePuissance() {
    const selectRacc = document.getElementById("puissanceRaccordement");
    const selectSous = document.getElementById("puissanceSouscrite");
    const isMono = document.getElementById("monophase").checked;
    
    if (!selectRacc) return; // Sécurité si l'élément n'existe pas encore

    // On vide les sélecteurs
    selectRacc.innerHTML = "";
    if (selectSous) selectSous.innerHTML = "";

    // --- 1. PUISSANCE DE RACCORDEMENT ---
    const optionsRacc = isMono ? ["3 kVA", "12 kVA"] : ["3 kVA", "36 kVA"];
    selectRacc.add(new Option("Sélectionnez le raccordement", ""));
    optionsRacc.forEach(pwr => {
        selectRacc.add(new Option(pwr, pwr));
    });

    // --- 2. PUISSANCE SOUHAITÉE (SOUSCRITE) ---
    if (selectSous) {
        selectSous.add(new Option("Sélectionnez la puissance souhaitée", ""));
        
        let paliers;
        if (isMono) {
            paliers = ["3 kVA", "6 kVA", "9 kVA", "12 kVA"];
        } else {
            paliers = ["6 kVA", "9 kVA", "12 kVA", "15 kVA", "18 kVA", "24 kVA", "30 kVA", "36 kVA"];
        }

        paliers.forEach(pwr => {
            selectSous.add(new Option(pwr, pwr));
        });
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const radios = document.querySelectorAll('input[name="nbPhasesConso"]');
    radios.forEach(r => r.addEventListener("change", updatePuissance));
    
    updatePuissance();
});

function toggleTravaux() {
    const section = document.getElementById("sectionTravaux");
    const isOui = document.querySelector('input[name="travauxChargeDemandeur"][value="Oui"]').checked;
    
    section.style.display = isOui ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
    // Synchronise auto : la value prend le texte du label
    document.querySelectorAll('.checkbox-item').forEach(item => {
        const input = item.querySelector('input');
        if (input && input.value === "") {
            input.value = item.textContent.trim();
        }
    });
});

async function getLocation() {
    const latInput = document.getElementById("gps-lat");
    const lonInput = document.getElementById("gps-lon");
    
    if (!navigator.geolocation) {
        return alert("❌ La géolocalisation n'est pas supportée.");
    }

    latInput.value = "⌛..."; 
    lonInput.value = "⌛...";

    const getPos = (options) => new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });

    try {
        const firstPos = await getPos({ enableHighAccuracy: false });
        latInput.value = "🛰️ satellite...";
        lonInput.value = "🛰️ satellite...";
        
        await new Promise(r => setTimeout(r, 50));

        try {
            const precisePos = await getPos({ 
                enableHighAccuracy: true, 
                timeout: 10000, 
                maximumAge: 0 
            });
            
            latInput.value = precisePos.coords.latitude.toFixed(6);
            lonInput.value = precisePos.coords.longitude.toFixed(6);

        } catch (preciseErr) {
            latInput.value = firstPos.coords.latitude.toFixed(6);
            lonInput.value = firstPos.coords.longitude.toFixed(6);
        }

    } catch (error) {
        latInput.value = "Erreur";
        lonInput.value = "Erreur";
        alert("❌ Erreur GPS : " + error.message);
    }
}
