// Système de gestion des cartes et mécaniques de jeu
class CardSystem {
    constructor() {
        this.currentTheme = 'minecraft';
        this.filters = {
            rarity: '',
            search: ''
        };
    }

    // Pioche une carte aléatoire
    drawCard() {
        // Vérifie si le joueur a des crédits
        if (!DB.hasCredits()) {
            return {
                success: false,
                message: 'Aucun crédit de pioche disponible'
            };
        }

        // Utilise un crédit
        const creditResult = DB.useCredit();
        if (!creditResult.success) {
            return {
                success: false,
                message: 'Impossible d\'utiliser le crédit'
            };
        }

        // Génère une rareté aléatoire selon la baseRarity de la carte
        const baseRarity = UTILS.getRandomRarity();

        // Récupère toutes les cartes de cette rareté de base
        const allCards = DB.getAllCards();
        const availableCards = allCards.filter(card => card.baseRarity === baseRarity);

        if (availableCards.length === 0) {
            return {
                success: false,
                message: 'Aucune carte disponible'
            };
        }

        // Sélectionne une carte aléatoire
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        const drawnCard = availableCards[randomIndex];

        // Ajoute la carte à la collection (toujours en 'common' au début)
        const collectionItem = DB.addToCollection(drawnCard.id);

        // Sauvegarde l'heure de pioche
        DB.saveLastDrawTime();

        // Détermine si c'est un doublon
        const isDuplicate = collectionItem.count > 1;

        return {
            success: true,
            card: drawnCard,
            isDuplicate,
            newCount: collectionItem.count,
            creditsRemaining: creditResult.remaining,
            message: isDuplicate ? CONFIG.MESSAGES.DUPLICATE_FOUND : CONFIG.MESSAGES.CARD_DRAWN
        };
    }

    // Améliore une carte en utilisant des doublons (amélioration de rareté)
    upgradeCard(cardId) {
        return DB.upgradeCardRarity(cardId);
    }

    // Calcule les points d'une carte selon sa rareté actuelle
    calculateCardPoints(card, currentRarity) {
        const basePoints = CONFIG.RARITIES[currentRarity].points;
        return basePoints;
    }

    // Récupère toutes les cartes avec leurs informations de collection
    getCardsWithCollectionInfo(themeFilter = null) {
        const allCards = DB.getAllCards();
        const collection = DB.getCollection();

        let filteredCards = allCards;

        // Filtre par thème
        if (themeFilter) {
            filteredCards = filteredCards.filter(card => card.theme === themeFilter);
        }

        // Filtre par rareté (basé sur la rareté actuelle)
        if (this.filters.rarity) {
            filteredCards = filteredCards.filter(card => {
                const currentRarity = DB.getCardCurrentRarity(card.id);
                return currentRarity === this.filters.rarity;
            });
        }

        // Filtre par recherche
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filteredCards = filteredCards.filter(card =>
                card.name.toLowerCase().includes(searchTerm) ||
                card.description.toLowerCase().includes(searchTerm)
            );
        }

        // Ajoute les informations de collection
        return filteredCards.map(card => {
            const collectionItem = collection[card.id];
            const currentRarity = DB.getCardCurrentRarity(card.id);
            const canUpgradeRarity = this.canUpgradeRarity(card.id);

            const result = {
                ...card,
                owned: !!collectionItem,
                count: collectionItem ? collectionItem.count : 0,
                currentRarity: currentRarity,
                baseRarity: card.baseRarity,
                points: this.calculateCardPoints(card, currentRarity),
                canUpgrade: canUpgradeRarity.canUpgrade,
                upgradeInfo: canUpgradeRarity
            };

            // Debug : vérifie les propriétés manquantes
            if (!result.baseRarity) {
                console.error('baseRarity manquante pour la carte:', card);
            }

            return result;
        });
    }

    // Vérifie si une carte peut être améliorée en rareté
    canUpgradeRarity(cardId) {
        const collection = DB.getCollection();
        const card = DB.getCardById(cardId);

        if (!collection[cardId] || !card) {
            return { canUpgrade: false, reason: 'Carte non possédée' };
        }

        const currentRarity = collection[cardId].currentRarity || 'common';
        const rarityOrder = ['common', 'rare', 'very_rare', 'epic', 'legendary'];
        const currentIndex = rarityOrder.indexOf(currentRarity);
        const legendaryIndex = rarityOrder.indexOf('legendary');

        if (currentIndex >= legendaryIndex) {
            return {
                canUpgrade: false,
                reason: 'Rareté maximale atteinte (Légendaire)',
                maxRarity: 'legendary'
            };
        }

        const upgradeCost = Math.pow(2, currentIndex + 2);
        const hasEnoughCards = collection[cardId].count >= upgradeCost;

        return {
            canUpgrade: hasEnoughCards,
            cost: upgradeCost,
            current: collection[cardId].count,
            nextRarity: rarityOrder[currentIndex + 1],
            reason: hasEnoughCards ? 'Peut être améliorée' : `Besoin de ${upgradeCost} exemplaires`
        };
    }

    // Met à jour les filtres
    setFilters(filters) {
        this.filters = { ...this.filters, ...filters };
    }

    // Change le thème actuel
    setCurrentTheme(theme) {
        this.currentTheme = theme;
    }

    // Récupère les cartes du thème actuel
    getCurrentThemeCards() {
        return this.getCardsWithCollectionInfo(this.currentTheme);
    }

    // Calcule le score total du joueur
    calculateTotalScore() {
        const collection = DB.getCollection();
        const allCards = DB.getAllCards();
        let totalScore = 0;

        for (const [cardId, collectionItem] of Object.entries(collection)) {
            const card = allCards.find(c => c.id === cardId);
            if (card) {
                const cardScore = this.calculateCardPoints(card, collectionItem.level);
                totalScore += cardScore;
            }
        }

        return totalScore;
    }

    // Récupère les statistiques détaillées
    getDetailedStats() {
        const basicStats = DB.getCollectionStats();
        const totalScore = this.calculateTotalScore();
        const collection = DB.getCollection();

        // Statistiques par rareté
        const rarityStats = {};
        for (const [rarityKey, rarity] of Object.entries(CONFIG.RARITIES)) {
            const allCardsOfRarity = DB.getAllCards().filter(card => card.rarity === rarityKey);
            const ownedCardsOfRarity = allCardsOfRarity.filter(card => DB.hasCard(card.id));

            rarityStats[rarityKey] = {
                name: rarity.name,
                total: allCardsOfRarity.length,
                owned: ownedCardsOfRarity.length,
                percentage: allCardsOfRarity.length > 0 ?
                    Math.round((ownedCardsOfRarity.length / allCardsOfRarity.length) * 100) : 0
            };
        }

        // Carte la plus élevée en niveau
        let highestLevelCard = null;
        let highestLevel = 0;

        for (const [cardId, collectionItem] of Object.entries(collection)) {
            if (collectionItem.level > highestLevel) {
                highestLevel = collectionItem.level;
                highestLevelCard = DB.getCardById(cardId);
            }
        }

        return {
            ...basicStats,
            totalScore,
            rarityStats,
            highestLevelCard,
            highestLevel
        };
    }

    // Vérifie s'il y a des améliorations possibles
    hasUpgradeableCards() {
        const cards = this.getCardsWithCollectionInfo();
        return cards.some(card => card.canUpgrade);
    }

    // Récupère les cartes qui peuvent être améliorées
    getUpgradeableCards() {
        const cards = this.getCardsWithCollectionInfo();
        return cards.filter(card => card.canUpgrade);
    }

    // Simulation de pioche (pour les probabilités)
    simulateDraws(numberOfDraws = 100) {
        const results = {};

        for (const rarityKey of Object.keys(CONFIG.RARITIES)) {
            results[rarityKey] = 0;
        }

        for (let i = 0; i < numberOfDraws; i++) {
            const rarity = UTILS.getRandomRarity();
            results[rarity]++;
        }

        // Convertit en pourcentages
        for (const rarityKey of Object.keys(results)) {
            results[rarityKey] = Math.round((results[rarityKey] / numberOfDraws) * 100);
        }

        return results;
    }
}

// Instance globale
const CARD_SYSTEM = new CardSystem();