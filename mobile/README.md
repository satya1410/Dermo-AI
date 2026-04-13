# DermoAI Mobile App

A React Native mobile application for skin analysis using AI, built with Expo and TypeScript.

## Features

- 🔐 User Authentication (Login/Signup)
- 📸 Image Capture and Analysis
- 📊 Analysis History
- 👨‍⚕️ Doctor Directory
- 👤 User Profile Management
- 🔔 Notifications

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: React Navigation
- **Storage**: AsyncStorage
- **Image Handling**: Expo Image Picker

## Setup Instructions

### Prerequisites

1. Install Node.js (v16 or higher)
2. Install Expo CLI: `npm install -g @expo/cli`
3. Install Expo Go app on your mobile device

### Installation

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update API Base URL:
   - Open `screens/LoginScreen.tsx`, `screens/SignupScreen.tsx`, `screens/DashboardScreen.tsx`, and `screens/HistoryScreen.tsx`
   - Replace `https://your-vercel-deployment-url.vercel.app` with your actual Vercel deployment URL

### Running the App

1. Start the development server:
   ```bash
   npm start
   ```

2. Scan the QR code with:
   - **Expo Go app** (recommended) on iOS/Android
   - **Camera app** on iOS (opens in Expo Go)
   - **Expo Go app** on Android

## Project Structure

```
mobile/
├── screens/                 # Screen components
│   ├── LoginScreen.tsx
│   ├── SignupScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── HistoryScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── DoctorsScreen.tsx
│   ├── NotificationsScreen.tsx
│   └── DoctorDashboardScreen.tsx
├── components/              # Reusable components
├── lib/                     # Utilities and helpers
├── assets/                  # Images and static assets
├── App.tsx                  # Main app component
├── app.json                 # Expo configuration
├── babel.config.js          # Babel configuration for NativeWind
├── tailwind.config.js       # Tailwind CSS configuration
└── package.json
```

## API Integration

The mobile app connects to the same backend API as the web version:

- **Authentication**: `/api/auth/login`, `/api/auth/signup`, `/api/auth/me`
- **Analysis**: `/api/analyze`
- **History**: `/api/history`
- **Doctors**: `/api/doctors`
- **Profile**: `/api/profile`
- **Notifications**: `/api/notifications`

## Permissions

The app requires the following permissions:

- **Camera**: For taking photos of skin conditions
- **Media Library**: For selecting images from gallery

These permissions are requested automatically when needed.

## Building for Production

### Android APK
```bash
expo build:android
```

### iOS App Store
```bash
expo build:ios
```

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `expo r -c`
2. **NativeWind not working**: Ensure `babel.config.js` is configured correctly
3. **Permissions denied**: Restart the app after granting permissions
4. **API connection failed**: Check that the Vercel URL is correct and the backend is deployed

### Development Tips

- Use `console.log()` for debugging (visible in Expo CLI terminal)
- Test on both iOS and Android devices/emulators
- Use React DevTools for component inspection

## Contributing

1. Follow the existing code style and structure
2. Test on both iOS and Android
3. Update this README for any new features
4. Ensure all dependencies are properly documented

## License

This project is part of the DermoAI application suite.