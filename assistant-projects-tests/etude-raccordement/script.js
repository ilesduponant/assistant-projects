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
    const form = document.getElementById("raccordementForm");
    const generatePDFBtn = document.getElementById("generatePDF");
    let hasSignature = false;

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

        if (!hasSignature || isCanvasEmpty(canvasRepresentant)) {
            alert("⚠️ La signature est obligatoire avant de générer le PDF !");
            return;
        }

        const data = {
            nomCli: document.getElementById("nomCli")?.value || "",
            prenomCli: document.getElementById("prenomCli")?.value || "",
            noDossier: document.getElementById("noDossier")?.value || "",
            signature: canvasRepresentant.toDataURL("image/png")
        };

        await genererPDF(data);
    });

    async function genererPDF(data) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: 'cm' });

        // PAGE 1 : Entête et Infos
        try {
            const enteteBase64 = await imageToBase64("enteteImg.png");
	    //nom fichier/var, type, offset W, offset H, W, H (cm)
            pdf.addImage(enteteBase64, 'PNG', 1, 0, 18.62, 11.67);
        } catch (e) { console.warn(e); }

        pdf.setFontSize(12);
        pdf.text(`Client : ${data.nomCli} ${data.prenomCli}`, 1, 14);
        pdf.text(`Dossier : ${data.noDossier}`, 1, 15);
        pdf.addImage(data.signature, "PNG", 1, 16, 5, 2.5);

        // PAGE 2 : Consuel
        try {
            pdf.addPage();
            const consuelB64 = await imageToBase64("consuelImg.png");
            pdf.addImage(consuelB64, 'PNG', 1, 0, 17.88, 24.63);
        } catch (e) { console.warn(e); }

        // PAGE 3 : Compteur
        try {
            pdf.addPage();
            const compteurB64 = await imageToBase64("compteurImg.png");
            pdf.addImage(compteurB64, 'PNG', 1, 0, 18.62, 11.67);
        } catch (e) { console.warn(e); }

        pdf.save("intervention.pdf");
    }

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
});
