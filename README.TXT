================================================================================
  SIGNAGEMANAGER — PRODUCT REQUIREMENT DOCUMENT
================================================================================

  Version   : 1.0
  Date      : May 28, 2026
  Author    : Landmark University Signage Team
  Contact   : superadmin@landmark.edu.ng

================================================================================
  TABLE OF CONTENTS
================================================================================

  1.  Project Overview
  2.  Goals & Objectives
  3.  User Roles & Permissions
  4.  Core Modules
       4.1  Authentication
       4.2  Media Library
       4.3  Playlist Management
       4.4  Screen Management
       4.5  Schedule Management
       4.6  Player
       4.7  Dashboard
  5.  Data Model & Relationships
  6.  Technical Architecture
  7.  Step-by-Step Project Workflow
  8.  Status Reference
  9.  File & Storage Specifications
  10. API & Route Reference
  11. Environment Setup

================================================================================
  1. PROJECT OVERVIEW
================================================================================

  SignageManager is a web-based digital signage management system built for
  Landmark University. It enables administrators to upload images and videos,
  organise them into playlists, register physical display screens, and schedule
  what content plays on each screen and when.

  Physical screens (TVs, monitors, kiosks) play content by navigating to a
  public player URL — no dedicated app or software installation is required on
  the screen device. Any browser-capable device can act as a display.

  The system supports both landscape (16:9) and portrait (9:16) screen
  orientations, making it suitable for horizontally mounted TVs as well as
  vertical kiosk-style displays.

================================================================================
  2. GOALS & OBJECTIVES
================================================================================

  PRIMARY GOALS
  -------------
  - Centralise all digital signage content in one web application
  - Allow non-technical staff to upload, organise, and schedule content
  - Enable screens to display content automatically without manual interaction
  - Support scheduling so content changes happen at the right time automatically

  KEY OUTCOMES
  ------------
  - Reduce manual effort in updating display screens across campus
  - Ensure the right content reaches the right screen at the right time
  - Provide real-time monitoring to know which screens are online or offline
  - Support both landscape (hallway TVs) and portrait (kiosk displays) screens

================================================================================
  3. USER ROLES & PERMISSIONS
================================================================================

  Three roles exist in the system. Each role is assigned per user account.

  +-------------+---------------------------------------------------------------+
  | Role        | Permissions                                                   |
  +-------------+---------------------------------------------------------------+
  | Super Admin | Full access to everything. Can manage all users' content.    |
  |             | Can delete any media, playlist, screen, or schedule.         |
  +-------------+---------------------------------------------------------------+
  | Admin       | Can upload and manage their own media. Can create and edit   |
  |             | playlists and screens. Can create schedules. Cannot delete   |
  |             | or modify content that belongs to another admin.             |
  +-------------+---------------------------------------------------------------+
  | Viewer      | Read-only. Can view the media library, playlists, screens,   |
  |             | and schedules but cannot create, edit, or delete anything.   |
  +-------------+---------------------------------------------------------------+

  DEFAULT SEEDED ACCOUNTS (for development)
  ------------------------------------------
  Email                          Password     Role
  superadmin@landmark.edu.ng     password     Super Admin
  admin@landmark.edu.ng          password     Admin
  viewer@landmark.edu.ng         password     Viewer

================================================================================
  4. CORE MODULES
================================================================================

  -------------------------------
  4.1  AUTHENTICATION
  -------------------------------

  Provided by Laravel Fortify. The following auth features are supported:

  - Email and password login
  - User registration
  - Password reset via email link
  - Email verification
  - Two-factor authentication (TOTP via authenticator app)
  - Two-factor recovery codes
  - Passkey / WebAuthn login
  - Profile updates (name, email, password)
  - Session management

  All authenticated routes require a verified email address.
  Unauthenticated users are redirected to /login.

  -------------------------------
  4.2  MEDIA LIBRARY
  -------------------------------

  PURPOSE
  The media library is the central store for all uploadable content —
  images and videos — that can later be added to playlists.

  SUPPORTED FILE TYPES
  +----------+----------------------------------+----------+
  | Category | Accepted MIME Types              | Max Size |
  +----------+----------------------------------+----------+
  | Image    | image/jpeg, image/png,           | 50 MB    |
  |          | image/gif, image/webp            |          |
  +----------+----------------------------------+----------+
  | Video    | video/mp4, video/webm,           | 500 MB   |
  |          | video/quicktime (.mov)           |          |
  +----------+----------------------------------+----------+

  MEDIA ATTRIBUTES
  +------------------+-------------------------------------------------------+
  | Field            | Description                                           |
  +------------------+-------------------------------------------------------+
  | name             | Display name. Auto-set from filename on upload.       |
  | type             | "image" or "video"                                    |
  | orientation      | Derived from dimensions. "landscape" if width >=      |
  |                  | height (16:9). "portrait" if height > width (9:16).   |
  |                  | Null until processing completes.                      |
  | status           | pending → processing → ready  (or failed)             |
  | size             | File size in bytes                                    |
  | duration         | Video length in seconds (extracted by FFmpeg)         |
  | width / height   | Pixel dimensions (extracted during processing)        |
  | thumbnail_url    | Preview image URL. Auto-generated during processing.  |
  | disk             | Storage backend ("public" local, "s3" in production)  |
  +------------------+-------------------------------------------------------+

  PROCESSING PIPELINE
  After every upload, a background job (ProcessMediaJob) runs:

  Upload saved to storage
          |
    Status → Pending
          |
    Job dispatched to queue
          |
    Status → Processing
          |
    [Images]  GD reads width/height, generates 400x225 JPEG thumbnail
    [Videos]  FFmpeg reads width/height/duration,
              captures a frame at the 1-second mark as thumbnail
          |
    Status → Ready   (thumbnail visible, media available for playlists)
          |
    Status → Failed  (on error — retried up to 3 times)

  MULTIPLE FILE UPLOAD
  Users can select or drag-and-drop multiple files at once. The frontend
  queues all selected files and uploads them one at a time, showing a
  live progress bar per file and a green checkmark when each is done.
  The media grid refreshes automatically once all uploads complete.

  FILTERING
  The media library can be filtered by:
  - Type       : All / Images / Videos
  - Orientation: All / Landscape 16:9 / Portrait 9:16
  - Status     : All / Ready / Processing / Pending / Failed
  - Search     : Free-text search on media name

  -------------------------------
  4.3  PLAYLIST MANAGEMENT
  -------------------------------

  PURPOSE
  A playlist is an ordered sequence of media items that plays on a screen.

  PLAYLIST ATTRIBUTES
  +------------------------+--------------------------------------------------+
  | Field                  | Description                                      |
  +------------------------+--------------------------------------------------+
  | name                   | Playlist name                                    |
  | description            | Optional notes                                   |
  | is_looping             | Loop continuously (true) or play once (false)    |
  | default_image_duration | Seconds each image shows if no per-item override |
  +------------------------+--------------------------------------------------+

  PLAYLIST ITEMS
  Each item in a playlist links one Media file to the playlist.

  +------------------+-------------------------------------------------------+
  | Field            | Description                                           |
  +------------------+-------------------------------------------------------+
  | sort_order       | Position in the playlist (1, 2, 3 …)                  |
  | duration         | Per-item display duration override (seconds).         |
  |                  | If null, falls back to playlist default_image_duration|
  | effective_duration | Resolved duration used by the player               |
  +------------------+-------------------------------------------------------+

  RULES
  - Only media with status "ready" can be added to a playlist
  - Items can be reordered by drag-and-drop
  - A playlist can be assigned to one or more screens simultaneously
  - Deleting a playlist does not delete the underlying media files

  -------------------------------
  4.4  SCREEN MANAGEMENT
  -------------------------------

  PURPOSE
  A screen represents one physical display device (TV, monitor, kiosk).

  SCREEN ATTRIBUTES
  +----------------------+----------------------------------------------------+
  | Field                | Description                                        |
  +----------------------+----------------------------------------------------+
  | name                 | Friendly name (e.g. "Main Hall Display")           |
  | location             | Physical location (e.g. "Building A, Ground Floor")|
  | description          | Optional notes                                     |
  | pairing_code         | Unique 8-character code (e.g. "AB3X7KQP")         |
  |                      | Auto-generated on registration.                    |
  | orientation          | "landscape" (16:9) or "portrait" (9:16)            |
  |                      | Set to match the physical mounting of the screen.  |
  | timezone             | Screen's local timezone. Default: Africa/Lagos     |
  | status               | "online" or "offline" — updated by heartbeat       |
  | current_playlist_id  | The playlist currently playing on this screen      |
  | last_seen_at         | Timestamp of the most recent player heartbeat      |
  +----------------------+----------------------------------------------------+

  PAIRING CODE
  When a screen is registered in the system, a unique 8-character code is
  generated. This code is entered into the TV's browser as part of the
  Player URL. The code never changes unless the screen is deleted and
  re-registered.

  Player URL format:  http://[domain]/player/[PAIRING_CODE]
  Example:            http://localhost:8000/player/AB3X7KQP

  REAL-TIME SIGNALS
  The management app can send two signals to a screen in real time
  via WebSockets (Laravel Reverb):

  - Playlist Changed  : Screen reloads its playlist content immediately
  - Refresh Requested : Screen performs a full browser page reload

  -------------------------------
  4.5  SCHEDULE MANAGEMENT
  -------------------------------

  PURPOSE
  Schedules allow content to switch automatically on a screen at
  specific dates and times without manual intervention.

  SCHEDULE ATTRIBUTES
  +-------------+-------------------------------------------------------------+
  | Field       | Description                                                 |
  +-------------+-------------------------------------------------------------+
  | screen_id   | Which screen this schedule applies to                       |
  | playlist_id | Which playlist to play during this time window              |
  | starts_at   | When this schedule activates. Null = activate immediately.  |
  | ends_at     | When this schedule expires. Null = never expires.           |
  | is_active   | Toggle to enable/disable without deleting                   |
  +-------------+-------------------------------------------------------------+

  ACTIVE SCHEDULE LOGIC
  A schedule is currently active when ALL of the following are true:
    (a) is_active = true
    (b) starts_at is null OR starts_at <= current time
    (c) ends_at is null OR ends_at >= current time

  EXAMPLES
  - Morning announcements: starts_at = 07:00, ends_at = 09:00, is_active = true
  - Lunch menu: starts_at = 11:30, ends_at = 14:00, is_active = true
  - Permanent display: starts_at = null, ends_at = null, is_active = true
  - Disabled draft: is_active = false (ignored regardless of time)

  -------------------------------
  4.6  PLAYER
  -------------------------------

  PURPOSE
  The player is the page that runs inside the browser on the physical
  screen device. It requires no login. Any browser that can open the
  Player URL will start displaying content.

  HOW IT WORKS
  1. The physical TV opens: http://[domain]/player/[PAIRING_CODE]
  2. The server looks up the screen by pairing code
  3. The server returns the screen's assigned playlist with all media URLs
  4. The player renders each media item fullscreen in order
  5. Images display for their configured duration
  6. Videos play until completion
  7. If is_looping is true, the playlist restarts from the beginning
  8. The player sends periodic heartbeats → screen status updates to "online"
  9. The player listens on a private WebSocket channel for real-time signals

  WHEN NO PLAYLIST IS ASSIGNED
  The player shows a waiting screen with the pairing code displayed.
  It continues polling until a playlist is assigned.

  -------------------------------
  4.7  DASHBOARD
  -------------------------------

  The dashboard provides an at-a-glance overview of the system:

  - Total screens registered
  - Number of screens currently online
  - Total media files in the library
  - Total playlists created
  - Table of recently active screens with name, location, status,
    last-seen time, and currently assigned playlist

================================================================================
  5. DATA MODEL & RELATIONSHIPS
================================================================================

  ENTITIES AND RELATIONSHIPS

  User
    |-- owns many --> Media
    |-- owns many --> Playlist

  Media
    |-- belongs to --> User
    |-- used in many --> PlaylistItem

  Playlist
    |-- belongs to --> User
    |-- has many --> PlaylistItem
    |-- has many --> ScreenSchedule
    |-- has many --> Screen (via current_playlist_id)

  PlaylistItem
    |-- belongs to --> Playlist
    |-- belongs to --> Media

  Screen
    |-- belongs to --> User (creator)
    |-- belongs to --> Playlist (current_playlist_id, nullable)
    |-- has many --> ScreenSchedule

  ScreenSchedule
    |-- belongs to --> Screen
    |-- belongs to --> Playlist

  DIAGRAM

  User ─────────┬──── owns ────► Media
                │                  │
                │           in ────┘
                │          ▼
                └── owns ──► Playlist ──► PlaylistItem
                                 │
                                 │ assigned to
                                 ▼
                              Screen ──► ScreenSchedule ──► Playlist
                                 │
                                 └──► Player URL (public, no auth)

================================================================================
  6. TECHNICAL ARCHITECTURE
================================================================================

  +------------------------+--------------------------------------------------+
  | Component              | Technology                                       |
  +------------------------+--------------------------------------------------+
  | Backend framework      | Laravel 13 (PHP 8.4)                             |
  | Frontend framework     | React 19                                         |
  | SPA bridge             | Inertia.js v3 (no REST API needed)               |
  | Styling                | TailwindCSS v4                                   |
  | Database               | MySQL 8.4                                        |
  | File storage (local)   | Laravel public disk (storage/app/public)         |
  | File storage (prod)    | AWS S3                                           |
  | Image processing       | PHP GD extension                                 |
  | Video processing       | FFmpeg via pbmedia/laravel-ffmpeg                |
  | Background jobs        | Laravel Queue (database driver)                  |
  | Real-time / WebSockets | Laravel Reverb                                   |
  | Authentication         | Laravel Fortify                                  |
  | Typed route functions  | Laravel Wayfinder                                |
  | Testing                | Pest v4                                          |
  | Code formatter         | Laravel Pint                                     |
  | Build tool             | Vite 8 with @laravel/vite-plugin                 |
  +------------------------+--------------------------------------------------+

================================================================================
  7. STEP-BY-STEP PROJECT WORKFLOW
================================================================================

  This section describes the complete end-to-end workflow from first login
  to content playing on a physical screen.

  ─────────────────────────────────────────────────────────
  STEP 1 — LOG IN
  ─────────────────────────────────────────────────────────

  1. Open your browser and navigate to http://localhost:8000
  2. You are automatically redirected to /login
  3. Enter your email and password
     (Default: superadmin@landmark.edu.ng / password)
  4. Click "Log in"
  5. On success you land on the Dashboard at /dashboard

  ─────────────────────────────────────────────────────────
  STEP 2 — UPLOAD MEDIA FILES
  ─────────────────────────────────────────────────────────

  1. In the left navigation, click "Media Library"
  2. You are taken to /media
  3. Drag and drop one or more image or video files into the upload zone,
     OR click the zone to open your file picker and select multiple files
  4. All selected files appear in a queue list below the upload zone,
     each showing filename, file size, and file type icon
  5. Click "Upload N files" to begin uploading
  6. Each file uploads one at a time with a live percentage progress bar
  7. A green checkmark appears on each file when its upload is done
  8. In the media grid, each newly uploaded file shows status "Pending"
  9. Within seconds the status changes to "Processing" (background job running)
 10. When processing finishes the status changes to "Ready" and a thumbnail
     appears on the card
 11. An orientation badge is shown on each card:
       Monitor icon + "16:9"  → landscape file (width >= height)
       Phone icon   + "9:16"  → portrait file  (height > width)

  NOTE: Videos take longer to process than images because FFmpeg must
  read the video stream to extract duration, dimensions, and a thumbnail.

  ─────────────────────────────────────────────────────────
  STEP 3 — CREATE A PLAYLIST
  ─────────────────────────────────────────────────────────

  1. In the left navigation, click "Playlists"
  2. Click "New Playlist"
  3. Fill in the form:
       Name                    : e.g. "Morning Announcements"
       Description             : Optional
       Loop playlist           : Toggle on to repeat indefinitely
       Default image duration  : How many seconds each image stays on screen
  4. Click "Create Playlist"
  5. You are taken to the playlist detail page
  6. Click "Add Media" to open the media picker
  7. Select one or more Ready media items to add to the playlist
  8. The items appear in the playlist with their order number
  9. Drag items to reorder them
 10. Optionally click the duration field on any item to override how long
     that specific item displays (overrides the playlist default)
 11. The playlist is now ready to be assigned to a screen

  ─────────────────────────────────────────────────────────
  STEP 4 — REGISTER A SCREEN
  ─────────────────────────────────────────────────────────

  1. In the left navigation, click "Screens"
  2. Click "Add Screen"
  3. Fill in the form:
       Screen Name  : e.g. "Main Hall Display"
       Location     : e.g. "Building A, Ground Floor"
       Description  : Optional notes
       Timezone     : The screen's local timezone (default: Africa/Lagos)
       Orientation  : Select Landscape (16:9) if the TV is mounted
                      horizontally. Select Portrait (9:16) if mounted
                      vertically like a kiosk or standing display.
  4. Click "Register Screen"
  5. A unique 8-character Pairing Code is generated, e.g. "AB3X7KQP"
  6. Note the full Player URL displayed on the screen detail page:
       http://localhost:8000/player/AB3X7KQP

  ─────────────────────────────────────────────────────────
  STEP 5 — CONNECT THE PHYSICAL SCREEN
  ─────────────────────────────────────────────────────────

  1. Walk to the physical TV or monitor
  2. Open a browser on the device (Chrome recommended)
  3. Navigate to the Player URL noted in Step 4, e.g.:
       http://[your-domain]/player/AB3X7KQP
  4. The screen connects to the system and begins listening
  5. Back in the management app, the screen status changes to "Online"
     on the Dashboard and Screens list
  6. If no playlist has been assigned yet, the screen shows a waiting
     screen displaying the pairing code

  ─────────────────────────────────────────────────────────
  STEP 6 — ASSIGN A PLAYLIST TO THE SCREEN
  ─────────────────────────────────────────────────────────

  1. In the management app, go to Screens
  2. Click on the screen name to open its detail page
  3. Under "Assign Playlist", select a playlist from the dropdown
  4. Click "Save Assignment"
  5. The physical screen receives a real-time signal via WebSocket
     and immediately begins playing the selected playlist
  6. The screens list and dashboard update to show the playlist name

  ─────────────────────────────────────────────────────────
  STEP 7 — (OPTIONAL) SET A SCHEDULE
  ─────────────────────────────────────────────────────────

  Use schedules when you want content to change automatically at
  specific times — for example, show a morning playlist from 7am–10am
  and switch to an afternoon playlist from 12pm–3pm.

  1. In the left navigation, click "Schedules"
  2. Click "New Schedule"
  3. Select the screen from the dropdown
  4. Select the playlist to play during this time window
  5. Set "Starts At" date and time (leave blank to activate immediately)
  6. Set "Ends At" date and time (leave blank to never expire)
  7. Toggle "Active" to enabled
  8. Click "Create Schedule"
  9. The system will switch the screen to that playlist automatically
     when the start time arrives, and revert it when the end time passes

  Multiple schedules can be set on the same screen for different time
  windows. They are evaluated in real time.

  ─────────────────────────────────────────────────────────
  STEP 8 — MONITOR YOUR SCREENS
  ─────────────────────────────────────────────────────────

  1. The Dashboard shows:
       - Total screens vs. online screens count
       - Recently active screens with last-seen time
  2. The Screens list shows each screen's current status (Online/Offline),
     orientation (16:9 or 9:16), current playlist, and last-seen time
  3. To force a screen to reload its content remotely:
       - Open the screen detail page
       - Click "Remote Refresh"
       - The physical TV performs a full browser reload immediately
  4. If a screen shows "Offline", it means the player page has been
     closed, the device lost internet, or the TV was turned off

================================================================================
  8. STATUS REFERENCE
================================================================================

  MEDIA STATUS
  +------------+--------------------------------------------------------------+
  | Status     | Meaning                                                      |
  +------------+--------------------------------------------------------------+
  | pending    | File uploaded to storage. Waiting for queue worker to pick   |
  |            | up the processing job.                                       |
  | processing | Background job is running. FFmpeg or GD is extracting        |
  |            | dimensions, duration, and generating the thumbnail.          |
  | ready      | Fully processed. Thumbnail generated. Can be added to        |
  |            | playlists and played on screens.                             |
  | failed     | Processing encountered an error. The job will retry up to    |
  |            | 3 times. If all retries fail the status stays "failed".      |
  +------------+--------------------------------------------------------------+

  SCREEN STATUS
  +------------+--------------------------------------------------------------+
  | Status     | Meaning                                                      |
  +------------+--------------------------------------------------------------+
  | online     | The player page is open and the screen is sending            |
  |            | heartbeats to the server.                                    |
  | offline    | No heartbeat received. The TV may be off, the browser        |
  |            | closed, or the network disconnected.                         |
  +------------+--------------------------------------------------------------+

================================================================================
  9. FILE & STORAGE SPECIFICATIONS
================================================================================

  LOCAL DEVELOPMENT
  -----------------
  Files are stored in: storage/app/public/
  Served via symlink at: public/storage/
  URL pattern: http://localhost:8000/storage/[path]

  To create the symlink (run once after setup):
    php artisan storage:link

  PRODUCTION (AWS S3)
  -------------------
  Set the following in your .env file:
    FILESYSTEM_DISK=s3
    AWS_ACCESS_KEY_ID=your-key
    AWS_SECRET_ACCESS_KEY=your-secret
    AWS_DEFAULT_REGION=us-east-1
    AWS_BUCKET=your-bucket-name

  File paths inside storage (same for both local and S3):
    media/[uuid].[ext]         — uploaded media files
    thumbnails/[uuid].jpg      — generated thumbnail images

================================================================================
  10. API & ROUTE REFERENCE
================================================================================

  All routes are web routes (session-authenticated), except the player.

  AUTHENTICATED ROUTES (require login + verified email)
  +--------+--------------------------------+-------------------------------+
  | Method | Path                           | Description                   |
  +--------+--------------------------------+-------------------------------+
  | GET    | /dashboard                     | Dashboard overview            |
  | GET    | /media                         | Media library                 |
  | POST   | /media                         | Upload a file                 |
  | GET    | /media/{id}                    | Get media details (JSON)      |
  | DELETE | /media/{id}                    | Delete a media file           |
  | GET    | /playlists                     | List all playlists            |
  | GET    | /playlists/create              | New playlist form             |
  | POST   | /playlists                     | Create a playlist             |
  | GET    | /playlists/{id}                | Playlist detail               |
  | PATCH  | /playlists/{id}                | Update playlist               |
  | DELETE | /playlists/{id}                | Delete playlist               |
  | POST   | /playlists/{id}/items          | Add item to playlist          |
  | PATCH  | /playlists/{id}/items/{item}   | Update playlist item          |
  | DELETE | /playlists/{id}/items/{item}   | Remove item from playlist     |
  | POST   | /playlists/{id}/items/reorder  | Reorder playlist items        |
  | GET    | /screens                       | List all screens              |
  | GET    | /screens/create                | Register screen form          |
  | POST   | /screens                       | Register a screen             |
  | GET    | /screens/{id}                  | Screen detail                 |
  | PATCH  | /screens/{id}                  | Update screen                 |
  | DELETE | /screens/{id}                  | Delete screen                 |
  | POST   | /screens/{id}/refresh          | Send refresh signal           |
  | GET    | /schedules                     | List all schedules            |
  | POST   | /schedules                     | Create a schedule             |
  | PATCH  | /schedules/{id}                | Update a schedule             |
  | DELETE | /schedules/{id}                | Delete a schedule             |
  +--------+--------------------------------+-------------------------------+

  PUBLIC ROUTES (no login required)
  +--------+--------------------------------+-------------------------------+
  | Method | Path                           | Description                   |
  +--------+--------------------------------+-------------------------------+
  | GET    | /player/{pairingCode}          | Screen player page            |
  +--------+--------------------------------+-------------------------------+

================================================================================
  11. ENVIRONMENT SETUP
================================================================================

  PREREQUISITES
  -------------
  - PHP 8.4 with extensions: GD, PDO, mbstring, OpenSSL, tokenizer, xml
  - Composer 2
  - Node.js 20+ and npm
  - MySQL 8.4
  - FFmpeg installed and accessible in system PATH

  FIRST-TIME SETUP
  ----------------
  Run the following command to set up everything in one step:

    composer run setup

  This command will:
    1. composer install     — install PHP dependencies
    2. Copy .env.example to .env
    3. php artisan key:generate  — generate the application key
    4. php artisan migrate       — create all database tables
    5. npm install          — install Node.js dependencies
    6. npm run build        — compile frontend assets

  STARTING THE DEVELOPMENT SERVER
  --------------------------------
  After setup, run:

    composer run dev

  This starts three processes concurrently:
    - php artisan serve     → Laravel server at http://localhost:8000
    - php artisan queue:listen --tries=1  → Background job worker
    - npm run dev           → Vite dev server with hot module replacement

  ENVIRONMENT VARIABLES (key settings in .env)
  ----------------------------------------------
  APP_URL=http://localhost:8000       Must include port for local dev
  FILESYSTEM_DISK=public             Use "s3" in production
  DB_CONNECTION=mysql
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_DATABASE=signagemanager
  DB_USERNAME=root
  DB_PASSWORD=
  QUEUE_CONNECTION=database
  BROADCAST_CONNECTION=reverb        For real-time WebSocket signals

  SEEDING THE DATABASE (optional)
  ---------------------------------
  To create the default demo user accounts:

    php artisan db:seed

  RUNNING TESTS
  -------------
    php artisan test --compact

================================================================================
  END OF DOCUMENT
================================================================================
