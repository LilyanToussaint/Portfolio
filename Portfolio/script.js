// Sélectionne l'élément racine (:root)
const root = document.documentElement;

// Récupère la valeur de la variable CSS --primary-color
const primaryColor = getComputedStyle(root).getPropertyValue('--primary-color').trim();

// Affiche la valeur dans la console
console.log(primaryColor); // Affiche: #0073e6

// Script pour créer un effet de glissement automatique
document.addEventListener('DOMContentLoaded', function() {
    const phrases = ["Ingénieur diplomé Enseeiht", "Ingénieur simulation numérique"];
    let currentPhraseIndex = 0;
    let currentCharIndex = 0;
    const typingSpeed = 150;
    const erasingSpeed = 100;
    const delayBetweenPhrases = 2000;
    const dynamicTextElement = document.getElementById('dynamic-text');
    let isDeleting = false;

    function type() {
        const currentPhrase = phrases[currentPhraseIndex];
        const currentText = currentPhrase.substring(0, currentCharIndex);

        dynamicTextElement.textContent = currentText;

        if (!isDeleting && currentCharIndex < currentPhrase.length) {
            currentCharIndex++;
            setTimeout(type, typingSpeed);
        } else if (isDeleting && currentCharIndex > 0) {
            currentCharIndex--;
            setTimeout(type, erasingSpeed);
        } else if (!isDeleting && currentCharIndex === currentPhrase.length) {
            setTimeout(() => isDeleting = true, delayBetweenPhrases);
            setTimeout(type, erasingSpeed);
        } else if (isDeleting && currentCharIndex === 0) {
            isDeleting = false;
            currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
            setTimeout(type, typingSpeed);
        }
    }

    type();
});

// Fonction pour ajouter la classe 'visible' lorsque l'élément est dans la vue
function onScrollAnimate() {
    const elements = document.querySelectorAll('.fade-in, .scale-up');
    elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
            element.classList.add('visible');
        }
    });
}

// Ajout de l'événement de défilement
window.addEventListener('scroll', onScrollAnimate);

// Appel initial pour vérifier la position au chargement de la page
onScrollAnimate();

// Fonction pour gérer le menu collant
function stickyHeader() {
    const header = document.querySelector('header');
    const sticky = header.offsetTop;

    if (window.pageYOffset > sticky) {
        header.classList.add('sticky');
    } else {
        header.classList.remove('sticky');
    }
}

// Ajout de l'événement de défilement
window.addEventListener('scroll', stickyHeader);

document.addEventListener('DOMContentLoaded', function() {
    const scene = new THREE.Scene();

    // Couleur de fond du canvas (transparent pour laisser voir le dégradé)
    scene.background = new THREE.Color('rgba(0, 0, 0, 0)');

    // Définir la caméra orthographique
    const camera = new THREE.OrthographicCamera(
        window.innerWidth / -2, window.innerWidth / 2,
        window.innerHeight / 2, window.innerHeight / -2,
        0.1, 1000
    );
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('waveCanvas').appendChild(renderer.domElement);

    // Créer une texture de dégradé avec Canvas
    function createGradientTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        
        const context = canvas.getContext('2d');
        
        // Créer un dégradé du haut vers le bas
        const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
        
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
        const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim();
        
        gradient.addColorStop(0, primaryColor);    // Début du dégradé avec la couleur primaire
        gradient.addColorStop(1, secondaryColor);  // Fin du dégradé avec la couleur secondaire
        
        // Remplir le canvas avec le dégradé
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Créer une texture à partir du canvas
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    // Appliquer la texture de dégradé à un plan qui couvre toute la scène
    const backgroundGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
    const backgroundMaterial = new THREE.MeshBasicMaterial({ map: createGradientTexture(), depthTest: false });
    const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    backgroundMesh.material.side = THREE.DoubleSide;
    backgroundMesh.position.z = -500; // Assure que le plan est en arrière-plan

    // Ajouter le plan en arrière-plan
    scene.add(backgroundMesh);

    // Fonction pour calculer le nombre de particules en fonction de la surface de la fenêtre
    function calculateParticleCount() {
        const referenceSurface = 1920 * 1080; // Surface de référence
        const currentSurface = window.innerWidth * window.innerHeight;
        return Math.round((currentSurface / referenceSurface) * 300);
    }

    let particlesCount = calculateParticleCount();
    const baseSpeed = 0.5;
    const turbulence = 0.0;
    const maxDistance = 120;
    let particles = [];

    // Fonction pour créer une particule à une position aléatoire dans la fenêtre
    function createParticleAtRandomPosition() {
        const geometry = new THREE.CircleGeometry(2.6, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const sphere = new THREE.Mesh(geometry, material);

        sphere.position.x = (Math.random() - 0.5) * window.innerWidth;
        sphere.position.y = (Math.random() - 0.5) * window.innerHeight;

        particles.push(sphere);
        scene.add(sphere);
    }

    // Fonction pour créer les particules initiales
    function createParticles() {
        // Supprimer les anciennes particules
        particles.forEach(particle => scene.remove(particle));
        particles = [];

        for (let i = 0; i < particlesCount; i++) {
            createParticleAtRandomPosition();
        }
    }

    createParticles();

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
    const lineGeometry = new THREE.BufferGeometry();
    const maxConnections = particlesCount * (particlesCount - 1) / 2;
    const linePositions = new Float32Array(maxConnections * 6); // Chaque ligne a 6 positions (2 points * 3 coordonnées)

    function animate() {
        requestAnimationFrame(animate);

        const time = Date.now() * 0.0005;

        // Déplacement des particules en 2D en fonction d'un champ vectoriel turbulent
        particles.forEach(particle => {
            const vx = Math.sin(time + particle.position.y * 0.02) * baseSpeed + (Math.random() - 0.5) * turbulence;
            const vy = Math.cos(time + particle.position.x * 0.02) * baseSpeed + (Math.random() - 0.5) * turbulence;

            particle.position.x += vx;
            particle.position.y += vy;

            // Limiter les particules à l'intérieur de l'écran
            if (particle.position.x > window.innerWidth / 2) particle.position.x = -window.innerWidth / 2;
            if (particle.position.x < -window.innerWidth / 2) particle.position.x = window.innerWidth / 2;
            if (particle.position.y > window.innerHeight / 2) particle.position.y = -window.innerHeight / 2;
            if (particle.position.y < -window.innerHeight / 2) particle.position.y = window.innerHeight / 2;
        });

        let index = 0;
        // Connexion des particules proches
        for (let i = 0; i < particlesCount; i++) {
            for (let j = i + 1; j < particlesCount; j++) {
                const dx = particles[i].position.x - particles[j].position.x;
                const dy = particles[i].position.y - particles[j].position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    linePositions[index++] = particles[i].position.x;
                    linePositions[index++] = particles[i].position.y;
                    linePositions[index++] = 0;
                    linePositions[index++] = particles[j].position.x;
                    linePositions[index++] = particles[j].position.y;
                    linePositions[index++] = 0;
                }
            }
        }

        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
        lineGeometry.setDrawRange(0, index / 3);

        // Ajouter ou mettre à jour la géométrie des lignes
        if (scene.getObjectByName('lineSegments')) {
            const lineSegments = scene.getObjectByName('lineSegments');
            lineSegments.geometry = lineGeometry;
        } else {
            const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
            lineSegments.name = 'lineSegments';
            scene.add(lineSegments);
        }

        renderer.render(scene, camera);
    }

    animate();

    // Gérer le redimensionnement de la fenêtre
    window.addEventListener('resize', () => {
        camera.left = window.innerWidth / -2;
        camera.right = window.innerWidth / 2;
        camera.top = window.innerHeight / 2;
        camera.bottom = window.innerHeight / -2;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Mettre à jour la taille du plan de fond pour correspondre à la nouvelle taille de fenêtre
        backgroundMesh.scale.set(window.innerWidth / backgroundGeometry.parameters.width, window.innerHeight / backgroundGeometry.parameters.height, 1);

        const newParticleCount = calculateParticleCount();

        // Ajouter des particules si la taille de la fenêtre augmente
        if (newParticleCount > particlesCount) {
            for (let i = 0; i < newParticleCount - particlesCount; i++) {
                createParticleAtRandomPosition();
            }
        }

        // Supprimer des particules si la taille de la fenêtre diminue
        if (newParticleCount < particlesCount) {
            const particlesToRemove = particles.splice(0, particlesCount - newParticleCount);
            particlesToRemove.forEach(particle => {
                scene.remove(particle);
            });
        }

        particlesCount = newParticleCount;
    });
});


document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    const scrollIndicator = document.querySelector('.scroll-down-indicator');
    const headerHeight = header.offsetHeight;

    window.addEventListener('scroll', function() {
        // Calculer la position de la flèche moins la hauteur du header
        const triggerPoint = scrollIndicator.offsetTop + scrollIndicator.offsetHeight - headerHeight;

        if (window.scrollY > triggerPoint) {
            header.classList.add('opaque');
        } else {
            header.classList.remove('opaque');
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navList = document.getElementById('nav-carousel');

    hamburger.addEventListener('click', function() {
        navList.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
});
