//variables
const photosInput = document.getElementById("photos");
const photoPreviewContainer = document.getElementById("photo-preview");
const takePhotoButton = document.getElementById("take-photo");
const savePhotoButton = document.getElementById("save-photo");
const camera = document.getElementById("camera");
const cameraCanvas = document.getElementById("camera-canvas");
const cameraContext = cameraCanvas.getContext("2d");

let photoList = []; //Tableau d'objets : { original, current, drawings, label }

//upload de photos
photosInput.addEventListener("change", (event) => {
    const files = Array.from(event.target.files);
    files.forEach((file) => {
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => addPhotoToPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    });
    event.target.value = ""; // Vide l'input pour permettre de remettre la même photo
});

//gestion caméra
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

    const photoData = cameraCanvas.toDataURL("image/png");
    addPhotoToPreview(photoData);

    // Arrêt de la caméra
    const stream = camera.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());

    camera.style.display = "none";
    savePhotoButton.style.display = "none";
});

//affichage et suppression des photos via l'aperçu
function addPhotoToPreview(photoData) {
    const photoObject = {
        original: photoData,
        current: photoData,
        drawings: [],
        label: ""
    };
    //div pour contenir les éléments ci-dessous
    const photoContainer = document.createElement("div");
    photoContainer.style.display = "inline-block";
    photoContainer.style.margin = "5px";
    photoContainer.style.position = "relative"; 

   //aperçu de l'image
    const img = document.createElement("img");
    img.src = photoObject.current;
    img.style.width = "100px";
    img.style.border = "1px solid #ccc";
    photoContainer.appendChild(img);
    
    //bouton de suppression
    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.className = "delete-button";     
    deleteButton.onclick = () => {
        photoPreviewContainer.removeChild(photoContainer);
        photoList = photoList.filter((p) => p !== photoObject);
    };
    photoContainer.appendChild(deleteButton);

    //input libellé
    const labelInp = document.createElement("input");
    labelInp.type = "text";
    labelInp.placeholder = "Libellé de la photo";
    labelInp.style.display = "block";
    labelInp.style.marginTop = "5px";
    labelInp.oninput = () => { photoObject.label = labelInp.value; };
    photoContainer.appendChild(labelInp);

    //bouton de modification
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Modifier";
    editBtn.style.width = "100%";
    editBtn.onclick = () => {
        const idx = photoList.indexOf(photoObject);
        openEditorInNewTab(photoObject.original, idx, photoObject.drawings);
    };
    photoContainer.appendChild(editBtn);

    photoPreviewContainer.appendChild(photoContainer);
    photoList.push(photoObject);
}
//-----------------------------------------
//onglet édition d'image
function openEditorInNewTab(originalData, index, existingDrawings) {
    const editorWindow = window.open("", "_blank");
    
    //conversion des dessins en str 
    const drawingsJson = JSON.stringify(existingDrawings);

    editorWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Éditeur</title>
    <style>
        body { margin: 0; background: #222; font-family: sans-serif; overflow: hidden; }
        #toolbar { display: flex; gap: 5px; padding: 10px; background: #eee; flex-wrap: wrap; justify-content: center; }
        .tool-btn { width: 44px; height: 44px; border: 1px solid #ccc; background: white; border-radius: 5px; cursor: pointer; display:flex; align-items:center; justify-content:center; }
        .tool-btn.active { background: #007bff; color: white; }
        .tool-btn svg { width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 2; }
        #canvas-container { height: calc(100vh - 120px); display: flex; justify-content: center; align-items: center; }
        canvas { background: white; touch-action: none; max-width: 100%; max-height: 100%; }
    </style>
</head>
<body>
    <div id="toolbar">
        <button class="tool-btn active" onclick="setTool('free', this)"><svg viewBox="0 0 24 24"><path d="M12 19c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM6 1c-1.1 0-2 ..."/></svg></button>
        <button class="tool-btn" onclick="setTool('line', this)"><svg viewBox="0 0 24 24"><line x1="5" y1="19" x2="19" y2="5"></line></svg></button>
        <button class="tool-btn" onclick="setTool('rect', this)"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg></button>
        <button class="tool-btn" onclick="setTool('circle', this)"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle></svg></button>
        <button class="tool-btn" onclick="setTool('text', this)"><svg viewBox="0 0 24 24"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg></button>
        <button class="tool-btn" onclick="setTool('eraser', this)"><svg viewBox="0 0 24 24"><path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z"></path></svg></button>
        <button class="tool-btn" onclick="undo()">↩</button>
        <button class="tool-btn" onclick="save()" style="background:#28a745; color:white;">✔</button>
    </div>
    <div style="padding: 5px; background: #ddd; display: flex; gap: 10px; justify-content: center;">
        <input type="color" id="col" value="#ff0000" onchange="color=this.value">
        <input type="range" min="1" max="50" value="5" onchange="size=parseInt(this.value)">
    </div>
    <div id="canvas-container"><canvas id="canvas"></canvas></div>

    <script>
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        let tool = "free", drawing = false, color = "#ff0000", size = 5;
        let startX, startY;
        
        // RECUPERATION DES DESSINS EXISTANTS
        let undoStack = ${drawingsJson}; 
        let currentPath = null;
        
        const baseImg = new Image();
        baseImg.onload = () => {
            const ratio = Math.min(window.innerWidth / baseImg.naturalWidth, (window.innerHeight - 150) / baseImg.naturalHeight);
            canvas.width = baseImg.naturalWidth * ratio;
            canvas.height = baseImg.naturalHeight * ratio;
            drawAll();
        };
        baseImg.src = "${originalData}";

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) };
        }

        canvas.addEventListener("mousedown", start);
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", end);
        canvas.addEventListener("touchstart", (e) => { e.preventDefault(); start(e); }, {passive:false});
        canvas.addEventListener("touchmove", (e) => { e.preventDefault(); move(e); }, {passive:false});
        canvas.addEventListener("touchend", end);

        function start(e) {
            drawing = true; const p = getPos(e); startX = p.x; startY = p.y;
            if(tool !== "text") currentPath = { tool, color, size, pts: [p] };
        }

        function move(e) {
            if(!drawing || tool === "text") return;
            const p = getPos(e);
            if(tool === "free" || tool === "eraser") currentPath.pts.push(p);
            else currentPath.pts = [{x:startX, y:startY}, p];
            drawAll();
        }

        function end(e) {
            if(!drawing) return; drawing = false;
            if(tool === "text") {
                const t = prompt("Texte :");
                if(t) undoStack.push({ tool: "text", color, size, pts: [{x:startX, y:startY}], txt: t });
            } else if(currentPath) undoStack.push(currentPath);
            currentPath = null; drawAll();
        }

        function drawAll() {
            ctx.clearRect(0,0,canvas.width, canvas.height);
            ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
            
            const tmp = document.createElement("canvas");
            tmp.width = canvas.width; tmp.height = canvas.height;
            const tCtx = tmp.getContext("2d");

            const paths = undoStack.concat(currentPath ? [currentPath] : []);
            paths.forEach(p => {
                tCtx.globalCompositeOperation = p.tool === "eraser" ? "destination-out" : "source-over";
                tCtx.strokeStyle = p.color; tCtx.fillStyle = p.color; tCtx.lineWidth = p.size; tCtx.lineCap = "round"; tCtx.lineJoin = "round";
                tCtx.beginPath();
                if(p.tool === "free" || p.tool === "eraser") {
                    tCtx.moveTo(p.pts[0].x, p.pts[0].y);
                    p.pts.forEach(pt => tCtx.lineTo(pt.x, pt.y));
                    tCtx.stroke();
                } else if(p.tool === "line") {
                    tCtx.moveTo(p.pts[0].x, p.pts[0].y); tCtx.lineTo(p.pts[1].x, p.pts[1].y); tCtx.stroke();
                } else if(p.tool === "rect") {
                    tCtx.strokeRect(p.pts[0].x, p.pts[0].y, p.pts[1].x - p.pts[0].x, p.pts[1].y - p.pts[0].y);
                } else if(p.tool === "circle") {
                    const r = Math.hypot(p.pts[1].x - p.pts[0].x, p.pts[1].y - p.pts[0].y);
                    tCtx.arc(p.pts[0].x, p.pts[0].y, r, 0, Math.PI*2); tCtx.stroke();
                } else if(p.tool === "text") {
                    tCtx.font = (p.size * 4) + "px Arial"; tCtx.fillText(p.txt, p.pts[0].x, p.pts[0].y);
                }
            });
            ctx.drawImage(tmp, 0, 0);
        }

        function setTool(t, b) { tool = t; document.querySelectorAll(".tool-btn").forEach(x=>x.classList.remove("active")); b.classList.add("active"); }
        function undo() { undoStack.pop(); drawAll(); }
        function save() {
            window.opener.postMessage({ editedImage: canvas.toDataURL(), drawings: undoStack, index: ${index} }, "*");
            window.close();
        }
    </script>
</body>
</html>
    `);
}

//reception de l'image
window.addEventListener("message", (event) => {
    if (event.data.editedImage) {
        const { editedImage, drawings, index } = event.data;
        photoList[index].current = editedImage;
        photoList[index].drawings = drawings; // On sauvegarde les calques

        const targetImg = photoPreviewContainer.children[index].querySelector("img");
        if (targetImg) targetImg.src = editedImage;
    }
});


//--------------------------------------
// Les fonctions appelées par onclick dans le HTML doivent être globales
window.syncIdentite = function() {
    const n = document.getElementById('nomCli').value;
    const p = document.getElementById('prenomCli').value;
    document.getElementById('nomTravaux').value = n;
    document.getElementById('prenomTravaux').value = p;
};

window.copyAdresseClient = function() {
    document.getElementById('adresseTravaux').value = document.getElementById('adresseCli').value;
    document.getElementById('complementAdrTravaux').value = document.getElementById('complementAdrCli').value;
    document.getElementById('cpTravaux').value = document.getElementById('cpCli').value;
    document.getElementById('villeTravaux').value = document.getElementById('villeCli').value;
};



document.addEventListener("DOMContentLoaded", () => {
    console.log("V1.13.3...");
    const form = document.getElementById("raccordementForm");
    const generatePDFBtn = document.getElementById("generatePDF");
    let hasSignature = false;

    // Définition de la fonction de signature AVANT de l'appeler
    function setupSignatureCanvas(canvasId, clearButtonId) {
        const canvas = document.getElementById(canvasId);
        const context = canvas.getContext("2d");
        let isDrawing = false;
        let tempCanvas = document.createElement("canvas");
        let tempContext = tempCanvas.getContext("2d");

        const synchronizeCanvasSize = () => {
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            tempContext.drawImage(canvas, 0, 0);
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            context.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
        };

        const getPosition = (event) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = event.touches ? event.touches[0].clientX : event.clientX;
            const clientY = event.touches ? event.touches[0].clientY : event.clientY;
            return { x: clientX - rect.left, y: clientY - rect.top };
        };

        const startDrawing = (event) => {
            event.preventDefault();
            isDrawing = true;
            const pos = getPosition(event);
            context.beginPath();
            context.moveTo(pos.x, pos.y);
        };

        const draw = (event) => {
            if (!isDrawing) return;
            event.preventDefault();
            hasSignature = true;
            const pos = getPosition(event);
            context.lineTo(pos.x, pos.y);
            context.stroke();
        };

        const stopDrawing = () => { isDrawing = false; };

        synchronizeCanvasSize();
        window.addEventListener("resize", synchronizeCanvasSize);
        canvas.addEventListener("mousedown", startDrawing);
        canvas.addEventListener("mousemove", draw);
        window.addEventListener("mouseup", stopDrawing);
        canvas.addEventListener("touchstart", startDrawing);
        canvas.addEventListener("touchmove", draw);
        canvas.addEventListener("touchend", stopDrawing);

        document.getElementById(clearButtonId).addEventListener("click", () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            hasSignature = false; 
        });
        
        return canvas;
    }

    // Initialisation du canvas
    const canvasRepresentant = setupSignatureCanvas("signature-representant-canvas", "clear-representant");

    function isCanvasEmpty(canvas) {
        const blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        return canvas.toDataURL() === blank.toDataURL();
    }

    const imageToBase64 = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.setAttribute("crossOrigin", "anonymous"); 
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = () => reject("Erreur de chargement : " + url);
            img.src = url;
        });
    };

    generatePDFBtn.addEventListener("click", async (event) => {
    event.preventDefault();

    // 1. Vérification sécurité
    if (!hasSignature || isCanvasEmpty(canvasRepresentant)) {
        alert("⚠️ La signature est obligatoire !");
        return;
    }

    // 2. Collecte des données
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

    // Changement de texte sur le bouton pour faire patienter
    const originalText = generatePDFBtn.textContent;
    generatePDFBtn.textContent = "⌛ Envoi en cours...";
    generatePDFBtn.disabled = true;

    try {
        // 3. Génération locale du PDF (téléchargement client)
        await genererPDF(data);

        // 4. Préparation du ZIP pour l'envoi mail
        const zip = new JSZip();
        const photoFolder = zip.folder("photos");

        data.photos.forEach((p, i) => {
            // On enlève le header "data:image/png;base64," pour JSZip
            const base64Data = p.src.split(',')[1];
            const fileName = `photo_${i}_${p.label.replace(/\s+/g, '_')}.png`;
            photoFolder.file(fileName, base64Data, {base64: true});
        });

        // Génération du contenu ZIP en Blob
        const zipBlob = await zip.generateAsync({ type: "blob" });

        // 5. Envoi vers l'API Vercel
        const reader = new FileReader();
        reader.readAsDataURL(zipBlob);
        reader.onloadend = async () => {
            const base64Zip = reader.result.split(',')[1];

            const response = await fetch('/api/send_report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nom_client: `${data.nomCli} ${data.prenomCli}`,
                    no_dossier: data.noDossier,
                    zip_data: base64Zip
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert("✅ PDF généré et Email envoyé avec succès !");
            } else {
                throw new Error(result.error || "Erreur serveur");
            }
        };

    } catch (error) {
        console.error("Erreur complète:", error);
        alert("❌ Erreur lors de l'envoi : " + error.message);
    } finally {
        generatePDFBtn.textContent = originalText;
        generatePDFBtn.disabled = false;
    }
});

    async function genererPDF(data) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: 'cm' });

        // --- PAGE 1 ---
        try {
            const enteteBase64 = await imageToBase64("enteteImg.png");
            pdf.addImage(enteteBase64, 'PNG', 1, 0.2, 18.62, 11.67);
        } catch (e) { console.warn(e); }

        pdf.setFontSize(12);
        pdf.text(`${data.nomCli} ${data.prenomCli}`, 10.5, 14, { align: "center" });
        pdf.text(`${data.adresseCli}`, 10.5, 15, { align: "center"});
        pdf.text(`${data.cpCli} ${data.villeCli}`, 10.5, 16, { align: "center"});
        pdf.text(`Dossier : ${data.noDossier}`, 10.5, 18, {align: "center"});

        // --- PAGE 2 ---
        pdf.addPage();
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.1);
        pdf.rect(0.7, 0.5, 19.6, 28.5, 'S'); 

        pdf.setFillColor(210, 230, 255);
        pdf.rect(0.7, 1.5, 19.6, 3.5, 'F');
        pdf.line(0.7, 1.5, 20.3, 1.5);
        pdf.line(0.7, 5, 20.3, 5);

        pdf.setFontSize(12);
        pdf.text("ETUDE DE VOTRE BRANCHEMENT ELECTRIQUE", 10.5, 1, {align: "center"});
        pdf.text("Coordonnées des travaux", 1, 2);
        pdf.setFontSize(10);
        pdf.text(`Nom : ${data.nomCli} ${data.prenomCli}`, 2, 2.5);
        pdf.text(`Adresse des travaux : ${data.adresseCli}`, 2, 3);
        pdf.text(`Commune : ${data.villeCli}`, 2, 3.5);
        pdf.text(`Nom et n° du POSTE : ${data.noPoste}`, 2, 4.2);
        pdf.text(`N° DIPOLE : ${data.noDipole}`, 10.5, 4.2);
        pdf.text(`Date souhaitée : ${data.dteSouhaitee}`, 2, 4.7);

        pdf.setFillColor(210, 230, 255);
        pdf.rect(1.5, 5.5, 18, 1, 'FD');
        pdf.text(`Branchement ${data.nomCli}`, 10.5, 6.1, {align: "center"});

        if (data.photos && data.photos.length > 0) {
            ajouterUnePhoto(pdf, data.photos[0], 7.5, 13);
        }

        // --- PAGES PHOTOS SUIVANTES ---
        if (data.photos && data.photos.length > 1) {
            for (let i = 1; i < data.photos.length; i += 2) {
                pdf.addPage();
                pdf.rect(0.7, 0.5, 19.6, 28.5, 'S');
                pdf.line(0.7, 1.5, 20.3, 1.5);
                pdf.text("PHOTOS DE L'INTERVENTION (SUITE)", 10.5, 1.1, { align: "center" });
                ajouterUnePhoto(pdf, data.photos[i], 2, 10);
                if (data.photos[i + 1]) {
                    ajouterUnePhoto(pdf, data.photos[i + 1], 15, 10);
                }
            }
        }

        // --- PAGE VIDE TECHNIQUE ---
        pdf.addPage();
        pdf.rect(0.7, 0.5, 19.6, 27.4, 'S');
        pdf.save(`intervention_${data.nomCli}.pdf`);
    }
});

// Fonction globale pour ajouter les photos
// --- FONCTION APERÇU AVEC CAPTURE GPS ---
function addPhotoToPreview(photoData) {
    const photoObject = {
        original: photoData,
        current: photoData,
        drawings: [],
        label: "",
        gps: "" // Stockage des coordonnées
    };

    const photoContainer = document.createElement("div");
    photoContainer.style.display = "inline-block";
    photoContainer.style.margin = "10px";
    photoContainer.style.position = "relative";
    photoContainer.style.width = "120px";
    photoContainer.style.verticalAlign = "top";

    const img = document.createElement("img");
    img.src = photoObject.current;
    img.style.width = "100%";
    img.style.border = "1px solid #ccc";
    photoContainer.appendChild(img);

    // --- ZONE GPS ---
    const gpsInfo = document.createElement("div");
    gpsInfo.style.fontSize = "9px";
    gpsInfo.style.color = "#666";
    gpsInfo.style.textAlign = "center";
    gpsInfo.textContent = "GPS : Non fixé";
    photoContainer.appendChild(gpsInfo);

    const gpsBtn = document.createElement("button");
    gpsBtn.type = "button";
    gpsBtn.textContent = "Fixer GPS";
    gpsBtn.style.width = "100%";
    gpsBtn.style.fontSize = "10px";
    gpsBtn.style.backgroundColor = "#ffc107";
    gpsBtn.onclick = () => {
        if (!navigator.geolocation) return alert("GPS non supporté");
        
        gpsInfo.textContent = "Recherche...";
        navigator.geolocation.getCurrentPosition((pos) => {
            const lat = pos.coords.latitude.toFixed(6);
            const lon = pos.coords.longitude.toFixed(6);
            photoObject.gps = `Lat: ${lat}, Lon: ${lon}`;
            gpsInfo.textContent = photoObject.gps;
            gpsBtn.style.backgroundColor = "#28a745";
            gpsBtn.style.color = "white";
            gpsBtn.textContent = "Position fixée";
        }, (err) => {
            gpsInfo.textContent = "Erreur GPS";
            console.error(err);
        }, { enableHighAccuracy: true });
    };
    photoContainer.appendChild(gpsBtn);

    // --- LIBELLÉ ---
    const labelInp = document.createElement("input");
    labelInp.type = "text";
    labelInp.placeholder = "Libellé...";
    labelInp.style.width = "100%";
    labelInp.oninput = () => { photoObject.label = labelInp.value; };
    photoContainer.appendChild(labelInp);

    // --- BOUTONS ÉDITION / SUPPRESSION ---
    const btnGroup = document.createElement("div");
    btnGroup.style.display = "flex";

    const editBtn = document.createElement("button");
    editBtn.textContent = "✎";
    editBtn.style.flex = "1";
    editBtn.onclick = () => {
        const idx = photoList.indexOf(photoObject);
        openEditorInNewTab(photoObject.original, idx, photoObject.drawings);
    };

    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = "🗑";
    deleteButton.style.flex = "1";
    deleteButton.style.color = "red";
    deleteButton.onclick = () => {
        photoPreviewContainer.removeChild(photoContainer);
        photoList = photoList.filter((p) => p !== photoObject);
    };

    btnGroup.appendChild(editBtn);
    btnGroup.appendChild(deleteButton);
    photoContainer.appendChild(btnGroup);

    photoPreviewContainer.appendChild(photoContainer);
    photoList.push(photoObject);
}

// --- MAPPING DES DONNÉES AVANT GÉNÉRATION ---
// (À insérer dans votre event listener generatePDFBtn)
/*
const data = {
    ...
    photos: photoList.map(p => ({
        src: p.current,
        label: p.label || "Sans libellé",
        gps: p.gps || "Non renseigné"
    })),
    ...
};
*/

// --- FONCTION PDF MISE À JOUR ---
function ajouterUnePhoto(pdf, photo, yPos, hauteurMax = 10) {
    try {
        const props = pdf.getImageProperties(photo.src);
        const ratio = Math.min(17 / props.width, hauteurMax / props.height);
        const finalW = props.width * ratio;
        const finalH = props.height * ratio;
        const xCentré = (21 - finalW) / 2;

        pdf.addImage(photo.src, 'PNG', xCentré, yPos, finalW, finalH, undefined, 'FAST');
        
        // Bandeau d'information (plus grand pour 2 lignes)
        const yBandeau = yPos + finalH + 0.2;
        pdf.setFillColor(210, 230, 255);
        pdf.rect(0.7, yBandeau, 19.6, 1.2, 'F'); 
        
        // Ligne 1 : Libellé
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text(photo.label, 10.5, yBandeau + 0.4, { align: "center" });
        
        // Ligne 2 : Coordonnées GPS
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(60, 60, 60);
        pdf.text(`Coordonnées GPS : ${photo.gps}`, 10.5, yBandeau + 0.9, { align: "center" });
        
    } catch (e) { 
        console.warn("Erreur image PDF :", e); 
    }
}


// --- FONCTION D'ENVOI VERS L'API VERCEL ---
async function envoyerEmail(data, zipBlob) {
    const reader = new FileReader();
    reader.readAsDataURL(zipBlob); 
    
    reader.onloadend = async () => {
        const base64Zip = reader.result.split(',')[1]; // On récupère juste le base64

        const payload = {
            nom_client: `${data.nomCli} ${data.prenomCli}`,
            no_dossier: data.noDossier,
            zip_data: base64Zip
        };

        try {
            const response = await fetch('/api/send_report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (response.ok) {
                alert("✅ Email envoyé avec succès !");
            } else {
                alert("❌ Erreur : " + result.error);
            }
        } catch (error) {
            console.error("Erreur réseau :", error);
            alert("❌ Impossible de contacter le serveur d'envoi.");
        }
    };
}