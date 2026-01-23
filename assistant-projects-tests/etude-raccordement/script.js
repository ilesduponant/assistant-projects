// Variables globales
const photosInput = document.getElementById("photos");
const photoPreviewContainer = document.getElementById("photo-preview");
const takePhotoButton = document.getElementById("take-photo");
const savePhotoButton = document.getElementById("save-photo");
const camera = document.getElementById("camera");
const cameraCanvas = document.getElementById("camera-canvas");
const cameraContext = cameraCanvas.getContext("2d");

let photoList = [];
let hasSignature = false;

// DOM
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("signature-representant-canvas");
    const ctx = canvas.getContext("2d");
    let drawing = false;

    // Réglages du dessin pour le canvas de signature
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";

    const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Position du curseur
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

    canvas.addEventListener("pointercancel", (e) => {
        drawing = false;
        canvas.releasePointerCapture(e.pointerId);
    });

    document.getElementById("clear-representant").onclick = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasSignature = false;
    };
    
    // Appel du changement de puissance
    const radios = document.querySelectorAll('input[name="nbPhasesConso"]');
    radios.forEach(r => r.addEventListener("change", updatePuissance));
    updatePuissance();

    // La value vaut le texte affiché (checkboxes)
    document.querySelectorAll('.checkbox-item').forEach(item => {
        const input = item.querySelector('input');
        if (input && input.value === "") {
            input.value = item.textContent.trim();
        }
    });

    const groupFields = document.querySelectorAll('.group-required');
    
    const updateRequiredStatus = () => {
        const oneHasValue = Array.from(groupFields).some(f => f.value.trim() !== "");
        groupFields.forEach(f => {
            f.required = !oneHasValue;
        });
    };

    groupFields.forEach(field => {
        field.addEventListener('input', updateRequiredStatus);
        field.addEventListener('change', updateRequiredStatus);
    });
    updateRequiredStatus();});

    // COntrôle du type des champs : utiliser data-format="" dans la balise input
    const applyFormatting = (input, type) => {
        if (type === 'num') {
            input.value = input.value.replace(/[^0-9]/g, '');
        } else if (type === 'cap') {
            input.value = input.value.toUpperCase();
        } else if (type === 'alphanumcap') {
            input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        } else if (type === 'decimal') {
            input.value = input.value.replace(/,/g, '.');
    	    input.value = input.value.replace(/[^0-9.]/g, '');
    	    const parts = input.value.split('.');
            if (parts.length > 2) {
        	input.value = parts[0] + '.' + parts.slice(1).join('');
            }
        }
    };
    document.querySelectorAll('[data-format]').forEach(field => {
        field.addEventListener('input', (e) => {
            const formatType = e.target.getAttribute('data-format');
            applyFormatting(e.target, formatType);
        });
    });

// Affichage de l'aperçu des photos
function renderPhotos() {
    photoPreviewContainer.innerHTML = "";

    photoList.forEach((photoObject, idx) => {
        const photoContainer = document.createElement("div");
        photoContainer.className = "photo-item";
        photoContainer.style = "position:relative; display:inline-block; margin:15px; width:140px; vertical-align:top; border:1px solid #ddd; padding:5px; background:#fff; border-radius:5px;";

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

        const img = document.createElement("img");
        img.src = photoObject.current; 
        img.style = "width:100%; height:100px; object-fit:cover; border-radius:3px;";
        photoContainer.appendChild(img);

        const gpsInfo = document.createElement("div");
        gpsInfo.style = "font-size:9px; color:#666; text-align:center; margin:5px 0; height:12px;";
        gpsInfo.textContent = photoObject.gpsLat ? `${photoObject.gpsLat}, ${photoObject.gpsLon}` : "Pas de GPS";
        photoContainer.appendChild(gpsInfo);

        const labelInp = document.createElement("input");
        labelInp.placeholder = "Libellé...";
        labelInp.value = photoObject.label || "";
        labelInp.style = "width:100%; margin-bottom:8px; font-size:11px; padding:2px; border:1px solid #ccc; border-radius:3px;";
        labelInp.oninput = () => { photoObject.label = labelInp.value; };
        photoContainer.appendChild(labelInp);

        const actionGroup = document.createElement("div");
        actionGroup.style = "display: flex; gap: 4px;";

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

        photoPreviewContainer.appendChild(photoContainer);
    });

    if (window.lucide) {
        lucide.createIcons();
    }
}

// Gestion des champs relatifs à la puissance du raccordement
function updatePuissance() {
    const selectRacc = document.getElementById("puissanceRaccordement"); // Puissance raccordement
    const selectSous = document.getElementById("puissanceSouscrite"); // Puissance souscrite
    const isMono = document.getElementById("monophase").checked;
    
    if (!selectRacc) return;

    selectRacc.innerHTML = "";
    if (selectSous) selectSous.innerHTML = "";

    const optionsRacc = isMono ? ["12 kVA", "3 kVA"] : ["36 kVA", "3 kVA"]; 
    optionsRacc.forEach(pwr => {
        selectRacc.add(new Option(pwr, pwr));
    });
    selectRacc.selectedIndex = 0;

    if (selectSous) {
        let paliers;
        if (isMono) {
            paliers = ["6 kVA", "3 kVA", "9 kVA", "12 kVA"];
        } else {
            paliers = ["18 kVA", "6 kVA", "9 kVA", "12 kVA", "15 kVA", "24 kVA", "30 kVA", "36 kVA"];
        }
        selectSous.add(new Option("Sélectionnez la puissance souhaitée", ""));
        paliers.forEach(pwr => {
            selectSous.add(new Option(pwr, pwr));
        });
    }
}

function toggleTravaux() {
    const section = document.getElementById("sectionTravaux");
    const isOui = document.querySelector('input[name="travauxChargeDemandeur"][value="Oui"]').checked;
    section.style.display = isOui ? "block" : "none";
}

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

window.addEventListener("message", (event) => {
    if (event.data && event.data.editedImage) {
        const idx = event.data.index;
        if (photoList[idx]) {
            photoList[idx].current = event.data.editedImage;
            photoList[idx].drawings = event.data.drawings; 
            renderPhotos(); 
        }
    }
}, false);

function addPhotoToPreview(photoData) {
    const photoObject = {
        original: photoData,
        current: photoData,
        drawings: [],
        label: "",
        gpsLat: null,
        gpsLon: null
    };
    photoList.push(photoObject);
    renderPhotos();
}

function validateForm() {
    const requiredFields = document.querySelectorAll("[required]");
    let missingFields = [];

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            const label = field.previousElementSibling?.innerText || field.id;
            missingFields.push(label);
            field.style.border = "2px solid red";
        } else {
            field.style.border = "";
        }
    });

    if (missingFields.length > 0) {
        alert("⚠️ Erreur : Les champs suivants sont obligatoires :\n- " + missingFields.join("\n- "));
        return false;
    }
    return true;
}

document.getElementById("generatePDF").onclick = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!hasSignature) return alert("⚠️ Signature obligatoire !");

    const btn = e.target;
    btn.disabled = true;
    btn.textContent = "⌛ Traitement...";

    const data = {
	// Infos client
        nomCli: document.getElementById("nomCli").value || "",
        prenomCli: document.getElementById("prenomCli").value || "",
        noDossier: document.getElementById("noDossier").value || "",
        adresseCli: document.getElementById("adresseCli").value || "",
        cpCli: document.getElementById("cpCli").value || "",
        villeCli: document.getElementById("villeCli").value || "",
	ileCli: document.getElementById("ileCli").value || "",
        complementAdrCli: document.getElementById("complementAdrCli").value || "",

	// Données réseau
        noDipole: document.getElementById("noDipole").value || "",
        distAmont: document.getElementById("distAmont").value || "",
        gpsLat: document.getElementById("gps-lat").value || "",
        gpsLon: document.getElementById("gps-lon").value || "",    
        nomDepartBT: document.getElementById("nomDepartBT").value || "",
        codeGDODepartBT: document.getElementById("codeGDODepartBT").value || "",
        nomPosteHTABT: document.getElementById("nomPosteHTABT").value || "",
        codeGDOPosteHTABT: document.getElementById("codeGDOPosteHTABT").value || "",

	// Branchement
        techBranchement: document.getElementById("techBranchement").value || "",
        typeBranchement: document.querySelector('input[name="typeBranchement"]:checked')?.value || "",
        longDomainePublic: document.getElementById("longDomainePublic").value || "",
        longDomainePrive: document.getElementById("longDomainePrive").value || "",
        trancheeEtFourreau: document.querySelector('input[name="trancheeEtFourreau"]:checked')?.value || "",
        domaineIntervention: document.getElementById("domaineIntervention").value || "",
        IRVE: document.getElementById("IRVE").value || "",
        schemaIRVE: document.querySelector('input[name="schemaIRVE"]:checked')?.value || "",
        nbPhasesConso: document.querySelector('input[name="nbPhasesConso"]:checked')?.value || "",
        puissanceRaccordement: document.getElementById("puissanceRaccordement").value || "",
        puissanceSouscrite: document.getElementById("puissanceSouscrite").value || "",
        localHabitation: document.querySelector('input[name="localHabitation"]:checked')?.value || "",
        travauxChargeDemandeur: document.querySelector('input[name="travauxChargeDemandeur"]:checked')?.value || "",
        datePrevue: document.getElementById("datePrevue").value || "",
        dateReelle: document.getElementById("dateReelle").value || "",
        listeTravaux: Array.from(document.querySelectorAll('input[name="listeTravaux"]:checked'))
            .map(cb => "- " + cb.parentElement.textContent.trim())
            .join("<br />"),        commTravaux: document.getElementById("commTravaux").value || "",

	// Autre
        signature: document.getElementById("signature-representant-canvas").toDataURL(),
        photos: photoList
    };
    
    // Génération du zip
    try {
	const zip = new JSZip();

        const pdfBlob = await genererPDF(data);
	zip.file(`Rapport_${data.nomCli}_${data.ileCli}.pdf`, pdfBlob);

        const htmlTemplate = generateHTMLReport(data);
        zip.file("CONSULTATION.html", htmlTemplate);

        const signatureBase64 = data.signature.split(',')[1];
        zip.file("signature.png", signatureBase64, { base64: true });

        data.photos.forEach((p, i) => {
            const base64Content = p.current.split(',')[1];
            zip.file(`photo_${i}.png`, base64Content, { base64: true });
        });

        const base64Zip = await zip.generateAsync({ type: "base64" });

        const response = await fetch('https://assistant-projects.vercel.app/api/send_report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
		nomCli: data.nomCli,
		prenomCli: data.prenomCli,
		npCli: `${data.nomCli} ${data.prenomCli}`,
                no_dossier: data.noDossier,
		ile: data.ileCli,
                zip_data: base64Zip
            })
        });

        if (response.ok) {
            alert("✅ Rapport envoyé avec succès !");
        } else {
            const errorText = await response.text();
            alert("❌ Erreur lors de l'envoi : " + response.status);
        }

    } catch (err) {
        alert("❌ Erreur : " + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "Générer PDF & Envoyer";
    }
};

// Création du pdf data -> blob pdf
async function genererPDF(data) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
    });

    // Couleurs
    const bleuEDF = [0, 91, 187];
    const grisFonce = [80, 80, 80];

    // En-tête
    try {
        pdf.addImage('../EDF.png', 'PNG', 160, 10, 35, 18);
    } catch (e) {
        console.warn("Logo non trouvé");
    }

    pdf.setFontSize(18);
    pdf.setTextColor(bleuEDF[0], bleuEDF[1], bleuEDF[2]);
    pdf.text("ARCHIVE TECHNIQUE DE RACCORDEMENT", 20, 25);

    pdf.setFontSize(9);
    pdf.setTextColor(grisFonce[0], grisFonce[1], grisFonce[2]);
    pdf.text(`Document de secours - Dossier OSR : ${data.noDossier}`, 20, 32);
    pdf.text(`Date de génération : ${new Date().toLocaleString('fr-FR')}`, 20, 37);

    let y = 50;

    // Ajout de section
    const addSection = (title) => {
        y += 5;
        pdf.setFontSize(12);
        pdf.setTextColor(bleuEDF[0], bleuEDF[1], bleuEDF[2]);
        pdf.setFont("helvetica", "bold");
        pdf.text(title, 20, y);
        y += 2;
        pdf.setDrawColor(bleuEDF[0], bleuEDF[1], bleuEDF[2]);
        pdf.setLineWidth(0.3);
        pdf.line(20, y, 190, y);
        y += 8;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
    };

    // Ajout d'une ligne
    const addData = (label, value) => {
        if (y > 270) { pdf.addPage(); y = 20; }
        pdf.setFont("helvetica", "bold");
        pdf.text(`${label} :`, 25, y);
        pdf.setFont("helvetica", "normal");
        const val = value ? String(value) : "Néant";
        const splitVal = pdf.splitTextToSize(val, 120);
        pdf.text(splitVal, 70, y);
        y += (splitVal.length * 5) + 2;
    };

    // Section client
    addSection("COORDONNÉES CLIENT");
    addData("Nom", data.nomCli);
    addData("Prénom", data.prenomCli);
    addData("Adresse", data.adresseCli);
    addData("CP / Ville", `${data.cpCli} ${data.villeCli}`);
    addData("Île", data.ileCli);
    addData("Complément", data.complementAdrCli);
    addData("N° Dossier OSR", data.noDossier);

    // Section réseau
    addSection("DONNÉES RÉSEAU");
    addData("Dipôle n°", data.noDipole);
    addData("Distance amont", `${data.distAmont} m`);
    addData("Latitude GPS", data.gpsLat);
    addData("Longitude GPS", data.gpsLon);
    addData("Départ BT", data.nomDepartBT);
    addData("GDO Départ", data.codeGDODepartBT);
    addData("Poste HTA/BT", data.nomPosteHTABT);
    addData("GDO Poste", data.codeGDOPosteHTABT);

    // Section branchement
    addSection("CARACTÉRISTIQUES BRANCHEMENT");
    addData("Technique", data.techBranchement);
    addData("Type", data.typeBranchement);
    addData("Domaine Public", `${data.longDomainePublic} m`);
    addData("Domaine Privé", `${data.longDomainePrive} m`);
    addData("Fourreaux client", data.trancheeEtFourreau);
    addData("Intervention", data.domaineIntervention);
    addData("IRVE", data.IRVE);
    addData("Schéma IRVE", data.schemaIRVE);
    addData("Phasage", data.nbPhasesConso);
    addData("P. Raccordement", `${data.puissanceRaccordement} kVA`);
    addData("P. Souscrite", `${data.puissanceSouscrite} kVA`);

    // Section travaux
    addSection("SUIVI DES TRAVAUX");
    addData("Local > 2 ans", data.localHabitation);
    addData("Charge demandeur", data.travauxChargeDemandeur);
    addData("Fin prévue le", data.datePrevue);
    addData("Fin réelle le", data.dateReelle);
    addData("Liste travaux", data.listeTravaux);
    addData("Commentaires", data.commTravaux);

    // Section signature
    y += 10;
    if (y > 230) { pdf.addPage(); y = 30; }
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(bleuEDF[0], bleuEDF[1], bleuEDF[2]);
    pdf.text("SIGNATURE DE L'AGENT", 25, y);
    y += 5;
    try {
        pdf.addImage(data.signature, 'PNG', 25, y, 50, 25);
    } catch (e) {
        pdf.text("[Erreur chargement signature]", 25, y + 10);
    }

    // Pied de page
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(`BRANCHEMENT ${data.nomCli} - Page ${i} / ${pageCount}`, 105, 290, { align: 'center' });
    }
    pdf.save(`Rapport_${data.noDossier}_${data.ileCli}.pdf`);
    return pdf.output('blob');
}

// Afficher cacher le champ schemaIRVE
function toggleIRVE() {
    const selectIRVE = document.getElementById('IRVE');
    const sectionSchema = document.getElementById('section-schema-irve');
    const radiosIRVE = document.querySelectorAll('input[name="schemaIRVE"]');

    if (selectIRVE.value === "IRVE") {
        sectionSchema.style.display = 'block';
        // être sûr que le champ soit obligatoire si affiché
        radiosIRVE.forEach(r => r.required = true);
    } else {
        sectionSchema.style.display = 'none';
        // on met le champ en facultatif et non coché si non affiché
        radiosIRVE.forEach(r => {
            r.required = false;
            r.checked = false;
        });
    }
}
// on vérifie le IRVE au chargement de la page
document.addEventListener('DOMContentLoaded', toggleIRVE);
