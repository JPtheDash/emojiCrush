/**
 * Match.js - Handles match detection, combos, and special emoji creation
 * Core matching logic for the Emoji Crush game
 */

class MatchDetector {
    constructor(board) {
        this.board = board;
        this.lastMatches = [];
        this.comboMultiplier = 1;
        this.maxComboMultiplier = 8;
    }

    /**
     * Find all matches on the board
     */
    findMatches() {
        const matches = [];
        const visited = new Set();

        console.log('Finding matches on board...');
        console.log('Current board state:', this.board.grid);

        // Find horizontal matches
        for (let row = 0; row < this.board.size; row++) {
            for (let col = 0; col < this.board.size - 2; col++) {
                const emoji = this.board.getEmoji(row, col);
                if (!emoji || this.board.isSpecialEmoji(emoji)) continue;

                let matchLength = 1;
                let currentCol = col + 1;

                // Count consecutive matching emojis
                while (currentCol < this.board.size && 
                       this.board.getEmoji(row, currentCol) === emoji) {
                    matchLength++;
                    currentCol++;
                }

                if (matchLength >= 3) {
                    console.log(`Found horizontal match: ${emoji} at row ${row}, cols ${col}-${col + matchLength - 1}`);
                    
                    const match = {
                        type: 'horizontal',
                        emoji: emoji,
                        positions: [],
                        length: matchLength,
                        row: row,
                        startCol: col,
                        endCol: col + matchLength - 1
                    };

                    for (let c = col; c < col + matchLength; c++) {
                        const posKey = `${row}-${c}`;
                        if (!visited.has(posKey)) {
                            match.positions.push({ row, col: c });
                            visited.add(posKey);
                        }
                    }

                    if (match.positions.length > 0) {
                        matches.push(match);
                    }
                    col = currentCol - 1; // Skip processed positions
                }
            }
        }

        // Find vertical matches
        for (let col = 0; col < this.board.size; col++) {
            for (let row = 0; row < this.board.size - 2; row++) {
                const emoji = this.board.getEmoji(row, col);
                if (!emoji || this.board.isSpecialEmoji(emoji)) continue;

                let matchLength = 1;
                let currentRow = row + 1;

                // Count consecutive matching emojis
                while (currentRow < this.board.size && 
                       this.board.getEmoji(currentRow, col) === emoji) {
                    matchLength++;
                    currentRow++;
                }

                if (matchLength >= 3) {
                    console.log(`Found vertical match: ${emoji} at col ${col}, rows ${row}-${row + matchLength - 1}`);
                    
                    const match = {
                        type: 'vertical',
                        emoji: emoji,
                        positions: [],
                        length: matchLength,
                        col: col,
                        startRow: row,
                        endRow: row + matchLength - 1
                    };

                    for (let r = row; r < row + matchLength; r++) {
                        const posKey = `${r}-${col}`;
                        if (!visited.has(posKey)) {
                            match.positions.push({ row: r, col });
                            visited.add(posKey);
                        }
                    }

                    if (match.positions.length > 0) {
                        matches.push(match);
                    }
                    row = currentRow - 1; // Skip processed positions
                }
            }
        }

        console.log(`Total matches found: ${matches.length}`);
        this.lastMatches = matches;
        return matches;
    }

    /**
     * Find L-shaped and T-shaped matches
     */
    findShapedMatches() {
        const shapedMatches = [];
        const horizontalMatches = this.lastMatches.filter(m => m.type === 'horizontal');
        const verticalMatches = this.lastMatches.filter(m => m.type === 'vertical');

        // Check for intersections between horizontal and vertical matches
        for (const hMatch of horizontalMatches) {
            for (const vMatch of verticalMatches) {
                // Check if they intersect
                if (hMatch.row >= vMatch.startRow && hMatch.row <= vMatch.endRow &&
                    vMatch.col >= hMatch.startCol && vMatch.col <= hMatch.endCol &&
                    hMatch.emoji === vMatch.emoji) {
                    
                    const intersection = { row: hMatch.row, col: vMatch.col };
                    
                    // Create shaped match
                    const shapedMatch = {
                        type: 'shaped',
                        subType: this.getShapeType(hMatch, vMatch),
                        emoji: hMatch.emoji,
                        positions: [...hMatch.positions, ...vMatch.positions],
                        intersection: intersection,
                        horizontalMatch: hMatch,
                        verticalMatch: vMatch
                    };

                    // Remove duplicates
                    const uniquePositions = [];
                    const posSet = new Set();
                    
                    for (const pos of shapedMatch.positions) {
                        const key = `${pos.row}-${pos.col}`;
                        if (!posSet.has(key)) {
                            uniquePositions.push(pos);
                            posSet.add(key);
                        }
                    }
                    
                    shapedMatch.positions = uniquePositions;
                    shapedMatches.push(shapedMatch);
                }
            }
        }

        return shapedMatches;
    }

    /**
     * Determine the type of shaped match (L or T)
     */
    getShapeType(hMatch, vMatch) {
        const totalLength = hMatch.length + vMatch.length - 1; // -1 for intersection
        
        if (totalLength >= 5) {
            return 'T'; // T-shaped match
        } else {
            return 'L'; // L-shaped match
        }
    }

    /**
     * Create special emojis based on match type
     */
    createSpecialEmojis(matches) {
        const specialEmojis = [];

        for (const match of matches) {
            let specialType = null;
            let position = null;

            if (match.type === 'shaped') {
                // L or T shaped matches create bomb emojis
                specialType = 'bomb';
                position = match.intersection;
            } else if (match.length === 4) {
                // 4-match creates striped emoji
                specialType = 'striped';
                position = this.getMiddlePosition(match);
            } else if (match.length >= 5) {
                // 5+ match creates rainbow emoji
                specialType = 'rainbow';
                position = this.getMiddlePosition(match);
            }

            if (specialType && position) {
                specialEmojis.push({
                    type: specialType,
                    position: position,
                    originalMatch: match
                });
            }
        }

        return specialEmojis;
    }

    /**
     * Get middle position of a match
     */
    getMiddlePosition(match) {
        if (match.positions.length === 0) return null;
        
        const middleIndex = Math.floor(match.positions.length / 2);
        return match.positions[middleIndex];
    }

    /**
     * Process special emoji activation
     */
    processSpecialEmoji(row, col) {
        const emoji = this.board.getEmoji(row, col);
        const specialType = this.board.getSpecialType(emoji);
        
        if (!specialType) return [];

        const affectedPositions = this.board.getSpecialEmojiEffect(row, col, specialType);
        
        // Handle chain reactions with other special emojis
        const chainReactions = [];
        for (const pos of affectedPositions) {
            const targetEmoji = this.board.getEmoji(pos.row, pos.col);
            if (this.board.isSpecialEmoji(targetEmoji) && 
                (pos.row !== row || pos.col !== col)) {
                // Trigger chain reaction
                const chainPositions = this.processSpecialEmoji(pos.row, pos.col);
                chainReactions.push(...chainPositions);
            }
        }

        return [...affectedPositions, ...chainReactions];
    }

    /**
     * Calculate score for matches
     */
    calculateScore(matches, specialEmojis = []) {
        let totalScore = 0;
        let baseScore = 0;

        // Score for regular matches
        for (const match of matches) {
            let matchScore = 0;
            
            if (match.type === 'shaped') {
                matchScore = match.positions.length * 25; // Bonus for shaped matches
            } else if (match.length === 3) {
                matchScore = match.positions.length * 10;
            } else if (match.length === 4) {
                matchScore = match.positions.length * 20;
            } else if (match.length >= 5) {
                matchScore = match.positions.length * 50;
            }
            
            baseScore += matchScore;
        }

        // Bonus for special emojis created
        const specialBonus = specialEmojis.length * 100;
        
        // Apply combo multiplier
        totalScore = (baseScore + specialBonus) * this.comboMultiplier;
        
        return {
            baseScore,
            specialBonus,
            multiplier: this.comboMultiplier,
            totalScore: Math.floor(totalScore)
        };
    }

    /**
     * Update combo multiplier
     */
    updateComboMultiplier(hasMatches) {
        if (hasMatches) {
            this.comboMultiplier = Math.min(this.comboMultiplier + 1, this.maxComboMultiplier);
        } else {
            this.comboMultiplier = 1;
        }
    }

    /**
     * Get combo multiplier
     */
    getComboMultiplier() {
        return this.comboMultiplier;
    }

    /**
     * Reset combo multiplier
     */
    resetComboMultiplier() {
        this.comboMultiplier = 1;
    }

    /**
     * Check if a swap would create matches
     */
    wouldCreateMatches(pos1, pos2) {
        console.log('Checking if swap would create matches:', pos1, pos2);
        
        // Get emojis before swap
        const emoji1 = this.board.getEmoji(pos1.row, pos1.col);
        const emoji2 = this.board.getEmoji(pos2.row, pos2.col);
        console.log('Emojis to swap:', emoji1, 'and', emoji2);
        
        // Temporarily swap
        this.board.swapEmojis(pos1, pos2);
        
        // Check for matches
        const matches = this.findMatches();
        console.log('Matches found after swap:', matches.length);
        
        const hasMatches = matches.length > 0;
        
        // Swap back
        this.board.swapEmojis(pos1, pos2);
        
        console.log('Would create matches result:', hasMatches);
        return hasMatches;
    }

    /**
     * Get all positions that would be cleared by matches
     */
    getAllMatchPositions(matches) {
        const allPositions = [];
        const positionSet = new Set();

        for (const match of matches) {
            for (const pos of match.positions) {
                const key = `${pos.row}-${pos.col}`;
                if (!positionSet.has(key)) {
                    allPositions.push(pos);
                    positionSet.add(key);
                }
            }
        }

        return allPositions;
    }

    /**
     * Analyze board for potential matches
     */
    analyzeBoard() {
        const analysis = {
            totalMatches: 0,
            matchTypes: {
                horizontal: 0,
                vertical: 0,
                shaped: 0
            },
            specialOpportunities: 0,
            possibleMoves: this.board.getPossibleMoves().length
        };

        const matches = this.findMatches();
        const shapedMatches = this.findShapedMatches();

        analysis.totalMatches = matches.length + shapedMatches.length;
        
        for (const match of matches) {
            analysis.matchTypes[match.type]++;
            if (match.length >= 4) {
                analysis.specialOpportunities++;
            }
        }

        analysis.matchTypes.shaped = shapedMatches.length;
        analysis.specialOpportunities += shapedMatches.length;

        return analysis;
    }

    /**
     * Get match statistics
     */
    getMatchStats() {
        return {
            lastMatchCount: this.lastMatches.length,
            currentCombo: this.comboMultiplier,
            maxCombo: this.maxComboMultiplier
        };
    }

    /**
     * Validate match integrity
     */
    validateMatches(matches) {
        const validMatches = [];

        for (const match of matches) {
            let isValid = true;
            const emoji = match.emoji;

            // Check if all positions in match still have the same emoji
            for (const pos of match.positions) {
                if (this.board.getEmoji(pos.row, pos.col) !== emoji) {
                    isValid = false;
                    break;
                }
            }

            if (isValid && match.positions.length >= 3) {
                validMatches.push(match);
            }
        }

        return validMatches;
    }

    /**
     * Get hint for creating matches
     */
    getMatchHint() {
        const possibleMoves = this.board.getPossibleMoves();
        
        if (possibleMoves.length === 0) {
            return null;
        }

        // Prioritize moves that create special emojis
        for (const move of possibleMoves) {
            this.board.swapEmojis(move.pos1, move.pos2);
            const matches = this.findMatches();
            const specialEmojis = this.createSpecialEmojis(matches);
            this.board.swapEmojis(move.pos1, move.pos2); // Swap back

            if (specialEmojis.length > 0) {
                return {
                    move,
                    priority: 'high',
                    reason: 'Creates special emoji'
                };
            }
        }

        // Return any valid move
        return {
            move: possibleMoves[0],
            priority: 'normal',
            reason: 'Creates match'
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MatchDetector;
}
