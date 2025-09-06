/**
 * Main.js - Application entry point and coordination
 * Initializes and coordinates all game modules
 */

class EmojiCrushApp {
    constructor() {
        this.game = null;
        this.ui = null;
        this.isInitialized = false;
        this.gameLoop = null;
        this.lastUpdateTime = 0;
        
        // Bind methods to preserve context
        this.update = this.update.bind(this);
        this.handleGameEvents = this.handleGameEvents.bind(this);
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize game logic
            this.game = new EmojiCrushGame();
            
            // Initialize UI
            this.ui = new GameUI(this.game);
            
            // Set up game event handlers
            this.setupGameEventHandlers();
            
            // Start the game
            this.game.startNewGame();
            
            // Initialize UI
            this.ui.initialize();
            
            // Start game loop
            this.startGameLoop();
            
            this.isInitialized = true;
            
            // Hide loading screen after a delay
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 2000);
            
        } catch (error) {
            console.error('Failed to initialize Emoji Crush:', error);
            this.showError('Failed to load game. Please refresh the page.');
        }
    }

    /**
     * Setup game event handlers
     */
    setupGameEventHandlers() {
        // Listen for game state changes
        this.originalHandleTileClick = this.game.handleTileClick.bind(this.game);
        this.game.handleTileClick = (row, col) => {
            const result = this.originalHandleTileClick(row, col);
            if (result) {
                this.handleGameEvents();
            }
            return result;
        };

        // Override game methods to trigger UI updates
        this.overrideGameMethods();
    }

    /**
     * Override game methods to add UI integration
     */
    overrideGameMethods() {
        // Override attemptSwap to add animations
        const originalAttemptSwap = this.game.attemptSwap.bind(this.game);
        this.game.attemptSwap = async (pos1, pos2) => {
            const result = await originalAttemptSwap(pos1, pos2);
            if (result) {
                this.ui.updateBoard();
                this.ui.updateUI();
            }
            return result;
        };

        // Override processCascadingMatches to add animations
        const originalProcessCascading = this.game.processCascadingMatches.bind(this.game);
        this.game.processCascadingMatches = async () => {
            const result = await originalProcessCascading();
            
            // Update UI after cascading
            this.ui.updateBoard();
            this.ui.updateUI();
            
            return result;
        };

        // Override completeLevel to show modal
        const originalCompleteLevel = this.game.completeLevel.bind(this.game);
        this.game.completeLevel = () => {
            const result = originalCompleteLevel();
            this.ui.showLevelComplete(result);
            return result;
        };

        // Override endGame to show modal
        const originalEndGame = this.game.endGame.bind(this.game);
        this.game.endGame = (reason) => {
            const result = originalEndGame(reason);
            this.ui.showGameOver(result);
            return result;
        };
    }

    /**
     * Handle game events and update UI
     */
    handleGameEvents() {
        if (!this.isInitialized) return;
        
        const gameState = this.game.getGameState();
        
        // Update UI based on game state
        this.ui.updateBoard();
        this.ui.updateUI();
        
        // Handle special game states
        switch (gameState.state) {
            case 'levelComplete':
                // Level complete is handled in overridden method
                break;
            case 'gameOver':
                // Game over is handled in overridden method
                break;
            case 'paused':
                this.pauseGameLoop();
                break;
            case 'playing':
                this.resumeGameLoop();
                break;
        }
    }

    /**
     * Start the game loop
     */
    startGameLoop() {
        this.lastUpdateTime = performance.now();
        this.gameLoop = requestAnimationFrame(this.update);
    }

    /**
     * Pause the game loop
     */
    pauseGameLoop() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
    }

    /**
     * Resume the game loop
     */
    resumeGameLoop() {
        if (!this.gameLoop) {
            this.lastUpdateTime = performance.now();
            this.gameLoop = requestAnimationFrame(this.update);
        }
    }

    /**
     * Main game loop update function
     */
    update(currentTime) {
        if (!this.isInitialized) return;
        
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;
        
        // Update game logic (if needed for animations, timers, etc.)
        this.updateGame(deltaTime);
        
        // Continue the loop
        if (this.game.gameState === 'playing') {
            this.gameLoop = requestAnimationFrame(this.update);
        }
    }

    /**
     * Update game logic
     */
    updateGame(deltaTime) {
        // Handle any time-based updates
        if (this.game.gameMode === 'timed' && this.game.timeLeft > 0) {
            // Time updates are handled in the game class
            // This could be used for smooth timer animations
        }
        
        // Update UI periodically
        if (deltaTime > 16) { // ~60 FPS
            this.ui.updateUI();
        }
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ef4444;
            color: white;
            padding: 20px;
            border-radius: 12px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Adjust UI for different screen sizes
        if (this.ui) {
            this.ui.updateBoard();
        }
    }

    /**
     * Handle visibility change (tab switching)
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Tab is hidden, pause game
            if (this.game && this.game.gameState === 'playing') {
                this.game.pauseGame();
                this.ui.pauseGame();
            }
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        
        if (this.game) {
            this.game.stopTimer();
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    /**
     * Get application info
     */
    getInfo() {
        return {
            version: '1.0.0',
            name: 'Emoji Crush',
            initialized: this.isInitialized,
            gameState: this.game ? this.game.gameState : 'not initialized'
        };
    }
}

// Global app instance
let emojiCrushApp = null;

/**
 * Initialize game when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting initialization...');
    
    // Simple test - just show welcome screen without complex initialization
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'flex';
        console.log('Welcome screen shown');
        
        // Add click event listener to start game button
        const startGameBtn = document.querySelector('.start-game-btn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', function() {
                console.log('Starting Fruit Crush game');
                
                // Hide welcome screen
                welcomeScreen.style.display = 'none';
                
                // Show game container
                const gameContainer = document.getElementById('gameContainer');
                if (gameContainer) {
                    gameContainer.style.display = 'block';
                    
                    // Initialize game after showing container
                    setTimeout(() => {
                        try {
                            console.log('Initializing game...');
                            const game = new EmojiCrushGame();
                            console.log('Game created:', game);
                            
                            const ui = new GameUI(game);
                            console.log('UI created:', ui);
                            
                            game.startNewGame('normal');
                            console.log('Game started, board:', game.board);
                            
                            // Initialize UI first
                            ui.initialize();
                            console.log('UI initialized');
                            
                            // Ensure board is rendered
                            const boardElement = document.getElementById('game-board');
                            console.log('Board element:', boardElement);
                            
                            if (boardElement && game.board && game.board.grid) {
                                ui.renderBoard();
                                ui.updateUI();
                                
                                // Store UI reference globally for game logic access
                                window.gameUI = ui;
                                
                                console.log('Fruit Crush game started successfully');
                                console.log('Board grid:', game.board.grid);
                            } else {
                                console.error('Board element or game board not found');
                                console.error('boardElement:', boardElement);
                                console.error('game.board:', game.board);
                                console.error('game.board.grid:', game.board?.grid);
                            }
                        } catch (error) {
                            console.error('Error starting game:', error);
                            console.error('Error stack:', error.stack);
                        }
                    }, 100);
                }
            });
        }
    } else {
        console.error('Welcome screen not found');
    }
});

/**
 * Handle page unload
 */
window.addEventListener('beforeunload', () => {
    if (emojiCrushApp) {
        emojiCrushApp.cleanup();
    }
});

/**
 * Service Worker registration for PWA support (optional)
 * Commented out to prevent 404 errors in development
 */
/*
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
*/

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmojiCrushApp;
}
