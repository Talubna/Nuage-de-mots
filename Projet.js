document.getElementById("submit").addEventListener("click", function (event) {
    event.preventDefault();

    const cloudElement = document.getElementById("cloud");
    const textarea = document.getElementById("texte");
    const fileInput = document.getElementById("fileInput");

    // Fonction interne pour envoyer les données au serveur
    const envoyerDonnees = (contenu) => {
        if (!contenu.trim()) {
            alert("Veuillez entrer du texte ou sélectionner un fichier.");
            return;
        }

        cloudElement.innerHTML = "<p style='text-align:center;'>Analyse en cours...</p>";

        const formData = new FormData();
        formData.append('contenu', contenu);
        formData.append('filename', 'nuage_' + Date.now() + '.txt');

        fetch("Projet.php", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.html) {
                // 1. Injecter le HTML
                cloudElement.innerHTML = data.html;

                // 2. Préparer le conteneur (doit être relatif pour le placement absolu des mots)
                Object.assign(cloudElement.style, {
                    display: "block",
                    width: "500px",
                    height: "500px",
                    position: "relative",
                    backgroundColor: "#fff",
                    borderRadius: "50%",
                    overflow: "hidden"
                });

                // 3. Laisser le navigateur calculer les tailles des spans avant de placer
                // On utilise un délai de 50ms pour garantir que offsetWidth/Height ne soient pas à 0
                setTimeout(() => {
                    placerMotsAvecCollision();
                }, 50);
            }
        })
        .catch(err => {
            console.error("Erreur:", err);
            cloudElement.innerHTML = "Erreur de connexion au serveur.";
        });
    };

    // Priorité au fichier, sinon on prend le textarea
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            envoyerDonnees(e.target.result);
        };
        
        reader.readAsText(file);
    } else {
        envoyerDonnees(textarea.value);
    }
});

function placerMotsDansCercle() {
    const cloud = document.getElementById("cloud");
    const mots = cloud.querySelectorAll(".word");

    const R = cloud.clientWidth / 2;
    const centerX = R;
    const centerY = R;

    let angle = 0;
    let radius = 0;

    mots.forEach(word => {
        const size = word.dataset.size;
        word.style.fontSize = size + "px";

        // Placement spiralé
        angle += 0.5;
        radius += 2;

        const x = centerX + radius * Math.cos(angle) - word.offsetWidth / 2;
        const y = centerY + radius * Math.sin(angle) - word.offsetHeight / 2;

        // Vérification cercle
        const dx = x + word.offsetWidth / 2 - centerX;
        const dy = y + word.offsetHeight / 2 - centerY;

        if (Math.sqrt(dx * dx + dy * dy) < R) {
            word.style.left = x + "px";
            word.style.top = y + "px";
        }
    });
}

function collision(a, b) {
    return !(
        a.right < b.left ||
        a.left > b.right ||
        a.bottom < b.top ||
        a.top > b.bottom
    );
}

function dansLeCercle(rect, centreX, centreY, rayon) {
    const points = [
        [rect.left, rect.top],
        [rect.right, rect.top],
        [rect.left, rect.bottom],
        [rect.right, rect.bottom]
    ];

    return points.every(([x, y]) => {
        const dx = x - centreX;
        const dy = y - centreY;
        return Math.sqrt(dx * dx + dy * dy) <= rayon;
    });
}

function placerMotsAvecCollision() {
    const cloud = document.getElementById("cloud");
    const mots = [...cloud.querySelectorAll(".word")];

    const R = cloud.clientWidth / 2;
    const centerX = R;
    const centerY = R;

    const placés = [];

    mots.forEach(word => {
        const size = word.dataset.size;
        word.style.fontSize = size + "px";

        const color = word.dataset.color;
        word.style.color = color;

        // Dans la boucle forEach de Projet.js
        const rotation = word.dataset.rotate === "90" ? "rotate(90deg)" : "rotate(0deg)";
        word.style.setProperty('--rotation', rotation);
        word.style.transform = `translate(-50%, -50%) ${rotation}`;

        let angle = Math.random() * 2 * Math.PI;
        let radius = 0;
        let placé = false;
        let tentatives = 0; // Ajout d'un compteur de tentatives

        while (!placé && radius < R && tentatives < 500) {
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            word.style.left = `${x}px`;
            word.style.top = `${y}px`;

            const rect = word.getBoundingClientRect();
            const cloudRect = cloud.getBoundingClientRect();

            const rectRelatif = {
                left: rect.left - cloudRect.left,
                top: rect.top - cloudRect.top,
                right: rect.right - cloudRect.left,
                bottom: rect.bottom - cloudRect.top
            };

            let collisionDetectée = placés.some(p => collision(rectRelatif, p));

            if (!collisionDetectée && dansLeCercle(rectRelatif, centerX, centerY, R)) {
                placés.push(rectRelatif);
                placé = true;
            }

            angle += 0.2; // Pas plus petit pour une spirale plus serrée
            radius += 0.8; // Progression plus lente pour mieux remplir le centre
            tentatives++;
        }

        if (!placé) {
            word.style.display = "none"; // sécurité
        }
    });
}
