# Sokoban

A daily Sokoban puzzle game built with Expo and React Native. Challenge yourself to find the optimal solution for each level.

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Project Structure

```
sokoban/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root navigation layout
│   ├── main.tsx            # Main game screen
│   ├── level_select.tsx    # Level selection screen
│   ├── level_editor.tsx    # Level editor screen
│   └── modal.tsx           # Modal screen
├── assets/
│   ├── images/             # App icons and images
│   ├── levels/             # Level data (JSON files)
│   └── soko_images/        # Game sprites (wall, floor, box)
├── components/
│   ├── game/               # Game-specific components
│   │   ├── SokobanBoard.tsx    # Main game board renderer
│   │   ├── Dpad.tsx            # Directional pad controls
│   │   ├── useSokoban.ts       # Game logic hook
│   │   └── types.ts            # TypeScript types for game
│   ├── themed-text.tsx     # Themed text component
│   └── themed-view.tsx     # Themed view component
├── constants/
│   └── theme.ts            # App theme configuration
├── hooks/                  # Custom React hooks
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
├── scripts/
│   ├── save_level.js       # Script to save levels
│   ├── server.js           # Development server
│   └── reset-project.js    # Project reset utility
└── firebaseConfig.ts       # Firebase configuration
```

## Features

- Multiple puzzle levels
- Level editor for creating custom puzzles
- Optimal solution challenge
- Touch-based D-pad controls
