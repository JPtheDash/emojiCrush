/**
 * Board.js - Handles game board logic, initialization, and refilling
 * Core functionality for the Emoji Crush game board management
 */

class GameBoard {
    constructor(size = 8) {
        this.size = size;
        this.grid = [];
        this.emojis = ['🍎', '🍌', '🍇', '🍓', '🥑', '🍕', '🍩', '⭐', '🔥', '💎'];
        this.specialEmojis = {
            striped: '⚡',
            bomb: '💥',
            rainbow: '🌈'
        };
        this.init();
    }

    /**
     * Initialize the game board with random emojis
     * Ensures no initial matches exist
     */
    init() {
        this.grid = [];
        for (let row = 0; row < this.size; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.size; col++) {
                this.grid[row][col] = this.getRandomEmoji(row, col);
            }
        }
        
        // Ensure no initial matches
        this.removeInitialMatches();
    }

    /**
     * Get a random emoji that doesn't create immediate matches
     */
    getRandomEmoji(row, col) {
        let attempts = 0;
        let emoji;
        
        do {
            emoji = this.emojis[Math.floor(Math.random() * this.emojis.length)];
            attempts++;
            // Only check for matches if we have enough grid initialized
            if (row < 2 && col < 2) {
                break; // Skip match checking for first few positions
            }
        } while (this.wouldCreateMatch(row, col, emoji) && attempts < 50);
        
        return emoji;
    }

    /**
     * Get emoji at position
     */
    getEmoji(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return null;
        }
        const emoji = this.grid[row][col];
        return emoji;
    }

    /**
     * Check if placing an emoji would create a match
     */
    wouldCreateMatch(row, col, emoji) {
        // Check horizontal match
        let horizontalCount = 1;
        
        // Check left
        for (let c = col - 1; c >= 0; c--) {
            if (this.grid[row] && this.grid[row][c] === emoji) {
                horizontalCount++;
            } else {
                break;
            }
        }
        
        // Check right
        for (let c = col + 1; c < this.size; c++) {
            if (this.grid[row] && this.grid[row][c] === emoji) {
                horizontalCount++;
            } else {
                break;
            }
        }
        
        if (horizontalCount >= 3) return true;
        
        // Check vertical match
        let verticalCount = 1;
        
        // Check up
        for (let r = row - 1; r >= 0; r--) {
            if (this.grid[r] && this.grid[r][col] === emoji) {
                verticalCount++;
            } else {
                break;
            }
        }
        
        // Check down
        for (let r = row + 1; r < this.size; r++) {
            if (this.grid[r] && this.grid[r][col] === emoji) {
                verticalCount++;
            } else {
                break;
            }
        }
        
        return verticalCount >= 3;
    }

    /**
     * Remove any initial matches that might exist
     */
    removeInitialMatches() {
        let hasMatches = true;
        let attempts = 0;
        
        while (hasMatches && attempts < 100) {
            hasMatches = false;
            
            for (let row = 0; row < this.size; row++) {
                for (let col = 0; col < this.size; col++) {
                    if (this.wouldCreateMatch(row, col, this.grid[row][col])) {
                        this.grid[row][col] = this.getRandomEmoji(row, col);
                        hasMatches = true;
                    }
                }
            }
            attempts++;
        }
    }


    /**
     * Set emoji at specific position
     */
    setEmoji(row, col, emoji) {
        if (this.isValidPosition(row, col)) {
            this.grid[row][col] = emoji;
        }
    }

    /**
     * Check if position is valid
     */
    isValidPosition(row, col) {
        return row >= 0 && row < this.size && col >= 0 && col < this.size;
    }

    /**
     * Swap two emojis on the board
     */
    swapEmojis(pos1, pos2) {
        if (!this.isValidPosition(pos1.row, pos1.col) || 
            !this.isValidPosition(pos2.row, pos2.col)) {
            return false;
        }

        const temp = this.grid[pos1.row][pos1.col];
        this.grid[pos1.row][pos1.col] = this.grid[pos2.row][pos2.col];
        this.grid[pos2.row][pos2.col] = temp;
        
        return true;
    }

    /**
     * Check if two positions are adjacent
     */
    areAdjacent(pos1, pos2) {
        const rowDiff = Math.abs(pos1.row - pos2.row);
        const colDiff = Math.abs(pos1.col - pos2.col);
        
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    /**
     * Apply gravity - make emojis fall down
     */
    applyGravity() {
        const movements = [];
        
        for (let col = 0; col < this.size; col++) {
            let writePos = this.size - 1;
            
            // Move existing emojis down
            for (let row = this.size - 1; row >= 0; row--) {
                if (this.grid[row][col] !== null) {
                    if (row !== writePos) {
                        movements.push({
                            from: { row, col },
                            to: { row: writePos, col },
                            emoji: this.grid[row][col]
                        });
                        this.grid[writePos][col] = this.grid[row][col];
                        this.grid[row][col] = null;
                    }
                    writePos--;
                }
            }
        }
        
        return movements;
    }

    /**
     * Fill empty spaces with new random emojis
     */
    fillEmpty() {
        const newEmojis = [];
        
        for (let col = 0; col < this.size; col++) {
            for (let row = 0; row < this.size; row++) {
                if (this.grid[row][col] === null) {
                    const newEmoji = this.emojis[Math.floor(Math.random() * this.emojis.length)];
                    this.grid[row][col] = newEmoji;
                    newEmojis.push({
                        row,
                        col,
                        emoji: newEmoji
                    });
                }
            }
        }
        
        return newEmojis;
    }

    /**
     * Remove emojis at specified positions
     */
    removeEmojis(positions) {
        positions.forEach(pos => {
            if (this.isValidPosition(pos.row, pos.col)) {
                this.grid[pos.row][pos.col] = null;
            }
        });
    }

    /**
     * Create special emoji at position
     */
    createSpecialEmoji(row, col, type) {
        if (this.isValidPosition(row, col)) {
            this.grid[row][col] = this.specialEmojis[type];
        }
    }

    /**
     * Check if emoji is special
     */
    isSpecialEmoji(emoji) {
        return Object.values(this.specialEmojis).includes(emoji);
    }

    /**
     * Get special emoji type
     */
    getSpecialType(emoji) {
        for (const [type, specialEmoji] of Object.entries(this.specialEmojis)) {
            if (specialEmoji === emoji) {
                return type;
            }
        }
        return null;
    }

    /**
     * Get positions affected by special emoji
     */
    getSpecialEmojiEffect(row, col, type) {
        const positions = [];
        
        switch (type) {
            case 'striped':
                // Clear entire row or column (randomly choose)
                if (Math.random() < 0.5) {
                    // Clear row
                    for (let c = 0; c < this.size; c++) {
                        positions.push({ row, col: c });
                    }
                } else {
                    // Clear column
                    for (let r = 0; r < this.size; r++) {
                        positions.push({ row: r, col });
                    }
                }
                break;
                
            case 'bomb':
                // Clear 3x3 area
                for (let r = row - 1; r <= row + 1; r++) {
                    for (let c = col - 1; c <= col + 1; c++) {
                        if (this.isValidPosition(r, c)) {
                            positions.push({ row: r, col: c });
                        }
                    }
                }
                break;
                
            case 'rainbow':
                // Clear all emojis of the same type (pick random type for now)
                const availableEmojis = this.emojis.filter(emoji => {
                    // Find emojis that exist on the board
                    for (let r = 0; r < this.size; r++) {
                        for (let c = 0; c < this.size; c++) {
                            if (this.grid[r][c] === emoji) {
                                return true;
                            }
                        }
                    }
                    return false;
                });
                
                if (availableEmojis.length > 0) {
                    const targetEmoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
                    for (let r = 0; r < this.size; r++) {
                        for (let c = 0; c < this.size; c++) {
                            if (this.grid[r][c] === targetEmoji) {
                                positions.push({ row: r, col: c });
                            }
                        }
                    }
                }
                break;
        }
        
        return positions;
    }

    /**
     * Shuffle the board (for shuffle power-up)
     */
    shuffle() {
        const allEmojis = [];
        
        // Collect all emojis
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                allEmojis.push(this.grid[row][col]);
            }
        }
        
        // Shuffle array
        for (let i = allEmojis.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allEmojis[i], allEmojis[j]] = [allEmojis[j], allEmojis[i]];
        }
        
        // Redistribute emojis
        let index = 0;
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                this.grid[row][col] = allEmojis[index++];
            }
        }
        
        // Ensure no matches after shuffle
        this.removeInitialMatches();
    }

    /**
     * Get a copy of the current board state
     */
    getState() {
        return this.grid.map(row => [...row]);
    }

    /**
     * Restore board state
     */
    setState(state) {
        this.grid = state.map(row => [...row]);
    }

    /**
     * Get all possible moves
     */
    getPossibleMoves() {
        const moves = [];
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                // Check right swap
                if (col < this.size - 1) {
                    const pos1 = { row, col };
                    const pos2 = { row, col: col + 1 };
                    
                    this.swapEmojis(pos1, pos2);
                    if (this.hasMatches()) {
                        moves.push({ pos1, pos2 });
                    }
                    this.swapEmojis(pos1, pos2); // Swap back
                }
                
                // Check down swap
                if (row < this.size - 1) {
                    const pos1 = { row, col };
                    const pos2 = { row: row + 1, col };
                    
                    this.swapEmojis(pos1, pos2);
                    if (this.hasMatches()) {
                        moves.push({ pos1, pos2 });
                    }
                    this.swapEmojis(pos1, pos2); // Swap back
                }
            }
        }
        
        return moves;
    }

    /**
     * Check if board has any matches
     */
    hasMatches() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.wouldCreateMatch(row, col, this.grid[row][col])) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Get hint for next move
     */
    getHint() {
        const possibleMoves = this.getPossibleMoves();
        if (possibleMoves.length > 0) {
            return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }
        return null;
    }

    /**
     * Print board to console (for debugging)
     */
    print() {
        console.log('Board State:');
        for (let row = 0; row < this.size; row++) {
            console.log(this.grid[row].join(' '));
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameBoard;
}
