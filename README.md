# 🎮 Emoji Crush Game

A modern, responsive match-3 puzzle game built with vanilla HTML, CSS, and JavaScript featuring smooth drag-and-drop mechanics and beautiful animations.

## ✨ Features

### Core Gameplay
- **Match-3 Mechanics**: Match 3 or more identical emojis in rows or columns
- **Drag & Drop**: Smooth drag-and-drop interface with visual feedback
- **Special Emojis**: Create powerful special tiles with 4+ matches
- **L/T-Shaped Matches**: Create bomb emojis with 3x3 explosion effects
- **Cascading Matches**: Chain reactions with combo multipliers
- **Special Emoji Interactions**: Special emojis can trigger each other

### Scoring & Progression
- **Dynamic Scoring**: 
  - Match 3: 10 points per emoji
  - Match 4: 20 points per emoji + special emoji
  - Match 5+: 50 points per emoji + super emoji
  - Cascades: Progressive multipliers (x2, x3, etc.)
- **50 Levels**: Progressively challenging levels with unique goals
- **Move Limits**: Strategic gameplay with limited moves per level
- **Star Rating System**: Earn 1-3 stars based on performance
- **High Score Tracking**: Persistent high scores via localStorage

### Power-ups & Tools
- **🔨 Hammer**: Clear any single emoji (3 uses)
- **🔄 Shuffle**: Randomly rearrange the entire board (2 uses)
- **↩️ Undo**: Reverse your last move (5 uses)
- **Strategic Usage**: Power-ups are limited and require tactical thinking

### Visual & Audio Experience
- **Smooth Animations**: 
  - Swap animations for emoji movement
  - Fade/bounce effects for clearing matches
  - Explosion effects for bomb emojis
  - Falling animations with gravity
- **Modern UI Design**: Clean, colorful interface with gradient backgrounds
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Theme**: Toggle between themes with persistent settings
- **Audio System**: Background music and sound effects (toggleable)

### Mobile Optimization
- **Touch Controls**: Full touch and swipe gesture support
- **Responsive Design**: Adapts to all screen sizes
- **Mobile-First**: Optimized for mobile gameplay
- **Performance**: Smooth 60fps animations on mobile devices

## 🚀 Getting Started

### Quick Start
1. Clone or download the project
2. Open `index.html` in a modern web browser
3. Start playing immediately - no build process required!

### File Structure
```
EmojiCrush/
├── index.html          # Main HTML file
├── styles.css          # Complete CSS with animations
├── js/
│   ├── board.js        # Game board logic
│   ├── match.js        # Match detection & combos
│   ├── game.js         # Game state & scoring
│   ├── ui.js           # User interface & animations
│   └── main.js         # Application coordinator
├── audio/              # Audio files (optional)
└── README.md          # This file
```

## 🎯 How to Play

### Basic Gameplay
1. **Swap Adjacent Emojis**: Click/tap two adjacent emojis to swap them
2. **Create Matches**: Form lines of 3 or more identical emojis
3. **Score Points**: Longer matches and combos earn more points
4. **Complete Objectives**: Reach the target score within the move limit

### Special Emojis
- **⚡ Striped Emoji**: Created by 4-matches, clears entire row or column
- **💥 Bomb Emoji**: Created by L/T-shaped matches, explodes in 3x3 area
- **🌈 Rainbow Emoji**: Created by 5+ matches, clears all emojis of one type

### Power-ups
- **🔨 Hammer**: Click to destroy any single emoji
- **🔄 Shuffle**: Randomly rearrange all emojis on the board
- **↩️ Undo**: Reverse your last move (great for fixing mistakes)

### Controls
- **Mouse**: Click to select and swap emojis
- **Touch**: Tap to select, swipe to move (mobile)
- **Keyboard Shortcuts**:
  - `Escape`: Pause game
  - `H`: Show hint
  - `1/2/3`: Activate power-ups
  - `Ctrl+R`: Restart level

## 🛠️ Technical Features

### Architecture
- **Modular Design**: Clean separation of concerns across multiple files
- **Object-Oriented**: Well-structured classes with clear responsibilities
- **Event-Driven**: Responsive UI updates based on game state changes
- **Performance Optimized**: Efficient algorithms and smooth animations

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Progressive Enhancement**: Graceful degradation for older browsers

### Storage & Persistence
- **localStorage**: High scores, settings, and progress are saved locally
- **Settings Persistence**: Theme, audio preferences, and game progress
- **Cross-Session**: Continue where you left off

## 🎨 Customization

### Adding New Emojis
Edit the `emojis` array in `board.js`:
```javascript
this.emojis = ['🍎', '🍌', '🍇', '🍓', '🥑', '🍕', '🍩', '⭐', '🔥', '💎'];
```

### Adjusting Difficulty
Modify level configuration in `game.js`:
```javascript
// Change scoring, moves, or goals
const baseGoal = 500 + (i * 250);
const baseMoves = Math.max(15, 35 - Math.floor(i / 3));
```

### Styling
All visual aspects can be customized in `styles.css`:
- Colors and themes via CSS custom properties
- Animation timings and effects
- Layout and responsive breakpoints

## 🔧 Development

### Adding Features
The modular architecture makes it easy to add new features:

1. **New Game Modes**: Extend the `game.js` class
2. **Additional Power-ups**: Add to the power-up system in `game.js` and `ui.js`
3. **More Animations**: Extend the animation system in `ui.js`
4. **Sound Effects**: Add audio files and integrate with the sound system

### Performance Optimization
- Uses `requestAnimationFrame` for smooth animations
- Efficient DOM manipulation with minimal reflows
- Optimized match detection algorithms
- Memory-conscious object management

## 📱 Mobile Features

### Touch Gestures
- **Tap**: Select emojis
- **Swipe**: Move selected emoji in swipe direction
- **Long Press**: Show hint or context menu
- **Pinch**: Zoom (if enabled)

### Mobile Optimizations
- Touch-friendly button sizes
- Optimized font sizes and spacing
- Reduced animation complexity on lower-end devices
- Battery-efficient rendering

## 🎵 Audio System

### Sound Effects
- Match sounds for different combo types
- Special emoji activation sounds
- UI interaction feedback
- Victory and completion sounds

### Background Music
- Looping background music
- Volume controls
- Mute/unmute functionality
- Persistent audio preferences

## 🏆 Achievements & Stats

### Statistics Tracking
- Total games played
- Highest score achieved
- Longest combo chain
- Total matches made
- Levels completed

### Achievement System
- Score milestones
- Combo achievements
- Level completion rewards
- Special emoji mastery

## 🐛 Troubleshooting

### Common Issues
1. **Game won't load**: Ensure JavaScript is enabled
2. **No sound**: Check browser audio permissions
3. **Touch not working**: Try refreshing the page
4. **Performance issues**: Close other browser tabs

### Browser Requirements
- JavaScript ES6+ support
- CSS Grid and Flexbox support
- Local Storage API
- Web Audio API (for sound)

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional game modes
- More power-ups and special emojis
- Enhanced animations and effects
- Accessibility improvements
- Performance optimizations

## 🎮 Enjoy Playing!

Emoji Crush is designed to be a fun, engaging, and polished gaming experience. Whether you're playing for a few minutes or several hours, the game adapts to provide an enjoyable challenge at every level.

**Have fun crushing those emojis!** 🎉
