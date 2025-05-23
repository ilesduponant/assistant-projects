

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-cr");
	const generatePDFBtn = document.getElementById("generatePDF");

	let hasSignature = false;
	
    // Initialisation des canvases pour les signatures
    const canvasRepresentant = setupSignatureCanvas("signature-representant-canvas", "clear-representant");
    const canvasAgent = setupSignatureCanvas("signature-agent-canvas", "clear-agent");

	
    // Fonction pour gérer les ajouts/suppressions dynamiques des lignes des tableaux
    function manageDynamicTable(addButtonId, tableBodySelector, rowHTML) {
		const tableBody = document.querySelector(tableBodySelector);
		const addButton = document.getElementById(addButtonId);

			addButton.addEventListener("click", () => {
			const newRow = document.createElement("tr");
			newRow.style.backgroundColor = "#FFFFFF";
			newRow.innerHTML = rowHTML;
			tableBody.appendChild(newRow);
			});

			tableBody.addEventListener("click", (event) => {
			if (event.target.classList.contains("remove-row")) {
				const row = event.target.closest("tr");
				if (row) tableBody.removeChild(row);
				}
			});
    }
	
    // Gestion des pièces fournies
    manageDynamicTable(
        "add-piece",
        "#pieces-table tbody",
        `
            <td><input type="text" name="fabricant[]" placeholder="Fabricant" oninput="this.value = this.value.toUpperCase()" /></td>
            <td><input type="text" name="designation[]" placeholder="Désignation" /></td>
            <td><input type="number" name="quantite[]" min="1" placeholder="Quantité" /></td>
            <td><button type="button" class="remove-row"><i class="fas fa-trash" style="pointer-events: none;"></i></button></td>
        `
    );

    // Gestion des intervenants
	manageDynamicTable(
		"add-technician",
		"#intervention-table tbody",
		`
			<td><input type="text" name="techniciens[]" placeholder="Nom du technicien" oninput="this.value = this.value.toUpperCase()" required /></td>
			<td><input type="date" name="date_intervention[]" required /></td>
			<td><input type="number" name="nbr_heures[]" min="1" placeholder="Nombre d'Heures" required /></td>
			<td><button type="button" class="remove-row"><i class="fas fa-trash" style="pointer-events: none;"></i></button></td>
		`
	);
		
    // Gestion des photos
    const photosInput = document.getElementById("photos");
    const photoPreviewContainer = document.getElementById("photo-preview");
    const takePhotoButton = document.getElementById("take-photo");
    const savePhotoButton = document.getElementById("save-photo");
    const camera = document.getElementById("camera");
    const cameraCanvas = document.getElementById("camera-canvas");
    const cameraContext = cameraCanvas.getContext("2d");
    let photoList = []; // Liste des photos (caméra + galerie) avec libellés

    // Gestion des photos ajoutées depuis la galerie
    photosInput.addEventListener("change", (event) => {
        const files = Array.from(event.target.files);
        files.forEach((file) => {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    addPhotoToPreview(e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    });

    // Gestion de la caméra pour prendre une photo (caméra dorsale)
    takePhotoButton.addEventListener("click", async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            camera.srcObject = stream;
            camera.style.display = "block";
            savePhotoButton.style.display = "inline-block";
        } catch (error) {
            console.error("Impossible d'accéder à la caméra dorsale :", error);
        }
    });

    // Enregistrer une photo prise avec la caméra
    savePhotoButton.addEventListener("click", () => {
        try {
            cameraCanvas.width = camera.videoWidth || 1920; // Largeur réelle du flux vidéo
            cameraCanvas.height = camera.videoHeight || 1080; // Hauteur réelle du flux vidéo
            cameraContext.drawImage(camera, 0, 0, cameraCanvas.width, cameraCanvas.height);

            const photoData = cameraCanvas.toDataURL("image/png"); // Convertir la photo en base64
            addPhotoToPreview(photoData); // Ajouter la photo à l'aperçu

            // Arrêter la caméra après la capture
            const stream = camera.srcObject;
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
            camera.style.display = "none";
            savePhotoButton.style.display = "none";
        } catch (error) {
            console.error("Erreur lors de l'enregistrement de la photo :", error);
        }
    });

    // Ajouter une photo à l'aperçu avec un champ "libellé" et un bouton "Supprimer"
    function addPhotoToPreview(photoData) {
        const photoContainer = document.createElement("div");
        photoContainer.style.display = "inline-block";
        photoContainer.style.margin = "5px";
        photoContainer.style.position = "relative";

        const img = document.createElement("img");
        img.src = photoData;
        img.style.width = "100px";
        img.style.border = "1px solid #ccc";
        photoContainer.appendChild(img);

        // Champ de saisie pour le libellé
        const labelInput = document.createElement("input");
        labelInput.type = "text";
        labelInput.placeholder = "Libellé de la photo";
        labelInput.style.display = "block";
        labelInput.style.marginTop = "5px";
        photoContainer.appendChild(labelInput);

        // Bouton supprimer photo
		const deleteButton = document.createElement("button");
		deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
		deleteButton.className = "delete-button"; // Ajout d'une classe CSS
        deleteButton.addEventListener("click", () => {photoPreviewContainer.removeChild(photoContainer); photoList = photoList.filter((photo) => photo.data !== photoData); // Retirer la photo et son libellé
		});
        photoContainer.appendChild(deleteButton);
        photoPreviewContainer.appendChild(photoContainer);

        // Ajouter la photo et son libellé dans la liste
        photoList.push({ data: photoData, label: labelInput });
    }

	// Controle que tous les champs obligatoires sont renseignés
	function validateForm() {
		let isValid = true;
		document.querySelectorAll("input[required], textarea[required], select[required]").forEach((input) => {
			console.log(`Validation du champ : ${input.name}, valeur : ${input.value}`);
			if (!input.value || (input.type === "file" && input.files.length === 0)) {
				console.log(`Champ invalide : ${input.name}`);
				input.style.border = "2px solid red";
				isValid = false;
			} else {
				input.style.border = "";
			}
		});
		console.log(`Statut de validation global : ${isValid}`);
		return isValid;
	}

    // Soumission du formulaire et génération du PDF
    //form.addEventListener("submit", async (event) => {
	generatePDFBtn.addEventListener("click", async (event) => {

		event.preventDefault();
				
        const data = {
            date: document.getElementById("date").value,
            chantier: document.getElementById("chantier").value,
            centrale: document.getElementById("centrale").value,
            entreprise: document.getElementById("entreprise").value,
            local: document.getElementById("local").value,
            description: document.getElementById("description").value,
            representantNom: document.getElementById("representant").value,
            agentNom: document.getElementById("agent").value,
            pieces: collectTableData("#pieces-table tbody"),
            interventions: collectTableData("#intervention-table tbody"),
            photos: photoList.map((photo) => ({
                data: photo.data,
                label: photo.label.value || ""
            })), // Photos avec libellés
            signatures: {
                representant: canvasRepresentant.toDataURL("image/png"),
                agent: canvasAgent.toDataURL("image/png")
            }
        };
		
		console.log("Validation déclenchée");
		if (!validateForm()) {
		  alert("⚠️ Veuillez remplir tous les champs obligatoires avant de générer le PDF !");
		  return;
		}
		
        await genererPDF(data);
    });

    // Fonction pour collecter les données des tableaux dynamiques
    function collectTableData(tableBodySelector) {
        return Array.from(document.querySelectorAll(`${tableBodySelector} tr`)).map(row => {
			console.log("row input = " + row.querySelectorAll("input").value);
            return Array.from(row.querySelectorAll("input")).map(input => {
				if (input.type === "date") {
					if (!input.value) {
						return ""; // Si aucune date n'est renseignée, retourne une chaîne vide
					}
                // Reformate la date en JJ/MM/AAAA
                const [year, month, day] = input.value.split("-"); // Sépare la date ISO
                const formattedDate = `${day}/${month}/${year}`; // Reformate
                console.log(`Date reformattée : ${formattedDate}`);
                return formattedDate; // Retourne la date reformattée
            }
            return input.value || "";
			});
        });
    }

// Charger le logo EDF en Base64 avant de générer le PDF
	function loadLogo(callback) {
		const logo = new Image();
		logo.src = "EDF.png"; // Vérifiez que l'image est bien à cet emplacement
		logo.crossOrigin = "Anonymous"; // Évite les problèmes de CORS

		logo.onload = function () {
			const canvas = document.createElement("canvas");
			canvas.width = logo.width;
			canvas.height = logo.height;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(logo, 0, 0);
			const logoBase64 = canvas.toDataURL("image/png"); // Convertir en Base64
			callback(logoBase64);
		};

		logo.onerror = function () {
			console.error("Erreur lors du chargement du logo EDF");
			callback(null);
		};
	}

// ???
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// Dessine l'entête d'un paragraphe
function drawHeader(pdf, x, y, width, height, headerText) {
    // Dessiner un rectangle avec coins arrondis
    const radius = 1; // Rayon des coins
    pdf.setFillColor(16, 54, 122); // Couleur bleu
    pdf.setDrawColor(16, 54, 122); // Couleur bleu
    
    pdf.roundedRect(x, y, width, height, radius, radius, "FD"); // Rectangle avec coins arrondis
    
    // Ajouter du texte dans le bandeau
    pdf.setTextColor(255, 255, 255); // Texte en blanc
    pdf.setFont("helvetica", "bold"); // Police en gras
    pdf.setFontSize(12); // Taille de la police
    
    // Centrer le texte horizontalement et ajuster verticalement
    const textY = y + height / 2 + 1.5 ; // Ajustement vertical
    pdf.text(headerText, x + width / 2, textY, { align: "center" });

    // Retourner la nouvelle position Y (après le bandeau)
    return y + height; // Nouvelle position
}

// Générer un PDF
async function genererPDF(data) {
    
	const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({compress: true});
	
	if (!hasSignature) {
		event.preventDefault(); // Empêche toute action par défaut, si nécessaire
		alert("⚠️ La signature est obligatoire avant de générer le PDF !");
		return; // Stoppe la fonction ici
	}
				
    loadLogo(function (logoBase64) {
        if (logoBase64) {
            pdf.addImage(logoBase64, "PNG", 10, 10, 1579/40, 673/40);
        } else {
            console.warn("Le logo EDF ne sera pas ajouté au PDF.");
        }
		
		/*pdf.setFillColor(16, 54, 122); // Couleur bleu
		pdf.setDrawColor(16, 54, 122); // Couleur bleu
		pdf.roundedRect(10, 10, 1579/40, 673/40, 1, 1, "FD");*/
		
		// Styles communs
		pdf.setFont("helvetica", "bold");
		pdf.setFontSize(25);    
		pdf.setTextColor(16, 54, 122);
		
		let y = 22;
		pdf.text("BON D'INTERVENTION", 200, y, { align: "right" });
		y+=15;
		
		// Paramètres du bandeau
		const x = 10;  // Position X du coin supérieur gauche
		const width = 190;  // Largeur du bandeau
		const height = 8;  // Hauteur du bandeau
		
	//Pavé Informations principales
		// Dessine le bandeau Informations principales
		y = drawHeader(pdf,x,y,width,height,"Informations principales");
		
		// Dessiner le cadre principal		
		const heightInfos = 35; // Hauteur du bloc Infos (date, nom du chantier,...)
					
		pdf.setDrawColor(16, 54, 122);
		pdf.roundedRect(x, y, width, heightInfos,1,1, "FD");
		// Espace après le rectangle
		y += 5;
		
		// Ajouter du texte à l'intérieur du rectangle
		const textMargin = 2; // Marge interne
		y += textMargin; // Ajustement pour placer le texte dans le rectangle
		pdf.setFontSize(12); // Taille de la police
		pdf.setTextColor(16, 54, 122); // Texte bleu
		
		// Fonction pour formater la date
		function formatDate(date) {
			const day = String(date.getDate()).padStart(2, "0");
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const year = date.getFullYear();
			
			return `${day}/${month}/${year}`;
		}
		pdf.setFont("helvetica", "bold"); // Police en gras
		const maDate = "Date : ";
		pdf.text(maDate, 160, y);
		// Calcul de la largeur du texte
		const widthDate = pdf.getTextWidth(maDate); 
		// Formater la date au format jj-mm-aaaa
		const formattedDate = formatDate(new Date(data.date)); // Remplace `data.date` par l'objet date approprié
		pdf.setFont("helvetica", "normal"); // Police normale
		pdf.text(formattedDate, 160 + widthDate, y);
		
		pdf.setFont("helvetica", "bold"); // Police en gras
		const maCentrale = "Centrale : ";
		pdf.text(maCentrale, 12, y);
		// Calcul de la largeur du texte
		const widthCentrale = pdf.getTextWidth(maCentrale); 
		pdf.setFont("helvetica", "normal"); // Police normale
		pdf.text(`${data.centrale}`, 12 + widthCentrale, y); // Ajustement basé sur la largeur
		y += 8;
		
		pdf.setFont("helvetica", "bold"); // Police en gras
		const monChantier = "Nom du chantier : ";
		pdf.text(monChantier, 12, y);
		// Calcul de la largeur du texte
		const widthChantier = pdf.getTextWidth(monChantier); 
		pdf.setFont("helvetica", "normal"); // Police normale
		pdf.text(`${data.chantier}`, 12 + widthChantier, y); // Ajustement basé sur la largeur
		y += 8;
		
		pdf.setFont("helvetica", "bold"); // Police en gras
		const monEntreprise = "Entreprise intervenante : ";
		pdf.text(monEntreprise, 12, y);
		// Calcul de la largeur du texte
		const widthEntreprise = pdf.getTextWidth(monEntreprise); 
		pdf.setFont("helvetica", "normal"); // Police normale
		pdf.text(`${data.entreprise}`, 12 + widthEntreprise, y); // Ajustement basé sur la largeur
		y += 8;
		
		pdf.setFont("helvetica", "bold"); // Police en gras
		const monLocal = "Local / Matériel concerné : ";
		pdf.text(monLocal, 12, y);
		// Calcul de la largeur du texte
		const widthLocal = pdf.getTextWidth(monLocal); 
		pdf.setFont("helvetica", "normal"); // Police normale
		pdf.text(`${data.local}`, 12 + widthLocal, y); // Ajustement basé sur la largeur
		y += 10;
	
	// Pavé Description des travaux
		// Dessine le bandeau pour la liste des pièces fournies
		y = drawHeader(pdf, x, y, width, height, "Description des travaux");        
		const descLines = pdf.splitTextToSize(data.description, 190); // Récupère les lignes de la description

		// Initialisation des propriétés
		pdf.setDrawColor(16, 54, 122); // bleu EDF
		pdf.setFillColor(255, 255, 255); // Définit une couleur de remplissage blanche
		pdf.setTextColor(16, 54, 122); // bleu EDF
		pdf.setFont("helvetica", "normal"); // Police normale

		// Dimensions du cadre et espacement
		const lineSpacing = 5;
		const pageHeight = pdf.internal.pageSize.getHeight();
		const rectPadding = -2; // Marge autour du texte à l'intérieur du rectangle

		let startY = y; // Garder la position initiale pour le rectangle
		y += lineSpacing;

		// Parcourt toutes les lignes de la description des travaux
		descLines.forEach((line, index) => {
			if (y + lineSpacing > pageHeight - 15) {
				// Si le texte dépasse la hauteur disponible, dessiner le cadre pour la page courante
				const rectHeight = y - startY + rectPadding; // Hauteur du rectangle pour cette page
				pdf.roundedRect(x, startY, width, rectHeight, 1, 1, "D"); // Dessiner le cadre arrondi

				// Ajouter une nouvelle page et réinitialiser la position
				pdf.addPage();
				y = 20; // Position verticale sur la nouvelle page
				startY = y; // Nouvelle position de départ pour le cadre
				y += lineSpacing; // Ajoute un espacement initial
			}

			// Ajouter la ligne de texte
			pdf.text(line, 12, y);
			y += lineSpacing; // Met à jour la position verticale
		});

		// Dessiner le cadre final pour les dernières lignes
		const finalRectHeight = y - startY + rectPadding; // Hauteur du rectangle final
		pdf.roundedRect(x, startY, width, finalRectHeight, 1, 1, "D"); // Dessiner le dernier cadre
		y += 4.5;
			
	//Pavé Liste des pièces fournies	
		var nombreDePieces = data.pieces.length;
		
		if(data.pieces[0]){
			var nameOfFirstPiece = data.pieces[0][0];
		
			if(nameOfFirstPiece){ // Si une pièce est renseignée, on ajoute le titre et le tableau, sinon rien ne s'affiche	
				// Dessine le bandeau pour la liste des pièces fournies
				y = drawHeader(pdf,x, y, width, height, "Liste des pièces fournies");
				y += 2;
			
				pdf.autoTable({
					startY: y, // Position verticale où commence le tableau
					head: [["Fabricant", "Désignation", "Quantité"]], // En-têtes du tableau
					body: data.pieces, // Contenu du tableau
					tableWidth: 190,
					margin: { left: 10 },
					theme: 'grid', // Style du tableau avec bordures
					styles: {
						fontSize: 10, // Taille de la police pour le contenu
						textColor: [16, 54, 122], // Texte bleu
						lineColor: [16, 54, 122], // Couleur des bordures (rouge en RGB)
						lineWidth: 0.1, // Épaisseur des bordures
					},
					headStyles: {
						fontSize: 10, // Taille de la police pour l'en-tête
						fillColor: [254, 87, 22], // Couleur orange vif (RGB : 254, 87, 22)
						textColor: [255, 255, 255], // Texte blanc dans l'en-tête
						fontStyle: 'bold', // Police en gras pour l'en-tête
						halign: 'center', // Alignement centré des titres
					},
					alternateRowStyles: {
						fillColor: [240, 248, 255], // Bleu très clair pour alternance des lignes (RGB : 240, 248, 255)
					},
					columnStyles: {
						0: { halign: 'left' }, // Alignement gauche des textes de la colonne 1 (Fabricant)
						1: { halign: 'left' }, // Alignement gauche des textes de la colonne 2 (Désignation)
						2: { halign: 'right' }, // Alignement droit pour la colonne Quantité
					}
				});

				y = pdf.lastAutoTable.finalY + 6;
			}
		}
		
	//Pavé Temps d'Intervention
				// Filtrer les données pour exclure les lignes avec un technicien non renseigné
				const filteredInterventions = data.interventions.filter(row => row[0]?.trim() !== "");
				// Dessine le bandeau pour la liste des pièces fournies	
				y = drawHeader(pdf,x,y,width,height,"Temps d'intervention");	
				y += 2;
				
				pdf.autoTable({
					startY: y, // Position verticale où commence le tableau
					head: [["Technicien", "Date", "Nombre d'heures"]], // En-têtes du tableau
					body: filteredInterventions, // Contenu du tableau // Utilise les données filtrées
					tableWidth: 190,
					margin: { left: 10 },
					theme: 'grid', // Style du tableau avec bordures
					styles: {
						fontSize: 10, // Taille de la police pour le contenu
						textColor: [16, 54, 122], // Texte bleu
						lineColor: [16, 54, 122], // Couleur des bordures (rouge en RGB)
						lineWidth: 0.1, // Épaisseur des bordures
					},
					headStyles: {
						fontSize: 10, // Taille de la police pour l'en-tête
						fillColor: [254, 87, 22], // Couleur orange vif (RGB : 254, 87, 22)
						textColor: [255, 255, 255], // Texte blanc dans l'en-tête
						fontStyle: 'bold', // Police en gras pour l'en-tête
						halign: 'center', // Alignement centré des titres
					},
					alternateRowStyles: {
						fillColor: [240, 248, 255], // Bleu très clair pour alternance des lignes (RGB : 240, 248, 255)
					},
					columnStyles: {
						0: { halign: 'left' }, // Alignement gauche des textes de la colonne 1 (Technicien)
						1: { halign: 'center' }, // Alignement centré des textes de la colonne 2 (Date)
						2: { halign: 'right' }, // Alignement droit des textes de la colonne 3 (Nombre d'heures)
					}
				});
				
				y = pdf.lastAutoTable.finalY + 6;
		
		//Ajout de la fonction signature				
		addSignatures(pdf, data.entreprise, data.representantNom, data.agentNom, data.signatures, y);
				
		// Dimensions maximales pour l'image
		const maxWidth = 180; // Largeur maximale en unités PDF
		const maxHeight = 200; // Hauteur maximale en unités PDF
		const imageProcessingPromises = []; // Stocker les promesses pour chaque image
		
        // Ajout des photos avec libellé
        data.photos.forEach((photo) => { // Boucle sur toutes les images ajoutées dans le formulaire
			
			const img = new Image();
			img.src = photo.data;
			// Dimensions originales de l'image
			const originalWidth = img.width;
			const originalHeight = img.height;

			// Calcul du rapport d'aspect
			const aspectRatio = originalWidth / originalHeight;

			// Initialisation des dimensions redimensionnées
			let newWidth = originalWidth;
			let newHeight = originalHeight;

			// Ajustement des dimensions pour respecter les limites
			if (newWidth > maxWidth) {
			  newWidth = maxWidth;
			  newHeight = newWidth / aspectRatio; // Hauteur ajustée proportionnellement
			}
			if (newHeight > maxHeight) {
			  newHeight = maxHeight;
			  newWidth = newHeight * aspectRatio; // Largeur ajustée proportionnellement
			}
			
			const pageWidth = pdf.internal.pageSize.getWidth();
			const imgSrc = img.src;
			
			var paddingWidth = (pdf.internal.pageSize.getWidth() - newWidth) / 2;
			var paddingHeight = (pdf.internal.pageSize.getHeight() - newHeight) / 2;
			
			function base64ToBlob(base64, mimeType) {
				const byteChars = atob(base64.split(',')[1]); // Décodage de base64
				const byteNumbers = new Array(byteChars.length);
				for (let i = 0; i < byteChars.length; i++) {
					byteNumbers[i] = byteChars.charCodeAt(i);
				}
				const byteArray = new Uint8Array(byteNumbers);
				return new Blob([byteArray], { type: mimeType });
			}

			const base64Image = 'data:image/jpeg;base64,...'; // Chaîne base64 de l'image
			// Exemple : Si le `src` de l'image contient une chaîne base64

			const blob = base64ToBlob(imgSrc, 'image/jpeg'); // Ajustez le type MIME selon l'image
		
			
			const file = new File([blob], "photo.jpg", { type: "image/jpeg" });				

			const promise = new Promise((resolve, reject) => {
				new Compressor(file, {
					quality: 0.4, // Compresse l'image à 40%
					success(result) {
						const reader = new FileReader();
						reader.readAsDataURL(result);
						reader.onload = () => {
							const compressedImage = reader.result;

							// Vérifier si l'image est bien au format attendu
							if (!compressedImage.startsWith("data:image/jpeg")) {
								console.error("Format incompatible :", compressedImage);
								reject("Image incompatible"); // Rejeter la promesse en cas d'erreur
								return;
							}

							pdf.addPage(); // Ajouter une page au PDF
							pdf.addImage(compressedImage, "JPEG", paddingWidth, paddingHeight, newWidth, newHeight); // Ajouter l'image
							pdf.setFont("helvetica", "bold");
							pdf.setFontSize(12);
							pdf.setTextColor(16, 54, 122); // Texte bleu EDF
							pdf.text(photo.label || "", 105, paddingHeight + 10 + newHeight, { align: "center" }); // Ajouter un texte

							console.log("Image ajoutée au PDF avec succès !");
							resolve(); // Résoudre la promesse après ajout
						};
					},
					error(err) {
						console.error("Erreur de compression :", err);
						reject(err); // Rejeter la promesse en cas d'erreur de compression
					},
				});
			});

			imageProcessingPromises.push(promise); // Ajouter la promesse à la liste					

		});	
	
		Promise.all(imageProcessingPromises)
			.then(() => {
				console.log("Toutes les images ont été ajoutées, sauvegarde en cours...");

			// Sauvegarde le PDF une fois que toutes les promesses sont résolues
				// Récupère les champs d'entrée HTML avec des identifiants spécifiques
				const dateInput = document.getElementById("date"); // Champ pour la date
				const companyInput = document.getElementById("entreprise"); // Champ pour le nom de l'entreprise

				// Récupére les valeurs des champs
				const formattedDate = dateInput.value; // La valeur de l'entrée pour la date
				const companyName = companyInput.value; // La valeur de l'entrée pour l'entreprise

				// Construit le nom du fichier
				const fileName = `BI_${companyName}_${formattedDate}.pdf`;

				// Sauvegarder le PDF avec le nouveau nom
				addFootPage(pdf); // Ajouter l'en-tête et pied de page
				pdf.save(fileName); 
				console.log(`PDF sauvegardé avec succès : ${fileName}`);
				alert(`✅PDF enregistré avec succès : ${fileName}✅`);
			})
			.catch((err) => {
				console.error("Erreur lors du traitement des images :", err);
				return;
			});	
		
});
   
}


    // Fonction pour ajouter les signatures dans le PDF
function addSignatures(pdf, entreprise, representantNom, agentNom, signatures, startY) {
    let y = startY; // Position de départ
    const x = 10; // Position X pour les rectangles
    const width = 190; // Largeur du bandeau "Signatures"
    const headerHeight = 8; // Hauteur du bandeau "Signatures"
    const rectWidth = 90; // Largeur des rectangles pour les signatures
    const rectHeight = 44; // Nouvelle hauteur réduite des rectangles
    const padding = 5; // Espace intérieur dans les rectangles
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Vérifier si un saut de page est nécessaire
    if (pageHeight - y - 16 < headerHeight + rectHeight + 5 ) {
        pdf.addPage();
        y = 20; // Réinitialisation de la position verticale après le saut de page
    }

    // En-tête "Signatures"
    y = drawHeader(pdf, x, y, width, headerHeight, "Signatures");
    y += 5;

    // Style des bordures et couleurs
    pdf.setDrawColor(16, 54, 122); // Bordures bleu EDF
    pdf.setTextColor(16, 54, 122); // Texte bleu EDF
    pdf.setLineWidth(0.3); // Bordure fine

    // Texte pour l'Entreprise
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
	const texteEntreprise = `Pour ${entreprise} : `
    pdf.text(texteEntreprise, x, y); // Texte au-dessus du rectangle
	const widthtexteEntreprise = pdf.getTextWidth(texteEntreprise); // Calcul de la largeur du texte
	pdf.setFont("helvetica", "normal"); // Police normale
	pdf.text(representantNom.toUpperCase(), x + widthtexteEntreprise, y); // Ajustement basé sur la largeur

    // Bloc pour l'Entreprise
    const rectY = y + 2; // Position du rectangle sous le texte
    pdf.setFillColor(240, 248, 255); // Remplissage bleu clair
    pdf.roundedRect(x, rectY, rectWidth, rectHeight, 3, 3, "FD"); // Rectangle arrondi
    pdf.setFontSize(10);
    pdf.addImage(signatures.representant, "PNG", x + padding, rectY + 2, 80, 40); // Signature (ajustée à la hauteur réduite)

    // Texte pour EDF
    const xAgent = x + rectWidth + 10; // Position X pour EDF
    pdf.setFont("helvetica", "bold");
	pdf.setFontSize(11);
	const texteEDF = "Pour EDF : "
    pdf.text(texteEDF, xAgent, y); // Texte au-dessus du rectangle
	const widthtexteEDF = pdf.getTextWidth(texteEDF); // Calcul de la largeur du texte
	pdf.setFont("helvetica", "normal"); // Police normale
	pdf.text(agentNom.toUpperCase(), xAgent + widthtexteEDF, y);

    // Bloc pour EDF
    pdf.setFillColor(240, 248, 255); // Remplissage bleu clair
    pdf.roundedRect(xAgent, rectY, rectWidth, rectHeight, 3, 3, "FD"); // Rectangle arrondi
    pdf.setFontSize(10);
    pdf.addImage(signatures.agent, "PNG", xAgent + padding, rectY + 2, 80, 40); // Signature (ajustée à la hauteur réduite)
}



    // Fonction pour initialiser un canvas avec support tactile et souris
	function setupSignatureCanvas(canvasId, clearButtonId) {
		const canvas = document.getElementById(canvasId);
		const context = canvas.getContext("2d");
		let isDrawing = false;
		
		 // Crée un tampon pour sauvegarder le contenu
		let tempCanvas = document.createElement("canvas");
		let tempContext = tempCanvas.getContext("2d");

		// Synchroniser la taille réelle du canvas avec son affichage tout en sauvegardant
		const synchronizeCanvasSize = () => {
			// Sauvegarde le contenu du canvas actuel
			tempCanvas.width = canvas.width;
			tempCanvas.height = canvas.height;
			tempContext.drawImage(canvas, 0, 0);

		// Ajuste la taille interne du canvas
		const rect = canvas.getBoundingClientRect(); // Taille affichée du canvas
		canvas.width = rect.width; // Définir la largeur interne réelle
		canvas.height = rect.height; // Définir la hauteur interne réelle

		// Restaure le contenu sauvegardé dans le canvas redimensionné
		context.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
		};
		
		// Fonction pour obtenir les coordonnées corrigées
		const getPosition = (event) => {
			const rect = canvas.getBoundingClientRect(); // Dimensions du canvas
			if (event.touches && event.touches[0]) {
				return {
					x: event.touches[0].clientX - rect.left, // Coordonnée X relative
					y: event.touches[0].clientY - rect.top  // Coordonnée Y relative
				};
			} else {
				return {
					x: event.clientX - rect.left,
					y: event.clientY - rect.top
				};
			}
		};

		const startDrawing = (event) => {
			event.preventDefault();
			isDrawing = true;
			hasSignature = true;
			const pos = getPosition(event);
			context.beginPath();
			context.moveTo(pos.x, pos.y);
		};

		const draw = (event) => {
			if (!isDrawing) return;
			event.preventDefault();
			const pos = getPosition(event);
			context.lineTo(pos.x, pos.y);
			context.stroke();
		};

		const stopDrawing = () => {
			isDrawing = false;
		};

		// Synchronisation de la taille réelle
		synchronizeCanvasSize();
		window.addEventListener("resize", synchronizeCanvasSize); // Recalcule si la fenêtre est redimensionnée

		// Écouteurs pour les événements de souris
		canvas.addEventListener("mousedown", startDrawing);
		canvas.addEventListener("mousemove", draw);
		canvas.addEventListener("mouseup", stopDrawing);
		canvas.addEventListener("mouseleave", stopDrawing);

		// Écouteurs pour les événements tactiles
		canvas.addEventListener("touchstart", startDrawing);
		canvas.addEventListener("touchmove", draw);
		canvas.addEventListener("touchend", stopDrawing);
		canvas.addEventListener("touchcancel", stopDrawing);

		// Bouton d'effacement
		document.getElementById(clearButtonId).addEventListener("click", () => {
			context.clearRect(0, 0, canvas.width, canvas.height);
			hasSignature = false; // Réinitialiser l'état de la signature
		});

        return canvas;
    }
});

// Fonction pour Ajouter En-tête et pieds de page avec la numérotation des pages
function addFootPage(pdf) {
    const pageCount = pdf.internal.getNumberOfPages(); // Nombre total de pages
    const pageWidth = pdf.internal.pageSize.getWidth(); // Largeur de la page
    const pageHeight = pdf.internal.pageSize.getHeight(); // Hauteur de la page

    // Parcours toutes les pages
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i); // Passe à la page actuelle
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(16, 54, 122); // Texte bleu foncé
        const pageNumberText = `${i} / ${pageCount}`;
        //Pieds de page
		pdf.text(pageNumberText, 200, pageHeight - 10, { align: "right" }); // Position en bas à droite
		pdf.text("EDF-SEI-IDP", 10, pageHeight - 10); // Position en bas à droite
		
		// Vérifie si la page est supérieure ou égale à 2
        if (i >= 2) {
			pdf.setFont("helvetica", "bold"); // Police en gras
            pdf.setFontSize(20); // Taille de police pour "BON D'INTERVENTION"
            //En-tête à partir de la page 2
			pdf.text("BON D'INTERVENTION", 200, 15, { align: "right" }); // Position en haut à droite
        }
    }
}

