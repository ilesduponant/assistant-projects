window.openEditorInNewTab = function(originalData, index, existingDrawings) {
    const editorWindow = window.open("", "_blank");
    const drawingsJson = JSON.stringify(existingDrawings || []);

    editorWindow.document.write(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Éditeur Pro</title>
    <style>
        body { margin: 0; background: #1a1a1a; font-family: sans-serif; overflow: hidden; color: white; }
        #toolbar { display: flex; gap: 8px; padding: 10px; background: #333; flex-wrap: wrap; justify-content: center; align-items: center; }
        .tool-btn { min-width: 44px; height: 44px; border: 1px solid #555; background: #444; color: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .tool-btn.active { background: #007bff; border-color: #0056b3; }
        #canvas-container { height: calc(100vh - 120px); display: flex; justify-content: center; align-items: center; overflow: hidden; padding: 10px; box-sizing: border-box; }
        canvas { background: white; touch-action: none; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
        .controls { display: flex; gap: 15px; padding: 10px; background: #222; justify-content: center; font-size: 14px; align-items: center; border-top: 1px solid #444;}
        input[type="range"] { width: 120px; }
    </style>
</head>
<body>
    <div id="toolbar">
        <button class="tool-btn active" onclick="setTool('free', this)">✏️</button>
        <button class="tool-btn" onclick="setTool('rect', this)">⬜</button>
        <button class="tool-btn" onclick="setTool('text', this)">A</button>
        <button class="tool-btn" onclick="setTool('line', this)">╱</button>
        <button class="tool-btn" onclick="setTool('eraser', this)">✖</button>
        <button class="tool-btn" onclick="undo()" style="background:#666;">↩</button>
        <button class="tool-btn" onclick="save()" style="background:#28a745; margin-left:10px; width:100px;">VALIDER</button>
    </div>
    
    <div class="controls">
        <label>Couleur: <input type="color" id="col" value="#ff0000"></label>
        <label>Taille: <input type="range" id="sizeRange" min="2" max="50" value="5"></label>
    </div>

    <div id="canvas-container"><canvas id="canvas"></canvas></div>

    <script>
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        let tool = "free", drawing = false;
        let startX, startY;
        
        let undoStack = ${drawingsJson}; 
        let currentPath = null;
        
        const baseImg = new Image();
        baseImg.onload = () => {
            const ratio = Math.min((window.innerWidth * 0.95) / baseImg.naturalWidth, (window.innerHeight - 160) / baseImg.naturalHeight);
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

        function drawPath(tCtx, p) {
            // Mise à jour des styles à chaque tracé
            tCtx.globalCompositeOperation = p.tool === "eraser" ? "destination-out" : "source-over";
            tCtx.strokeStyle = p.color;
            tCtx.fillStyle = p.color;
            tCtx.lineWidth = p.size;
            tCtx.lineCap = "round";
            tCtx.lineJoin = "round";

            if(p.tool === "free" || p.tool === "eraser") {
                tCtx.beginPath();
                if(p.pts.length > 0) {
                    tCtx.moveTo(p.pts[0].x, p.pts[0].y);
                    p.pts.forEach(pt => tCtx.lineTo(pt.x, pt.y));
                }
                tCtx.stroke();
            } else if(p.tool === "line") {
                tCtx.beginPath();
                tCtx.moveTo(p.pts[0].x, p.pts[0].y);
                tCtx.lineTo(p.pts[1].x, p.pts[1].y);
                tCtx.stroke();
            } else if(p.tool === "rect") {
                tCtx.beginPath(); // Rectangle VIDE
                tCtx.strokeRect(p.pts[0].x, p.pts[0].y, p.pts[1].x - p.pts[0].x, p.pts[1].y - p.pts[0].y);
            } else if(p.tool === "text") {
                const fontSize = p.size * 3;
                tCtx.font = "bold " + fontSize + "px Arial";
                const txtWidth = tCtx.measureText(p.txt).width;
                
                // Fond blanc derrière le texte
                tCtx.fillStyle = "white";
                tCtx.fillRect(p.x - 5, p.y - fontSize, txtWidth + 10, fontSize + 10);
                
                // Contour fin du rectangle de texte
                tCtx.strokeStyle = p.color;
                tCtx.lineWidth = 1;
                tCtx.strokeRect(p.x - 5, p.y - fontSize, txtWidth + 10, fontSize + 10);
                
                // Le texte
                tCtx.fillStyle = p.color;
                tCtx.fillText(p.txt, p.x, p.y);
            }
        }

        function drawAll() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
            
            const tmpCanvas = document.createElement("canvas");
            tmpCanvas.width = canvas.width; tmpCanvas.height = canvas.height;
            const tCtx = tmpCanvas.getContext("2d");

            undoStack.forEach(p => drawPath(tCtx, p));
            if(currentPath) drawPath(tCtx, currentPath);
            
            ctx.drawImage(tmpCanvas, 0, 0);
        }

        canvas.onpointerdown = (e) => {
            const p = getPos(e);
            const color = document.getElementById("col").value;
            const size = parseInt(document.getElementById("sizeRange").value);
            
            if(tool === "text") {
                const txt = prompt("Texte :");
                if(txt) {
                    undoStack.push({ tool: "text", color, size, x: p.x, y: p.y, txt });
                    drawAll();
                }
                return;
            }
            drawing = true;
            startX = p.x; startY = p.y;
            currentPath = { tool, color, size, pts: [p] };
        };

        window.onpointermove = (e) => {
            if(!drawing) return;
            const p = getPos(e);
            if(tool === "free" || tool === "eraser") {
                currentPath.pts.push(p);
            } else {
                currentPath.pts = [{x:startX, y:startY}, p];
            }
            drawAll();
        };

        window.onpointerup = () => {
            if(!drawing) return;
            drawing = false;
            undoStack.push(currentPath);
            currentPath = null;
            drawAll();
        };

        function setTool(t, btn) {
            tool = t;
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }

        function undo() { undoStack.pop(); drawAll(); }

        function save() {
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = baseImg.naturalWidth;
    finalCanvas.height = baseImg.naturalHeight;
    const fCtx = finalCanvas.getContext("2d");
    
    const scale = baseImg.naturalWidth / canvas.width;
    
    // 1. On dessine d'abord la photo originale (le fond)
    fCtx.drawImage(baseImg, 0, 0);
    
    // 2. On crée un calque temporaire à la taille réelle pour les dessins
    const layerCanvas = document.createElement("canvas");
    layerCanvas.width = finalCanvas.width;
    layerCanvas.height = finalCanvas.height;
    const lCtx = layerCanvas.getContext("2d");

    // 3. On dessine tout le stack sur ce calque
    undoStack.forEach(p => {
        const scaledP = JSON.parse(JSON.stringify(p));
        scaledP.size *= scale;
        if(scaledP.pts) scaledP.pts.forEach(pt => { pt.x *= scale; pt.y *= scale; });
        if(scaledP.x) { 
            scaledP.x *= scale; 
            scaledP.y *= scale; 
        }
        // On utilise lCtx pour ne pas toucher à la photo tout de suite
        drawPath(lCtx, scaledP);
    });

    // 4. On pose le calque de dessins sur la photo
    fCtx.drawImage(layerCanvas, 0, 0);

    // 5. Envoi du résultat
    window.opener.postMessage({ 
        editedImage: finalCanvas.toDataURL("image/jpeg", 0.9), 
        drawings: undoStack, 
        index: ${index} 
    }, "*");
    
    setTimeout(() => window.close(), 200);
}
    </script>
</body>
</html>
    `);
};