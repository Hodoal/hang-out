# Project Title: Barranquilla Places Recommendation App (Example Name)

This project is a mobile application designed to recommend places in Barranquilla, Colombia, based on user mood and preferences. It features a React Native frontend, a Node.js backend for user authentication and core logic, and a Python backend for Natural Language Processing (NLP) tasks.

## Architecture Overview

The project is structured into three main components:

1.  **Frontend (React Native):**
    *   Located in the `/` directory (main project files) and `src/`.
    *   Built using Expo and React Native.
    *   Provides the user interface for interacting with the application, including a chatbot for recommendations.
    *   Communicates with both the Node.js backend and the Python NLP service.

2.  **Node.js Backend:**
    *   Located in the `backend/` directory.
    *   Built using Express.js.
    *   Handles user authentication, potentially other core business logic.
    *   Uses a persistent SQLite database (`backend/database.sqlite`) for storing user data.
    *   To run: `cd backend && npm install && node server.js` (or equivalent start script if added to package.json).

3.  **Python NLP Service:**
    *   Located in the `nlp_service/` directory.
    *   Built using Flask.
    *   Provides NLP capabilities, including mood and intent detection from user messages, and user profile management for personalization.
    *   Uses pre-trained scikit-learn models.
    *   To run: `cd nlp_service && pip install -r requirements.txt && python app.py`.
    *   Exposes API endpoints for prediction and profile updates (see `nlp_service/README.md` for details).

## Key Features (Example)

*   User registration and login.
*   Chatbot interface for place recommendations.
*   Mood-based and preference-based suggestions.
*   User profiles that adapt to interactions.

## Setup and Running

(Detailed setup instructions for each component should be added here or in their respective READMEs)

1.  **Frontend:**
    *   `npm install`
    *   `expo start` (or `npm start`)

2.  **Node.js Backend:**
    *   `cd backend`
    *   `npm install`
    *   `node server.js` (Ensure port 3000 is free)

3.  **Python NLP Service:**
    *   `cd nlp_service`
    *   `pip install -r requirements.txt`
    *   `python app.py` (Ensure port 5000 is free)

## Good Practices Implemented

This project aims to follow good software engineering practices, including:
*   **Modular Architecture:** Separation of frontend, backend, and NLP service.
*   **Persistent Data Storage:** Use of a file-based SQLite database for the Node.js backend.
*   **Code Linting and Formatting:** ESLint/Prettier for JavaScript/TypeScript and Black/Flake8 for Python.
*   **Version Control:** (Assuming Git is used).
*   **Dependency Management:** `package.json` for Node.js and `requirements.txt` for Python.
*   **Basic Documentation:** This README and service-specific READMEs.

---
*This is a general README. More specific details should be added as the project evolves.*
