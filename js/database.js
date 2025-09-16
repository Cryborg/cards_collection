// Gestionnaire de base de données (localStorage pour le moment, SQLite plus tard)
class DatabaseManager {
    constructor() {
        this.initializeData();
    }

    // Initialise les données de base si elles n'existent pas
    initializeData() {
        // Vérifie si les cartes existent et ont la nouvelle structure
        const cards = this.getAllCards();
        if (!cards || cards.length === 0 || !cards[0].baseRarity) {
            console.log('🔄 Mise à jour vers le nouveau système de rareté...');
            this.initializeDefaultCards();
        }

        // Migre la collection si nécessaire
        this.migrateCollection();

        const collection = this.getCollection();
        if (!collection) {
            this.saveCollection({});
        }
    }

    // Migre l'ancienne collection vers le nouveau format
    migrateCollection() {
        const collection = this.getCollection();
        if (!collection) return;

        let needsMigration = false;

        for (const [cardId, collectionItem] of Object.entries(collection)) {
            if (!collectionItem.currentRarity) {
                collectionItem.currentRarity = 'common';
                needsMigration = true;
            }
        }

        if (needsMigration) {
            console.log('🔄 Migration de la collection vers le nouveau format...');
            this.saveCollection(collection);
        }
    }

    // Crée les cartes par défaut pour les 3 thèmes
    initializeDefaultCards() {
        const defaultCards = [
            // MINECRAFT
            {
                id: 'mc_01',
                name: 'Creeper',
                theme: 'minecraft',
                baseRarity: 'common', // Rareté naturelle de la carte
                emoji: '💚',
                image: 'images/creeper.webp',
                description: 'Une créature explosive qui détruit tout sur son passage.'
            },
            {
                id: 'mc_02',
                name: 'Enderman',
                theme: 'minecraft',
                baseRarity: 'rare',
                emoji: '👤',
                image: 'images/enderman.webp',
                description: 'Être mystérieux capable de téléportation.'
            },
            {
                id: 'mc_03',
                name: 'Diamant',
                theme: 'minecraft',
                baseRarity: 'very_rare',
                emoji: '💎',
                description: 'Le minerai le plus précieux du monde de Minecraft.'
            },
            {
                id: 'mc_04',
                name: 'Ender Dragon',
                theme: 'minecraft',
                baseRarity: 'epic',
                emoji: '🐉',
                description: 'Le boss final qui règne sur l\'End.'
            },
            {
                id: 'mc_05',
                name: 'Steve',
                theme: 'minecraft',
                baseRarity: 'legendary',
                emoji: '🧑‍🔧',
                description: 'Le héros légendaire de Minecraft.'
            },
            {
                id: 'mc_06',
                name: 'Zombie',
                theme: 'minecraft',
                baseRarity: 'common',
                emoji: '🧟',
                description: 'Mort-vivant qui erre dans la nuit.'
            },
            {
                id: 'mc_07',
                name: 'Wither',
                theme: 'minecraft',
                baseRarity: 'epic',
                emoji: '💀',
                description: 'Boss destructeur aux trois têtes.'
            },
            {
                id: 'mc_08',
                name: 'Émeraude',
                theme: 'minecraft',
                baseRarity: 'rare',
                emoji: '💚',
                description: 'Gemme précieuse pour le commerce.'
            },

            // ASTRONOMIE
            {
                id: 'space_01',
                name: 'Soleil',
                theme: 'space',
                baseRarity: 'legendary',
                emoji: '☀️',
                description: 'Notre étoile, source de toute vie sur Terre.'
            },
            {
                id: 'space_02',
                name: 'Lune',
                theme: 'space',
                baseRarity: 'common',
                emoji: '🌙',
                description: 'Satellite naturel de la Terre.'
            },
            {
                id: 'space_03',
                name: 'Mars',
                theme: 'space',
                baseRarity: 'rare',
                emoji: '🔴',
                description: 'La planète rouge, future destination humaine.'
            },
            {
                id: 'space_04',
                name: 'Saturne',
                theme: 'space',
                baseRarity: 'very_rare',
                emoji: '🪐',
                description: 'Planète aux magnifiques anneaux.'
            },
            {
                id: 'space_05',
                name: 'Trou Noir',
                theme: 'space',
                baseRarity: 'epic',
                emoji: '⚫',
                description: 'Objet cosmique d\'une densité infinie.'
            },
            {
                id: 'space_06',
                name: 'Galaxie',
                theme: 'space',
                baseRarity: 'epic',
                emoji: '🌌',
                description: 'Amas de milliards d\'étoiles.'
            },
            {
                id: 'space_07',
                name: 'Comète',
                theme: 'space',
                baseRarity: 'rare',
                emoji: '☄️',
                description: 'Voyageuse glacée des confins du système solaire.'
            },
            {
                id: 'space_08',
                name: 'Nébuleuse',
                theme: 'space',
                baseRarity: 'very_rare',
                emoji: '🌠',
                description: 'Nuage cosmique où naissent les étoiles.'
            },

            // DINOSAURES
            {
                id: 'dino_01',
                name: 'T-Rex',
                theme: 'dinosaurs',
                baseRarity: 'legendary',
                emoji: '🦖',
                description: 'Le roi des prédateurs du Crétacé.'
            },
            {
                id: 'dino_02',
                name: 'Tricératops',
                theme: 'dinosaurs',
                baseRarity: 'rare',
                emoji: '🦕',
                description: 'Herbivore aux trois cornes impressionnantes.'
            },
            {
                id: 'dino_03',
                name: 'Vélociraptor',
                theme: 'dinosaurs',
                baseRarity: 'very_rare',
                emoji: '🦅',
                description: 'Chasseur intelligent et redoutable.'
            },
            {
                id: 'dino_04',
                name: 'Diplodocus',
                theme: 'dinosaurs',
                baseRarity: 'common',
                emoji: '🦴',
                description: 'Géant au long cou et à la longue queue.'
            },
            {
                id: 'dino_05',
                name: 'Ptérodactyle',
                theme: 'dinosaurs',
                baseRarity: 'rare',
                emoji: '🦋',
                description: 'Reptile volant des temps préhistoriques.'
            },
            {
                id: 'dino_06',
                name: 'Spinosaurus',
                theme: 'dinosaurs',
                baseRarity: 'epic',
                emoji: '🐊',
                description: 'Prédateur aquatique à la voile dorsale.'
            },
            {
                id: 'dino_07',
                name: 'Ankylosaure',
                theme: 'dinosaurs',
                baseRarity: 'common',
                emoji: '🛡️',
                description: 'Herbivore blindé comme un tank.'
            },
            {
                id: 'dino_08',
                name: 'Archéoptéryx',
                theme: 'dinosaurs',
                baseRarity: 'epic',
                emoji: '🪶',
                description: 'Lien évolutif entre dinosaures et oiseaux.'
            }
        ];

        this.saveCards(defaultCards);
    }

    // Sauvegarde toutes les cartes
    saveCards(cards) {
        return UTILS.saveToStorage('all_cards', cards);
    }

    // Récupère toutes les cartes disponibles
    getAllCards() {
        return UTILS.loadFromStorage('all_cards', []);
    }

    // Récupère les cartes par thème
    getCardsByTheme(theme) {
        const allCards = this.getAllCards();
        return allCards.filter(card => card.theme === theme);
    }

    // Récupère une carte par son ID
    getCardById(cardId) {
        const allCards = this.getAllCards();
        return allCards.find(card => card.id === cardId);
    }

    // Sauvegarde la collection du joueur
    saveCollection(collection) {
        return UTILS.saveToStorage(CONFIG.STORAGE_KEYS.COLLECTION, collection);
    }

    // Récupère la collection du joueur
    getCollection() {
        return UTILS.loadFromStorage(CONFIG.STORAGE_KEYS.COLLECTION, {});
    }

    // Ajoute une carte à la collection
    addToCollection(cardId, level = 1) {
        const collection = this.getCollection();

        if (collection[cardId]) {
            collection[cardId].count += 1;
        } else {
            collection[cardId] = {
                count: 1,
                level: level,
                currentRarity: 'common', // Toujours common au début
                firstObtained: Date.now()
            };
        }

        this.saveCollection(collection);
        return collection[cardId];
    }

    // Met à jour le niveau d'une carte
    upgradeCard(cardId, newLevel) {
        const collection = this.getCollection();

        if (collection[cardId]) {
            collection[cardId].level = newLevel;
            this.saveCollection(collection);
            return true;
        }

        return false;
    }

    // Améliore la rareté d'une carte
    upgradeCardRarity(cardId) {
        const collection = this.getCollection();
        const card = this.getCardById(cardId);

        if (!collection[cardId] || !card) {
            return { success: false, message: 'Carte introuvable' };
        }

        const currentRarity = collection[cardId].currentRarity || 'common';
        const rarityOrder = ['common', 'rare', 'very_rare', 'epic', 'legendary'];
        const currentIndex = rarityOrder.indexOf(currentRarity);
        const maxIndex = rarityOrder.indexOf(card.baseRarity);

        // Toutes les cartes peuvent maintenant atteindre Légendaire
        const legendaryIndex = rarityOrder.indexOf('legendary');
        if (currentIndex >= legendaryIndex) {
            return {
                success: false,
                message: 'Cette carte a atteint sa rareté maximale (Légendaire)',
                maxRarity: 'legendary'
            };
        }

        // Calcule le coût d'amélioration (de plus en plus cher)
        const upgradeCost = Math.pow(2, currentIndex + 2); // 4, 8, 16, 32...

        if (collection[cardId].count < upgradeCost) {
            return {
                success: false,
                message: `Il faut ${upgradeCost} exemplaires pour cette amélioration`,
                required: upgradeCost,
                current: collection[cardId].count
            };
        }

        // Effectue l'amélioration
        const newRarity = rarityOrder[currentIndex + 1];
        collection[cardId].currentRarity = newRarity;

        // Si on atteint Légendaire, convertit les cartes restantes en crédits
        let creditsEarned = 0;
        let excessCards = 0;

        if (newRarity === 'legendary') {
            // Une fois Légendaire, convertit toutes les cartes en excès en crédits
            const remainingCards = collection[cardId].count - upgradeCost;
            excessCards = Math.max(0, remainingCards);
            creditsEarned = excessCards * CONFIG.CREDITS.EXCESS_CARD_VALUE;

            // Garde seulement 1 exemplaire Légendaire
            collection[cardId].count = 1;

            // Ajoute les crédits gagnés
            if (creditsEarned > 0) {
                this.addCredits(creditsEarned);
            }
        } else {
            // Pour les autres niveaux, consomme exactement le coût d'amélioration
            collection[cardId].count -= upgradeCost;
        }

        this.saveCollection(collection);

        return {
            success: true,
            newRarity,
            message: `Carte améliorée en ${CONFIG.RARITIES[newRarity].name} !`,
            cost: upgradeCost,
            creditsEarned,
            excessCards
        };
    }

    // Retire des cartes de la collection (pour les améliorations)
    removeFromCollection(cardId, count) {
        const collection = this.getCollection();

        if (collection[cardId] && collection[cardId].count >= count) {
            collection[cardId].count -= count;

            if (collection[cardId].count <= 0) {
                delete collection[cardId];
            }

            this.saveCollection(collection);
            return true;
        }

        return false;
    }

    // Vérifie si le joueur possède une carte
    hasCard(cardId) {
        const collection = this.getCollection();
        return collection[cardId] && collection[cardId].count > 0;
    }

    // Récupère le nombre de cartes possédées
    getCardCount(cardId) {
        const collection = this.getCollection();
        return collection[cardId] ? collection[cardId].count : 0;
    }

    // Récupère le niveau d'une carte
    getCardLevel(cardId) {
        const collection = this.getCollection();
        return collection[cardId] ? collection[cardId].level : 1;
    }

    // Récupère la rareté actuelle d'une carte
    getCardCurrentRarity(cardId) {
        const collection = this.getCollection();
        return collection[cardId] ? (collection[cardId].currentRarity || 'common') : 'common';
    }

    // Statistiques de la collection
    getCollectionStats() {
        const allCards = this.getAllCards();
        const collection = this.getCollection();

        const totalCards = allCards.length;
        const ownedCards = Object.keys(collection).length;
        const completionPercentage = totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0;

        // Statistiques par thème
        const themeStats = {};
        for (const theme of Object.keys(CONFIG.THEMES)) {
            const themeCards = this.getCardsByTheme(theme);
            const ownedThemeCards = themeCards.filter(card => this.hasCard(card.id));

            themeStats[theme] = {
                total: themeCards.length,
                owned: ownedThemeCards.length,
                percentage: themeCards.length > 0 ? Math.round((ownedThemeCards.length / themeCards.length) * 100) : 0
            };
        }

        return {
            totalCards,
            ownedCards,
            completionPercentage,
            themeStats
        };
    }

    // Sauvegarde de l'heure de dernière pioche
    saveLastDrawTime() {
        UTILS.saveToStorage(CONFIG.STORAGE_KEYS.LAST_DRAW, Date.now());
    }

    // Gestion des crédits de pioche
    getCredits() {
        return UTILS.loadFromStorage(CONFIG.STORAGE_KEYS.CREDITS, CONFIG.CREDITS.INITIAL);
    }

    saveCredits(credits) {
        const maxCredits = Math.min(credits, CONFIG.CREDITS.MAX_STORED);
        return UTILS.saveToStorage(CONFIG.STORAGE_KEYS.CREDITS, maxCredits);
    }

    addCredits(amount) {
        const currentCredits = this.getCredits();
        const newCredits = Math.min(currentCredits + amount, CONFIG.CREDITS.MAX_STORED);
        this.saveCredits(newCredits);
        return newCredits;
    }

    useCredit() {
        const currentCredits = this.getCredits();
        if (currentCredits > 0) {
            const newCredits = currentCredits - 1;
            this.saveCredits(newCredits);
            return { success: true, remaining: newCredits };
        }
        return { success: false, remaining: 0 };
    }

    hasCredits() {
        return this.getCredits() > 0;
    }

    // Gestion du crédit quotidien
    getLastDailyCreditTime() {
        return UTILS.loadFromStorage(CONFIG.STORAGE_KEYS.LAST_DAILY_CREDIT, 0);
    }

    saveLastDailyCreditTime() {
        return UTILS.saveToStorage(CONFIG.STORAGE_KEYS.LAST_DAILY_CREDIT, Date.now());
    }

    canClaimDailyCredit() {
        const lastClaim = this.getLastDailyCreditTime();
        const now = Date.now();
        return (now - lastClaim) >= CONFIG.CREDITS.DAILY_COOLDOWN;
    }

    getDailyCreditTimeLeft() {
        const lastClaim = this.getLastDailyCreditTime();
        const now = Date.now();
        const timeLeft = CONFIG.CREDITS.DAILY_COOLDOWN - (now - lastClaim);
        return Math.max(0, timeLeft);
    }

    claimDailyCredit() {
        if (!this.canClaimDailyCredit()) {
            return { success: false, message: 'Crédit quotidien déjà réclamé' };
        }

        const newCredits = this.addCredits(CONFIG.CREDITS.DAILY_BONUS);
        this.saveLastDailyCreditTime();

        return {
            success: true,
            creditsAdded: CONFIG.CREDITS.DAILY_BONUS,
            totalCredits: newCredits,
            message: `+${CONFIG.CREDITS.DAILY_BONUS} crédit quotidien !`
        };
    }

    // Reset complet de la base de données (pour debug)
    resetDatabase() {
        localStorage.removeItem('all_cards');
        localStorage.removeItem(CONFIG.STORAGE_KEYS.COLLECTION);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.LAST_DRAW);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.CREDITS);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.LAST_DAILY_CREDIT);
        this.initializeData();
    }
}

// Instance globale
const DB = new DatabaseManager();