#  PathVoyager – Intelligent Travel Route Planner

PathVoyager is a backend-driven travel route planning system that computes **shortest paths between locations using Dijkstra’s Algorithm**.  
The project integrates a **Node.js backend** with a **C++ implementation** of Dijkstra’s algorithm to efficiently process weighted graphs and return optimal travel routes.

---

##  Features

- Computes shortest travel paths using **Dijkstra’s Algorithm**
- Supports **weighted graphs**
- Handles **dynamic graph updates**
- Enables **multi-destination route planning**
- Backend-driven computation for improved performance

---

##  Tech Stack

- **Node.js** – Backend server and request handling
- **C++** – High-performance implementation of Dijkstra’s algorithm
- **JavaScript** – Backend orchestration
- **Child Processes** – Node.js invoking the C++ executable

---

##  Project Structure
```
PathVoyager/
├── server.js          # Node.js backend server
├── package.json       # Backend dependencies
├── package-lock.json
├── djikstra.cpp       # C++ implementation of Dijkstra’s algorithm
├── djikstra.exe       # Compiled executable (generated)
├── index.html
├── style.css         # Frontend interface 
└── script.js
```
---

