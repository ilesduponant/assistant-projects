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
    photoContainer.className = "photo-item"; // Utilise ton CSS existant
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
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Éditeur d'image</title>
    <style>
        body { margin: 0; background: #1a1a1a; font-family: sans-serif; overflow: hidden; color: white; }
        #toolbar { display: flex; gap: 8px; padding: 10px; background: #333; flex-wrap: wrap; justify-content: center; align-items: center; }
        .tool-btn { min-width: 44px; height: 44px; border: 1px solid #555; background: #444; color: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .tool-btn.active { background: #007bff; border-color: #0056b3; }
        #canvas-container { height: calc(100vh - 110px); display: flex; justify-content: center; align-items: center; overflow: hidden; padding: 10px; box-sizing: border-box; }
        canvas { background: white; touch-action: none; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
        .controls { display: flex; gap: 15px; padding: 5px; background: #222; justify-content: center; font-size: 12px; }
        input[type="range"] { width: 80px; }
    </style>
</head>
<body>
    <div id="toolbar">
        <button class="tool-btn active" onclick="setTool('free', this)" title="Crayon">✎</button>
        <button class="tool-btn" onclick="setTool('line', this)" title="Ligne">╱</button>
        <button class="tool-btn" onclick="setTool('rect', this)" title="Rectangle">▭</button>
        <button class="tool-btn" onclick="setTool('circle', this)" title="Cercle">○</button>
        <button class="tool-btn" onclick="setTool('eraser', this)" title="Gomme">✖</button>
        <button class="tool-btn" onclick="undo()" title="Annuler">↩</button>
        <button class="tool-btn" onclick="save()" style="background:#28a745; margin-left:10px;">✔ Valider</button>
    </div>
    <div class="controls">
        <label>Couleur: <input type="color" id="col" value="#ff0000" onchange="color=this.value"></label>
        <label>Taille: <input type="range" min="2" max="40" value="5" id="sizeRange" onchange="size=parseInt(this.value)"></label>
    </div>
    <div id="canvas-container"><canvas id="canvas"></canvas></div>

    <script>
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        let tool = "free", drawing = false, color = "#ff0000", size = 5;
        let startX, startY;
        
        let undoStack = ${drawingsJson}; 
        let currentPath = null;
        
        const baseImg = new Image();
        baseImg.onload = () => {
            // Calcul du ratio pour que l'image tienne dans l'écran sans déformer
            const maxWidth = window.innerWidth * 0.95;
            const maxHeight = window.innerHeight - 150;
            const ratio = Math.min(maxWidth / baseImg.naturalWidth, maxHeight / baseImg.naturalHeight);
            
            canvas.width = baseImg.naturalWidth * ratio;
            canvas.height = baseImg.naturalHeight * ratio;
            drawAll();
        };
        baseImg.src = "${originalData}";

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * (canvas.width / rect.width),
                y: (clientY - rect.top) * (canvas.height / rect.height)
            };
        }

        function start(e) {
            drawing = true;
            const p = getPos(e);
            startX = p.x; startY = p.y;
            currentPath = { tool, color, size, pts: [p] };
        }

        function move(e) {
            if(!drawing) return;
            const p = getPos(e);
            if(tool === "free" || tool === "eraser") {
                currentPath.pts.push(p);
            } else {
                currentPath.pts = [{x:startX, y:startY}, p];
            }
            drawAll();
        }

        function end() {
            if(!drawing) return;
            drawing = false;
            if(currentPath) undoStack.push(currentPath);
            currentPath = null;
            drawAll();
        }

        function drawPath(tCtx, p) {
            tCtx.globalCompositeOperation = p.tool === "eraser" ? "destination-out" : "source-over";
            tCtx.strokeStyle = p.color;
            tCtx.lineWidth = p.size;
            tCtx.lineCap = "round";
            tCtx.lineJoin = "round";
            tCtx.beginPath();

            if(p.tool === "free" || p.tool === "eraser") {
                tCtx.moveTo(p.pts[0].x, p.pts[0].y);
                p.pts.forEach(pt => tCtx.lineTo(pt.x, pt.y));
                tCtx.stroke();
            } else if(p.tool === "line") {
                tCtx.moveTo(p.pts[0].x, p.pts[0].y);
                tCtx.lineTo(p.pts[1].x, p.pts[1].y);
                tCtx.stroke();
            } else if(p.tool === "rect") {
                tCtx.strokeRect(p.pts[0].x, p.pts[0].y, p.pts[1].x - p.pts[0].x, p.pts[1].y - p.pts[0].y);
            } else if(p.tool === "circle") {
                const r = Math.hypot(p.pts[1].x - p.pts[0].x, p.pts[1].y - p.pts[0].y);
                tCtx.arc(p.pts[0].x, p.pts[0].y, r, 0, Math.PI*2);
                tCtx.stroke();
            }
        }

        function drawAll() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
            
            // On utilise un canvas temporaire pour la gomme (destination-out sur l'image)
            const tmpCanvas = document.createElement("canvas");
            tmpCanvas.width = canvas.width; tmpCanvas.height = canvas.height;
            const tCtx = tmpCanvas.getContext("2d");

            undoStack.forEach(p => drawPath(tCtx, p));
            if(currentPath) drawPath(tCtx, currentPath);
            
            ctx.drawImage(tmpCanvas, 0, 0);
        }

        function setTool(t, btn) {
            tool = t;
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }

        function undo() { undoStack.pop(); drawAll(); }

        function save() {
            // On crée le rendu final à la taille réelle de l'image d'origine
            const finalCanvas = document.createElement("canvas");
            finalCanvas.width = baseImg.naturalWidth;
            finalCanvas.height = baseImg.naturalHeight;
            const fCtx = finalCanvas.getContext("2d");
            
            const scale = baseImg.naturalWidth / canvas.width;
            
            fCtx.drawImage(baseImg, 0, 0);
            
            undoStack.forEach(p => {
                fCtx.globalCompositeOperation = p.tool === "eraser" ? "destination-out" : "source-over";
                fCtx.strokeStyle = p.color;
                fCtx.lineWidth = p.size * scale;
                fCtx.lineCap = "round"; fCtx.lineJoin = "round";
                fCtx.beginPath();
                const pts = p.pts.map(pt => ({ x: pt.x * scale, y: pt.y * scale }));
                
                if(p.tool === "free" || p.tool === "eraser") {
                    fCtx.moveTo(pts[0].x, pts[0].y);
                    pts.forEach(pt => fCtx.lineTo(pt.x, pt.y));
                } else if(p.tool === "line") {
                    fCtx.moveTo(pts[0].x, pts[0].y); fCtx.lineTo(pts[1].x, pts[1].y);
                } else if(p.tool === "rect") {
                    fCtx.strokeRect(pts[0].x, pts[0].y, pts[1].x - pts[0].x, pts[1].y - pts[0].y);
                } else if(p.tool === "circle") {
                    const r = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
                    fCtx.arc(pts[0].x, pts[0].y, r, 0, Math.PI*2);
                }
                fCtx.stroke();
            });

            window.opener.postMessage({ 
                editedImage: finalCanvas.toDataURL("image/png"), 
                drawings: undoStack, 
                index: ${index} 
            }, "*");
            window.close();
        }

        canvas.addEventListener("mousedown", start);
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", end);
        canvas.addEventListener("touchstart", (e) => { e.preventDefault(); start(e); }, {passive:false});
        canvas.addEventListener("touchmove", (e) => { e.preventDefault(); move(e); }, {passive:false});
        canvas.addEventListener("touchend", (e) => { e.preventDefault(); end(); }, {passive:false});
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

    // Ajustement taille canvas
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

    // --- GENERATION PDF & ENVOI ---
    document.getElementById("generatePDF").onclick = async (e) => {
        e.preventDefault();
        if (!hasSignature) return alert("Signature obligatoire !");

        const btn = e.target;
        btn.disabled = true;
        btn.textContent = "Traitement...";

        const data = {
            nomCli: document.getElementById("nomCli").value,
            prenomCli: document.getElementById("prenomCli").value,
            noDossier: document.getElementById("noDossier").value,
            adresseCli: document.getElementById("adresseCli").value,
            cpCli: document.getElementById("cpCli").value,
            villeCli: document.getElementById("villeCli").value,
            signature: canvas.toDataURL(),
            photos: photoList
        };

        try {
            await genererPDF(data);
            
            // Création ZIP
            const zip = new JSZip();
            data.photos.forEach((p, i) => {
                zip.file(`photo_${i}.png`, p.current.split(',')[1], {base64: true});
            });
            const zipBlob = await zip.generateAsync({type: "blob"});
            
            // Envoi Vercel
            const reader = new FileReader();
            reader.readAsDataURL(zipBlob);
            reader.onloadend = async () => {
                const response = await fetch('https://assistant-projects-q9lix48o4-valerians-projects-417c35ac.vercel.app/api/send_report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nom_client: data.nomCli,
                        no_dossier: data.noDossier,
                        zip_data: reader.result.split(',')[1]
                    })
                });
                if(response.ok) alert("Envoyé !");
                else alert("Erreur d'envoi");
            };
        } catch (err) {
            console.error(err);
        } finally {
            btn.disabled = false;
            btn.textContent = "Générer PDF & Envoyer";
        }
    };
});

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
        pdf.text(p.label + " (" + p.gps + ")", 75, y + 20);
        y += 50;
    });

    pdf.addPage();
    pdf.text("Signature :", 20, 20);
    pdf.addImage(data.signature, 'PNG', 20, 30, 60, 30);
    
    pdf.save(`Rapport_${data.nomCli}.pdf`);
}

// Helpers globales
window.syncIdentite = () => {
    document.getElementById('nomTravaux').value = document.getElementById('nomCli').value;
    document.getElementById('prenomTravaux').value = document.getElementById('prenomCli').value;
};
