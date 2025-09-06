/**
 * UI.js - Handles user interface, animations, and visual effects
 * Manages all visual aspects and user interactions for Emoji Crush
 */

class GameUI {
    constructor(game) {
        this.game = game;
        this.boardElement = document.getElementById('game-board');
        this.elements = this.initializeElements();
        this.animations = new Map();
        this.sounds = this.initializeSounds();
        this.theme = localStorage.getItem('emojiCrush_theme') || 'light';
        this.soundEnabled = localStorage.getItem('emojiCrush_sound') !== 'false';
        this.musicEnabled = localStorage.getItem('emojiCrush_music') !== 'false';
        this.touchStartPos = null;
        this.touchEndPos = null;
        
        this.initializeEventListeners();
        this.setupAudio();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        return {
            // Stats
            levelDisplay: document.getElementById('level-display'),
            scoreDisplay: document.getElementById('score-display'),
            movesDisplay: document.getElementById('moves-display'),
            goalDisplay: document.getElementById('goal-display'),
            progressFill: document.getElementById('progress-fill'),
            
            // Combo
            comboDisplay: document.getElementById('combo-display'),
            comboMultiplier: document.getElementById('combo-multiplier'),
            
            // Power-ups
            hammerPowerup: document.getElementById('hammer-powerup'),
            shufflePowerup: document.getElementById('shuffle-powerup'),
            undoPowerup: document.getElementById('undo-powerup'),
            hammerCount: document.getElementById('hammer-count'),
            shuffleCount: document.getElementById('shuffle-count'),
            undoCount: document.getElementById('undo-count'),
            
            // Modals
            gameOverModal: document.getElementById('game-over-modal'),
            levelCompleteModal: document.getElementById('level-complete-modal'),
            pauseModal: document.getElementById('pause-modal'),
            instructionsModal: document.getElementById('instructions-modal'),
            loadingScreen: document.getElementById('loading-screen'),
            
            // Modal content
            finalScore: document.getElementById('final-score'),
            finalLevel: document.getElementById('final-level'),
            highScoreMessage: document.getElementById('high-score-message'),
            levelScore: document.getElementById('level-score'),
            levelBonus: document.getElementById('level-bonus'),
            starsDisplay: document.getElementById('stars-display'),
            
            // Controls
            themeToggle: document.getElementById('themeToggle'),
            musicToggle: document.getElementById('music-toggle'),
            soundToggle: document.getElementById('sound-toggle'),
            
            // Buttons
            restartGame: document.getElementById('restart-game'),
            mainMenu: document.getElementById('main-menu'),
            nextLevel: document.getElementById('next-level'),
            replayLevel: document.getElementById('replay-level'),
            resumeGame: document.getElementById('resume-game'),
            restartLevel: document.getElementById('restart-level'),
            quitGame: document.getElementById('quit-game'),
            closeInstructions: document.getElementById('close-instructions')
        };
    }

    /**
     * Initialize sound effects
     */
    initializeSounds() {
        const sounds = {};
        try {
            sounds.backgroundMusic = document.getElementById('background-music');
            sounds.matchSound = document.getElementById('match-sound');
            sounds.comboSound = document.getElementById('combo-sound');
            sounds.specialSound = document.getElementById('special-sound');
            sounds.victorySound = document.getElementById('victory-sound');
        } catch (e) {
            console.warn('Audio elements not found, audio will be disabled');
        }
        return sounds;
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Theme toggle
        this.elements.themeToggle?.addEventListener('click', () => this.toggleTheme());
        
        // Audio controls
        this.elements.musicToggle?.addEventListener('click', () => this.toggleMusic());
        this.elements.soundToggle?.addEventListener('click', () => this.toggleSound());
        
        // Game controls
        this.elements.pauseBtn?.addEventListener('click', () => this.pauseGame());
        this.elements.helpBtn?.addEventListener('click', () => this.showInstructions());
        
        // Power-ups
        this.elements.hammerPowerup?.addEventListener('click', () => this.selectPowerUp('hammer'));
        this.elements.shufflePowerup?.addEventListener('click', () => this.selectPowerUp('shuffle'));
        this.elements.undoPowerup?.addEventListener('click', () => this.selectPowerUp('undo'));
        
        // Modal buttons
        this.elements.restartGame?.addEventListener('click', () => this.restartGame());
        this.elements.mainMenu?.addEventListener('click', () => this.showMainMenu());
        this.elements.nextLevel?.addEventListener('click', () => this.nextLevel());
        this.elements.replayLevel?.addEventListener('click', () => this.replayLevel());
        this.elements.resumeGame?.addEventListener('click', () => this.resumeGame());
        this.elements.restartLevel?.addEventListener('click', () => this.restartLevel());
        this.elements.quitGame?.addEventListener('click', () => this.quitGame());
        this.elements.closeInstructions?.addEventListener('click', () => this.hideInstructions());
        
        // Board interactions
        this.setupBoardInteractions();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Window events
        window.addEventListener('beforeunload', () => this.saveSettings());
        window.addEventListener('blur', () => this.pauseGame());
    }

    /**
     * Setup board click and touch interactions
     */
    setupBoardInteractions() {
        // Mouse events
        this.boardElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        
        // Touch events for mobile
        this.boardElement.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.boardElement.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.boardElement.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        // Prevent context menu on long press
        this.boardElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Handle mouse events for desktop
     */
    handleMouseDown(e) {
        console.log('Mouse down detected on:', e.target);
        const tile = e.target.closest('.emoji-tile');
        if (!tile) return;

        console.log('Found emoji tile:', tile);
        const row = parseInt(tile.dataset.row);
        const col = parseInt(tile.dataset.col);
        
        // Start drag for mouse
        this.mouseStartPos = {
            x: e.clientX,
            y: e.clientY,
            tile: tile
        };
        
        console.log('Set mouseStartPos:', this.mouseStartPos);
        
        this.game.selectedTile = { row, col };
        this.startDragFeedback(tile, e.clientX, e.clientY);
        this.updateBoard();
        
        // Add mouse move and up listeners
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        e.preventDefault();
    }

    handleMouseMove(e) {
        if (!this.mouseStartPos) return;
        
        console.log('Mouse move detected:', e.clientX, e.clientY);
        this.updateDragGhost(e.clientX, e.clientY);
        this.updateDropTarget(e.clientX, e.clientY);
    }

    handleMouseUp(e) {
        if (!this.mouseStartPos) return;
        
        console.log('Mouse up detected');
        const deltaX = e.clientX - this.mouseStartPos.x;
        const deltaY = e.clientY - this.mouseStartPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        console.log('Mouse drag distance:', distance, 'delta:', deltaX, deltaY);
        
        this.endDragFeedback();
        
        if (distance < 10) {
            // Click
            console.log('Detected click');
            const tile = e.target.closest('.emoji-tile');
            if (tile) {
                const row = parseInt(tile.dataset.row);
                const col = parseInt(tile.dataset.col);
                this.game.handleTileClick(row, col);
            }
        } else if (distance > 20) {
            // Drag
            console.log('Detected drag, performing visual swap');
            this.performVisualSwap(deltaX, deltaY);
        }
        
        this.mouseStartPos = null;
        document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
        
        this.updateBoard();
        this.updateUI();
    }

    /**
     * Handle board click events
     */
    handleBoardClick(e) {
        const tile = e.target.closest('.emoji-tile');
        if (!tile) return;
        
        const row = parseInt(tile.dataset.row);
        const col = parseInt(tile.dataset.col);
        
        if (this.game.handleTileClick(row, col)) {
            this.updateBoard();
            this.updateUI();
            this.playSound('matchSound');
        }
    }

    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        e.preventDefault();
        console.log('Touch start detected');
        
        const touch = e.touches[0];
        const startTile = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.emoji-tile');
        
        console.log('Touch start tile:', startTile);
        
        this.touchStartPos = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
            tile: startTile
        };

        if (startTile) {
            const row = parseInt(startTile.dataset.row);
            const col = parseInt(startTile.dataset.col);
            console.log('Auto-selecting tile:', row, col);
            
            // Auto-select the touched tile
            this.game.selectedTile = { row, col };
            
            // Start drag visual feedback
            this.startDragFeedback(startTile, touch.clientX, touch.clientY);
            this.updateBoard();
        }
    }

    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        e.preventDefault();
        
        if (!this.touchStartPos) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStartPos.x;
        const deltaY = touch.clientY - this.touchStartPos.y;
        
        console.log('Touch move delta:', deltaX, deltaY);
        
        // Update drag ghost position
        this.updateDragGhost(touch.clientX, touch.clientY);
        
        // Update drop target highlighting
        this.updateDropTarget(touch.clientX, touch.clientY);
    }

    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        e.preventDefault();
        
        if (!this.touchStartPos) return;
        
        const touch = e.changedTouches[0];
        this.touchEndPos = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };

        // End drag feedback
        this.endDragFeedback();

        const deltaX = this.touchEndPos.x - this.touchStartPos.x;
        const deltaY = this.touchEndPos.y - this.touchStartPos.y;
        const deltaTime = this.touchEndPos.time - this.touchStartPos.time;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < 20 && deltaTime < 300) {
            // Tap
            const tile = document.elementFromPoint(this.touchEndPos.x, this.touchEndPos.y)?.closest('.emoji-tile');
            if (tile) {
                const row = parseInt(tile.dataset.row);
                const col = parseInt(tile.dataset.col);
                this.game.handleTileClick(row, col);
            }
        } else if (distance > 30) {
            // Swipe/Drop
            this.performVisualSwap(deltaX, deltaY);
        }

        // Reset touch tracking
        this.touchStartPos = null;
        this.touchEndPos = null;
        this.updateBoard();
        this.updateUI();
    }

    /**
     * Start drag visual feedback
     */
    startDragFeedback(tile, clientX, clientY) {
        console.log('Starting drag feedback for tile:', tile, 'at position:', clientX, clientY);
        if (!tile) return;
        
        // Add dragging class to source tile
        tile.classList.add('drag-source');
        console.log('Added drag-source class to tile');
        
        // Create floating ghost element
        const ghost = document.createElement('div');
        ghost.className = 'drag-ghost';
        ghost.textContent = tile.textContent;
        ghost.style.left = clientX + 'px';
        ghost.style.top = clientY + 'px';
        
        document.body.appendChild(ghost);
        this.dragGhost = ghost;
        console.log('Created drag ghost:', ghost);
    }

    /**
     * Update drag ghost position
     */
    updateDragGhost(clientX, clientY) {
        if (this.dragGhost) {
            this.dragGhost.style.left = clientX + 'px';
            this.dragGhost.style.top = clientY + 'px';
        }
    }

    /**
     * Update drop target highlighting
     */
    updateDropTarget(clientX, clientY) {
        // Clear previous drop target
        document.querySelectorAll('.drop-target').forEach(tile => {
            tile.classList.remove('drop-target');
        });
        
        // Find current drop target
        const targetTile = document.elementFromPoint(clientX, clientY)?.closest('.emoji-tile');
        const startTile = this.touchStartPos?.tile || this.mouseStartPos?.tile;
        
        if (targetTile && startTile && targetTile !== startTile) {
            const startRow = parseInt(startTile.dataset.row);
            const startCol = parseInt(startTile.dataset.col);
            const targetRow = parseInt(targetTile.dataset.row);
            const targetCol = parseInt(targetTile.dataset.col);
            
            // Only highlight if adjacent
            if (this.game.board.areAdjacent({row: startRow, col: startCol}, {row: targetRow, col: targetCol})) {
                targetTile.classList.add('drop-target');
            }
        }
    }

    /**
     * End drag feedback
     */
    endDragFeedback() {
        // Remove drag ghost
        if (this.dragGhost) {
            this.dragGhost.remove();
            this.dragGhost = null;
        }
        
        // Clear all drag classes
        document.querySelectorAll('.drag-source, .drop-target').forEach(tile => {
            tile.classList.remove('drag-source', 'drop-target');
        });
    }

    /**
     * Perform visual swap with animation
     */
    performVisualSwap(deltaX, deltaY) {
        const startTile = this.touchStartPos?.tile || this.mouseStartPos?.tile;
        if (!startTile) return;
        
        const row = parseInt(startTile.dataset.row);
        const col = parseInt(startTile.dataset.col);
        
        let targetRow = row;
        let targetCol = col;
        
        // Determine target based on swipe direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            targetCol = deltaX > 0 ? col + 1 : col - 1;
        } else {
            targetRow = deltaY > 0 ? row + 1 : row - 1;
        }
        
        // Check bounds
        if (targetRow >= 0 && targetRow < this.game.board.size &&
            targetCol >= 0 && targetCol < this.game.board.size) {
            
            const targetTile = document.querySelector(`[data-row="${targetRow}"][data-col="${targetCol}"]`);
            if (targetTile) {
                // Check if this would be a valid swap first
                this.game.selectedTile = { row, col };
                const pos1 = { row, col };
                const pos2 = { row: targetRow, col: targetCol };
                
                // Always attempt the swap - let game logic handle validation
                this.animateVisualSwap(startTile, targetTile, () => {
                    this.game.handleTileClick(targetRow, targetCol);
                });
            }
        }
    }

    /**
     * Animate visual swap between two tiles
     */
    animateVisualSwap(tile1, tile2, callback) {
        const rect1 = tile1.getBoundingClientRect();
        const rect2 = tile2.getBoundingClientRect();
        
        const deltaX = rect2.left - rect1.left;
        const deltaY = rect2.top - rect1.top;
        
        // Don't swap visual content - let the game logic handle it
        // Just animate the tiles moving
        tile1.style.transition = 'transform 0.3s ease-out';
        tile2.style.transition = 'transform 0.3s ease-out';
        tile1.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        tile2.style.transform = `translate(${-deltaX}px, ${-deltaY}px)`;
        
        // Execute game logic immediately, then reset animation
        if (callback) callback();
        
        setTimeout(() => {
            tile1.style.transform = '';
            tile2.style.transform = '';
            tile1.style.transition = '';
            tile2.style.transition = '';
        }, 300);
    }

    /**
     * Animate bounce back for invalid swaps
     */
    animateBounceBack(tile1, tile2) {
        const rect1 = tile1.getBoundingClientRect();
        const rect2 = tile2.getBoundingClientRect();
        
        const deltaX = rect2.left - rect1.left;
        const deltaY = rect2.top - rect1.top;
        
        // Animate forward
        tile1.style.transition = 'transform 0.15s ease-out';
        tile2.style.transition = 'transform 0.15s ease-out';
        tile1.style.transform = `translate(${deltaX * 0.3}px, ${deltaY * 0.3}px)`;
        tile2.style.transform = `translate(${-deltaX * 0.3}px, ${-deltaY * 0.3}px)`;
        
        // Bounce back
        setTimeout(() => {
            tile1.style.transition = 'transform 0.2s ease-in';
            tile2.style.transition = 'transform 0.2s ease-in';
            tile1.style.transform = '';
            tile2.style.transform = '';
            
            setTimeout(() => {
                tile1.style.transition = '';
                tile2.style.transition = '';
            }, 200);
        }, 150);
    }

    /**
     * Show visual preview of swipe direction
     */
    showSwipePreview(deltaX, deltaY) {
        if (!this.touchStartPos.tile) return;
        
        const startTile = this.touchStartPos.tile;
        const startRow = parseInt(startTile.dataset.row);
        const startCol = parseInt(startTile.dataset.col);
        
        // Determine swipe direction
        let targetRow = startRow;
        let targetCol = startCol;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            targetCol = deltaX > 0 ? startCol + 1 : startCol - 1;
        } else {
            // Vertical swipe
            targetRow = deltaY > 0 ? startRow + 1 : startRow - 1;
        }
        
        // Clear previous preview
        this.clearSwipePreview();
        
        // Validate target position
        if (targetRow >= 0 && targetRow < this.game.board.size && 
            targetCol >= 0 && targetCol < this.game.board.size) {
            
            const targetTile = this.getTileElement(targetRow, targetCol);
            
            if (targetTile) {
                // Add visual feedback
                startTile.classList.add('swipe-source');
                targetTile.classList.add('swipe-target');
                
                // Add directional transform to show movement
                const moveDistance = 10; // pixels
                let transformX = 0, transformY = 0;
                
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    transformX = deltaX > 0 ? moveDistance : -moveDistance;
                } else {
                    transformY = deltaY > 0 ? moveDistance : -moveDistance;
                }
                
                startTile.style.transform = `translate(${transformX}px, ${transformY}px)`;
                targetTile.style.transform = `translate(${-transformX}px, ${-transformY}px)`;
            }
        }
    }

    /**
     * Clear swipe preview visual effects
     */
    clearSwipePreview() {
        const tiles = this.boardElement.querySelectorAll('.emoji-tile');
        tiles.forEach(tile => {
            tile.classList.remove('swipe-source', 'swipe-target');
            tile.style.transform = '';
        });
    }

    /**
     * Perform direct swipe without requiring pre-selected tile
     */
    performDirectSwipe(deltaX, deltaY) {
        if (!this.touchStartPos.tile) return;
        
        const startTile = this.touchStartPos.tile;
        const row = parseInt(startTile.dataset.row);
        const col = parseInt(startTile.dataset.col);
        
        let targetRow = row;
        let targetCol = col;
        
        // Determine swipe direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            targetCol = deltaX > 0 ? col + 1 : col - 1;
        } else {
            // Vertical swipe
            targetRow = deltaY > 0 ? row + 1 : row - 1;
        }
        
        console.log('Swipe from', row, col, 'to', targetRow, targetCol);
        
        // Validate target position
        if (targetRow >= 0 && targetRow < this.game.board.size && 
            targetCol >= 0 && targetCol < this.game.board.size) {
            
            // First select the start tile
            this.game.selectedTile = { row, col };
            this.updateBoard();
            
            // Then attempt the swap
            const success = this.game.handleTileClick(targetRow, targetCol);
            console.log('Swap success:', success);
            
            if (success) {
                this.animateSwap(row, col, targetRow, targetCol);
            } else {
                this.animateRejectedSwap(row, col, targetRow, targetCol);
            }
        }
    }

    /**
     * Handle swipe gestures (legacy method)
     */
    handleSwipe(deltaX, deltaY) {
        if (!this.game.selectedTile) return;
        
        const { row, col } = this.game.selectedTile;
        let targetRow = row;
        let targetCol = col;
        
        // Determine swipe direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            targetCol = deltaX > 0 ? col + 1 : col - 1;
        } else {
            // Vertical swipe
            targetRow = deltaY > 0 ? row + 1 : row - 1;
        }
        
        // Validate target position and attempt swap
        if (targetRow >= 0 && targetRow < this.game.board.size && 
            targetCol >= 0 && targetCol < this.game.board.size) {
            
            // Animate the swap
            this.animateSwap(row, col, targetRow, targetCol);
            
            // Perform the actual swap
            const success = this.game.handleTileClick(targetRow, targetCol);
            
            if (!success) {
                // If swap failed, animate rejection
                this.animateRejectedSwap(row, col, targetRow, targetCol);
            }
        }
    }

    /**
     * Animate successful swap
     */
    animateSwap(row1, col1, row2, col2) {
        const tile1 = this.getTileElement(row1, col1);
        const tile2 = this.getTileElement(row2, col2);
        
        if (tile1 && tile2) {
            tile1.classList.add('swapping');
            tile2.classList.add('swapping');
            
            setTimeout(() => {
                tile1.classList.remove('swapping');
                tile2.classList.remove('swapping');
            }, 300);
        }
    }

    /**
     * Animate rejected swap
     */
    animateRejectedSwap(row1, col1, row2, col2) {
        const tile1 = this.getTileElement(row1, col1);
        const tile2 = this.getTileElement(row2, col2);
        
        if (tile1 && tile2) {
            tile1.classList.add('rejected-swap');
            tile2.classList.add('rejected-swap');
            
            setTimeout(() => {
                tile1.classList.remove('rejected-swap');
                tile2.classList.remove('rejected-swap');
            }, 400);
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(e) {
        switch (e.key) {
            case 'Escape':
                this.pauseGame();
                break;
            case 'r':
            case 'R':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.restartLevel();
                }
                break;
            case 'h':
            case 'H':
                this.showHint();
                break;
            case '1':
                this.selectPowerUp('hammer');
                break;
            case '2':
                this.selectPowerUp('shuffle');
                break;
            case '3':
                this.selectPowerUp('undo');
                break;
        }
    }

    /**
     * Render the game board
     */
    renderBoard() {
        console.log('renderBoard called');
        console.log('boardElement:', this.boardElement);
        console.log('game.board:', this.game.board);
        console.log('game.board.size:', this.game.board?.size);
        console.log('game.board.grid:', this.game.board?.grid);
        
        if (!this.boardElement) {
            console.error('Board element not found');
            return;
        }
        
        if (!this.game.board || !this.game.board.grid) {
            console.error('Game board or grid not initialized');
            return;
        }
        
        this.boardElement.innerHTML = '';
        
        for (let row = 0; row < this.game.board.size; row++) {
            for (let col = 0; col < this.game.board.size; col++) {
                const tile = this.createTile(row, col);
                this.boardElement.appendChild(tile);
            }
        }
        
        console.log('Board rendered with', this.game.board.size * this.game.board.size, 'tiles');
    }

    /**
     * Create a single tile element
     */
    createTile(row, col) {
        const tile = document.createElement('div');
        tile.className = 'emoji-tile';
        tile.dataset.row = row;
        tile.dataset.col = col;
        
        const emoji = this.game.board.getEmoji(row, col);
        tile.textContent = emoji || '';
        
        // Add special emoji classes
        if (this.game.board.isSpecialEmoji(emoji)) {
            const specialType = this.game.board.getSpecialType(emoji);
            tile.classList.add(`special-${specialType}`);
        }
        
        // Add selected class
        if (this.game.selectedTile && 
            this.game.selectedTile.row === row && 
            this.game.selectedTile.col === col) {
            tile.classList.add('selected');
        }
        
        return tile;
    }

    /**
     * Update the board display
     */
    updateBoard() {
        const tiles = this.boardElement.querySelectorAll('.emoji-tile');
        
        tiles.forEach(tile => {
            const row = parseInt(tile.dataset.row);
            const col = parseInt(tile.dataset.col);
            const emoji = this.game.board.getEmoji(row, col);
            
            tile.textContent = emoji || '';
            
            // Update classes
            tile.className = 'emoji-tile';
            
            if (this.game.board.isSpecialEmoji(emoji)) {
                const specialType = this.game.board.getSpecialType(emoji);
                tile.classList.add(`special-${specialType}`);
            }
            
            if (this.game.selectedTile && 
                this.game.selectedTile.row === row && 
                this.game.selectedTile.col === col) {
                tile.classList.add('selected');
            }
        });
    }

    /**
     * Update UI elements
     */
    updateUI() {
        const progress = this.game.getProgress();
        
        // Update stats
        if (this.elements.levelDisplay) this.elements.levelDisplay.textContent = progress.level;
        if (this.elements.scoreDisplay) this.elements.scoreDisplay.textContent = progress.score.toLocaleString();
        if (this.elements.movesDisplay) this.elements.movesDisplay.textContent = progress.moves;
        if (this.elements.goalDisplay) this.elements.goalDisplay.textContent = progress.goal.toLocaleString();
        
        // Update progress bar
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${progress.percentage}%`;
        }
        
        // Update power-up counts
        if (this.elements.hammerCount) this.elements.hammerCount.textContent = progress.powerUps.hammer;
        if (this.elements.shuffleCount) this.elements.shuffleCount.textContent = progress.powerUps.shuffle;
        if (this.elements.undoCount) this.elements.undoCount.textContent = progress.powerUps.undo;
        
        // Update active power-up
        this.updateActivePowerUp(progress.activePowerUp);
        
        // Show combo if active
        if (progress.combo > 1) {
            this.showCombo(progress.combo);
        }
    }

    /**
     * Update active power-up display
     */
    updateActivePowerUp(activePowerUp) {
        // Remove active class from all power-ups
        [this.elements.hammerPowerup, this.elements.shufflePowerup, this.elements.undoPowerup]
            .forEach(element => element?.classList.remove('active'));
        
        // Add active class to selected power-up
        if (activePowerUp) {
            const element = this.elements[`${activePowerUp}Powerup`];
            element?.classList.add('active');
        }
    }

    /**
     * Show combo display
     */
    showCombo(multiplier) {
        if (this.elements.comboDisplay && this.elements.comboMultiplier) {
            this.elements.comboMultiplier.textContent = `x${multiplier}`;
            this.elements.comboDisplay.classList.remove('hidden');
            
            // Hide after animation
            setTimeout(() => {
                this.elements.comboDisplay.classList.add('hidden');
            }, 2000);
            
            this.playSound('comboSound');
        }
    }

    /**
     * Animate tile matches
     */
    animateMatches(positions) {
        positions.forEach(pos => {
            const tile = this.getTileElement(pos.row, pos.col);
            if (tile) {
                tile.classList.add('matching');
                setTimeout(() => {
                    tile.classList.remove('matching');
                }, 600);
            }
        });
    }

    /**
     * Animate falling tiles
     */
    animateFalling(movements) {
        movements.forEach(movement => {
            const tile = this.getTileElement(movement.to.row, movement.to.col);
            if (tile) {
                tile.classList.add('falling');
                setTimeout(() => {
                    tile.classList.remove('falling');
                }, 500);
            }
        });
    }

    /**
     * Animate special emoji effects
     */
    animateSpecialEffect(row, col, type) {
        const tile = this.getTileElement(row, col);
        if (!tile) return;
        
        switch (type) {
            case 'bomb':
                this.createExplosionEffect(row, col);
                break;
            case 'striped':
                this.createStripedEffect(row, col);
                break;
            case 'rainbow':
                this.createRainbowEffect(row, col);
                break;
        }
        
        this.playSound('specialSound');
    }

    /**
     * Create explosion effect
     */
    createExplosionEffect(row, col) {
        const tile = this.getTileElement(row, col);
        if (!tile) return;
        
        const explosion = document.createElement('div');
        explosion.className = 'explosion-effect';
        explosion.style.position = 'absolute';
        explosion.style.top = '50%';
        explosion.style.left = '50%';
        explosion.style.transform = 'translate(-50%, -50%)';
        explosion.style.fontSize = '48px';
        explosion.textContent = '💥';
        
        tile.style.position = 'relative';
        tile.appendChild(explosion);
        
        setTimeout(() => {
            explosion.remove();
        }, 1000);
    }

    /**
     * Create striped effect
     */
    createStripedEffect(row, col) {
        // Add visual effect for striped emoji activation
        const tiles = this.boardElement.querySelectorAll('.emoji-tile');
        tiles.forEach(tile => {
            const tileRow = parseInt(tile.dataset.row);
            const tileCol = parseInt(tile.dataset.col);
            
            if (tileRow === row || tileCol === col) {
                tile.style.background = 'linear-gradient(45deg, #f59e0b, #fbbf24)';
                setTimeout(() => {
                    tile.style.background = '';
                }, 500);
            }
        });
    }

    /**
     * Create rainbow effect
     */
    createRainbowEffect(row, col) {
        const tiles = this.boardElement.querySelectorAll('.emoji-tile');
        tiles.forEach((tile, index) => {
            setTimeout(() => {
                tile.style.background = 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)';
                tile.style.backgroundSize = '400% 400%';
                tile.style.animation = 'rainbow 0.5s ease';
                
                setTimeout(() => {
                    tile.style.background = '';
                    tile.style.animation = '';
                }, 500);
            }, index * 50);
        });
    }

    /**
     * Get tile element by position
     */
    getTileElement(row, col) {
        return this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    /**
     * Select power-up
     */
    selectPowerUp(type) {
        if (this.game.setActivePowerUp(type)) {
            this.updateUI();
            this.playSound('matchSound');
        }
    }

    /**
     * Show game over modal
     */
    showGameOver(result) {
        if (this.elements.finalScore) this.elements.finalScore.textContent = result.finalScore.toLocaleString();
        if (this.elements.finalLevel) this.elements.finalLevel.textContent = result.level;
        
        if (result.isHighScore && this.elements.highScoreMessage) {
            this.elements.highScoreMessage.classList.remove('hidden');
        }
        
        this.elements.gameOverModal?.classList.remove('hidden');
        this.playSound('victorySound');
    }

    /**
     * Show level complete modal
     */
    showLevelComplete(result) {
        if (this.elements.levelScore) this.elements.levelScore.textContent = result.score.toLocaleString();
        if (this.elements.levelBonus) this.elements.levelBonus.textContent = result.bonus.toLocaleString();
        
        // Update stars display
        if (this.elements.starsDisplay) {
            const stars = this.elements.starsDisplay.querySelectorAll('.star');
            stars.forEach((star, index) => {
                if (index < result.stars) {
                    star.classList.add('active');
                } else {
                    star.classList.remove('active');
                }
            });
        }
        
        this.elements.levelCompleteModal?.classList.remove('hidden');
        this.playSound('victorySound');
    }

    /**
     * Show instructions modal
     */
    showInstructions() {
        this.elements.instructionsModal?.classList.remove('hidden');
    }

    /**
     * Hide instructions modal
     */
    hideInstructions() {
        this.elements.instructionsModal?.classList.add('hidden');
    }

    /**
     * Show hint
     */
    showHint() {
        const hint = this.game.getHint();
        if (hint) {
            const { pos1, pos2 } = hint.move;
            const tile1 = this.getTileElement(pos1.row, pos1.col);
            const tile2 = this.getTileElement(pos2.row, pos2.col);
            
            [tile1, tile2].forEach(tile => {
                if (tile) {
                    tile.style.boxShadow = '0 0 20px #fbbf24';
                    setTimeout(() => {
                        tile.style.boxShadow = '';
                    }, 2000);
                }
            });
        }
    }

    /**
     * Game control methods
     */
    pauseGame() {
        this.game.pauseGame();
        this.elements.pauseModal?.classList.remove('hidden');
    }

    resumeGame() {
        this.game.resumeGame();
        this.elements.pauseModal?.classList.add('hidden');
    }

    restartGame() {
        this.hideAllModals();
        this.game.startNewGame();
        this.renderBoard();
        this.updateUI();
    }

    restartLevel() {
        this.hideAllModals();
        this.game.restartLevel();
        this.renderBoard();
        this.updateUI();
    }

    nextLevel() {
        this.hideAllModals();
        this.game.nextLevel();
        this.renderBoard();
        this.updateUI();
    }

    replayLevel() {
        this.hideAllModals();
        this.game.restartLevel();
        this.renderBoard();
        this.updateUI();
    }

    quitGame() {
        this.hideAllModals();
        this.showMainMenu();
    }

    showMainMenu() {
        // Implementation for main menu
        console.log('Show main menu');
    }

    /**
     * Hide all modals
     */
    hideAllModals() {
        [
            this.elements.gameOverModal,
            this.elements.levelCompleteModal,
            this.elements.pauseModal,
            this.elements.instructionsModal
        ].forEach(modal => {
            if (modal) modal.classList.add('hidden');
        });
    }

    /**
     * Audio management
     */
    setupAudio() {
        if (this.sounds.backgroundMusic) {
            this.sounds.backgroundMusic.volume = 0.3;
            if (this.musicEnabled) {
                this.sounds.backgroundMusic.play().catch(() => {
                    // Auto-play prevented
                });
            }
        }
        
        // Set volume for sound effects
        Object.values(this.sounds).forEach(sound => {
            if (sound !== this.sounds.backgroundMusic) {
                sound.volume = 0.5;
            }
        });
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        
        if (this.musicEnabled) {
            this.sounds.backgroundMusic?.play();
        } else {
            this.sounds.backgroundMusic?.pause();
        }
        
        if (this.elements.musicToggle) {
            this.elements.musicToggle.textContent = this.musicEnabled ? '🎵' : '🔇';
        }
        
        this.saveSettings();
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        
        if (this.elements.soundToggle) {
            this.elements.soundToggle.textContent = this.soundEnabled ? '🔊' : '🔇';
        }
        
        this.saveSettings();
    }

    playSound(soundName) {
        if (this.soundEnabled && this.sounds[soundName]) {
            try {
                this.sounds[soundName].currentTime = 0;
                this.sounds[soundName].play().catch(() => {
                    // Sound play failed - audio file not found
                });
            } catch (e) {
                // Audio element not available
            }
        }
    }

    /**
     * Apply theme to UI elements
     */
    applyTheme() {
        const isDark = this.theme === 'dark';
        document.body.classList.toggle('dark-theme', isDark);
        
        if (this.elements.themeToggle) {
            this.elements.themeToggle.textContent = isDark ? '☀️' : '🌙';
        }
        
        const welcomeToggle = document.getElementById('themeToggleWelcome');
        if (welcomeToggle) {
            welcomeToggle.textContent = isDark ? '☀️ Toggle Theme' : '🌙 Toggle Theme';
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('emojiCrush_theme', this.theme);
            localStorage.setItem('emojiCrush_sound', this.soundEnabled.toString());
            localStorage.setItem('emojiCrush_music', this.musicEnabled.toString());
        } catch (e) {
            console.warn('Could not save settings:', e);
        }
    }

    /**
     * Show loading screen
     */
    showLoading() {
        this.elements.loadingScreen?.classList.remove('hidden');
    }

    /**
     * Hide loading screen
     */
    hideLoading() {
        this.elements.loadingScreen?.classList.add('hidden');
    }

    /**
     * Initialize the UI
     */
    initialize() {
        console.log('UI initialize called');
        this.applyTheme();
        this.renderBoard();
        this.updateUI();
        console.log('UI initialization complete');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameUI;
}
