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
    <title>Édition de photo</title>

    <!-- CSS externe -->
    <link rel="stylesheet" href="styles.css">
</head>

<body>
<main class="editeur">

    <h2>Éditeur de photo</h2>

    <div id="toolbar">
        <button onclick="setTool('free')">Trait libre</button>
        <button onclick="setTool('line')">Ligne</button>
        <button onclick="setTool('rect')">Rectangle</button>
        <button onclick="setTool('circle')">Cercle</button>
        <button onclick="setTool('eraser')">Gomme</button>

        <input type="color" value="#ff0000" onchange="setColor(this.value)">
        <input type="range" min="1" max="20" value="3" onchange="setSize(this.value)">

        <button onclick="undo()">Undo</button>
        <button onclick="redo()">Redo</button>

        <button onclick="saveEditedImage()">Sauvegarder</button>
    </div>

    <div id="canvas-container">
        <canvas id="canvas"></canvas>
    </div>

<script>
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let tool = "free";
let drawing = false;
let startX = 0;
let startY = 0;
let color = "#ff0000";
let size = 3;
let canvasReady = false;

let undoStack = [];
let redoStack = [];

function setTool(t) { tool = t; }
function setColor(c) { color = c; }
function setSize(s) { size = parseInt(s, 10); }

function saveState() {
    undoStack.push(canvas.toDataURL());
    redoStack = [];
    if (undoStack.length > 50) undoStack.shift();
}

function restoreState(state) {
    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = state;
}

function undo() {
    if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        restoreState(undoStack[undoStack.length - 1]);
    }
}

function redo() {
    if (redoStack.length) {
        const state = redoStack.pop();
        undoStack.push(state);
        restoreState(state);
    }
}

function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const p = e.touches ? e.touches[0] : e;
    return {
        x: (p.clientX - rect.left) * scaleX,
        y: (p.clientY - rect.top) * scaleY
    };
}

const baseImg = new Image();
baseImg.onload = () => {
    resizeCanvas();
    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
    saveState();
    canvasReady = true;
};
baseImg.src = "${photoData}";

function resizeCanvas() {
    const container = document.getElementById("canvas-container");
    const editor = document.querySelector("main.editeur");

    const maxW = container.clientWidth;
    const maxH = editor.clientHeight - container.offsetTop;

    const ratio = Math.min(
        maxW / baseImg.naturalWidth,
        maxH / baseImg.naturalHeight
    );

    canvas.width = Math.round(baseImg.naturalWidth * ratio);
    canvas.height = Math.round(baseImg.naturalHeight * ratio);
}

// Événements souris
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mouseleave", endDraw);

// Événements tactiles
canvas.addEventListener("touchstart", startDraw, { passive: false });
canvas.addEventListener("touchmove", draw, { passive: false });
canvas.addEventListener("touchend", endDraw, { passive: false });

function startDraw(e) {
    if (!canvasReady) return;
    e.preventDefault();

    drawing = true;
    const pos = getCanvasPos(e);
    startX = pos.x;
    startY = pos.y;

    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.globalCompositeOperation =
        tool === "eraser" ? "destination-out" : "source-over";

    ctx.beginPath();
    ctx.moveTo(startX, startY);
}

function draw(e) {
    if (!drawing) return;
    e.preventDefault();

    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}

function endDraw(e) {
    if (!drawing) return;
    drawing = false;

    if (tool !== "free" && tool !== "eraser") {
        const pos = getCanvasPos(e);
        ctx.beginPath();

        if (tool === "line") {
            ctx.moveTo(startX, startY);
            ctx.lineTo(pos.x, pos.y);
        } else if (tool === "rect") {
            ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
        } else if (tool === "circle") {
            const r = Math.hypot(pos.x - startX, pos.y - startY);
            ctx.arc(startX, startY, r, 0, Math.PI * 2);
        }
        ctx.stroke();
    }

    saveState();
}

function saveEditedImage() {
    window.opener.postMessage({
        editedImage: canvas.toDataURL("image/png"),
        index: ${index}
    }, "*");
    window.close();
}
</script>

</main>
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
