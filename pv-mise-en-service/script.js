document.addEventListener("DOMContentLoaded", async () => {
  const generatePDFBtn = document.getElementById("generatePDF");
  const addPhotoGroupBtn = document.getElementById("addPhotoGroup");
  const photosContainer = document.getElementById("photosContainer");
  const clearSignatureBtn = document.getElementById("clearSignature");
  const signatureCanvas = document.getElementById("signatureCanvas");
  const signatureContext = signatureCanvas.getContext("2d");
  let isDrawing = false;

  // ✅ Gérer la signature (souris et tactile)
  const startDrawing = (event) => {
    event.preventDefault();
    isDrawing = true;
    const pos = getMousePos(event);
    signatureContext.beginPath();
    signatureContext.moveTo(pos.x, pos.y);
  };

  const draw = (event) => {
    event.preventDefault();
    if (!isDrawing) return;
    const pos = getMousePos(event);
    signatureContext.lineTo(pos.x, pos.y);
    signatureContext.stroke();
  };

  const stopDrawing = () => {
    isDrawing = false;
  };

  const getMousePos = (event) => {
    const rect = signatureCanvas.getBoundingClientRect();
    return {
      x: (event.clientX || event.touches[0].clientX) - rect.left,
      y: (event.clientY || event.touches[0].clientY) - rect.top,
    };
  };

  signatureCanvas.addEventListener("mousedown", startDrawing);
  signatureCanvas.addEventListener("mousemove", draw);
  signatureCanvas.addEventListener("mouseup", stopDrawing);
  signatureCanvas.addEventListener("mouseleave", stopDrawing);
  signatureCanvas.addEventListener("touchstart", startDrawing);
  signatureCanvas.addEventListener("touchmove", draw);
  signatureCanvas.addEventListener("touchend", stopDrawing);
  signatureCanvas.addEventListener("touchcancel", stopDrawing);

  clearSignatureBtn.addEventListener("click", () => {
    signatureContext.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  });

  addPhotoGroupBtn.addEventListener("click", () => {
    const photoGroup = document.createElement("div");
    photoGroup.className = "photoGroup";

    photoGroup.innerHTML = `
      <label>Ajouter des photos : *</label>
      <input type="file" class="photoInput" accept="image/*" multiple required />
      <label>Catégorie : *</label>
      <select class="photoCategory" required>
        <option value="">-- Sélectionner --</option>
        <option value="infosCommandes">Infos commandes</option>
        <option value="photos">Photos</option>
      </select>
      <button type="button" class="removePhotoGroup">Supprimer ce groupe</button>
    `;

    photosContainer.appendChild(photoGroup);

    photoGroup.querySelector(".removePhotoGroup").addEventListener("click", () => {
      photosContainer.removeChild(photoGroup);
    });
  });

  generatePDFBtn.addEventListener("click", async () => {
    if (!validateForm()) {
      alert("⚠️ Veuillez remplir tous les champs obligatoires avant de générer le PDF !");
      return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    let y = 25;
    const margin = 20;
    const pageHeight = 297;

    try {
      const logo = new Image();
      logo.src = "EDF.png";
      await new Promise((resolve) => {
        logo.onload = () => {
          pdf.addImage(logo, "PNG", 10, 10, 30, 20);
          resolve();
        };
      });

      y += 25;
      pdf.setFontSize(18);
      pdf.setTextColor("#003366");
      pdf.text("PV Mise En Service Technique", 105, y, { align: "center" });
      y += 20;

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);

      const getValue = (id) => {
        const element = document.getElementById(id);
        return element ? element.value : "Non renseigné";
      };

      y = addSection(pdf, "Informations Générales", y);
      y = addText(pdf, `Titre : ${getValue("title")}`, y);
      y = addText(pdf, `Responsable chantier : ${getValue("responsable")}`, y);
      y = addText(pdf, `Entreprise : ${getValue("entreprise")}`, y);
      y = addText(pdf, `Date début : ${getValue("startDate")}`, y);
      y = addText(pdf, `Date fin : ${getValue("endDate")}`, y);

      y = addSection(pdf, "Historique", y);
      y = addText(pdf, `Date d'application : ${getValue("historique")}`, y);

      y = addSection(pdf, "Description du projet", y);
      const summary = getValue("summary");
      const descLines = pdf.splitTextToSize(summary, 170);
      pdf.text(descLines, margin, y);
      y += descLines.length * 7 + 15;

      const photoGroups = document.querySelectorAll(".photoGroup");
      let infosCommandesPhotos = [];
      let generalPhotos = [];

      for (const group of photoGroups) {
        const filesInput = group.querySelector(".photoInput");
        if (filesInput.files.length === 0) continue;
        const category = group.querySelector(".photoCategory").value;
        if (category === "infosCommandes") {
          infosCommandesPhotos.push(...Array.from(filesInput.files));
        } else {
          generalPhotos.push(...Array.from(filesInput.files));
        }
      }

      if (infosCommandesPhotos.length > 0) {
        y = await addImages(pdf, "Infos commandes", infosCommandesPhotos, y);
      }

      if (generalPhotos.length > 0) {
        y = await addImages(pdf, "Photos", generalPhotos, y);
      }

      y = addSection(pdf, "Signature", y);
      const signataireNom = getValue("signataireNom");
      pdf.text(`Signé par : ${signataireNom}`, margin, y);
      y += 10;

      if (y + 40 > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }

      pdf.addImage(signatureCanvas.toDataURL("image/png"), "PNG", margin, y, 80, 40);
      y += 50;

      pdf.save("pv_mise_en_service.pdf");
    } catch (error) {
      console.error("Erreur lors de la génération du PDF :", error);
      alert("Une erreur est survenue lors de la génération du PDF.");
    }
  });

  function validateForm() {
    let isValid = true;
    document.querySelectorAll("input[required], textarea[required], select[required]").forEach((input) => {
      if (!input.value || (input.type === "file" && input.files.length === 0)) {
        input.style.border = "2px solid red";
        isValid = false;
      } else {
        input.style.border = "";
      }
    });
    return isValid;
  }

  function addSection(pdf, title, y) {
    pdf.setTextColor("#003366");
    pdf.setFontSize(14);
    pdf.text(title, 20, y);
    pdf.setTextColor(0, 0, 0);
    pdf.line(20, y + 2, 190, y + 2);
    return y + 15;
  }

  function addText(pdf, text, y) {
    pdf.setFontSize(12);
    pdf.text(text, 20, y);
    return y + 10;
  }

  async function addImages(pdf, title, images, y) {
    y = addSection(pdf, title, y);

    for (const image of images) {
      try {
        const imgData = await toDataURL(image);
        pdf.addImage(imgData, "JPEG", 20, y, 100, 100);
        y += 110;
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }
      } catch (error) {
        console.error("Erreur de conversion d'image :", error);
      }
    }

    return y;
  }

  function toDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }
});
