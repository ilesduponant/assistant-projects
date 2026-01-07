/* ============================================================
   VARIABLES GLOBALES
============================================================ */
const photosInput = document.getElementById("photos");
const photoPreviewContainer = document.getElementById("photo-preview");
const takePhotoButton = document.getElementById("take-photo");
const savePhotoButton = document.getElementById("save-photo");
const camera = document.getElementById("camera");
const cameraCanvas = document.getElementById("camera-canvas");
const cameraContext = cameraCanvas.getContext("2d");

let photoList = [];
let currentEditingIndex = null;

/* ============================================================
   UPLOAD DE PHOTOS
============================================================ */
photosInput.addEventListener("change", (event) => {
    const files = Array.from(event.target.files);
    files.forEach((file) => {
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => addPhotoToPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    });
});

/* ============================================================
   CAMÉRA
============================================================ */
takePhotoButton.addEventListener("click", async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });
        camera.srcObject = stream;
        camera.style.display = "block";
        savePhotoButton.style.display = "inline-block";
    } catch (error) {
        console.error("Caméra inaccessible :", error);
    }
});

savePhotoButton.addEventListener("click", () => {
    cameraCanvas.width = camera.videoWidth;
    cameraCanvas.height = camera.videoHeight;
    cameraContext.drawImage(camera, 0, 0);

    const photoData = cameraCanvas.toDataURL("image/png");
    addPhotoToPreview(photoData);

    const stream = camera.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());

    camera.style.display = "none";
    savePhotoButton.style.display = "none";
});

/* ============================================================
   APERCU DES PHOTOS
============================================================ */
function addPhotoToPreview(photoData) {
    const index = photoList.length;

    const container = document.createElement("div");

    const img = document.createElement("img");
    img.src = photoData;
    img.style.width = "100px";
    img.style.border = "1px solid #ccc";
    container.appendChild(img);

    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.placeholder = "Libellé";
    labelInput.style.display = "block";
    labelInput.style.marginTop = "5px";
    container.appendChild(labelInput);

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Modifier";
    editButton.className = "edit-button";
    editButton.onclick = () => openEditorInNewTab(photoData, index);
    container.appendChild(editButton);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.innerHTML = "🗑";
    deleteButton.className = "delete-button";
    deleteButton.onclick = () => {
        photoPreviewContainer.removeChild(container);
        photoList.splice(index, 1);
    };
    container.appendChild(deleteButton);

    photoPreviewContainer.appendChild(container);

    photoList.push({ data: photoData, label: labelInput });
}

/* ============================================================
   OUVERTURE DE L'ÉDITEUR DANS UN NOUVEL ONGLET
============================================================ */
function openEditorInNewTab(photoData, index) {
    const editorWindow = window.open("", "_blank");

    editorWindow.document.write(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Éditeur Mobile</title>
    <style>
        body { margin: 0; padding: 0; font-family: sans-serif; overflow: hidden; background: #333; }
        #toolbar { 
            display: flex; flex-wrap: wrap; gap: 8px; padding: 10px; 
            background: #f8f9fa; border-bottom: 1px solid #ccc; justify-content: center;
        }
        .tool-btn {
            width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
            border: 1px solid #ccc; background: white; border-radius: 8px; cursor: pointer;
            touch-action: manipulation;
        }
        .tool-btn.active { background-color: #007bff; color: white; border-color: #0056b3; }
        .tool-btn svg { width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 2; }
        
        #canvas-container { 
            display: flex; justify-content: center; align-items: center; 
            height: calc(100vh - 120px); background: #222; overflow: hidden;
        }
        canvas { 
            background: white; 
            touch-action: none; /* Empêche le scroll pendant le dessin */
            max-width: 100%; max-height: 100%;
        }
        .controls-row { display: flex; align-items: center; gap: 10px; padding: 5px 10px; background: #eee; }
        input[type="range"] { flex-grow: 1; }
    </style>
</head>
<body>

    <div id="toolbar">
        <button class="tool-btn active" onclick="setTool('free', this)" title="Crayon">
            <svg viewBox="0 0 24 24"><path d="M12 19c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM6 1c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM18 1c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM12 1c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 7c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
        </button>
        <button class="tool-btn" onclick="setTool('line', this)">
            <svg viewBox="0 0 24 24"><line x1="5" y1="19" x2="19" y2="5"></line></svg>
        </button>
        <button class="tool-btn" onclick="setTool('rect', this)">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>
        </button>
        <button class="tool-btn" onclick="setTool('circle', this)">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle></svg>
        </button>
        <button class="tool-btn" onclick="setTool('text', this)">
            <svg viewBox="0 0 24 24"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
        </button>
        <button class="tool-btn" onclick="setTool('eraser', this)">
            <svg viewBox="0 0 24 24"><path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z"></path></svg>
        </button>
        <button class="tool-btn" onclick="undo()" style="margin-left:auto">↩</button>
        <button class="tool-btn" onclick="saveEditedImage()" style="background:#28a745; color:white; border:none">✔</button>
    </div>

    <div class="controls-row">
        <input type="color" value="#ff0000" id="colorPicker" onchange="setColor(this.value)">
        <input type="range" min="1" max="25" value="5" onchange="setSize(this.value)">
    </div>

    <div id="canvas-container">
        <canvas id="canvas"></canvas>
    </div>

<script>
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let tool = "free", drawing = false;
let startX = 0, startY = 0, color = "#ff0000", size = 5;
let undoStack = [], redoStack = [], currentPath = null;
const baseImg = new Image();

baseImg.onload = () => {
    const container = document.getElementById("canvas-container");
    const ratio = Math.min(container.clientWidth / baseImg.naturalWidth, container.clientHeight / baseImg.naturalHeight);
    canvas.width = baseImg.naturalWidth * ratio;
    canvas.height = baseImg.naturalHeight * ratio;
    drawAll();
};
baseImg.src = "${photoData}";

function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    // Support Souris OU Tactile
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

// Event Listeners Souris
canvas.addEventListener("mousedown", start);
window.addEventListener("mousemove", move);
window.addEventListener("mouseup", end);

// Event Listeners Tactile
canvas.addEventListener("touchstart", (e) => { e.preventDefault(); start(e); }, { passive: false });
canvas.addEventListener("touchmove", (e) => { e.preventDefault(); move(e); }, { passive: false });
canvas.addEventListener("touchend", (e) => { e.preventDefault(); end(e); }, { passive: false });

function start(e) {
    drawing = true;
    const pos = getCanvasPos(e);
    startX = pos.x; startY = pos.y;

    if (tool === "free" || tool === "eraser") {
        currentPath = { tool, color, size, points: [{ x: startX, y: startY }] };
    }
}

function move(e) {
    if (!drawing || tool === "text") return;
    const pos = getCanvasPos(e);
    
    if (tool === "free" || tool === "eraser") {
        currentPath.points.push({ x: pos.x, y: pos.y });
    } else {
        currentPath = { tool, color, size, points: [{ x: startX, y: startY }, { x: pos.x, y: pos.y }] };
    }
    drawAll();
}

function end(e) {
    if (!drawing) return;
    drawing = false;

    if (tool === "text") {
        const txt = prompt("Texte à ajouter :");
        if (txt) undoStack.push({ tool: "text", color, size, points: [{ x: startX, y: startY }], text: txt });
    } else if (currentPath) {
        undoStack.push(currentPath);
    }
    currentPath = null;
    drawAll();
}

function drawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width; tempCanvas.height = canvas.height;
    const tCtx = tempCanvas.getContext("2d");

    const paths = undoStack.concat(currentPath ? [currentPath] : []);
    
    paths.forEach(p => {
        tCtx.globalCompositeOperation = p.tool === "eraser" ? "destination-out" : "source-over";
        tCtx.strokeStyle = p.color; tCtx.fillStyle = p.color;
        tCtx.lineWidth = p.size; tCtx.lineCap = "round"; tCtx.lineJoin = "round";
        tCtx.beginPath();

        if (p.tool === "free" || p.tool === "eraser") {
            tCtx.moveTo(p.points[0].x, p.points[0].y);
            p.points.forEach(pt => tCtx.lineTo(pt.x, pt.y));
            tCtx.stroke();
        } else if (p.tool === "line") {
            tCtx.moveTo(p.points[0].x, p.points[0].y);
            tCtx.lineTo(p.points[1].x, p.points[1].y);
            tCtx.stroke();
        } else if (p.tool === "rect") {
            tCtx.strokeRect(p.points[0].x, p.points[0].y, p.points[1].x - p.points[0].x, p.points[1].y - p.points[0].y);
        } else if (p.tool === "circle") {
            const r = Math.hypot(p.points[1].x - p.points[0].x, p.points[1].y - p.points[0].y);
            tCtx.arc(p.points[0].x, p.points[0].y, r, 0, Math.PI * 2);
            tCtx.stroke();
        } else if (p.tool === "text") {
            tCtx.font = (p.size * 4) + "px Arial";
            tCtx.fillText(p.text, p.points[0].x, p.points[0].y);
        }
    });
    ctx.drawImage(tempCanvas, 0, 0);
}

function setTool(t, btn) {
    tool = t;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}
function undo() { undoStack.pop(); drawAll(); }
function setColor(c) { color = c; }
function setSize(s) { size = parseInt(s); }

function saveEditedImage() {
    window.opener.postMessage({ editedImage: canvas.toDataURL("image/png"), index: ${index} }, "*");
    window.close();
}
</script>
</body>
</html>
    `);
}
/* ============================================================
   RÉCEPTION DE L’IMAGE MODIFIÉE
============================================================ */
window.addEventListener("message", (event) => {
    if (event.data.editedImage !== undefined) {
        const { editedImage, index } = event.data;

        // Mise à jour dans photoList
        photoList[index].data = editedImage;

        // Mise à jour de l’aperçu
        photoPreviewContainer.children[index].querySelector("img").src = editedImage;
    }
});
