import React, { useState, useEffect, useRef } from 'react';

// ── Graph-aware City Autocomplete ────────────────────────────────────────────
const CityAutocomplete = ({ label, id, placeholder, value, onChange, allCities }) => {
  const [query, setQuery]           = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (value !== query) setQuery(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (!query || query.length < 2) { setSuggestions([]); return; }
    const q = query.toLowerCase();
    const filtered = allCities
      .filter(c => c.toLowerCase().startsWith(q) || c.toLowerCase().includes(q))
      .slice(0, 8);
    setSuggestions(filtered);
    setShowDropdown(filtered.length > 0);
  }, [query, allCities]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="form-group" style={{ position: 'relative' }} ref={dropdownRef}>
      <label htmlFor={id}>{label}</label>
      <input
        type="text" id={id} placeholder={placeholder}
        value={query} autoComplete="off"
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setShowDropdown(true); }}
        onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className="autocomplete-dropdown" style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'white', border: '1px solid #ddd', borderRadius: '4px',
          zIndex: 100, listStyle: 'none', padding: 0, margin: 0,
          maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        }}>
          {suggestions.map((city, idx) => (
            <li key={idx}
              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', color: '#333', fontSize: '0.95rem' }}
              onMouseDown={() => { setQuery(city); onChange(city); setShowDropdown(false); }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f0f7ff'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Transport icon / style helpers ────────────────────────────────────────────
const TRANSPORT_META = {
  Flight: { icon: '✈️', color: '#4a90e2', bg: 'rgba(74,144,226,0.08)', border: 'rgba(74,144,226,0.25)', dash: true },
  Train:  { icon: '🚂', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.25)', dash: false },
  Bus:    { icon: '🚌', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  dash: false },
  Drive:  { icon: '🚗', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', dash: false },
};

const getMeta = (transport) => TRANSPORT_META[transport] || TRANSPORT_META.Drive;

// Format time in hours+minutes
const fmtTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

// ── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [from, setFrom]           = useState('');
  const [to, setTo]               = useState('');
  const [preference, setPreference] = useState('distance');
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [allCities, setAllCities] = useState([]);

  // Fetch city list from /api/cities on mount
  useEffect(() => {
    fetch('http://localhost:3000/api/cities')
      .then(r => r.json())
      .then(d => { if (d.cities) setAllCities(d.cities); })
      .catch(() => {}); // silently ignore if backend is down
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!from || !to) { setError('Please enter both origin and destination cities.'); return; }

    setLoading(true); setError(null); setResult(null);

    try {
      const res  = await fetch(
        `http://localhost:3000/api/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&preference=${preference}`
      );
      const data = await res.json();

      if (!res.ok || !data.success)
        throw new Error(data.error?.message || 'Failed to fetch route');

      setResult(data);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Build itinerary legs from path + transports arrays
  const buildLegs = (result) => {
    if (!result?.path || result.path.length < 2) return [];
    return result.transports.map((t, i) => ({
      from:      result.path[i],
      to:        result.path[i + 1],
      transport: t,
    }));
  };

  const legs = result ? buildLegs(result) : [];

  return (
    <div className="app-container">
      {/* Header */}
      <div className="header">
        <h1>PathVoyager</h1>
        <p>Intelligent route planning powered by Dijkstra's Algorithm</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <CityAutocomplete
            label="Origin City"    id="from"
            placeholder="e.g., Delhi, Mumbai"
            value={from} onChange={setFrom} allCities={allCities}
          />
          <CityAutocomplete
            label="Destination City" id="to"
            placeholder="e.g., London, Singapore"
            value={to}   onChange={setTo}   allCities={allCities}
          />
        </div>

        <div className="form-group">
          <label htmlFor="preference">Optimization Preference</label>
          <select id="preference" value={preference} onChange={(e) => setPreference(e.target.value)}>
            <option value="distance">📏 Shortest Distance</option>
            <option value="time">⚡ Fastest Time</option>
            <option value="cost">💰 Lowest Cost</option>
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Calculating...' : 'Find Optimal Route'}
        </button>
      </form>

      {/* Error */}
      {error && <div className="error-message">{error}</div>}

      {/* Result */}
      {result && result.path && (
        <div className="result-container">
          <div className="result-header">
            <h2>Optimal Route</h2>

            {/* Summary bar */}
            <div className="route-summary">
              <div className="summary-item">
                <span className="summary-label">📏 Distance</span>
                <span className="summary-value">{result.distance.toLocaleString()} km</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">⏱ Time</span>
                <span className="summary-value">{fmtTime(result.time)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">💰 Cost</span>
                <span className="summary-value">₹{result.cost.toLocaleString()}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">🔀 Legs</span>
                <span className="summary-value">{legs.length}</span>
              </div>
            </div>
          </div>

          {/* Itinerary */}
          <div style={{ marginTop: '20px' }}>
            {legs.map((leg, idx) => {
              const m = getMeta(leg.transport);
              return (
                <div key={idx}>
                  {/* Origin node */}
                  {idx === 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: m.color, flexShrink: 0, boxShadow: `0 0 8px ${m.color}60` }} />
                      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b' }}>{leg.from}</span>
                    </div>
                  )}

                  {/* Connector + mode card */}
                  <div style={{ display: 'flex', gap: '12px', margin: '4px 0' }}>
                    <div style={{ width: 14, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 2, minHeight: 64,
                        background: m.dash
                          ? `repeating-linear-gradient(to bottom, ${m.color} 0, ${m.color} 6px, transparent 6px, transparent 12px)`
                          : m.color,
                      }} />
                    </div>
                    <div style={{
                      flex: 1, padding: '10px 14px',
                      background: m.bg, border: `1px solid ${m.border}`,
                      borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.25em' }}>{m.icon}</span>
                        <div>
                          <div style={{ color: m.color, fontWeight: 600, fontSize: '0.95rem' }}>
                            {leg.transport}: {leg.from} → {leg.to}
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: 2 }}>
                            via {leg.transport}
                          </div>
                        </div>
                      </div>
                      <div style={{ color: m.color, fontWeight: 700, fontSize: '0.9rem', textAlign: 'right' }}>
                        {m.icon}
                      </div>
                    </div>
                  </div>

                  {/* Destination node */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 6, marginBottom: idx < legs.length - 1 ? 6 : 0 }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                      background: idx < legs.length - 1 ? getMeta(legs[idx + 1].transport).color : '#10b981',
                      boxShadow: `0 0 8px ${idx < legs.length - 1 ? getMeta(legs[idx + 1].transport).color : '#10b981'}60`,
                    }} />
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b' }}>{leg.to}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Algorithm note */}
          <div style={{
            marginTop: 20, padding: '10px 14px',
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 8, fontSize: '0.82rem', color: '#64748b',
          }}>
            ⚙️ Route computed by <strong>Dijkstra's Algorithm</strong> O((V + E) log V) on a weighted bidirectional graph
            — optimized for <strong>{preference}</strong>.
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
