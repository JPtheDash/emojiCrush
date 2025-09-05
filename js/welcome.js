/**
 * Welcome.js - Handles welcome screen and game mode selection
 */

class WelcomeScreen {
    constructor(game, ui) {
        this.game = game;
        this.ui = ui;
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.gameContainer = document.getElementById('gameContainer');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupThemeToggle();
    }

    setupEventListeners() {
        // Mode selection buttons
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const modeOption = e.target.closest('.mode-option');
                const emojiMode = modeOption.dataset.mode;
                this.startGame(emojiMode);
            });
        });

        // Mode option hover effects
        const modeOptions = document.querySelectorAll('.mode-option');
        modeOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                if (!e.target.classList.contains('mode-btn')) {
                    const button = option.querySelector('.mode-btn');
                    button.click();
                }
            });
        });
    }

    setupThemeToggle() {
        const themeToggleWelcome = document.getElementById('themeToggleWelcome');
        if (themeToggleWelcome) {
            themeToggleWelcome.addEventListener('click', () => {
                document.body.classList.toggle('dark-theme');
                const isDark = document.body.classList.contains('dark-theme');
                themeToggleWelcome.textContent = isDark ? '☀️ Toggle Theme' : '🌙 Toggle Theme';
                
                // Save theme preference
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            });

            // Load saved theme
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
                themeToggleWelcome.textContent = '☀️ Toggle Theme';
            }
        }
    }

    startGame(emojiMode) {
        console.log(`Starting game with emoji mode: ${emojiMode}`);
        
        // Hide welcome screen and show game
        this.welcomeScreen.style.display = 'none';
        this.gameContainer.style.display = 'block';
        
        // Start new game with selected emoji mode
        this.game.startNewGame('normal', emojiMode);
        
        // Update UI
        this.ui.updateBoard();
        this.ui.updateUI();
        
        // Add back to menu button
        this.addBackToMenuButton();
    }

    addBackToMenuButton() {
        const header = document.querySelector('.header');
        let backButton = document.getElementById('backToMenu');
        
        if (!backButton) {
            backButton = document.createElement('button');
            backButton.id = 'backToMenu';
            backButton.className = 'btn btn-secondary';
            backButton.innerHTML = '← Menu';
            backButton.style.marginLeft = '10px';
            
            backButton.addEventListener('click', () => {
                this.showWelcomeScreen();
            });
            
            header.appendChild(backButton);
        }
    }

    showWelcomeScreen() {
        this.welcomeScreen.style.display = 'flex';
        this.gameContainer.style.display = 'none';
        
        // Reset game state
        this.game.gameState = 'menu';
    }

    show() {
        this.welcomeScreen.style.display = 'flex';
        this.gameContainer.style.display = 'none';
    }

    hide() {
        this.welcomeScreen.style.display = 'none';
        this.gameContainer.style.display = 'block';
    }
}
