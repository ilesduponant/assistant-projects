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
        <html>
        <head>
            <title>Édition de photo</title>
	    <link rel="stylesheet" href="style.css" />
            <style>
                body { font-family: Arial; margin: 20px; }
                #toolbar button { margin-right: 5px; }
                #toolbar input { margin-right: 10px; }
            </style>
        </head>
        <body>
	<main class="editeur">

        <h2>Éditeur de photo</h2>

        <div id="toolbar">
            <button type="button" onclick="setTool('free')">Trait libre</button>
            <button type="button" onclick="setTool('line')">Ligne</button>
            <button type="button" onclick="setTool('rect')">Rectangle</button>
            <button type="button" onclick="setTool('circle')">Cercle</button>
            <button type="button" onclick="setTool('eraser')">Gomme</button>

            <input type="color" id="colorPicker" value="#ff0000" onchange="setColor(this.value)">
            <input type="range" id="sizePicker" min="1" max="20" value="3" onchange="setSize(this.value)">

            <button type="button" onclick="undo()">Undo</button>
            <button type="button" onclick="redo()">Redo</button>

            <button type="button" onclick="saveEditedImage()">Sauvegarder</button>
        </div>

        <canvas id="canvas" width="800" height="500" style="border:1px solid #000"></canvas>

        <script>
            const canvas = document.getElementById("canvas");
            const ctx = canvas.getContext("2d");

            let tool = "free";
            let drawing = false;
            let startX = 0;
            let startY = 0;
            let color = "#ff0000";
            let size = 3;

            let undoStack = [];
            let redoStack = [];

            function setTool(t) { tool = t; }
            function setColor(c) { color = c; }
            function setSize(s) { size = s; }

            function saveState() {
                undoStack.push(canvas.toDataURL());
                redoStack = [];
            }

            function undo() {
                if (undoStack.length > 1) {
                    redoStack.push(undoStack.pop());
                    restoreState(undoStack[undoStack.length - 1]);
                }
            }

            function redo() {
                if (redoStack.length > 0) {
                    const state = redoStack.pop();
                    undoStack.push(state);
                    restoreState(state);
                }
            }

            function restoreState(state) {
                const img = new Image();
                img.onload = () => {
		    console.log("Natural Width:", img.naturalWidth);
                    console.log("Natural Height:", img.naturalHeight);
                    ctx.clearRect(0, 0);
                    ctx.drawImage(img, 0, 0);
                };
                img.src = state;
            }

            // Charger l'image envoyée par la fenêtre parent
            const img = new Image();
            img.onload = () => {

	    	canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                saveState();
            };
            img.src = "${photoData}";

            canvas.addEventListener("mousedown", (e) => {
                drawing = true;
                startX = e.offsetX;
                startY = e.offsetY;

                ctx.strokeStyle = tool === "eraser" ? "white" : color;
                ctx.lineWidth = size;

                if (tool === "free" || tool === "eraser") {
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                }
            });

            canvas.addEventListener("mousemove", (e) => {
                if (!drawing) return;

                if (tool === "free" || tool === "eraser") {
                    ctx.lineTo(e.offsetX, e.offsetY);
                    ctx.stroke();
                }
            });

            canvas.addEventListener("mouseup", (e) => {
                if (!drawing) return;
                drawing = false;

                const endX = e.offsetX;
                const endY = e.offsetY;

                ctx.strokeStyle = color;
                ctx.lineWidth = size;

                if (tool !== "free" && tool !== "eraser") {
                    ctx.beginPath();
                    switch (tool) {
                        case "line":
                            ctx.moveTo(startX, startY);
                            ctx.lineTo(endX, endY);
                            ctx.stroke();
                            break;
                        case "rect":
                            ctx.strokeRect(startX, startY, endX - startX, endY - startY);
                            break;
                        case "circle":
                            const radius = Math.sqrt((endX - startX)**2 + (endY - startY)**2);
                            ctx.arc(startX, startY, radius, 0, Math.PI * 2);
                            ctx.stroke();
                            break;
                    }
                }

                saveState();
            });

            function saveEditedImage() {
                const finalImage = canvas.toDataURL("image/png");

                // Envoi à la fenêtre parent
                window.opener.postMessage({
                    editedImage: finalImage,
                    index: ${index}
                }, "*");

                window.close();
            }
        <\/script>
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
