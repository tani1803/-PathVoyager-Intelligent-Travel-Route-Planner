#include<bits/stdc++.h>
using namespace std;

string trim(const string& str) {
    int size = str.size();
    int index = -1 , index2 =-1;
    string ans="";
    for(int i=0 ;i< size;i++){
        if(str[i] ==' '){
            index =i;
            continue;
        }
        break;
    }
    int k=index+1;
    for(int i=size-1 ;i>=k ;i--){
        if(str[i]!=' '){
        index2=i;
        break;
        }
    }
   for(int i=k;i<=index2;i++)
   {
    ans=ans+str[i];
   }
   return ans;
}

class Graph {
public:
    unordered_map<string, vector<pair<string, tuple<int, int, string>>>> adjList;

    void addEdge(string from, string to, int distance, int cost, string transport) {
        adjList[from].push_back({to, make_tuple(distance, cost, transport)});
        adjList[to].push_back({from, make_tuple(distance, cost, transport)});
    }

    string transportName(const string& code) {
        if (code == "F") return "Flight";
        if (code == "B") return "Bus";
        if (code == "T") return "Train";
        return "";
    }

    string shortestPath(string start, string end, bool useCost, string transportFilter) {
        priority_queue<pair<int, string>, vector<pair<int, string>>, greater<pair<int, string>>> pq;
        unordered_map<string, int> dist;
        unordered_map<string, string> prev;
        unordered_map<string, int> actualDist;
        unordered_map<string, int> actualCost;
        unordered_map<string, string> transportUsed;

        for (auto& city : adjList) {
            dist[city.first] = INT_MAX;
            actualDist[city.first] = 0;
            actualCost[city.first] = 0;
        }

        dist[start] = 0;
        actualDist[start] = 0;
        actualCost[start] = 0;
        pq.push({0, start});

        while (!pq.empty()) {
            int currentWeight = pq.top().first;
            string current = pq.top().second;
            pq.pop();

            if (current == end) break;

            for (auto& neighbor : adjList[current]) {
                string nextCity = neighbor.first;
                auto& edge = neighbor.second;
                int edgeDist = get<0>(edge);
                int edgeCost = get<1>(edge);
                string edgeTransport = get<2>(edge);
                int weight ;
               if(useCost)
               {
                weight=edgeCost;
               }
               else
               {
                weight=edgeDist;
               }

                int newDist = actualDist[current] + edgeDist;
                int newCost = actualCost[current] + edgeCost;
                int newWeight = currentWeight + weight;

                if (newWeight < dist[nextCity]) {
                    dist[nextCity] = newWeight;
                    actualDist[nextCity] = newDist;
                    actualCost[nextCity] = newCost;
                    prev[nextCity] = current;
                    transportUsed[nextCity] = edgeTransport;
                    pq.push({newWeight, nextCity});
                }
            }
        }

        if (dist[end] == INT_MAX || (start != end && (actualDist[end] == 0 || actualCost[end] == 0))) {
            stringstream error;
            error << R"({"error":")";
            if (transportFilter != "ALL") {
                string tname = transportName(transportFilter);
                error << "No valid " << tname << " routes exist between " << start << " and " << end;
            } else {
                error << "No routes exist between " << start << " and " << end;
            }
            error << R"("})";
            return error.str();
        }

        vector<string> path;
        vector<string> transports;
        string current = end;
        while (prev.find(current) != prev.end()) {
            path.push_back(current);
            transports.push_back(transportName(transportUsed[current]));
            current = prev[current];
        }
        path.push_back(start);
        reverse(path.begin(), path.end());
        reverse(transports.begin(), transports.end());

        stringstream json;
        json << R"({"path":[)";
        for (size_t i = 0; i < path.size(); i++) {
            json << (i ? "," : "") << R"(")" << path[i] << R"(")";
        }
        json << R"(],"transports":[)";
        for (size_t i = 0; i < transports.size(); i++) {
            json << (i ? "," : "") << R"(")" << transports[i] << R"(")";
        }
        json << R"(],"distance":)" << actualDist[end]
             << R"(,"cost":)" << actualCost[end] << "}";
        return json.str();
    }
};

int main(int argc, char* argv[]) {
    if (argc < 4) {
        cerr << "Usage: " << argv[0] << " start end (distance|cost) [transport-type]\n";
        return 1;
    }

    Graph g;
    string line;
    string transportFilter;
    if(argc>=5)
    {
         transportFilter= trim(argv[4]);
    }
    else
    {
         transportFilter="all";
    }
    int size=transportFilter.size();
    for(int i=0;i<size;i++)
    {
        if(transportFilter[i]>='a' && transportFilter[i]<='z')

        transportFilter[i]-=32;
    }

    while (getline(cin, line)) {
        line = trim(line);
        if(line.empty() ) continue;

        istringstream ss(line);
        string from, to, type;
        int distance, cost;
        char comma;

        getline(ss, from, ',');
        from = trim(from);
        
        getline(ss, to, ',');
        to = trim(to);
        
        if (!(ss >> distance >> comma >> cost >> comma >> type)) continue;
        type = trim(type);
        transform(type.begin(), type.end(), type.begin(), ::toupper);

        if (transportFilter != "ALL" && type != transportFilter) continue;
        if(from.empty() || to.empty()) continue;

        g.addEdge(from, to, distance, cost, type);
    }

    bool useCost = (trim(argv[3]) == "cost");
    cout << g.shortestPath(trim(argv[1]), trim(argv[2]), useCost, transportFilter);

    return 0;
}