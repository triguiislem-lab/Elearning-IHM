# E-Learning Platform

This application is an e-learning platform developed with React, Vite, and Firebase, designed to provide a seamless learning experience for students, instructors, and administrators.

## 🌟 Features

### For Students
- Browse and enroll in courses by specialties and disciplines
- Access course materials including videos, PDFs, and other resources
- Take evaluations and track progress
- Communicate with instructors through messaging
- Personalized dashboard with enrolled courses

### For Instructors
- Create and manage courses with modular structure
- Upload various types of learning resources
- Create evaluations and assessments
- Track student progress and engagement
- Communicate with students

### For Administrators
- Manage users, roles, and permissions
- Organize courses by specialties and disciplines
- Monitor platform usage and performance
- Database standardization and maintenance tools

## 🚀 Technologies Used

- **Frontend**: React 18, React Router v7, Tailwind CSS
- **Build Tool**: Vite
- **Backend**: Firebase (Authentication, Realtime Database)
- **State Management**: React Hooks
- **UI Components**: Custom components with Tailwind CSS
- **Media**: React Player, React PDF
- **Animations**: Framer Motion
- **Deployment**: Firebase Hosting

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/e-learning-platform.git
   cd e-learning-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 🔥 Firebase Configuration

To improve application performance, Firebase indexes have been configured. Please refer to the [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) file for instructions on deploying rules and indexes.

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init
   ```
   - Select "Database" and "Hosting"
   - Choose your Firebase project
   - Accept default values for other questions

4. Deploy Firebase rules and indexes:
   ```bash
   firebase deploy --only database
   ```

## 📊 Performance Optimizations

Several optimizations have been implemented to improve application performance:

1. **Console calls removal**: 477 console calls removed to improve performance
2. **Loading animations unification**: All loading animations unified for consistent UX
3. **Firebase data caching**: Frequently used data is cached to reduce Firebase calls
4. **Lazy loading components**: Components are loaded only when needed
5. **Image optimization**: Images are lazy-loaded to improve loading times
6. **Firebase indexes**: Indexes configured to speed up Firebase queries

For more details on performance optimizations, see:
- [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md)
- [LOADING_OPTIMIZATION.md](./LOADING_OPTIMIZATION.md)
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

## 📁 Project Structure

```
e-learning-platform/
├── public/                  # Static files
├── src/
│   ├── components/          # Reusable components
│   │   ├── Admin/           # Admin-specific components
│   │   ├── Auth/            # Authentication components
│   │   ├── Common/          # Shared components
│   │   ├── Courses/         # Course-related components
│   │   ├── Layout/          # Layout components
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Page components
│   │   ├── Admin/           # Admin pages
│   │   ├── Auth/            # Authentication pages
│   │   ├── Dashboard/       # Dashboard pages
│   │   ├── Instructor/      # Instructor pages
│   │   └── ...
│   ├── utils/               # Utility functions
│   ├── App.jsx              # Main application component
│   ├── main.jsx             # Entry point
│   └── ...
├── docs/                    # Documentation
├── firebase.json            # Firebase configuration
├── database.rules.json      # Firebase database rules
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── package.json             # Project dependencies
```

## 🚢 Deployment

To deploy to Firebase Hosting:
```bash
npm run build
firebase deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Made with ❤️ by [Your Name/Team]
