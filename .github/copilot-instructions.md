## Quick overview

This repo is a small PHP + MySQL web app with a public-facing map UI and an admin dashboard.
- Frontend (client): `mainFolder/` — HTML (`index.html`), client JS (`script.js`), styles (`styles.css`). Uses jQuery and Leaflet to render a map and call backend endpoints.
- Admin: `adminFolder/` — admin UI (`admin.html`), admin JS (`admin-script.js`) and PHP endpoints for CRUD (`addItem.php`, `updateItem.php`, `deleteItem.php`, `getAdminLocations.php`, `getLookups.php`).
- DB helper: `adminFolder/db.php` — central mysqli connection factory. Local XAMPP defaults: user `root`, empty password. Adjust before running.
- DB dump: `smilespots_db (1).sql` — import into MySQL to recreate schema/data.

## Big-picture architecture & data flow

- Browser (Leaflet + jQuery) -> AJAX -> PHP endpoints under `adminFolder/` or `mainFolder/`.
- `mainFolder/getLocations.php` returns public locations JSON for the map.
- Admin pages load lookups from `getLookups.php` (types, subcategories, vibes, amenities) and manage locations through the CRUD endpoints.
- DB access is synchronous via mysqli. Endpoints generally return JSON with a `success` boolean and optional `message`/`sql_error` fields.

## Key developer conventions and patterns (project-specific)

- All API PHP files set `Content-Type: application/json` and return a JSON object { success: bool, ... }.
- Endpoints prefer `application/json` POST bodies (see `addItem.php`) but many admin scripts include a fallback to form-encoded POST when the server rejects JSON — mimic this behavior when writing clients/tests.
- Use prepared statements for DB writes (insert/update). `db.php` exposes `get_db_connection()` and will echo JSON & exit on connection failure — callers typically assume it returns a valid mysqli object.
- Coordinates: admin map uses click-to-pick; values are stored with 6 decimal places (`COORD_PRECISION = 6`). Admin UI places coordinates in hidden inputs `#spotLatitude`, `#spotLongitude` for submission.
- Image handling: `image_id` defaults to 0 when none is provided.

## Important files to reference when modifying behavior

- `adminFolder/db.php` — edit DB credentials for local dev. All PHP endpoints include this. Changing connection behavior affects every API.
- `adminFolder/getLookups.php` — canonical source for select lists used in admin UI (types, subcategories, vibes, amenities).
- `adminFolder/addItem.php`, `updateItem.php`, `deleteItem.php` — show expected payload shapes and server-side validation. Example request body for add:

  { "name": "My Spot", "type_id": 1, "subcategory_id": 2, "latitude": 10.123456, "longitude": 122.123456, "vibe_id": 1, "description": "...", "image_id": 0, "amenities": [1,2] }

- `mainFolder/getLocations.php` — public endpoint used by the main map; returns `locations` array with id, name, latitude, longitude, description, type, subcategory, vibe.
- `mainFolder/script.js` and `adminFolder/admin-script.js` — follow these to understand client-side validation, UX flows, and how endpoints are consumed (including error handling and form-encoded fallback behavior).

## Common gotchas / pragmatic notes for agents

- db.php contains credentials placeholders; do not commit real secrets. Assume local XAMPP: user `root`, password empty.
- `addItem.php` expects JSON but will accept form-encoded on fallback. When generating tests or HTTP clients, try JSON first and implement a form-encoded fallback if you see 400 errors about Content-Type.
- Some server-side comments and bind_param type strings contain minor mismatches (e.g., `updateItem.php` commentary vs. actual types). Treat mysqli binding carefully and prefer validating SQL types before edits.
- Endpoints often wrap amenity inserts in a transaction — preserve transactional semantics when refactoring.

## How to run locally (discoverable steps)

1. Start XAMPP (Apache + MySQL). Place this folder under your XAMPP `htdocs` (the repo already appears under `c:/xampp/htdocs/SmileSpots`).
2. Import `smilespots_db (1).sql` into a MySQL database named `smilespots_db` (or change `$DB_NAME` in `adminFolder/db.php`).
3. Open the app in the browser: http://localhost/SmileSpots/mainFolder/index.html and admin at http://localhost/SmileSpots/adminFolder/admin.html

## Example tasks and where to look

- Add a new public filter: update `mainFolder/script.js` (client filter UI) and `mainFolder/getLocations.php` (SQL + output shape). See how existing selects (`spotType`, `subCategory`) are wired.
- Fix admin form validation bug: inspect `adminFolder/admin-script.js` (client validation) and `adminFolder/addItem.php` (server validation). The server returns useful `message` and `sql_error` fields — use them in UI feedback.

## When editing APIs

- Preserve the JSON response contract ({ success: bool, message?, sql_error?, id? }) so the admin UI continues to work.
- Keep `Content-Type: application/json` on JSON responses and check for `php://input` parsing as done in existing endpoints.

---

If anything in these notes is unclear or you'd like more detail (example request/response pairs, DB schema references, or preferred test harness), tell me which area to expand and I will iterate.
