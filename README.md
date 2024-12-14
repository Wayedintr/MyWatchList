
# MyWatchList

A project that helps you manage and explore your watchlist.

## Prerequisites

- **Backend**: PostgreSQL
- **Frontend**: Node.js (with Yarn as the package manager)

---

## Setup Instructions

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the example `.env` file and configure your environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the values in `.env` as needed (e.g., database credentials, API keys).

3. Install dependencies:
   ```bash
   yarn
   ```

4. Run the backend in development mode:
   ```bash
   yarn dev
   ```

5. To run the backend in production mode:
   ```bash
   yarn start
   ```

---

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   yarn
   ```

3. Run the frontend in development mode:
   ```bash
   yarn dev
   ```

4. Build the frontend for production:
   ```bash
   yarn build
   ```

---

## Additional Notes

- Make sure your PostgreSQL server is running and accessible with the credentials specified in the `.env` file.
- Ensure that all required environment variables (e.g., `PGDATABASE`, `PGUSER`, `TMDB_API_KEY`) are correctly configured.
