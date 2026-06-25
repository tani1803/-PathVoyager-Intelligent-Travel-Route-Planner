# PathVoyager – Intelligent Travel Route Planner

PathVoyager is a highly performant, multi-modal travel route optimization engine. 
The project integrates a **Node.js backend** with a custom **C++ implementation** of Dijkstra’s algorithm to compute the most efficient paths across a weighted transportation graph (Flight, Train, Bus, Drive).

---

## Features

- Computes optimal travel paths using **Dijkstra’s Algorithm**
- Supports **multi-modal weighted graphs** (Distance, Cost, Time)
- Handles **dynamic graph data** enriched via OpenRouteService
- **In-memory caching** via MongoDB for sub-second API responses
- Backend-driven computation via Inter-Process Communication (IPC)

---

## Tech Stack

- **Node.js & Express.js** – Backend REST API and orchestrator
- **C++** – High-performance algorithmic engine `O((V + E) log V)`
- **MongoDB** – Persistent graph storage and caching layer
- **Child Processes** – Node.js invoking the C++ executable via standard I/O
- **React.js** – Frontend interface for multi-leg itinerary visualization

---

## Project Structure

```
PathVoyager/
├── backend/
│   ├── route-engine/
│   │   ├── dijkstra.cpp         # C++ implementation of Dijkstra’s algorithm
│   │   └── dijkstra.exe         # Compiled executable (generated)
│   ├── scripts/
│   │   └── seedGraph.js         # Populates MongoDB with OpenRouteService data
│   ├── services/
│   │   └── route.services.js    # Node.js IPC bridge & cache management
│   ├── models/                  # MongoDB schemas
│   ├── routes/                  # API endpoints
│   └── server.js                # Node.js backend server
├── frontend/                    # React frontend application
├── .env.example                 # Environment variables template
└── package.json                 # Backend dependencies & compilation scripts
```

---

## Setup Instructions

1. **Install dependencies:** `npm install` and `cd frontend && npm install`
2. **Configure environment:** Copy `.env.example` to `.env` and add your MongoDB URI.
3. **Compile the engine:** `npm run compile`
4. **Seed the database:** `npm run seed`
5. **Start the application:** `npm run start` (Backend) and `npm start` (Frontend)
