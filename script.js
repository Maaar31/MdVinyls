let accessToken = null;

// Fonction pour rediriger vers Spotify pour se connecter
function redirectToSpotify() {
    const clientId = "c3b94a096f0e4ca392978b6ee67d002c";
    const redirectUri = "https://maaar31.github.io/spotify-music-visualizer/";
    const scopes = "user-read-playback-state user-modify-playback-state";
    const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    window.location.href = url;
}

// Fonction pour gérer le token après la redirection
function handleSpotifyRedirect() {
    const hash = window.location.hash;
    if (hash) {
        const token = new URLSearchParams(hash.substring(1)).get("access_token");
        if (token) {
            accessToken = token;
            document.getElementById("status").innerText = "Connecté à Spotify !";
            document.getElementById("connect-btn").style.display = "none";
            document.getElementById("refresh-btn").style.display = "inline-block";
            fetchCurrentlyPlaying();
        } else {
            console.error("Erreur : le token d'accès est introuvable.");
            document.getElementById("status").innerText = "Erreur de connexion. Veuillez réessayer.";
        }
    }
}

// Fonction pour récupérer la musique en cours de lecture
async function fetchCurrentlyPlaying() {
    if (!accessToken) {
        console.error("Erreur : aucun token d'accès disponible.");
        document.getElementById("status").innerText = "Erreur : non connecté à Spotify.";
        return;
    }

    try {
        const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.status === 200) {
            const data = await response.json();

            // Récupération des informations du morceau
            const trackName = data.item.name;
            const artistName = data.item.artists.map(artist => artist.name).join(", ");
            const albumArt = data.item.album.images[0].url;

            // Mise à jour de l'interface utilisateur
            document.getElementById("track-name").innerText = trackName;
            document.getElementById("artist-name").innerText = artistName;
            document.getElementById("album-art").src = albumArt;
            extractDominantColor(albumArt);
            document.getElementById("playback-info").innerText = data.is_playing ? "En cours" : "En pause";
            document.getElementById("playback-status").style.display = "block";

            // Ajouter un widget pour la musique en cours
            addWidget(trackName, artistName, albumArt);
        } else if (response.status === 204) {
            // Aucun contenu : aucune musique en cours
            document.getElementById("status").innerText = "Aucune musique en cours.";
            document.getElementById("track-name").innerText = "Aucune musique en cours";
            document.getElementById("artist-name").innerText = "Artiste inconnu";
        } else {
            console.error("Erreur de l'API Spotify :", response.status);
            document.getElementById("status").innerText = "Erreur lors de la récupération des informations.";
        }
    } catch (error) {
        console.error("Erreur lors de la récupération de la lecture :", error);
        document.getElementById("status").innerText = "Erreur réseau. Veuillez réessayer.";
    }
}

// Fonction pour extraire la couleur prédominante de l'image
function extractDominantColor(imageUrl) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    img.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);
        const imageData = context.getImageData(0, 0, img.width, img.height).data;
        const color = getDominantColor(imageData);
        document.body.style.backgroundColor = color;
    };
}

// Fonction pour calculer la couleur prédominante
function getDominantColor(data) {
    const colorCount = {};
    let dominantColor = "";
    let maxCount = 0;

    for (let i = 0; i < data.length; i += 4) {
        const rgb = `${data[i]},${data[i + 1]},${data[i + 2]}`;
        colorCount[rgb] = (colorCount[rgb] || 0) + 1;
        if (colorCount[rgb] > maxCount) {
            maxCount = colorCount[rgb];
            dominantColor = rgb;
        }
    }

    return `rgb(${dominantColor})`;
}

// Fonction pour gérer l'expiration du token
function handleTokenExpiration() {
    alert("Reconnectez-vous à Spotify !");
    redirectToSpotify();
}

// Basculer l'état du vinyle (animation)
function toggleVinyl() {
    const albumContainer = document.querySelector('.album-container');
    albumContainer.classList.toggle('active');
}

// Fonction pour ajouter un widget
function addWidget(trackName, artistName, albumArt) {
    const widgetContainer = document.getElementById("widgets");
    const widget = document.createElement("div");
    widget.className = "widget";
    widget.innerHTML = `
        <img src="${albumArt}" alt="Album Art">
        <div class="widget-info">
            <h4>${trackName}</h4>
            <p>${artistName}</p>
        </div>
    `;
    widgetContainer.appendChild(widget);
}

// Appel initial pour vérifier le token
handleSpotifyRedirect();