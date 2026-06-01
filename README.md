# 🌟 Quotable

**Quotable** is a sophisticated, event-driven desktop application designed to provide "gentle reminders" and mindful inspiration during key transitional moments. Built with Electron and React, it delivers stunning, full-screen overlays triggered by system events like startup, wake-from-sleep, or user inactivity.

🔗 **Visit the Website:** https://quotable-s1q8.onrender.com/

---

## ✨ Features

- **Intelligent Triggers:** Seamlessly intercepts system hooks to display quotes on startup, system wake, or after a custom inactivity period.
- **Sleep-Aware Inactivity:** Monitors system idle time, and intelligently accounts for time spent while the computer is suspended, ensuring you receive reminders after long breaks.
- **Offline-First Reliability:** Uses a local-first architecture with `better-sqlite3` for zero-latency performance and 100% offline functionality.
- **Real-Time Cloud Sync:** Integrated with Supabase for multi-device synchronization, ensuring your collection and preferences stay consistent across all your machines.
- **Community Explore:** Share your favorite quotes with the community and discover new inspiration from other users.
- **Immersive UX:** Beautifully designed glassmorphic overlays with customizable themes, typography, and transparency settings.
- **Robust Data Integrity:** Implements a sophisticated "tombstone" deletion system to ensure data consistency during cross-platform reconciliation.

---

## 🛠 Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, TanStack Router, Zustand
- **Backend:** Electron (Node.js), Better-SQLite3
- **Cloud/Auth:** Supabase (PostgreSQL, Auth, Real-time Sync)
- **Build Tools:** Vite, Bun, Electron Builder

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Bun](https://bun.sh/) (Recommended) or npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/quotable.git
   cd quotable
   ```

2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```

3. Configure your environment:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### Development

Run the Vite development server and Electron simultaneously:
```bash
npm run electron:dev
```

### Production Build

Build the frontend and package the application for your OS:
```bash
npm run build
npm run package
```

---

## 🔧 Troubleshooting Startup Issues

If you notice the app labeled as "electron.exe" in Task Manager's Startup tab:

1. Rebuild and repackage the app using `npm run package`.
2. Install the new version.
3. Open the app settings, toggle "Launch at Startup" **Off**, and then back **On**. 
   *This forces the app to re-register with Windows using the correct application name.*

---

## 📂 Project Structure

- `/electron`: Main process logic, IPC handlers, scheduler, and SQLite database management.
- `/src`: React frontend, state management (Zustand), and UI components.
- `/docs`: Detailed technical documentation for architecture and database schemas.

---

## 📄 License

This project is licensed under the MIT License - see the [license.md](license.md) file for details.
