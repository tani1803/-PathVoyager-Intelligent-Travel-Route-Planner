/**
 * dijkstra.cpp
 * High-performance Dijkstra's Shortest Path Engine
 *
 * Reads a weighted directed graph from stdin (CSV format):
 *   from,to,distance,cost,time,transport
 *
 * CLI Usage:
 *   ./dijkstra <start> <end> <distance|cost|time> [transport_filter]
 *
 * Output: JSON on stdout
 *   {"path":[...],"transports":[...],"distance":X,"cost":Y,"time":Z}
 *
 * Compile:  g++ -O2 -std=c++17 -o dijkstra.exe dijkstra.cpp   (Windows)
 *           g++ -O2 -std=c++17 -o dijkstra     dijkstra.cpp   (Linux/Mac)
 */

#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <unordered_map>
#include <queue>
#include <tuple>
#include <algorithm>
#include <climits>

using namespace std;

// ── Utilities ────────────────────────────────────────────────────────────────

string trim(const string& str) {
    size_t first = str.find_first_not_of(" \t\r\n");
    if (first == string::npos) return "";
    size_t last = str.find_last_not_of(" \t\r\n");
    return str.substr(first, last - first + 1);
}

string transportName(const string& code) {
    if (code == "F") return "Flight";
    if (code == "T") return "Train";
    if (code == "B") return "Bus";
    if (code == "D") return "Drive";
    return code;
}

// ── Graph Data Structures ────────────────────────────────────────────────────

struct Edge {
    string to;
    int    distance; // km
    int    cost;     // INR
    int    time;     // minutes
    string transport;
};

class Graph {
public:
    unordered_map<string, vector<Edge>> adjList;

    void addEdge(const string& from, const string& to,
                 int distance, int cost, int time, const string& transport) {
        adjList[from].push_back({ to, distance, cost, time, transport });
        adjList[to].push_back({ from, distance, cost, time, transport }); // bidirectional
    }

    // ── Dijkstra's Algorithm  O((V + E) log V) ──────────────────────────────
    string shortestPath(const string& start, const string& end,
                        const string& pref, const string& transportFilter) {

        // Validate source / destination
        if (adjList.find(start) == adjList.end())
            return "{\"error\":\"City not found: " + start + "\"}";
        if (adjList.find(end) == adjList.end())
            return "{\"error\":\"City not found: " + end + "\"}";
        if (start == end)
            return "{\"error\":\"Source and destination cannot be the same\"}";

        // Min-heap: (weight, city)
        priority_queue<pair<int,string>,
                       vector<pair<int,string>>,
                       greater<pair<int,string>>> pq;

        unordered_map<string, int>    dist;
        unordered_map<string, string> prev;
        unordered_map<string, string> edgeTransport;
        unordered_map<string, int>    accumDist;
        unordered_map<string, int>    accumCost;
        unordered_map<string, int>    accumTime;

        for (auto it = adjList.begin(); it != adjList.end(); ++it) {
            const string& city = it->first;
            dist[city]      = INT_MAX;
            accumDist[city] = 0;
            accumCost[city] = 0;
            accumTime[city] = 0;
        }

        dist[start] = 0;
        pq.push({ 0, start });

        while (!pq.empty()) {
            int curWeight    = pq.top().first;
            string cur       = pq.top().second;
            pq.pop();

            if (cur == end) break;
            if (curWeight > dist[cur]) continue; // stale entry - skip

            for (size_t ei = 0; ei < adjList[cur].size(); ++ei) {
                const Edge& e = adjList[cur][ei];
                if (transportFilter != "ALL" && e.transport != transportFilter) continue;

                int w = (pref == "cost")   ? e.cost :
                        (pref == "time")   ? e.time :
                                             e.distance;

                int newDist = dist[cur] + w;
                if (newDist < dist[e.to]) {
                    dist[e.to]         = newDist;
                    accumDist[e.to]    = accumDist[cur] + e.distance;
                    accumCost[e.to]    = accumCost[cur] + e.cost;
                    accumTime[e.to]    = accumTime[cur] + e.time;
                    prev[e.to]         = cur;
                    edgeTransport[e.to]= e.transport;
                    pq.push({ newDist, e.to });
                }
            }
        }

        if (dist[end] == INT_MAX) {
            string msg = (transportFilter != "ALL")
                ? "No " + transportName(transportFilter) + " route exists between " + start + " and " + end
                : "No route exists between " + start + " and " + end;
            return "{\"error\":\"" + msg + "\"}";
        }

        // ── Reconstruct path ─────────────────────────────────────────────────
        vector<string> path;
        vector<string> transports;
        string cur = end;
        while (prev.find(cur) != prev.end()) {
            path.push_back(cur);
            transports.push_back(transportName(edgeTransport[cur]));
            cur = prev[cur];
        }
        path.push_back(start);
        reverse(path.begin(), path.end());
        reverse(transports.begin(), transports.end());

        // -- Build JSON ---------------------------------------------------
        stringstream json;
        json << "{";

        json << "\"path\":[";
        for (size_t i = 0; i < path.size(); ++i)
            json << (i ? "," : "") << "\"" << path[i] << "\"";
        json << "]";

        json << ",\"transports\":[";
        for (size_t i = 0; i < transports.size(); ++i)
            json << (i ? "," : "") << "\"" << transports[i] << "\"";
        json << "]";

        json << ",\"distance\":" << accumDist[end];
        json << ",\"cost\":"     << accumCost[end];
        json << ",\"time\":"     << accumTime[end];
        json << "}";

        return json.str();
    }
};

// ── main ─────────────────────────────────────────────────────────────────────

int main(int argc, char* argv[]) {
    if (argc < 4) {
        cerr << "Usage: " << argv[0]
             << " <start> <end> <distance|cost|time> [transport]\n";
        return 1;
    }

    string startCity       = trim(argv[1]);
    string endCity         = trim(argv[2]);
    string preference      = trim(argv[3]);
    string transportFilter = (argc >= 5) ? trim(argv[4]) : "ALL";

    transform(transportFilter.begin(), transportFilter.end(),
              transportFilter.begin(), ::toupper);

    Graph g;
    string line;

    // Read graph edges from stdin: from,to,distance,cost,time,transport
    while (getline(cin, line)) {
        line = trim(line);
        if (line.empty() || line[0] == '#') continue;

        istringstream ss(line);
        string from, to, transport;
        int    distance, cost, time;
        char   comma;

        if (!getline(ss, from, ',')) continue;
        if (!getline(ss, to,   ',')) continue;
        if (!(ss >> distance >> comma >> cost >> comma >> time >> comma)) continue;
        if (!getline(ss, transport)) continue;

        from      = trim(from);
        to        = trim(to);
        transport = trim(transport);
        transform(transport.begin(), transport.end(), transport.begin(), ::toupper);

        if (from.empty() || to.empty() || transport.empty()) continue;
        if (transportFilter != "ALL" && transport != transportFilter) continue;

        g.addEdge(from, to, distance, cost, time, transport);
    }

    cout << g.shortestPath(startCity, endCity, preference, transportFilter);
    return 0;
}
