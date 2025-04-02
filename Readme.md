# ReelPick - Movie Tracking App MVP

ReelPick is a mobile app that lets users track, rate, and discover movies. This is a minimum viable product (MVP) built in React Native with Expo.

## Features

- **Movie Discovery**: Browse trending and popular movies
- **Search**: Find movies by title
- **Movie Logging & Rating**: Rate movies you've watched (1-5 stars) and write reviews
- **Watchlist**: Save movies you want to watch
- **Basic Recommendations**: Get movie suggestions based on your ratings
- **User Authentication**: Create an account and log in

## Tech Stack

- **Frontend**: React Native (with Expo)
- **Web Support**: React Native Web
- **Backend**: Firebase (Firestore + Auth)
- **Movie Data**: TMDb API
- **Navigation**: React Navigation
- **UI Components**: React Native Paper

## Getting Started

### Prerequisites

- Node.js (LTS version)
- npm or yarn
- Expo CLI
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/reelpick.git
cd reelpick
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the project root with your TMDb API key:
```
TMDB_API_KEY=your_api_key_here
```

4. Update the Firebase configuration in `firebase.ts` with your Firebase project details

### Running the App

```bash
# Start the Expo development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Run on web
npx expo start:web
```

## Project Structure

```
ReelPick/
├── src/
│   ├── api/             # API services (TMDb)
│   ├── components/      # Reusable components
│   ├── contexts/        # Context providers (Auth)
│   ├── hooks/           # Custom hooks
│   ├── navigation/      # Navigation configuration
│   ├── screens/         # App screens
│   │   ├── auth/        # Authentication screens
│   │   └── ...          # Other screens
│   └── services/        # Firebase services
├── App.tsx              # Main app component
├── firebase.ts          # Firebase configuration
└── package.json
```

## Next Steps (Post-MVP)

- Social features (following friends, sharing ratings)
- Advanced recommendation algorithms
- Streaming service availability
- Personalized movie collections
- Push notifications for new releases
- Offline support

## Credits

- Movie data provided by [The Movie Database (TMDb)](https://www.themoviedb.org/)
- This project uses the TMDb API but is not endorsed or certified by TMDb