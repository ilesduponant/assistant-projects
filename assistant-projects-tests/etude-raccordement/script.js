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
        gps: ""
    };

    const photoContainer = document.createElement("div");
    photoContainer.className = "photo-item";
    photoContainer.style = "display:inline-block; margin:10px; width:120px; vertical-align:top; border:1px solid #ddd; padding:5px;";

    const img = document.createElement("img");
    img.src = photoObject.current;
    img.style.width = "100%";
    photoContainer.appendChild(img);

    const gpsInfo = document.createElement("div");
    gpsInfo.style = "font-size:9px; color:#666; text-align:center; margin:5px 0;";
    gpsInfo.textContent = "GPS : Non fixé";
    photoContainer.appendChild(gpsInfo);

    const gpsBtn = document.createElement("button");
    gpsBtn.type = "button";
    gpsBtn.textContent = "Fixer GPS";
    gpsBtn.style = "width:100%; font-size:10px; background:#ffc107; cursor:pointer;";
    gpsBtn.onclick = () => {
        navigator.geolocation.getCurrentPosition((pos) => {
            photoObject.gps = `Lat: ${pos.coords.latitude.toFixed(6)}, Lon: ${pos.coords.longitude.toFixed(6)}`;
            gpsInfo.textContent = photoObject.gps;
            gpsBtn.style.background = "#28a745";
            gpsBtn.textContent = "Fixé ✔";
        }, () => alert("Erreur GPS"), { enableHighAccuracy: true });
    };
    photoContainer.appendChild(gpsBtn);

    const labelInp = document.createElement("input");
    labelInp.placeholder = "Libellé...";
    labelInp.style = "width:100%; margin-top:5px;";
    labelInp.oninput = () => { photoObject.label = labelInp.value; };
    photoContainer.appendChild(labelInp);

    const editBtn = document.createElement("button");
    editBtn.textContent = "Modifier";
    editBtn.style = "width:100%; margin-top:5px;";
    editBtn.onclick = () => {
        const idx = photoList.indexOf(photoObject);
        openEditorInNewTab(photoObject.original, idx, photoObject.drawings);
    };
    photoContainer.appendChild(editBtn);

    photoPreviewContainer.appendChild(photoContainer);
    photoList.push(photoObject);
}

// --- EDITEUR D'IMAGE (NOUVEL ONGLET) ---
function openEditorInNewTab(originalData, index, existingDrawings) {
    const editorWindow = window.open("", "_blank");
    const drawingsJson = JSON.stringify(existingDrawings || []);

    editorWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Éditeur</title>
            <style>body{margin:0;background:#1a1a1a;color:white;text-align:center;} canvas{background:white;touch-action:none;}</style>
        </head>
        <body>
            <div style="padding:10px;background:#333;">
                <button onclick="setTool('free')" id="btn-free" style="background:blue;color:white;">Crayon</button>
                <button onclick="setTool('eraser')">Gomme</button>
                <button onclick="undo()">Annuler</button>
                <button onclick="save()" style="background:green;color:white;">Valider</button>
            </div>
            <canvas id="canvas"></canvas>
            <script>
                const canvas = document.getElementById("canvas");
                const ctx = canvas.getContext("2d");
                let tool = "free", drawing = false;
                let undoStack = ${drawingsJson};
                const baseImg = new Image();
                baseImg.onload = () => {
                    canvas.width = baseImg.naturalWidth * 0.5;
                    canvas.height = baseImg.naturalHeight * 0.5;
                    drawAll();
                };
                baseImg.src = "${originalData}";
                
                function drawAll() {
                    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
                    undoStack.forEach(p => {
                        ctx.beginPath();
                        ctx.strokeStyle = p.color;
                        ctx.lineWidth = p.size;
                        p.pts.forEach((pt, i) => { if(i===0) ctx.moveTo(pt.x,pt.y); else ctx.lineTo(pt.x,pt.y); });
                        ctx.stroke();
                    });
                }
                function setTool(t) { tool = t; }
                function save() {
                    window.opener.postMessage({ editedImage: canvas.toDataURL(), index: ${index} }, "*");
                    window.close();
                }
                // (Simplifié pour l'exemple, garde ta logique complète de dessin ici)
            </script>
        </body>
        </html>
    `);
}

window.addEventListener("message", (event) => {
    if (event.data.editedImage) {
        const { editedImage, index } = event.data;
        photoList[index].current = editedImage;
        const targetImg = photoPreviewContainer.children[index].querySelector("img");
        if (targetImg) targetImg.src = editedImage;
    }
});

// --- SIGNATURE & INITIALISATION ---
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("signature-representant-canvas");
    const ctx = canvas.getContext("2d");
    let drawing = false;

    const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    };
    resizeCanvas();

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    canvas.addEventListener("pointerdown", (e) => {
        drawing = true;
        hasSignature = true;
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

    canvas.addEventListener("pointerup", () => drawing = false);

    document.getElementById("clear-representant").onclick = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasSignature = false;
    };
}); // <--- C'ÉTAIT CETTE FERMETURE QUI MANQUAIT

// --- GENERATION PDF & ENVOI ---
document.getElementById("generatePDF").onclick = async (e) => {
    e.preventDefault();
    if (!hasSignature) return alert("⚠️ Signature obligatoire !");

    const btn = e.target;
    btn.disabled = true;
    btn.textContent = "⌛ Traitement...";

    const data = {
        nomCli: document.getElementById("nomCli").value,
        prenomCli: document.getElementById("prenomCli").value,
        noDossier: document.getElementById("noDossier").value,
        adresseCli: document.getElementById("adresseCli").value,
        cpCli: document.getElementById("cpCli").value,
        villeCli: document.getElementById("villeCli").value,
        signature: document.getElementById("signature-representant-canvas").toDataURL(),
        photos: photoList
    };

    try {
        await genererPDF(data);

	const htmlTemplate = generateHTMLReport(data);
        const zip = new JSZip();
	zip.file("CONSULTATION.html", htmlTemplate);
        data.photos.forEach((p, i) => {
            const base64Content = p.current.split(',')[1];
            zip.file(`photo_${i}.png`, base64Content, {base64: true});
        });
        // ... après avoir ajouté les fichiers au zip ...

// 1. On génère le ZIP directement en texte (base64)
const base64Zip = await zip.generateAsync({type: "base64"});

// 2. On l'envoie direct (on n'a pas besoin de zipBlob ni de reader)
const response = await fetch('https://assistant-projects.vercel.app/api/send_report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        nom_client: `${rapportData.nomCli} ${rapportData.prenomCli}`,
        no_dossier: rapportData.noDossier,
        zip_data: base64Zip // On utilise la variable créée juste au-dessus
    })
});

if (response.ok) {
    alert("✅ Rapport envoyé avec succès !");
} else {
    alert("❌ Erreur lors de l'envoi");
}catch (err) {
                alert("❌ Erreur réseau");
            } finally {
                btn.disabled = false;
                btn.textContent = "Générer PDF & Envoyer";
            }
        };
    } catch (err) {
        alert("Erreur : " + err.message);
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
