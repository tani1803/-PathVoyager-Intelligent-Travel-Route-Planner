# Intelligent Travel Route Planner

A high-performance route orchestration pipeline that integrates a **Node.js REST API backend** with real-time mapping services. This full-stack system dynamically computes and compares multi-modal travel routes, delivering sub-second optimization based on time, cost, and distance preferences.

---

## 🚀 Features

- **High-Performance Traversal:** Computes optimal travel paths dynamically using a highly optimized Node.js orchestration engine.
- **Sub-Second Route Optimization:** Models real-world travel options evaluating 3 asymmetric variables (time, cost, distance) for lightning-fast results.
- **Local Dataset & API Caching:** Minimizes external API latency by caching 130+ global hubs natively and mapping precise distances via OpenRouteService.
- **Multi-Modal Comparisons:** Seamlessly evaluates direct driving routes against multi-leg flight options based on user constraints.
- **MVC Architecture:** Built on a clean, scalable Model-View-Controller design pattern utilizing robust Express.js middlewares.

---

## 🛠️ Tech Stack

- **Node.js & Express** – REST API backend and core routing logic
- **JavaScript** – High-performance orchestrator for geocoding and haversine calculations
- **React** – Dynamic frontend interface
- **OpenRouteService API** – Real-time map rendering and driving distance calculations

---

## 📂 Project Structure
```text
TravelPlanner/
├── backend/
│   ├── data/          # Local caching datasets (cities, airports)
│   ├── utils/         # Cost and time estimation utilities
│   ├── routes/        # REST API endpoints (MVC pattern)
│   ├── services/      # Routing logic and API orchestration
│   ├── middleware/    # Request validation and sanitization
│   └── server.js      # Node.js backend server
├── frontend/
│   ├── public/        # Static assets
│   ├── src/           # React frontend interface
│   └── package.json   # Frontend dependencies
├── package.json       # Backend dependencies
├── .env               # Environment variables
├── .gitignore
└── README.md
```
---
