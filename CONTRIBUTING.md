# Contributing to E-Learning Platform

Thank you for considering contributing to our E-Learning Platform! This document outlines the guidelines for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct. Please be respectful and considerate of others.

## How Can I Contribute?

### Reporting Bugs

- Check if the bug has already been reported in the Issues section
- Use the bug report template when creating a new issue
- Include detailed steps to reproduce the bug
- Include screenshots if applicable
- Describe the expected behavior and what actually happened

### Suggesting Enhancements

- Check if the enhancement has already been suggested in the Issues section
- Use the feature request template when creating a new issue
- Provide a clear description of the proposed enhancement
- Explain why this enhancement would be useful to most users

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure your changes don't break existing functionality
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

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

## Coding Guidelines

### JavaScript/React

- Follow the ESLint configuration in the project
- Use functional components with hooks instead of class components
- Use destructuring for props and state
- Keep components small and focused on a single responsibility
- Use meaningful variable and function names

### CSS/Styling

- Follow the Tailwind CSS conventions
- Use the existing color palette defined in tailwind.config.js
- Avoid inline styles when possible

### Firebase

- Follow the database schema defined in docs/DATABASE_SCHEMA.md
- Use the utility functions in src/utils/firebaseUtils.js for database operations
- Ensure proper error handling for all Firebase operations

## Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

## Documentation

- Update the README.md file with details of changes to the interface
- Update the docs/ directory with any new information
- Comment your code, particularly for complex logic

## Testing

- Write tests for new features
- Ensure all tests pass before submitting a pull request
- Test your changes in different browsers if applicable

## Questions?

If you have any questions about contributing, please open an issue with the label "question".

Thank you for contributing to our E-Learning Platform!
