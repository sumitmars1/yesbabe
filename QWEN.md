# Project Context: AI-chat Frontend Application

## Project Overview
This is a Vue 3 + TypeScript + Vite frontend application with AI/chat functionality and media collection features. The application includes features for managing collections of files (images and videos), chat interfaces, and user authentication.

Key technologies used:
- Vue 3 with `<script setup>` SFCs
- TypeScript for type safety
- Vite as the build tool
- Naive UI component library
- UnoCSS for styling with custom theme configuration
- Pinia for state management
- Vue Router for routing
- Vue I18n for internationalization

## Project Structure
```
/mnt/d/前端/AI-chat/
├── .claude/          # Claude-related configuration
├── .cursor/          # Cursor editor configuration
├── public/           # Public assets
├── src/              # Main source code
│   ├── api/          # API integration
│   ├── assets/       # Static assets
│   ├── components/   # Reusable components
│   ├── composables/  # Vue composables
│   ├── docs/         # Documentation
│   ├── layouts/      # Layout components
│   ├── locales/      # I18n locale files
│   ├── router/       # Vue Router configuration
│   ├── stores/       # Pinia stores
│   ├── types/        # TypeScript type definitions
│   ├── utils/        # Utility functions
│   ├── views/        # Page components
│   ├── App.vue       # Root component
│   ├── main.ts       # Application entry point
│   └── style.css     # Global styles
├── .env.development  # Development environment variables
├── .env.production   # Production environment variables
├── package.json      # Project dependencies and scripts
├── vite.config.ts    # Vite configuration
├── tsconfig.json     # TypeScript configuration
├── uno.config.ts     # UnoCSS configuration
└── README.md         # Project documentation
```

## Key Features
1. **Collection Management**: Users can manage collections of media files (images/videos)
2. **Chat Interface**: AI chat functionality with conversation management
3. **Media Display**: Video player component with custom controls and fullscreen support
4. **Responsive Design**: Adapts to both desktop and mobile layouts
5. **Internationalization**: Multi-language support
6. **User Authentication**: Login and session management
7. **Media Protection**: Implementation of media protection mechanisms

## Building and Running

### Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for development
pnpm build:dev

# Preview production build
pnpm preview
```

### Environment Configuration
The application uses environment variables for configuration:
- Development: `.env.development`
- Production: `.env.production`

API requests are proxied to `https://yesbabeabc.com/api` during development.

### Key Dependencies
- Vue 3 (v3.5.13)
- TypeScript (v5.8.3)
- Naive UI (v2.41.0)
- Pinia (v3.0.2) for state management
- Vue Router (v4.5.1)
- Vue I18n (v9.14.4)
- UnoCSS (v66.1.0) for styling
- Axios (v1.9.0) for HTTP requests
- Day.js (v1.11.13) for date handling

## Development Conventions

### TypeScript
- Uses strict type checking
- Type definitions are located in `src/types/`
- Vue component props are defined with `withDefaults` for default values

### Component Structure
- Components follow the Vue 3 Composition API with `<script setup>`
- Components are auto-imported using `unplugin-auto-import`
- UI components are organized in `src/components/`
- Page-level components are in `src/views/`

### Styling
- UnoCSS is used for utility-first CSS
- Custom theme is defined in `uno.config.ts` using CSS variables
- Component-specific styles use scoped styles in Vue SFCs

### State Management
- Pinia is used for state management
- Persistent state is handled with `pinia-plugin-persistedstate`
- Global store is available in `src/stores/global/global.ts`

### Internationalization
- Vue I18n is used for internationalization
- Locale files are stored in `src/locales/`
- Translation function is accessible via `useI18n().t`

### File/Video Carousel Feature
The CollectionFilesView component implements a carousel for displaying media files with:
- Automatic video playback when in view
- Video progress reset when switching between videos
- Responsive layout for both desktop and mobile
- Thumbnail navigation alongside main carousel

## Special Focus: Video Playback Management
The CollectionFilesView.vue component has specific logic for handling video playback in the carousel:
- Videos autoplay when they become visible in the carousel
- Video progress is automatically reset to 0 when switching from one video to another
- The `currentPlayingVideoId` tracks which video is currently playing
- When selecting a different video, the previous video's progress is reset
- The `currentTime` property of the video player is set to 0 when switching videos

This functionality ensures that when users navigate between video files in the carousel, each video starts from the beginning rather than resuming from where it was left off.

## API Integration
- API calls are handled in the `src/api/` directory
- The `getCollectionFile` function retrieves media files by filename
- HTTP requests are made using Axios with proper error handling

## Security Features
- Media protection mechanisms are implemented to prevent unauthorized access
- Context menu is disabled on videos to prevent download
- Object URLs are properly revoked to prevent memory leaks