// Configuration globale du jeu
const CONFIG = {
    // Système de raretés avec probabilités et points
    RARITIES: {
        common: {
            name: 'Commune',
            emoji: '🤍',
            color: '#ffffff',
            points: 1,
            probability: 0.60 // 60%
        },
        rare: {
            name: 'Rare',
            emoji: '💙',
            color: '#3b82f6',
            points: 2,
            probability: 0.25 // 25%
        },
        very_rare: {
            name: 'Très Rare',
            emoji: '💚',
            color: '#10b981',
            points: 4,
            probability: 0.10 // 10%
        },
        epic: {
            name: 'Épique',
            emoji: '💛',
            color: '#f59e0b',
            points: 8,
            probability: 0.04 // 4%
        },
        legendary: {
            name: 'Légendaire',
            emoji: '❤️',
            color: '#ef4444',
            points: 16,
            probability: 0.01 // 1%
        }
    },

    // Système de niveaux
    LEVELS: {
        MAX_LEVEL: 5,
        UPGRADE_COST: 2 // Il faut 2 cartes de niveau X-1 pour faire une carte niveau X
    },

    // Système de crédits de pioche
    CREDITS: {
        INITIAL: 5, // Crédits de départ
        DAILY_BONUS: 5, // Crédits quotidiens
        MAX_STORED: 50, // Maximum de crédits stockables
        EXCESS_CARD_VALUE: 1, // Une carte en trop = 1 crédit
        DAILY_COOLDOWN: 24 * 60 * 60 * 1000 // 24h en millisecondes
    },

    // Thèmes de cartes
    THEMES: {
        minecraft: {
            name: 'Minecraft',
            emoji: '🟫',
            color: '#8B4513'
        },
        space: {
            name: 'Astronomie',
            emoji: '🌌',
            color: '#4169E1'
        },
        dinosaurs: {
            name: 'Dinosaures',
            emoji: '🦕',
            color: '#228B22'
        }
    },

    // Messages de toasts
    MESSAGES: {
        CARD_DRAWN: 'Nouvelle carte obtenue !',
        CARD_UPGRADED: 'Carte améliorée !',
        INSUFFICIENT_CARDS: 'Pas assez de cartes pour améliorer',
        COOLDOWN_ACTIVE: 'Veuillez attendre avant de piocher',
        MAX_LEVEL: 'Cette carte est déjà au niveau maximum',
        DUPLICATE_FOUND: 'Doublon ! Carte ajoutée à votre collection'
    },

    // Stockage local
    STORAGE_KEYS: {
        COLLECTION: 'cards_collection',
        LAST_DRAW: 'last_draw_time',
        CREDITS: 'draw_credits',
        LAST_DAILY_CREDIT: 'last_daily_credit',
        SETTINGS: 'game_settings'
    },

    // API endpoints (pour future implémentation PHP)
    API: {
        BASE_URL: './api',
        ENDPOINTS: {
            CARDS: '/cards.php',
            COLLECTION: '/collection.php',
            DRAW: '/draw.php',
            UPGRADE: '/upgrade.php'
        }
    }
};

// Utilitaires globaux
const UTILS = {
    // Génère un ID unique
    generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),

    // Formatage des dates
    formatDate: (date) => new Intl.DateTimeFormat('fr-FR').format(date),

    // Sauvegarde dans le localStorage
    saveToStorage: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            return false;
        }
    },

    // Lecture depuis le localStorage
    loadFromStorage: (key, defaultValue = null) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            return defaultValue;
        }
    },

    // Calcul de probabilité pondérée
    getRandomRarity: () => {
        const random = Math.random();
        let cumulative = 0;

        for (const [rarityKey, rarity] of Object.entries(CONFIG.RARITIES)) {
            cumulative += rarity.probability;
            if (random <= cumulative) {
                return rarityKey;
            }
        }
        return 'common'; // Fallback
    },

    // Vérification du cooldown
    isCooldownActive: () => {
        const lastDraw = UTILS.loadFromStorage(CONFIG.STORAGE_KEYS.LAST_DRAW, 0);
        const now = Date.now();
        return (now - lastDraw) < CONFIG.DRAW_COOLDOWN;
    },

    // Temps restant du cooldown
    getCooldownTimeLeft: () => {
        const lastDraw = UTILS.loadFromStorage(CONFIG.STORAGE_KEYS.LAST_DRAW, 0);
        const now = Date.now();
        const timeLeft = CONFIG.DRAW_COOLDOWN - (now - lastDraw);
        return Math.max(0, timeLeft);
    },

    // Formatage du temps en secondes
    formatTimeLeft: (milliseconds) => {
        const seconds = Math.ceil(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
    },

    // Fonction utilitaire pour rendre l'affichage visuel d'une carte (image ou emoji)
    renderCardVisual(card, size = 'medium', className = '') {
        if (!card.owned) {
            return `<span class="mystery-card ${className}">❓</span>`;
        }

        if (card.image) {
            return `<img src="${card.image}" alt="${card.name}" class="card-visual-image ${size} ${className}" loading="lazy">`;
        }

        const sizeClasses = {
            small: 'font-size: 2rem;',
            medium: 'font-size: 3rem;',
            large: 'font-size: 6rem;',
            grouped: 'font-size: 4.5rem;'
        };

        return `<span class="card-visual-emoji ${className}" style="${sizeClasses[size]}">${card.emoji}</span>`;
    }
};

// Export pour compatibilité future avec modules ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, UTILS };
}