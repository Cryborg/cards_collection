// Gestionnaire d'animation de pioche de cartes
class DrawAnimationManager {
    constructor() {
        this.overlay = null;
        this.currentCard = null;
        this.isAnimating = false;
    }

    // Initialise l'overlay d'animation
    init() {
        this.createOverlay();
    }

    // Crée l'overlay d'animation
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'draw-animation-overlay';
        this.overlay.style.display = 'none'; // Important : caché par défaut
        this.overlay.innerHTML = `
            <div class="animated-card">
                <div class="card-face back">
                    <div class="card-back-pattern">🃏</div>
                </div>
                <div class="card-face front">
                    <div class="animated-card-image">
                        <span class="card-emoji"></span>
                    </div>
                    <div class="animated-card-info">
                        <h2 class="card-name"></h2>
                        <div class="animated-card-rarity">
                            <span class="rarity-emoji"></span>
                            <span class="rarity-name"></span>
                        </div>
                        <p class="animated-card-description"></p>
                    </div>
                    <div class="particles"></div>
                </div>
            </div>
            <div class="draw-animation-buttons">
                <button class="draw-animation-btn" id="add-to-collection-btn">
                    ✅ Ajouter à ma collection
                </button>
                <button class="draw-animation-btn secondary" id="close-animation-btn">
                    ✨ Continuer
                </button>
            </div>
        `;

        document.body.appendChild(this.overlay);

        // Lie les événements
        this.bindEvents();
    }

    // Lie les événements des boutons
    bindEvents() {
        const addBtn = this.overlay.querySelector('#add-to-collection-btn');
        const closeBtn = this.overlay.querySelector('#close-animation-btn');

        addBtn.addEventListener('click', () => this.closeAnimation(true));
        closeBtn.addEventListener('click', () => this.closeAnimation(false));

        // Ferme avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isAnimating) {
                this.closeAnimation(false);
            }
        });

        // Ferme l'animation en cliquant sur l'overlay (pas sur la carte)
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                e.preventDefault();
                e.stopPropagation();
                this.closeAnimation(false);
            }
        });
    }

    // Lance l'animation pour une carte donnée
    async showCardAnimation(card, isDuplicate = false) {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.currentCard = card;

        // Mise à jour du contenu de la carte
        this.updateCardContent(card, isDuplicate);

        // Affiche l'overlay
        this.overlay.style.display = 'flex';

        // Force un reflow puis ajoute la classe show
        this.overlay.offsetHeight;
        this.overlay.classList.add('show');

        // Lance l'animation de flip
        const animatedCard = this.overlay.querySelector('.animated-card');
        animatedCard.classList.add('flipping');

        // Génère les particules pour les raretés élevées
        if (card.rarity === 'epic' || card.rarity === 'legendary') {
            setTimeout(() => this.generateParticles(card.rarity), 1000);
        }

        // Joue un son si disponible (optionnel)
        this.playDrawSound(card.rarity);

        return new Promise((resolve) => {
            this.resolveAnimation = resolve;
        });
    }

    // Met à jour le contenu de la carte
    updateCardContent(card, isDuplicate) {
        // Les cartes apparaissent toujours en Common lors de la pioche
        const rarity = CONFIG.RARITIES['common'];
        const baseRarity = CONFIG.RARITIES[card.baseRarity];

        // Éléments de la carte
        const cardEmoji = this.overlay.querySelector('.card-emoji');
        const cardName = this.overlay.querySelector('.card-name');
        const rarityEmoji = this.overlay.querySelector('.rarity-emoji');
        const rarityName = this.overlay.querySelector('.rarity-name');
        const cardDescription = this.overlay.querySelector('.animated-card-description');
        const frontFace = this.overlay.querySelector('.card-face.front');
        const addBtn = this.overlay.querySelector('#add-to-collection-btn');

        // Met à jour le contenu
        // Utilise l'image si disponible, sinon l'emoji
        if (card.image) {
            cardEmoji.innerHTML = `<img src="${card.image}" alt="${card.name}" class="animated-card-image-content">`;
        } else {
            cardEmoji.textContent = card.emoji;
        }
        cardName.textContent = card.name;
        rarityEmoji.textContent = rarity.emoji;
        rarityName.textContent = `${rarity.name} (Max: ${baseRarity.name})`;
        cardDescription.textContent = card.description + ` Collecte des doublons pour améliorer cette carte vers sa rareté maximale : ${baseRarity.name}.`;

        // Applique la classe de rareté (toujours common pour l'animation)
        frontFace.className = `card-face front common`;

        // Met à jour la couleur de la rareté
        const rarityElement = this.overlay.querySelector('.animated-card-rarity');
        rarityElement.style.color = rarity.color;

        // Met à jour le bouton selon si c'est un doublon
        if (isDuplicate) {
            addBtn.innerHTML = '🔄 Doublon obtenu !';
            addBtn.title = 'Cette carte est déjà dans votre collection';
        } else {
            addBtn.innerHTML = '✅ Nouvelle carte !';
            addBtn.title = 'Première fois que vous obtenez cette carte';
        }
    }

    // Génère des particules pour les animations épiques/légendaires
    generateParticles(rarity) {
        const particlesContainer = this.overlay.querySelector('.particles');
        particlesContainer.innerHTML = '';

        const particleCount = rarity === 'legendary' ? 20 : 12;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = `particle ${rarity}`;

            // Position aléatoire
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const delay = Math.random() * 2;

            particle.style.left = `${x}%`;
            particle.style.top = `${y}%`;
            particle.style.animationDelay = `${delay}s`;

            particlesContainer.appendChild(particle);
        }

        // Nettoie les particules après l'animation
        setTimeout(() => {
            particlesContainer.innerHTML = '';
        }, 5000);
    }

    // Joue un son selon la rareté (optionnel)
    playDrawSound(rarity) {
        // Pour le moment, on utilise une vibration sur mobile si disponible
        if ('vibrate' in navigator) {
            switch (rarity) {
                case 'legendary':
                    navigator.vibrate([200, 100, 200, 100, 200]);
                    break;
                case 'epic':
                    navigator.vibrate([150, 50, 150]);
                    break;
                case 'very_rare':
                    navigator.vibrate([100, 50, 100]);
                    break;
                case 'rare':
                    navigator.vibrate([75]);
                    break;
                default:
                    navigator.vibrate([50]);
            }
        }

        // On pourrait ajouter ici des sons audio si souhaité
        // const audio = new Audio(`sounds/${rarity}.mp3`);
        // audio.play().catch(() => {}); // Ignore les erreurs de lecture
    }

    // Ferme l'animation
    closeAnimation(addToCollection = true) {
        if (!this.isAnimating) return;

        // Animation de fermeture
        this.overlay.classList.remove('show');

        setTimeout(() => {
            this.overlay.style.display = 'none';

            // Nettoie les classes d'animation
            const animatedCard = this.overlay.querySelector('.animated-card');
            animatedCard.classList.remove('flipping');

            // Nettoie les particules
            const particlesContainer = this.overlay.querySelector('.particles');
            particlesContainer.innerHTML = '';

            this.isAnimating = false;

            // Résout la promesse avec le résultat
            if (this.resolveAnimation) {
                this.resolveAnimation({
                    card: this.currentCard,
                    addToCollection,
                    closed: true
                });
                this.resolveAnimation = null;
            }

            this.currentCard = null;
        }, 300);
    }

    // Vérifie si une animation est en cours
    isCurrentlyAnimating() {
        return this.isAnimating;
    }

    // Nettoie les ressources
    destroy() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
        this.isAnimating = false;
        this.currentCard = null;
    }
}

// Instance globale
const DRAW_ANIMATION = new DrawAnimationManager();