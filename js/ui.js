// Gestionnaire d'interface utilisateur
class UIManager {
    constructor() {
        this.elements = {};
        this.currentModal = null;
        this.updateInterval = null;
    }

    // Initialise tous les éléments DOM
    init() {
        this.cacheElements();
        this.bindEvents();
        this.startCooldownUpdate();

        // Initialise l'animation de pioche
        DRAW_ANIMATION.init();

        this.render();
    }

    // Met en cache les éléments DOM fréquemment utilisés
    cacheElements() {
        this.elements = {
            uniqueCards: document.getElementById('unique-cards'),
            totalCards: document.getElementById('total-cards'),
            completionPercentage: document.getElementById('completion-percentage'),
            nextCreditCountdown: document.getElementById('next-credit-countdown'),
            drawButton: document.getElementById('draw-card-btn'),
            drawCooldown: document.getElementById('draw-cooldown'),
            collectionGrid: document.getElementById('collection-grid'),
            rarityFilter: document.getElementById('rarity-filter'),
            searchFilter: document.getElementById('search-filter'),
            modal: document.getElementById('card-modal'),
            modalContent: document.getElementById('modal-card-content'),
            modalActions: document.getElementById('modal-actions'),
            toast: document.getElementById('toast'),
            themeTabs: document.querySelectorAll('.tab-btn')
        };
    }

    // Lie les événements
    bindEvents() {
        // Bouton de pioche
        this.elements.drawButton.addEventListener('click', () => this.handleDraw());

        // Onglets de thèmes
        this.elements.themeTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.switchTheme(theme);
            });
        });

        // Filtres
        this.elements.rarityFilter.addEventListener('change', (e) => {
            CARD_SYSTEM.setFilters({ rarity: e.target.value });
            this.renderCards();
        });

        this.elements.searchFilter.addEventListener('input', (e) => {
            CARD_SYSTEM.setFilters({ search: e.target.value });
            this.renderCards();
        });

        // Modal
        const closeModal = this.elements.modal.querySelector('.close');
        closeModal.addEventListener('click', () => this.closeModal());

        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                this.closeModal();
            }
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.closeModal();
            }
            if (e.key === ' ' && !this.currentModal) {
                e.preventDefault();
                this.handleDraw();
            }
            // Touche secrète X pour ajouter un crédit bonus
            if ((e.key === 'x' || e.key === 'X') && !this.currentModal) {
                this.addBonusCredit();
            }
        });
    }

    // Met à jour l'affichage complet
    render() {
        this.updateStats();
        this.updateThemeTabs();
        this.renderCards();
        this.updateDrawButton();
    }

    // Met à jour les statistiques en haut
    updateStats() {
        const stats = DB.getCollectionStats();
        this.elements.uniqueCards.textContent = stats.ownedCards;
        this.elements.totalCards.textContent = stats.totalCards;
        this.elements.completionPercentage.textContent = `${stats.completionPercentage}%`;

        // Compte à rebours pour le prochain crédit gratuit
        this.updateCreditCountdown();
    }

    // Met à jour le compte à rebours du crédit gratuit
    updateCreditCountdown() {
        const canClaimDaily = DB.canClaimDailyCredit();
        const dailyTimeLeft = DB.getDailyCreditTimeLeft();

        if (canClaimDaily) {
            this.elements.nextCreditCountdown.textContent = "Disponible !";
            this.elements.nextCreditCountdown.style.color = "#10b981";
        } else {
            const formattedTime = this.formatCountdown(dailyTimeLeft);
            this.elements.nextCreditCountdown.textContent = formattedTime;
            this.elements.nextCreditCountdown.style.color = "#b0b0b0";
        }
    }

    // Formate le temps en format HH:MM:SS
    formatCountdown(milliseconds) {
        const totalSeconds = Math.ceil(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Met à jour les onglets de thèmes avec indicateurs de progression
    updateThemeTabs() {
        this.elements.themeTabs.forEach(tab => {
            const theme = tab.dataset.theme;
            const themeCards = DB.getCardsByTheme(theme);
            const ownedThemeCards = themeCards.filter(card => DB.hasCard(card.id));

            const completion = themeCards.length > 0 ?
                Math.round((ownedThemeCards.length / themeCards.length) * 100) : 0;

            // Supprime les anciens indicateurs
            const existingIndicator = tab.querySelector('.theme-completion');
            if (existingIndicator) {
                existingIndicator.remove();
            }

            // Crée le nouvel indicateur
            const indicator = document.createElement('div');
            indicator.className = 'theme-completion';

            // Détermine la couleur selon le pourcentage
            let indicatorClass = 'low';
            if (completion >= 100) indicatorClass = 'complete';
            else if (completion >= 75) indicatorClass = 'high';
            else if (completion >= 50) indicatorClass = 'medium';
            else if (completion >= 25) indicatorClass = 'low-medium';

            indicator.innerHTML = `
                <div class="completion-bar">
                    <div class="completion-fill ${indicatorClass}" style="width: ${completion}%"></div>
                </div>
                <span class="completion-text">${completion}%</span>
            `;

            tab.appendChild(indicator);

            // Ajoute une classe pour styling différent selon la completion
            tab.classList.remove('complete', 'high', 'medium', 'low');
            tab.classList.add(indicatorClass);
        });
    }

    // Affiche les cartes de la collection
    renderCards() {
        const cards = CARD_SYSTEM.getCurrentThemeCards();
        this.elements.collectionGrid.innerHTML = '';

        if (cards.length === 0) {
            this.elements.collectionGrid.innerHTML = `
                <div class="no-cards">
                    <p>Aucune carte trouvée pour ce thème ou ces filtres.</p>
                </div>
            `;
            return;
        }

        cards.forEach(card => {
            const cardElement = this.createCardElement(card);
            this.elements.collectionGrid.appendChild(cardElement);
        });
    }

    // Crée un élément carte
    createCardElement(card) {
        const cardDiv = document.createElement('div');

        // Assure-toi que currentRarity existe, sinon utilise 'common'
        const currentRarityKey = card.currentRarity || 'common';
        const baseRarityKey = card.baseRarity || 'common';

        cardDiv.className = `card ${card.owned ? 'owned' : 'not-owned'} ${currentRarityKey}`;
        cardDiv.dataset.cardId = card.id;

        const currentRarity = CONFIG.RARITIES[currentRarityKey];
        const baseRarity = CONFIG.RARITIES[baseRarityKey];

        // Vérifie que les objets de rareté existent
        if (!currentRarity || !baseRarity) {
            console.error('Rareté introuvable:', { currentRarityKey, baseRarityKey, card });
            return document.createElement('div'); // Retourne un div vide en cas d'erreur
        }

        const rarityDisplay = card.owned ?
            `${currentRarity.emoji} ${currentRarity.name}` :
            'Non possédée';
        const countDisplay = card.owned && card.count > 1 ? `<span class="card-count">×${card.count}</span>` : '';

        cardDiv.innerHTML = `
            ${countDisplay}
            <div class="card-image">
                ${card.owned ?
                    (card.image ?
                        `<img src="${card.image}" alt="${card.name}" class="card-artwork" loading="lazy">` :
                        `<span style="font-size: 3rem;">${card.emoji}</span>`
                    ) :
                    `<span class="mystery-card">❓</span>`
                }
            </div>
            <div class="card-info">
                <h3>${card.owned ? card.name : '???'}</h3>
                <div class="card-rarity" style="color: ${currentRarity.color}">
                    ${rarityDisplay}
                </div>
                ${card.owned ?
                    `<p class="card-description">${card.description}</p>` :
                    `<p class="card-description mystery">Carte non découverte</p>`
                }
                ${card.canUpgrade ? `<div class="upgrade-hint">🔺 Améliorer (${card.upgradeInfo.cost} cartes → ${CONFIG.RARITIES[card.upgradeInfo.nextRarity].name})</div>` : ''}
            </div>
        `;

        // Ajoute l'événement de clic
        cardDiv.addEventListener('click', () => this.showCardModal(card));

        return cardDiv;
    }

    // Affiche la modal d'une carte
    showCardModal(card) {
        const currentRarityKey = card.currentRarity || 'common';
        const currentRarity = CONFIG.RARITIES[currentRarityKey];
        const points = CARD_SYSTEM.calculateCardPoints(card, currentRarityKey);

        // Recalcule les informations d'amélioration pour être sûr
        const upgradeInfo = card.owned ? CARD_SYSTEM.canUpgradeRarity(card.id) : null;

        this.elements.modalContent.innerHTML = `
            <div class="card-viewer">
                <div class="physical-card ${currentRarityKey}" id="modal-physical-card">
                    ${card.owned && card.count > 1 ? `<div class="card-count-badge">×${card.count}</div>` : ''}
                    <div class="card-border"></div>
                    <div class="card-header">
                        <h2 class="card-title">${card.owned ? card.name : '???'}</h2>
                        <div class="card-rarity-badge" style="color: ${currentRarity.color}">
                            ${currentRarity.emoji} ${currentRarity.name}
                        </div>
                    </div>

                    <div class="card-artwork">
                        <div class="artwork-frame">
                            ${card.owned ?
                                (card.image ?
                                    `<img src="${card.image}" alt="${card.name}" class="card-artwork-image">` :
                                    `<span class="card-emoji-large">${card.emoji}</span>`
                                ) :
                                `<span class="card-emoji-large mystery">❓</span>`
                            }
                            ${card.owned ? '<div class="holographic-effect"></div>' : ''}
                        </div>
                    </div>

                    <div class="card-info-section">
                        ${card.owned ?
                            `<p class="card-description-text">${card.description}</p>` :
                            `<p class="card-description-text mystery">Découvrez cette carte en la collectant !</p>`
                        }

                        ${card.owned && currentRarityKey !== 'legendary' ? `
                            <div class="upgrade-progress">
                                <div class="progress-label">Amélioration suivante</div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${upgradeInfo ? Math.min((card.count / upgradeInfo.cost) * 100, 100) : 0}%"></div>
                                </div>
                                <div class="progress-text">${card.count} / ${upgradeInfo ? upgradeInfo.cost : '?'} cartes</div>
                            </div>
                        ` : ''}
                    </div>

                    <div class="card-footer">
                        ${card.owned ? `<div class="card-collection-number">#${card.id}</div>` : ''}
                        <div class="card-theme">${CONFIG.THEMES[card.theme].emoji} ${CONFIG.THEMES[card.theme].name}</div>
                    </div>
                </div>
            </div>
        `;

        // Boutons d'action
        this.elements.modalActions.innerHTML = '';

        // Toujours afficher le statut d'amélioration si la carte est possédée
        if (card.owned) {

            if (upgradeInfo.canUpgrade) {
                const upgradeBtn = document.createElement('button');
                upgradeBtn.className = 'modal-btn upgrade-btn';
                upgradeBtn.innerHTML = `
                    <span class="btn-icon">🔺</span>
                    <span class="btn-text">Améliorer la rareté</span>
                    <span class="btn-cost">Coût : ${upgradeInfo.cost} cartes → ${CONFIG.RARITIES[upgradeInfo.nextRarity].emoji} ${CONFIG.RARITIES[upgradeInfo.nextRarity].name}</span>
                `;
                upgradeBtn.addEventListener('click', () => this.handleCardUpgrade(card));
                this.elements.modalActions.appendChild(upgradeBtn);
            } else {
                // Afficher pourquoi on ne peut pas améliorer
                const infoDiv = document.createElement('div');
                infoDiv.className = 'upgrade-info-message';

                if (currentRarityKey === 'legendary') {
                    infoDiv.innerHTML = `
                        <span class="info-icon">👑</span>
                        <span class="info-text">Rareté maximale atteinte !</span>
                    `;
                } else {
                    infoDiv.innerHTML = `
                        <span class="info-icon">📊</span>
                        <span class="info-text">Prochain niveau : ${upgradeInfo.cost} cartes nécessaires (vous en avez ${upgradeInfo.current})</span>
                    `;
                }
                this.elements.modalActions.appendChild(infoDiv);
            }
        }

        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-btn secondary';
        closeBtn.innerHTML = '<span class="btn-icon">✕</span><span class="btn-text">Fermer</span>';
        closeBtn.addEventListener('click', () => this.closeModal());
        this.elements.modalActions.appendChild(closeBtn);

        this.elements.modal.style.display = 'block';
        this.currentModal = card;
    }

    // Ferme la modal
    closeModal() {
        this.elements.modal.style.display = 'none';
        this.currentModal = null;
    }

    // Gère la pioche d'une carte
    async handleDraw() {
        // Vérifie d'abord si on peut récupérer le crédit quotidien
        if (!DB.hasCredits() && DB.canClaimDailyCredit()) {
            const result = DB.claimDailyCredit();
            if (result.success) {
                this.showToast(result.message, 'success');
                this.render();
                return;
            } else {
                this.showToast(result.message, 'error');
                return;
            }
        }

        // Vérifie si une animation est déjà en cours
        if (DRAW_ANIMATION.isCurrentlyAnimating()) {
            return;
        }

        const result = CARD_SYSTEM.drawCard();

        if (result.success) {
            // Lance l'animation de la carte
            try {
                const animationResult = await DRAW_ANIMATION.showCardAnimation(result.card, result.isDuplicate);

                // Après l'animation, bascule sur le thème de la carte
                this.switchTheme(result.card.theme);

                // Met à jour l'affichage
                this.render();

                // Animation de la nouvelle carte dans la collection
                setTimeout(() => {
                    const cardElement = document.querySelector(`[data-card-id="${result.card.id}"]`);
                    if (cardElement) {
                        cardElement.classList.add('new-draw');
                        setTimeout(() => cardElement.classList.remove('new-draw'), 800);

                        // Scroll vers la carte si elle n'est pas visible
                        cardElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                            inline: 'nearest'
                        });
                    }
                }, 300);

                // Affiche un message selon le résultat
                if (result.isDuplicate) {
                    this.showToast(`${result.message} (${result.newCount} exemplaires)`, 'info');
                } else {
                    this.showToast(result.message, 'success');
                }

            } catch (error) {
                console.error('Erreur lors de l\'animation:', error);
                // Fallback sans animation
                this.showToast(result.message, result.isDuplicate ? 'info' : 'success');
                this.render();
            }
        } else {
            this.showToast(result.message, 'error');
        }
    }

    // Gère l'amélioration d'une carte avec animation
    async handleCardUpgrade(card) {
        const result = CARD_SYSTEM.upgradeCard(card.id);

        if (result.success) {
            // Lance l'animation d'amélioration
            await this.animateCardUpgrade(result.newRarity);

            // Met à jour l'affichage général
            this.render();

            // Récupère les nouvelles informations de la carte après amélioration
            const updatedCards = CARD_SYSTEM.getCardsWithCollectionInfo();
            const updatedCard = updatedCards.find(c => c.id === card.id);

            // Vérifie si on peut encore améliorer cette carte
            if (updatedCard && updatedCard.canUpgrade) {
                // Réaffiche la modal avec les nouvelles données
                this.showCardModal(updatedCard);
            } else {
                // Ferme la modal si plus d'amélioration possible
                this.closeModal();
            }

            // Message avec crédits gagnés s'il y en a
            let message = result.message;
            if (result.creditsEarned > 0) {
                message += ` (+${result.creditsEarned} crédit${result.creditsEarned > 1 ? 's' : ''} bonus)`;
            }
            this.showToast(message, 'success');
        } else {
            this.showToast(result.message, 'error');
        }
    }

    // Animation d'amélioration de carte
    async animateCardUpgrade(newRarity) {
        const cardElement = document.getElementById('modal-physical-card');
        if (!cardElement) return;

        const newRarityConfig = CONFIG.RARITIES[newRarity];

        // Phase 1: Effet de lueur
        cardElement.classList.add('upgrading');

        // Phase 2: Explosion de particules après 0.5s
        setTimeout(() => {
            this.createUpgradeParticles(cardElement, newRarity);
        }, 500);

        // Phase 3: Transformation de la carte après 1s
        setTimeout(() => {
            cardElement.className = `physical-card ${newRarity}`;

            // Met à jour les informations visuelles
            const rarityBadge = cardElement.querySelector('.card-rarity-badge');
            if (rarityBadge) {
                rarityBadge.innerHTML = `${newRarityConfig.emoji} ${newRarityConfig.name}`;
                rarityBadge.style.color = newRarityConfig.color;
            }

            // Effet de brillance finale
            cardElement.classList.add('upgrade-complete');

            // Nettoie les classes d'animation après 2s
            setTimeout(() => {
                cardElement.classList.remove('upgrading', 'upgrade-complete');
            }, 2000);
        }, 1000);

        // Retourne une promesse qui se résout après l'animation complète
        return new Promise(resolve => setTimeout(resolve, 2500));
    }

    // Crée des particules d'amélioration
    createUpgradeParticles(cardElement, rarity) {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'upgrade-particles';
        cardElement.appendChild(particlesContainer);

        const colors = {
            common: '#ffffff',
            rare: '#3b82f6',
            very_rare: '#10b981',
            epic: '#f59e0b',
            legendary: '#ef4444'
        };

        const particleCount = rarity === 'legendary' ? 30 : 20;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'upgrade-particle';
            particle.style.backgroundColor = colors[rarity];

            // Position aléatoire autour de la carte
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = 50 + Math.random() * 100;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;

            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.transform = `translate(-50%, -50%)`;
            particle.style.setProperty('--end-x', `${x}px`);
            particle.style.setProperty('--end-y', `${y}px`);

            particlesContainer.appendChild(particle);
        }

        // Supprime les particules après l'animation
        setTimeout(() => {
            if (particlesContainer.parentNode) {
                particlesContainer.parentNode.removeChild(particlesContainer);
            }
        }, 1500);
    }

    // Change de thème
    switchTheme(theme) {
        // Met à jour les onglets
        this.elements.themeTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.theme === theme);
        });

        // Change le thème actuel
        CARD_SYSTEM.setCurrentTheme(theme);
        this.renderCards();
    }

    // Met à jour le bouton de pioche
    updateDrawButton() {
        const hasCredits = DB.hasCredits();
        const creditsCount = DB.getCredits();
        const canClaimDaily = DB.canClaimDailyCredit();
        const dailyTimeLeft = DB.getDailyCreditTimeLeft();

        // Vérifie automatiquement si on peut récupérer le crédit quotidien
        if (canClaimDaily && creditsCount < CONFIG.CREDITS.MAX_STORED) {
            const result = DB.claimDailyCredit();
            if (result.success) {
                this.showToast(result.message, 'success');
                this.updateStats();
                return; // Re-calcule après avoir ajouté le crédit
            }
        }

        // Active le bouton si on a des crédits OU si on peut récupérer le crédit quotidien
        this.elements.drawButton.disabled = !hasCredits && !canClaimDaily;

        // Met à jour le texte du bouton selon la situation
        if (hasCredits) {
            this.elements.drawButton.innerHTML = `🎁 Piocher une carte (${creditsCount})`;
            this.elements.drawCooldown.style.display = 'none';
        } else if (canClaimDaily) {
            this.elements.drawButton.innerHTML = `🎁 Récupérer crédit gratuit`;
            this.elements.drawCooldown.style.display = 'none';
        } else {
            this.elements.drawButton.innerHTML = `🎁 Piocher une carte`;
            const formattedTime = UTILS.formatTimeLeft(dailyTimeLeft);
            this.elements.drawCooldown.textContent = `Prochain crédit gratuit dans ${formattedTime}`;
            this.elements.drawCooldown.style.display = 'block';
        }
    }

    // Démarre la mise à jour du cooldown
    startCooldownUpdate() {
        this.updateInterval = setInterval(() => {
            this.updateDrawButton();
        }, 1000);
    }

    // Affiche un toast de notification
    showToast(message, type = 'info', duration = 3000) {
        const toast = this.elements.toast;
        toast.textContent = message;
        toast.className = `toast ${type}`;

        // Force un reflow pour que l'animation fonctionne
        toast.offsetHeight;

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    // Ajoute un crédit bonus (touche secrète X)
    addBonusCredit() {
        const currentCredits = DB.getCredits();
        if (currentCredits >= CONFIG.CREDITS.MAX_STORED) {
            this.showToast('Maximum de crédits atteint !', 'warning');
            return;
        }

        const newCredits = DB.addCredits(1);
        this.updateStats();
        this.showToast(`+1 crédit bonus ! (${newCredits}/${CONFIG.CREDITS.MAX_STORED})`, 'success');
    }

    // Nettoie les ressources
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Nettoie l'animation de pioche
        if (DRAW_ANIMATION) {
            DRAW_ANIMATION.destroy();
        }
    }
}

// Instance globale
const UI = new UIManager();