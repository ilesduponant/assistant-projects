let photoList = [];
const photoPreviewContainer = document.getElementById("photo-preview");

document.addEventListener("DOMContentLoaded", () => {
    const photosInput = document.getElementById("photos");
    const takePhotoButton = document.getElementById("take-photo");
    const savePhotoButton = document.getElementById("save-photo");
    const camera = document.getElementById("camera");
    const cameraCanvas = document.getElementById("camera-canvas");
    const cameraContext = cameraCanvas.getContext("2d");

    if (photosInput) {
        photosInput.addEventListener("change", (event) => {
            const files = Array.from(event.target.files);
            files.forEach((file) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    photoList.push({ current: e.target.result });
                    renderPhotos();
                };
                reader.readAsDataURL(file);
            });
        });
    }
    // affichage de la caméra
    if (takePhotoButton) {
        takePhotoButton.addEventListener("click", async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                });
                camera.srcObject = stream;
                camera.style.display = "block";
                savePhotoButton.style.display = "inline-block";
            } catch (error) {
                console.error("Erreur caméra :", error);
            }
        });
    }
    
    // bouton pour prendre la photo avec la caméra
    if (savePhotoButton) {
        savePhotoButton.addEventListener("click", () => {
            try {
                cameraCanvas.width = camera.videoWidth || 1920;
                cameraCanvas.height = camera.videoHeight || 1080;
                cameraContext.drawImage(camera, 0, 0, cameraCanvas.width, cameraCanvas.height);

                const photoData = cameraCanvas.toDataURL("image/png");
                photoList.push({ current: photoData });
                renderPhotos();

                const stream = camera.srcObject;
                if (stream) {
                    stream.getTracks().forEach((track) => track.stop());
                }
                camera.style.display = "none";
                savePhotoButton.style.display = "none";
            } catch (error) {
                console.error("Erreur enregistrement :", error);
            }
        });
    }
});

// bouton de validation du formulaire
const sendBtn = document.getElementById("send");
if (sendBtn) {
    sendBtn.onclick = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const ile = document.getElementById("ile")?.value || "N/A";
        const description = document.querySelector("#description")?.value || "N/A";

        sendBtn.disabled = true;
        sendBtn.textContent = "⌛ Envoi en cours...";

        try {
	    // photos en pj
            const attachments = photoList.map((p, i) => ({
                filename: `photo_${ile}_${i + 1}.png`,
                content: p.current.split(',')[1],
                type: 'image/png'
            }));

	    // appel de la fonction vercel send_colis
            const response = await fetch('https://assistant-projects.vercel.app/api/send_colis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ile: ile,
                    description: description,
                    subject: `LIVRAISON - ${ile}`,
                    files: attachments
                })
            });

            if (response.ok) {
                clearDraft();
                alert("✅ Livraison envoyée !");
                photoList = [];
                renderPhotos();
                document.querySelector("form")?.reset();
            } else {
                alert("❌ Erreur : " + response.status);
            }

        } catch (err) {
            alert("❌ Erreur technique : " + err.message);
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = "Envoyer";
        }
    };
}

// affichage de l'aperçu des photos
function renderPhotos() {
    if (!photoPreviewContainer) return;
    photoPreviewContainer.innerHTML = "";

    photoList.forEach((photoObject, idx) => {
        const photoContainer = document.createElement("div");
        photoContainer.className = "photo-item";
        photoContainer.style = "position:relative; display:inline-block; margin:15px; width:180px; vertical-align:top; border:1px solid #ddd; padding:5px; background:#fff; border-radius:5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);";

        const deleteBtn = document.createElement("div");
        deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
        deleteBtn.className = "delete-button";

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
        img.style = "width:100%; height:auto; display:block; border-radius:3px;";

        photoContainer.appendChild(img);
        photoPreviewContainer.appendChild(photoContainer);
    });

    if (window.lucide) lucide.createIcons();
}

window.addEventListener('load', () => {
  const inputs = document.querySelectorAll('input, textarea, select');

  inputs.forEach(field => {
    if (!field.id || field.type === 'file') return; // Ignore les fichiers et les champs sans ID

    // Restauration
    const savedValue = localStorage.getItem(`draft_${field.id}`);
    if (savedValue !== null) field.value = savedValue;

    // Sauvegarde
    field.addEventListener('input', () => {
      localStorage.setItem(`draft_${field.id}`, field.value);
    });
  });
});

function clearDraft() {
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(field => {
    if (field.id) localStorage.removeItem(`draft_${field.id}`);
    if (field.type !== 'file') field.value = ''; // On ne vide pas le champ file comme ça
  });
}
// on regarde si tous les champs sont remplis
function validateForm() {
    const requiredFields = document.querySelectorAll("[required]");
    let missingFields = [];

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            const label = field.previousElementSibling?.innerText || field.placeholder || "Champ requis";
            missingFields.push(label);
            field.style.border = "2px solid red";
        } else {
            field.style.border = "";
        }
    });

    if (missingFields.length > 0) {
        alert("⚠️ Champs obligatoires manquants :\n- " + missingFields.join("\n- "));
        return false;
    }
    return true;
}
