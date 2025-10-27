# uni-fundflow (UniKL Finance)

This repository contains the frontend (React + Vite + TypeScript + Tailwind + shadcn-ui) for the UniKL finance application (uni-fundflow). A Laravel-based backend (unifa-backend) sits alongside this project in the workspace and exposes the API used by the frontend.

This README focuses on the frontend workspace and includes notes to help run and integrate with the backend.

## Project structure (important folders)

- `src/` — Frontend source (React + TypeScript + shadcn-ui components)
- `src/lib/api` — Axios instance and API hooks
- `src/pages` — Page-level React components (Student, Committee, Admin)
- `public/` & `assets/` — Static assets
- `../unifa-backend/` — Laravel backend (API server)

## Quick start — Frontend (development)

These commands assume you're on Windows PowerShell (your default shell). From the `uni-fundflow` folder run:

```powershell
# install dependencies
npm install

# start dev server (Vite)
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`) to view the app.

## Backend (quick notes)

The backend lives in the sibling folder `unifa-backend/` and is a Laravel app that exposes the API under `http://localhost:8000/api` by default.

Typical steps to run the backend locally (from `unifa-backend`):

```powershell
# install composer deps
composer install

# copy environment (edit values as needed)
Copy-Item .env.example .env

# if using sqlite (project includes a sqlite db), ensure storage and DB settings are correct
# generate app key
php artisan key:generate

# run migrations and seeders if needed
php artisan migrate --seed

# start the dev server
php artisan serve --host=127.0.0.1 --port=8000
```

If you run the backend on a different host/port update `src/lib/api/axios.ts`'s `baseURL` accordingly.

## API notes (useful endpoints)

- Base API URL (default): `http://localhost:8000/api`
- Committee profile (public demo by email): `GET /api/committee/profile?email={email}`
- Committee profile update: `PUT /api/committee/profile`
- Committee change password: `POST /api/committee/change-password`

Example request body for change-password (frontend sends email + current/new password):

```json
{
	"email": "committee@example.com",
	"current_password": "currentPassword",
	"password": "newPassword",
	"password_confirmation": "newPassword"
}
```

The frontend includes a hook for this endpoint at `src/lib/api/hooks/hooks/use-change-password.ts` and the Edit Profile page sends the request including `user_email` read from `localStorage`.

## Frontend developer tips

- Local email-based demo auth: The frontend currently uses a simple demo flow where `user_email` is stored in `localStorage`. Many API endpoints accept `email` as a query or payload value for demo access.
- Axios base URL: `src/lib/api/axios.ts` sets the base URL to `http://localhost:8000/api`. If your backend is on another host/port, update that file.
- Password visibility: The Edit Profile page contains client-side toggles (eye icons) to show/hide password fields.
- Routes & components: The app uses React Router. If you see 404s when navigating a route, check that the route path and the imported component match in `src/App.tsx`.

## Running tests

- Frontend unit/e2e tests are not included by default. Use the Vite dev server to manually test UI flows.
- For backend tests (if any), run PHPUnit inside the `unifa-backend` folder:

```powershell
cd ..\unifa-backend
./vendor/bin/phpunit
```

## Contributing

1. Create a branch for your feature/bugfix.
2. Run frontend and backend locally and verify changes.
3. Commit and open a pull request with a short description and testing notes.

## Contact / Troubleshooting

- If the frontend sends requests to `http://localhost:8000/api/api/...` (double `/api`), check `src/lib/api/axios.ts` (it already includes `/api`) and remove additional `/api` from API hooks.
- If a 403 Forbidden is returned when calling an endpoint, check whether the endpoint expects an authenticated JWT/guard or an email-based demo payload (some endpoints are public demo and others require auth).

---

If you'd like, I can:

- Add a short 'developer setup' script in a `Makefile` or PowerShell script to run frontend + backend concurrently.
- Add example Postman collections or cURL snippets for the most-used API endpoints.

Tell me which of those you'd like next.
