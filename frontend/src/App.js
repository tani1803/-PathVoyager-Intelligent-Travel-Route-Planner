import React, { useState, useEffect, useRef } from 'react';

const CityAutocomplete = ({ label, id, placeholder, value, onChange }) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Sync external value changes
    if (value !== query) {
      setQuery(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const fetchCities = async () => {
      // Avoid fetching if query is exactly the selected value, or too short
      if (!query || query.length < 2 || query === value) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&featuretype=city&limit=5`);
        const data = await res.json();
        
        // Extract unique city names
        const uniqueCities = Array.from(new Set(data.map(item => item.display_name.split(',')[0])));
        setSuggestions(uniqueCities);
      } catch (err) {
        console.error("Error fetching cities", err);
      }
    };

    const debounce = setTimeout(() => {
      fetchCities();
    }, 500);

    return () => clearTimeout(debounce);
  }, [query, value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="form-group" style={{ position: 'relative' }} ref={dropdownRef}>
      <label htmlFor={id}>{label}</label>
      <input
        type="text"
        id={id}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => { if(suggestions.length > 0) setShowDropdown(true); }}
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className="autocomplete-dropdown" style={{
          position: 'absolute', top: '100%', left: 0, right: 0, 
          background: 'white', border: '1px solid #ddd', borderRadius: '4px',
          zIndex: 10, listStyle: 'none', padding: 0, margin: 0, 
          maxHeight: '150px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {suggestions.map((city, idx) => (
            <li 
              key={idx} 
              style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', color: '#333' }}
              onMouseDown={() => {
                setQuery(city);
                onChange(city);
                setShowDropdown(false);
              }}
              onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.background = 'white'}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


function App() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [preference, setPreference] = useState('distance');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!from || !to) {
      setError('Please enter both starting and destination cities.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Fetch from the backend running on port 3000
      const response = await fetch(`http://localhost:3000/api/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&preference=${preference}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Failed to fetch route');
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching the route.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Travel Planner</h1>
        <p>Find the optimal route between cities</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <CityAutocomplete
            label="Origin City"
            id="from"
            placeholder="e.g., New York, Delhi"
            value={from}
            onChange={setFrom}
          />
          <CityAutocomplete
            label="Destination City"
            id="to"
            placeholder="e.g., Los Angeles, Mumbai"
            value={to}
            onChange={setTo}
          />
        </div>

        <div className="form-group">
          <label htmlFor="preference">Optimization Preference</label>
          <select
            id="preference"
            value={preference}
            onChange={(e) => setPreference(e.target.value)}
          >
            <option value="distance">Shortest Distance</option>
            <option value="time">Fastest Time</option>
            <option value="cost">Lowest Cost</option>
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Calculating Route...' : 'Find Route'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {result && result.legs && (
        <div className="result-container">
          <div className="result-header">
            <h2>Optimal Route</h2>
            <div className="route-summary">
              {result.total !== undefined && (
                <div className="summary-item">
                  <span className="summary-label">
                    Total {result.preference.charAt(0).toUpperCase() + result.preference.slice(1)}
                  </span>
                  <span className="summary-value">
                    {result.total} {result.preference === 'distance' ? 'km' : result.preference === 'time' ? 'hrs' : '₹'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Multi-leg itinerary */}
          <div style={{ marginTop: '20px' }}>
            {result.legs.map((leg, index) => {
              const isFlight = leg.mode === 'flight';
              const color = isFlight ? '#4a90e2' : '#10b981';
              const bgColor = isFlight ? 'rgba(74,144,226,0.1)' : 'rgba(16,185,129,0.1)';
              const borderColor = isFlight ? 'rgba(74,144,226,0.3)' : 'rgba(16,185,129,0.3)';

              return (
                <div key={index}>
                  {/* From city node (only show for first leg) */}
                  {index === 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 8px ${color}60` }} />
                      <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#1e293b' }}>{leg.from}</span>
                    </div>
                  )}

                  {/* Leg connector with mode badge */}
                  <div style={{ display: 'flex', gap: '12px', margin: '4px 0' }}>
                    {/* Vertical line */}
                    <div style={{ width: '14px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: '2px', minHeight: '70px',
                        background: isFlight
                          ? 'repeating-linear-gradient(to bottom, #4a90e2 0, #4a90e2 6px, transparent 6px, transparent 12px)'
                          : '#10b981'
                      }} />
                    </div>
                    {/* Mode card */}
                    <div style={{
                      flex: 1, padding: '10px 14px',
                      background: bgColor, border: `1px solid ${borderColor}`,
                      borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.3em' }}>{isFlight ? '✈️' : '🚗'}</span>
                        <div>
                          <div style={{ color, fontWeight: '600', fontSize: '0.95rem' }}>
                            {isFlight ? `Fly: ${leg.from} → ${leg.to}` : `Drive: ${leg.from} → ${leg.to}`}
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '2px' }}>
                            {leg.distanceKm} km &nbsp;·&nbsp; {leg.timeHours} hrs
                          </div>
                        </div>
                      </div>
                      <div style={{ color, fontWeight: '700', fontSize: '1rem' }}>
                        ₹{leg.cost}
                      </div>
                    </div>
                  </div>

                  {/* To city node */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', marginBottom: index < result.legs.length - 1 ? '6px' : '0' }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: index < result.legs.length - 1 ? '#4a90e2' : '#10b981', flexShrink: 0, boxShadow: `0 0 8px ${index < result.legs.length - 1 ? '#4a90e260' : '#10b98160'}` }} />
                    <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#1e293b' }}>{leg.to}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
