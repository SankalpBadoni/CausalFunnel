# Causal Funnel Analytics Event Tracker & Dashboard

A lightweight, real-time user activity tracker, API backend, and visual analytics dashboard.

---

## 🛠️ Tech Stack

### 1. Client-Side (Tracker)
- **JavaScript (ES6)**: Vanilla IIFE (Immediately Invoked Function Expression) payload, optimized for async integration.
- **Cookies & LocalStorage**: Dual fallback persistence mechanism for tracking session identity.

### 2. Backend API
- **Node.js**: Server runtime.
- **Express.js**: REST API server framework.
- **Mongoose**: Object-Document Mapping (ODM) layer for MongoDB interactions.
- **Dotenv**: Environment variable loader.
- **Cors**: Cross-Origin Resource Sharing enablement for cross-domain tracker injections.

### 3. Database
- **MongoDB**: Schema database designed to store tracking event collections.

### 4. Dashboard (Frontend)
- **React.js**: Single-page UI framework.
- **Vite 5**: Fast build tool configured to support Node.js versions v20+.
- **Vanilla CSS**: Curated custom styling (without external UI frameworks like Tailwind) implementing a glassmorphism theme, timeline views, and visual heat overlays.

---

## 🚀 Setup Steps

### 1. Start MongoDB Database
Ensure MongoDB is running locally.
- Default connection URI: `mongodb://127.0.0.1:27017/causal_funnel`

### 2. Configure & Run Backend API
1. Navigate to the `backend/` directory.
2. The environment variables are set inside `backend/.env`. You can edit `MONGODB_URI` to put your database credentials:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/causal_funnel
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the backend:
   ```bash
   npm start
   ```
   *The server will run on [http://localhost:5000](http://localhost:5000).*

### 3. Run the React Dashboard
1. Navigate to the `dashboard/` directory.
2. Verify environment config in `dashboard/.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the dashboard in development mode:
   ```bash
   npm run dev
   ```
   *By default, Vite runs the UI on [http://localhost:5173](http://localhost:5173).*

### 4. Generate Mock Tracking Data
To test and generate event data:
1. Open the local demo page inside a browser:
   [http://localhost:5000/tracker/demo.html](http://localhost:5000/tracker/demo.html)
2. Click around various buttons, cards, links, and navigations.
3. Check the React Dashboard at [http://localhost:5173](http://localhost:5173) to see the sessions register and view the coordinates heatmap in real-time.

---

## 📌 Assumptions & Trade-offs

### 1. Click Coordinates Tracking
- **Assumption**: Clicks are mapped using page-relative scroll coordinates (`pageX`/`pageY`) instead of viewport-relative coordinates (`clientX`/`clientY`).
- **Trade-off**: This ensures click positions remain accurate even if the user scrolls before clicking. To display this in the dashboard, the page viewport size (`window.innerWidth` and `window.innerHeight`) is recorded along with the click, allowing the heatmap overlay to accurately simulate scale overlays.

### 2. Embedded Iframe for Heatmap
- **Assumption**: The tracked web page will be previewed behind the heatmap dots using an `<iframe>` container.
- **Trade-off**: Loading a page inside an iframe requires that the page does not set strict `X-Frame-Options` headers blocking frame embeddings. For our local `demo.html`, this works flawlessly. For external webpages that block frame loading, a dark grid fallback mode is provided so click coordinate groupings can still be plotted.

### 3. Session Identification Persistence
- **Assumption**: A simple session ID is generated on the client-side (starts with `sess_`).
- **Trade-off**: LocalStorage and Cookie Fallback ensures that session identity persists across page updates and browsing scopes. While a backend-generated session cookie is more secure, a client-side generator simplifies standalone script installations (e.g. static CDN deployments).

### 4. Vite Version Alignment
- **Assumption**: Vite 5 was explicitly set instead of Vite 8/Rolldown.
- **Trade-off**: The workspace container runs Node.js `v20.15.1`. Vite 8 requires Node.js `v20.19+` or `v22.12+`. Downgrading to Vite 5 ensures reliable local builds and execution compatibility with standard server runtimes.
