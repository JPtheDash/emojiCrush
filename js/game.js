/**
 * Game.js - Core game logic, scoring, levels, and game state management
 * Main game controller for Emoji Crush
 */

class EmojiCrushGame {
    constructor() {
        // Initialize basic properties first
        this.gameState = 'menu'; // menu, playing, paused, gameOver, levelComplete
        this.score = 0;
        this.level = 1;
        this.moves = 30;
        this.goal = 1000;
        this.selectedTile = null;
        this.isProcessing = false;
        this.powerUps = {
            hammer: 3,
            shuffle: 2,
            undo: 5
        };
        this.activePowerUp = null;
        this.moveHistory = [];
        this.gameMode = 'normal'; // normal, timed, endless
        this.timeLeft = 0;
        this.timerInterval = null;
        
        // Initialize methods that don't depend on other objects
        try {
            this.stats = this.initializeStats();
            this.levelConfig = this.initializeLevelConfig();
            this.highScore = this.loadHighScore();
            this.achievements = this.loadAchievements();
        } catch (e) {
            console.warn('Error initializing game data:', e);
            this.stats = { totalGamesPlayed: 0, totalScore: 0, totalMatches: 0, totalSpecialEmojis: 0, longestCombo: 0, fastestLevel: Infinity, levelsCompleted: 0 };
            this.levelConfig = [];
            this.highScore = 0;
            this.achievements = {};
        }
        
        // Initialize game objects last - but don't start game yet
        this.emojiMode = 'regular'; // Default mode
        this.board = null; // Will be initialized when game starts
        this.matchDetector = null;
    }

    /**
     * Initialize level configuration
     */
    initializeLevelConfig() {
        const configs = [];
        
        for (let i = 1; i <= 50; i++) {
            // Start very easy and gradually increase
            const baseGoal = i === 1 ? 500 : 300 + (i * 200); // Much easier start
            const baseMoves = i === 1 ? 50 : Math.max(15, 45 - Math.floor(i / 3)); // More moves for level 1
            
            configs.push({
                level: i,
                goal: baseGoal,
                moves: baseMoves,
                timeLimit: null,
                specialRequirements: this.getSpecialRequirements(i),
                difficulty: this.getDifficultyLevel(i),
                starThresholds: {
                    one: Math.floor(baseGoal * 0.6),
                    two: Math.floor(baseGoal * 0.8),
                    three: baseGoal
                }
            });
        }
        
        return configs;
    }

    /**
     * Get special requirements for level
     */
    getSpecialRequirements(level) {
        const requirements = {};
        
        if (level % 5 === 0) {
            // Every 5th level has special emoji requirements
            const emojis = ['🍎', '🍌', '🍇', '🍓', '🥑'];
            const targetEmoji = emojis[Math.floor(level / 5) % emojis.length];
            requirements.clearSpecific = {
                emoji: targetEmoji,
                count: 10 + Math.floor(level / 10) * 5
            };
        }
        
        if (level % 10 === 0) {
            // Every 10th level has time limit
            requirements.timeLimit = Math.max(60, 120 - Math.floor(level / 10) * 10);
        }
        
        return requirements;
    }

    /**
     * Get difficulty level
     */
    getDifficultyLevel(level) {
        if (level <= 10) return 'easy';
        if (level <= 25) return 'medium';
        if (level <= 40) return 'hard';
        return 'expert';
    }

    /**
     * Initialize game statistics
     */
    initializeStats() {
        return {
            totalGamesPlayed: 0,
            totalScore: 0,
            totalMatches: 0,
            totalSpecialEmojis: 0,
            longestCombo: 0,
            fastestLevel: Infinity,
            levelsCompleted: 0
        };
    }

    /**
     * Start new game
     */
    startNewGame(mode = 'normal', emojiMode = 'regular') {
        this.gameMode = mode;
        this.emojiMode = emojiMode;
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.selectedTile = null;
        this.isProcessing = false;
        this.activePowerUp = null;
        this.moveHistory = [];
        
        // Initialize board and match detector if not already done
        if (!this.board) {
            this.board = new GameBoard(8, emojiMode);
        } else {
            this.board.setEmojiMode(emojiMode);
        }
        
        if (!this.matchDetector) {
            this.matchDetector = new MatchDetector(this.board);
        }
        
        this.matchDetector.resetComboMultiplier();
        
        this.loadLevel(1);
        this.board.init();
        
        // Debug logging
        console.log('Board initialized:', this.board);
        console.log('Board grid:', this.board.grid);
        console.log('Board size:', this.board.size);
        
        if (mode === 'timed') {
            this.timeLeft = 60;
            this.startTimer();
        }
        
        this.stats.totalGamesPlayed++;
        this.saveStats();
    }

    /**
     * Highlight matched tiles for visual feedback before removal
     */
    async highlightMatchedTiles(positions) {
        // Update board to show current state first
        const ui = window.gameUI || document.gameUI;
        if (ui) {
            ui.updateBoard();
        }
        
        // Add highlight class to matched tiles
        positions.forEach(pos => {
            const tile = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
            if (tile) {
                tile.classList.add('matched');
            }
        });

        // Wait for 300ms to show the match (reduced from 500ms)
        await new Promise(resolve => setTimeout(resolve, 300));

        // Remove highlight class
        positions.forEach(pos => {
            const tile = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
            if (tile) {
                tile.classList.remove('matched');
            }
        });
    }

    /**
     * Load specific level
     */
    loadLevel(levelNumber) {
        this.level = levelNumber;
        const config = this.levelConfig[levelNumber - 1] || this.levelConfig[this.levelConfig.length - 1];
        
        this.goal = config.goal;
        this.moves = config.moves;
        this.timeLeft = config.specialRequirements.timeLimit || 0;
        
        console.log(`Loading Level ${levelNumber}:`, {
            goal: this.goal,
            moves: this.moves,
            timeLimit: this.timeLeft
        });
        
        if (this.timeLeft > 0) {
            this.startTimer();
        }
        
        // Reset board for new level
        this.board.init();
        this.matchDetector.resetComboMultiplier();
    }

    /**
     * Start timer for timed levels
     */
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.endGame('timeUp');
            }
        }, 1000);
    }

    /**
     * Stop timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Handle tile selection and swapping
     */
    handleTileClick(row, col) {
        console.log('handleTileClick called:', row, col, 'gameState:', this.gameState, 'isProcessing:', this.isProcessing);
        
        if (this.isProcessing || this.gameState !== 'playing') {
            console.log('Rejected - game not ready');
            return false;
        }

        // Handle power-up usage
        if (this.activePowerUp) {
            return this.usePowerUp(row, col);
        }

        const clickedTile = { row, col };

        if (!this.selectedTile) {
            // First tile selection
            console.log('Selecting first tile:', row, col);
            this.selectedTile = clickedTile;
            return true;
        }

        if (this.selectedTile.row === row && this.selectedTile.col === col) {
            // Deselect same tile
            console.log('Deselecting tile');
            this.selectedTile = null;
            return true;
        }

        // Attempt to swap
        if (this.board.areAdjacent(this.selectedTile, clickedTile)) {
            console.log('Attempting swap from', this.selectedTile, 'to', clickedTile);
            return this.attemptSwap(this.selectedTile, clickedTile);
        } else {
            // Select new tile
            console.log('Selecting new tile:', row, col);
            this.selectedTile = clickedTile;
            return true;
        }
    }

    /**
     * Attempt to swap two tiles
     */
    async attemptSwap(pos1, pos2) {
        console.log('attemptSwap called with:', pos1, pos2);
        console.log('Moves remaining:', this.moves);
        
        if (this.moves <= 0) {
            console.log('No moves left');
            return false;
        }

        // Perform the swap first to check for matches
        this.board.swapEmojis(pos1, pos2);
        
        // Check for matches after swap
        const matches = this.matchDetector.findMatches();
        const shapedMatches = this.matchDetector.findShapedMatches();
        const allMatches = [...matches, ...shapedMatches];
        
        console.log('Matches found after swap:', allMatches.length);
        
        if (allMatches.length === 0) {
            // Invalid swap - revert and animate rejection
            console.log('Invalid swap - no matches created, reverting');
            this.board.swapEmojis(pos1, pos2); // Swap back
            return false;
        }

        // Save state for undo
        this.saveMove(pos1, pos2);

        // Don't swap again - already swapped above
        console.log('Valid swap confirmed, processing matches...');
        this.moves--;
        this.selectedTile = null;
        this.isProcessing = true;

        // Process cascading matches immediately
        await this.processCascadingMatches();

        this.isProcessing = false;
        
        // Force UI update after processing
        const ui = window.gameUI || document.gameUI;
        if (ui) {
            ui.updateBoard();
            ui.updateUI();
        }
        
        // Check win/lose conditions
        this.checkGameEnd();
        
        console.log('Swap completed successfully');
        return true;
    }

    /**
     * Process cascading matches and animations
     */
    async processCascadingMatches() {
        console.log('=== STARTING MATCH PROCESSING ===');
        let cascadeCount = 0;
        let totalScore = 0;

        // Force UI update first
        const ui = window.gameUI || document.gameUI;
        if (ui) {
            ui.updateBoard();
            ui.updateUI();
        }

        while (true) {
            // Find matches
            const matches = this.matchDetector.findMatches();
            const shapedMatches = this.matchDetector.findShapedMatches();
            const allMatches = [...matches, ...shapedMatches];

            console.log(`Cascade ${cascadeCount + 1}: Found ${allMatches.length} matches`);

            if (allMatches.length === 0) {
                console.log('No more matches found, stopping cascade');
                break;
            }

            cascadeCount++;
            
            // Update combo multiplier
            this.matchDetector.updateComboMultiplier(true);

            // Create special emojis
            const specialEmojis = this.matchDetector.createSpecialEmojis(allMatches);
            
            // Calculate score
            const scoreData = this.matchDetector.calculateScore(allMatches, specialEmojis);
            totalScore += scoreData.totalScore;

            // Update statistics
            this.stats.totalMatches += allMatches.length;
            this.stats.totalSpecialEmojis += specialEmojis.length;
            this.stats.longestCombo = Math.max(this.stats.longestCombo, this.matchDetector.getComboMultiplier());

            // Remove matched emojis immediately
            const allPositions = this.matchDetector.getAllMatchPositions(allMatches);
            console.log('Removing positions:', allPositions);
            this.board.removeEmojis(allPositions);

            // Create special emojis before refilling
            for (const special of specialEmojis) {
                this.board.createSpecialEmoji(
                    special.position.row, 
                    special.position.col, 
                    special.type
                );
            }

            // Apply gravity and refill
            this.board.applyGravity();
            this.board.fillEmpty();

            // Force UI update immediately after each cascade
            if (ui) {
                ui.updateBoard();
                ui.updateUI();
            }

            console.log(`Cascade ${cascadeCount} complete, checking for more matches...`);
        }

        // Add score
        this.score += totalScore;
        
        // Reset combo if no more matches
        this.matchDetector.updateComboMultiplier(false);

        // Final UI update
        if (ui) {
            ui.updateBoard();
            ui.updateUI();
        }

        console.log(`=== MATCH PROCESSING COMPLETE: ${cascadeCount} cascades, ${totalScore} points ===`);
        return { cascadeCount, totalScore };
    }

    /**
     * Use power-up at specified position
     */
    usePowerUp(row, col) {
        if (!this.activePowerUp || this.powerUps[this.activePowerUp] <= 0) {
            return false;
        }

        switch (this.activePowerUp) {
            case 'hammer':
                // Remove single emoji
                this.board.setEmoji(row, col, null);
                this.board.applyGravity();
                this.board.fillEmpty();
                break;

            case 'shuffle':
                // Shuffle entire board
                this.board.shuffle();
                break;

            case 'undo':
                // Undo last move
                return this.undoLastMove();
        }

        this.powerUps[this.activePowerUp]--;
        this.activePowerUp = null;
        
        return true;
    }

    /**
     * Save move for undo functionality
     */
    saveMove(pos1, pos2) {
        const boardState = this.board.getState();
        this.moveHistory.push({
            boardState,
            pos1,
            pos2,
            score: this.score,
            moves: this.moves + 1, // +1 because we haven't decremented yet
            comboMultiplier: this.matchDetector.getComboMultiplier()
        });

        // Keep only last 5 moves
        if (this.moveHistory.length > 5) {
            this.moveHistory.shift();
        }
    }

    /**
     * Undo last move
     */
    undoLastMove() {
        if (this.moveHistory.length === 0) {
            return false;
        }

        const lastMove = this.moveHistory.pop();
        this.board.setState(lastMove.boardState);
        this.score = lastMove.score;
        this.moves = lastMove.moves;
        this.matchDetector.comboMultiplier = lastMove.comboMultiplier;
        
        return true;
    }

    /**
     * Check if game should end
     */
    checkGameEnd() {
        console.log('Checking game end - Score:', this.score, 'Goal:', this.goal, 'Level:', this.level);
        
        if (this.score >= this.goal) {
            console.log('Level complete! Score reached goal.');
            this.completeLevel();
        } else if (this.moves <= 0 && !this.hasValidMoves()) {
            this.endGame('noMoves');
        } else if (this.timeLeft <= 0 && this.gameMode === 'timed') {
            this.endGame('timeUp');
        }
    }

    /**
     * Check if there are valid moves available
     */
    hasValidMoves() {
        return this.board.getPossibleMoves().length > 0;
    }

    /**
     * Complete current level
     */
    completeLevel() {
        this.gameState = 'levelComplete';
        this.stopTimer();
        
        // Calculate bonus score
        const moveBonus = this.moves * 50;
        const timeBonus = this.timeLeft * 10;
        const totalBonus = moveBonus + timeBonus;
        
        this.score += totalBonus;
        
        // Calculate stars
        const config = this.levelConfig[this.level - 1];
        const stars = this.calculateStars(this.score, config.starThresholds);
        
        // Update statistics
        this.stats.levelsCompleted++;
        this.stats.totalScore += this.score;
        
        // Check for new high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        
        this.saveStats();
        
        return {
            level: this.level,
            score: this.score,
            bonus: totalBonus,
            stars: stars,
            isHighScore: this.score > this.highScore
        };
    }

    /**
     * Calculate stars earned for level
     */
    calculateStars(score, thresholds) {
        if (score >= thresholds.three) return 3;
        if (score >= thresholds.two) return 2;
        if (score >= thresholds.one) return 1;
        return 0;
    }

    /**
     * End game
     */
    endGame(reason) {
        this.gameState = 'gameOver';
        this.stopTimer();
        
        // Update statistics
        this.stats.totalScore += this.score;
        
        // Check for new high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        
        this.saveStats();
        
        return {
            reason: reason,
            finalScore: this.score,
            level: this.level,
            isHighScore: this.score > this.highScore
        };
    }

    /**
     * Pause game
     */
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.stopTimer();
        }
    }

    /**
     * Resume game
     */
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            if (this.timeLeft > 0) {
                this.startTimer();
            }
        }
    }

    /**
     * Restart current level
     */
    restartLevel() {
        this.loadLevel(this.level);
        this.gameState = 'playing';
        this.selectedTile = null;
        this.isProcessing = false;
        this.activePowerUp = null;
        this.moveHistory = [];
    }

    /**
     * Go to next level
     */
    nextLevel() {
        if (this.level < this.levelConfig.length) {
            this.loadLevel(this.level + 1);
            this.gameState = 'playing';
        }
    }

    /**
     * Set active power-up
     */
    setActivePowerUp(powerUpType) {
        if (this.powerUps[powerUpType] > 0) {
            this.activePowerUp = this.activePowerUp === powerUpType ? null : powerUpType;
            return true;
        }
        return false;
    }

    /**
     * Get game progress
     */
    getProgress() {
        return {
            score: this.score,
            goal: this.goal,
            level: this.level,
            moves: this.moves,
            timeLeft: this.timeLeft,
            percentage: Math.min((this.score / this.goal) * 100, 100),
            combo: this.matchDetector.getComboMultiplier(),
            powerUps: { ...this.powerUps },
            activePowerUp: this.activePowerUp
        };
    }

    /**
     * Get hint for next move
     */
    getHint() {
        return this.matchDetector.getMatchHint();
    }

    /**
     * Save high score to localStorage
     */
    saveHighScore() {
        try {
            localStorage.setItem('emojiCrush_highScore', this.highScore.toString());
        } catch (e) {
            console.warn('Could not save high score:', e);
        }
    }

    /**
     * Load high score from localStorage
     */
    loadHighScore() {
        try {
            const saved = localStorage.getItem('emojiCrush_highScore');
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            console.warn('Could not load high score:', e);
            return 0;
        }
    }

    /**
     * Save game statistics
     */
    saveStats() {
        try {
            localStorage.setItem('emojiCrush_stats', JSON.stringify(this.stats));
        } catch (e) {
            console.warn('Could not save stats:', e);
        }
    }

    /**
     * Load game statistics
     */
    loadStats() {
        try {
            const saved = localStorage.getItem('emojiCrush_stats');
            return saved ? JSON.parse(saved) : this.initializeStats();
        } catch (e) {
            console.warn('Could not load stats:', e);
            return this.initializeStats();
        }
    }

    /**
     * Load achievements
     */
    loadAchievements() {
        try {
            const saved = localStorage.getItem('emojiCrush_achievements');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn('Could not load achievements:', e);
            return {};
        }
    }

    /**
     * Save achievements
     */
    saveAchievements() {
        try {
            localStorage.setItem('emojiCrush_achievements', JSON.stringify(this.achievements));
        } catch (e) {
            console.warn('Could not save achievements:', e);
        }
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current game state
     */
    getGameState() {
        return {
            state: this.gameState,
            board: this.board.getState(),
            progress: this.getProgress(),
            selectedTile: this.selectedTile,
            isProcessing: this.isProcessing
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmojiCrushGame;
}
