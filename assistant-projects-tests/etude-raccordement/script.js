/**
 * V1.13.4 - Unifiée et Sécurisée
 * - Correction CORS pour Vercel
 * - Correction Chemin Image En-tête
 * - Intégration Éditeur d'images & GPS
 */

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

// --- INITIALISATION AU CHARGEMENT ---
document.addEventListener("DOMContentLoaded", () => {
    console.log("Démarrage V1.13.4...");
    
    const generatePDFBtn = document.getElementById("generatePDF");
    const canvasRepresentant = setupSignatureCanvas("signature-representant-canvas", "clear-representant");

    // --- GESTIONNAIRE PRINCIPAL : GÉNÉRATION ET ENVOI ---
    generatePDFBtn.addEventListener("click", async (event) => {
        event.preventDefault();

        if (!hasSignature || isCanvasEmpty(canvasRepresentant)) {
            alert("⚠️ La signature est obligatoire !");
            return;
        }

        const data = {
            nomCli: document.getElementById("nomCli")?.value || "",
            prenomCli: document.getElementById("prenomCli")?.value || "",
            noDossier: document.getElementById("noDossier")?.value || "",
            adresseCli: document.getElementById("adresseCli")?.value || "",
            cpCli: document.getElementById("cpCli")?.value || "",
            villeCli: document.getElementById("villeCli")?.value || "",
            noPoste: document.getElementById("noPoste")?.value || "",
            noDipole: document.getElementById("noDipole")?.value || "",
            dteSouhaitee: document.getElementById("dteSouhaitee")?.value || "",
            photos: photoList.map(p => ({
                src: p.current,
                label: p.label || "Sans titre",
                gps: p.gps || "Non renseigné"
            })),
            signature: canvasRepresentant.toDataURL("image/png")
        };

        generatePDFBtn.textContent = "⌛ Envoi en cours...";
        generatePDFBtn.disabled = true;

        try {
            // 1. Génération locale du PDF (Téléchargement automatique)
            await genererPDF(data);

            // 2. Création du ZIP pour l'envoi
            const zip = new JSZip();
            const photoFolder = zip.folder("photos");
            data.photos.forEach((p, i) => {
                const base64Data = p.src.split(',')[1];
                photoFolder.file(`photo_${i}.png`, base64Data, {base64: true});
            });
            const zipBlob = await zip.generateAsync({ type: "blob" });

            // 3. Conversion et Envoi API
            const reader = new FileReader();
            reader.readAsDataURL(zipBlob);
            reader.onloadend = async () => {
                const base64Zip = reader.result.split(',')[1];
                const apiUrl = 'https://assistant-projects-q9lix48o4-valerians-projects-417c35ac.vercel.app/api/send_report';
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nom_client: `${data.nomCli} ${data.prenomCli}`,
                        no_dossier: data.noDossier,
                        zip_data: base64Zip
                    })
                });

                if (response.ok) {
                    alert("✅ Succès : PDF généré et Email envoyé avec photos !");
                } else {
                    const err = await response.json();
                    alert("❌ Erreur serveur : " + err.error);
                }
            };

        } catch (error) {
            alert("❌ Erreur : " + error.message);
        } finally {
            generatePDFBtn.textContent = "Générer PDF & Envoyer";
            generatePDFBtn.disabled = false;
        }
    });
});

// --- GESTION DE LA SIGNATURE ---
function setupSignatureCanvas(canvasId, clearButtonId) {
    const canvas = document.getElementById(canvasId);
    const context = canvas.getContext("2d");
    let isDrawing = false;

    const getPosition = (e) => {
        const rect = canvas.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: cx - rect.left, y: cy - rect.top };
    };

    const start = (e) => { e.preventDefault(); isDrawing = true; context.beginPath(); const p = getPosition(e); context.moveTo(p.x, p.y); };
    const draw = (e) => { if (!isDrawing) return; e.preventDefault(); hasSignature = true; const p = getPosition(e); context.lineTo(p.x, p.y); context.stroke(); };
    const stop = () => isDrawing = false;

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", stop);
    canvas.addEventListener("touchstart", start, {passive: false});
    canvas.addEventListener("touchmove", draw, {passive: false});
    canvas.addEventListener("touchend", stop);

    document.getElementById(clearButtonId).addEventListener("click", () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        hasSignature = false;
    });
    return canvas;
}

function isCanvasEmpty(canvas) {
    const blank = document.createElement('canvas');
    blank.width = canvas.width; blank.height = canvas.height;
    return canvas.toDataURL() === blank.toDataURL();
}

// --- GESTIONNAIRE DE PHOTOS (Aperçu, GPS, Suppression) ---
function addPhotoToPreview(photoData) {
    const photoObject = {
        original: photoData,
        current: photoData,
        drawings: [],
        label: "",
        gps: ""
    };

    const container = document.createElement("div");
    container.style.cssText = "display:inline-block; margin:10px; width:120px; vertical-align:top; border:1px solid #ddd; padding:5px; background:#f9f9f9;";

    const img = document.createElement("img");
    img.src = photoData;
    img.style.width = "100%";
    container.appendChild(img);

    // Bloc GPS
    const gpsTxt = document.createElement("div");
    gpsTxt.style.fontSize = "9px"; gpsTxt.textContent = "GPS : Non fixé";
    container.appendChild(gpsTxt);

    const gpsBtn = document.createElement("button");
    gpsBtn.type = "button"; gpsBtn.textContent = "Fixer GPS";
    gpsBtn.style.cssText = "width:100%; font-size:10px; margin-bottom:5px;";
    gpsBtn.onclick = () => {
        gpsTxt.textContent = "Recherche...";
        navigator.geolocation.getCurrentPosition((pos) => {
            photoObject.gps = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
            gpsTxt.textContent = "Fixé : " + photoObject.gps;
            gpsBtn.style.background = "#28a745"; gpsBtn.style.color = "white";
        }, () => { gpsTxt.textContent = "Erreur GPS"; }, {enableHighAccuracy: true});
    };
    container.appendChild(gpsBtn);

    // Libellé
    const labelInp = document.createElement("input");
    labelInp.type = "text"; labelInp.placeholder = "Titre...";
    labelInp.style.width = "100%";
    labelInp.oninput = () => { photoObject.label = labelInp.value; };
    container.appendChild(labelInp);

    // Boutons Action
    const btnGroup = document.createElement("div");
    btnGroup.style.display = "flex";
    
    const editBtn = document.createElement("button");
    editBtn.textContent = "✎"; editBtn.style.flex = "1";
    editBtn.onclick = () => {
        const idx = photoList.indexOf(photoObject);
        openEditorInNewTab(photoObject.original, idx, photoObject.drawings);
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑"; delBtn.style.cssText = "flex:1; color:red;";
    delBtn.onclick = () => {
        container.remove();
        photoList = photoList.filter(p => p !== photoObject);
    };

    btnGroup.appendChild(editBtn);
    btnGroup.appendChild(delBtn);
    container.appendChild(btnGroup);

    photoPreviewContainer.appendChild(container);
    photoList.push(photoObject);
}

// --- ÉDITEUR D'IMAGE (TON CODE ORIGINAL) ---
function openEditorInNewTab(originalData, index, existingDrawings) {
    const editorWindow = window.open("", "_blank");
    const drawingsJson = JSON.stringify(existingDrawings);
    editorWindow.document.write(`
        <html>
        <head><title>Éditeur</title><style>body{margin:0; background:#222; text-align:center;} canvas{background:white; max-width:95vw; max-height:80vh; cursor:crosshair;}</style></head>
        <body>
            <div style="background:#eee; padding:10px;">
                <button onclick="tool='free'">✏️</button>
                <button onclick="tool='line'">📏</button>
                <button onclick="tool='rect'">🟦</button>
                <button onclick="undo()">↩️</button>
                <button onclick="save()" style="background:green; color:white;">Valider</button>
            </div>
            <canvas id="canvas"></canvas>
            <script>
                const canvas = document.getElementById('canvas');
                const ctx = canvas.getContext('2d');
                let tool = 'free', drawing = false, startX, startY;
                let undoStack = ${drawingsJson};
                let currentPath = null;
                const baseImg = new Image();
                baseImg.onload = () => { canvas.width = baseImg.width; canvas.height = baseImg.height; drawAll(); };
                baseImg.src = "${originalData}";

                function getPos(e) {
                    const rect = canvas.getBoundingClientRect();
                    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                    return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) };
                }
                canvas.onmousedown = (e) => { drawing = true; const p = getPos(e); startX=p.x; startY=p.y; currentPath = {tool, pts:[p]}; };
                window.onmousemove = (e) => {
                    if(!drawing) return; const p = getPos(e);
                    if(tool==='free') currentPath.pts.push(p);
                    else currentPath.pts = [{x:startX, y:startY}, p];
                    drawAll();
                };
                window.onmouseup = () => { if(drawing){ undoStack.push(currentPath); drawing=false; currentPath=null; drawAll(); } };
                
                function drawAll() {
                    ctx.drawImage(baseImg, 0, 0);
                    ctx.strokeStyle = "red"; ctx.lineWidth = 5;
                    [...undoStack, ...(currentPath?[currentPath]:[])].forEach(p => {
                        ctx.beginPath();
                        if(p.tool==='free'){ ctx.moveTo(p.pts[0].x, p.pts[0].y); p.pts.forEach(pt=>ctx.lineTo(pt.x,pt.y)); }
                        else if(p.tool==='line'){ ctx.moveTo(p.pts[0].x, p.pts[0].y); ctx.lineTo(p.pts[1].x, p.pts[1].y); }
                        else if(p.tool==='rect'){ ctx.strokeRect(p.pts[0].x, p.pts[0].y, p.pts[1].x-p.pts[0].x, p.pts[1].y-p.pts[0].y); }
                        ctx.stroke();
                    });
                }
                function undo() { undoStack.pop(); drawAll(); }
                function save() { window.opener.postMessage({editedImage: canvas.toDataURL(), drawings: undoStack, index: ${index}}, "*"); window.close(); }
            </script>
        </body></html>
    `);
}

// Réception de l'image éditée
window.addEventListener("message", (event) => {
    if (event.data.editedImage) {
        const { editedImage, drawings, index } = event.data;
        photoList[index].current = editedImage;
        photoList[index].drawings = drawings;
        const targetImg = photoPreviewContainer.children[index].querySelector("img");
        if (targetImg) targetImg.src = editedImage;
    }
});

// --- GÉNÉRATION DU PDF (jsPDF) ---
async function genererPDF(data) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'cm' });

    // Page 1 - En-tête (URL ABSOLUE)
    try {
        const logoUrl = "https://ilesduponant.github.io/assistant-projects/assistant-projects-tests/etude-raccordement/enteteImg.png";
        const logoB64 = await imageToBase64(logoUrl);
        pdf.addImage(logoB64, 'PNG', 1, 0.2, 18.6, 11.6);
    } catch (e) { console.warn("Logo non chargé"); }

    pdf.setFontSize(12);
    pdf.text(`${data.nomCli} ${data.prenomCli}`, 10.5, 14, { align: "center" });
    pdf.text(`${data.adresseCli}`, 10.5, 15, { align: "center"});
    pdf.text(`Dossier : ${data.noDossier}`, 10.5, 18, {align: "center"});

    // Page 2 - Détails et Photos
    pdf.addPage();
    pdf.text("ETUDE TECHNIQUE", 10.5, 1.2, {align: "center"});
    if (data.photos.length > 0) ajouterUnePhotoPDF(pdf, data.photos[0], 4);

    // Photos suivantes
    for (let i = 1; i < data.photos.length; i++) {
        pdf.addPage();
        ajouterUnePhotoPDF(pdf, data.photos[i], 2);
    }

    pdf.save(`intervention_${data.nomCli}.pdf`);
}

function ajouterUnePhotoPDF(pdf, photo, y) {
    try {
        pdf.addImage(photo.src, 'PNG', 2, y, 17, 10);
        pdf.setFontSize(10);
        pdf.text("Libellé : " + photo.label, 2, y + 11);
        pdf.setFontSize(8);
        pdf.text("GPS : " + photo.gps, 2, y + 11.6);
    } catch (e) {}
}

const imageToBase64 = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute("crossOrigin", "anonymous");
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width; canvas.height = img.height;
            canvas.getContext("2d").drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = url;
    });
};

// --- CAMERA ET UPLOAD ---
photosInput.onchange = (e) => {
    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => addPhotoToPreview(ev.target.result);
        reader.readAsDataURL(file);
    });
};

takePhotoButton.onclick = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    camera.srcObject = stream;
    camera.style.display = "block";
    savePhotoButton.style.display = "inline-block";
    camera.play();
};

savePhotoButton.onclick = () => {
    cameraCanvas.width = camera.videoWidth;
    cameraCanvas.height = camera.videoHeight;
    cameraContext.drawImage(camera, 0, 0);
    addPhotoToPreview(cameraCanvas.toDataURL("image/png"));
    camera.srcObject.getTracks().forEach(t => t.stop());
    camera.style.display = "none";
    savePhotoButton.style.display = "none";
};

// --- FONCTIONS GLOBALES (Appelées par HTML onclick) ---
window.syncIdentite = () => {
    document.getElementById('nomTravaux').value = document.getElementById('nomCli').value;
    document.getElementById('prenomTravaux').value = document.getElementById('prenomCli').value;
};
window.copyAdresseClient = () => {
    document.getElementById('adresseTravaux').value = document.getElementById('adresseCli').value;
    document.getElementById('cpTravaux').value = document.getElementById('cpCli').value;
    document.getElementById('villeTravaux').value = document.getElementById('villeCli').value;
};