
window.addEventListener('DOMContentLoaded', () => {
    const loading = document.getElementById('loading');
    const errorDiv = document.getElementById('initError');

    loading.style.display = 'flex';

    fetch('/cities')
        .then(response => {
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            return response.json();
        })
        .then(cities => {
            if (!cities?.length) throw new Error('No cities found in database');

            const populateDropdown = (selectId) => {
                const select = document.getElementById(selectId);
                select.innerHTML = '';

                const placeholder = new Option('Select City', '');
                placeholder.disabled = true;
                placeholder.selected = true;
                select.add(placeholder);

                cities.sort().forEach(city => {
                    select.add(new Option(city, city));
                });
            };

            populateDropdown('startCity');
            populateDropdown('endCity');
        })
        .catch(error => {
            errorDiv.innerHTML = `
                        <h3>⚠️ Initialization Failed</h3>
                        <p>${error.message}</p>
                    `;
            errorDiv.style.display = 'block';
        })
        .finally(() => {
            loading.style.display = 'none';
        });
});

// Trip Itinerary Functions
document.getElementById('tripForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const destination = document.getElementById('destination').value;
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    const notes = document.getElementById('notes').value;

    // Validation
    if (!destination || !startDate || !endDate) {
        alert('Please fill in all required fields');
        return;
    }
    if (startDate > endDate) {
        alert('End date must be after start date');
        return;
    }

    document.getElementById('itineraryDisplay').style.display = 'block';
    generateItinerary(destination, startDate, endDate, notes);
});

function generateItinerary(destination, startDate, endDate, notes) {
    const daysContainer = document.getElementById('itineraryDays');
    daysContainer.innerHTML = '';

    const timeDiff = endDate - startDate;
    const numDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

    for (let i = 0; i < numDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const daySection = document.createElement('div');
        daySection.className = 'day-section';
        daySection.innerHTML = `
                    <h3>Day ${i + 1} - ${currentDate.toDateString()}</h3>
                    <div class="activity-controls">
                        <input type="text" placeholder="Add activity" id="activityInput${i}">
                        <button onclick="addActivity(${i})">Add Activity</button>
                    </div>
                    <ul class="activity-list" id="activityList${i}"></ul>
                `;
        daysContainer.appendChild(daySection);
    }
}

function addActivity(dayIndex) {
    const input = document.getElementById(`activityInput${dayIndex}`);
    const activity = input.value.trim();

    if (activity) {
        const list = document.getElementById(`activityList${dayIndex}`);
        const li = document.createElement('li');
        li.className = 'activity-item';
        li.innerHTML = `
                    ${activity}
                    <button class="remove-btn" onclick="this.parentElement.remove()">Remove</button>
                `;
        list.appendChild(li);
        input.value = '';
    }
}

// Route Calculation Function
async function calculateRoute() {
    const start = document.getElementById('startCity').value;
    const end = document.getElementById('endCity').value;
    const optimizeType = document.getElementById('optimizeType').value;
    const transportType = document.getElementById('transportType').value;
    const resultDiv = document.getElementById('routeResult');

    resultDiv.innerHTML = '<div class="loading-text">Calculating route...</div>';

    try {
        const response = await fetch('/calculate-route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                start,
                end,
                optimizeType,
                transportType: transportType === 'all' ? 'all' : transportType
            })
        });

        const result = await response.json();

        if (result.error) {
            resultDiv.innerHTML = `
                        <div class="error-message">
                            <h3>❌ Route Error</h3>
                            <p>${result.error}</p>
                        </div>
                    `;
        } else {
            resultDiv.innerHTML = `
                    <div class="route-success">
                        <h3>✅ Optimal Route Found</h3>
                        <div class="route-steps">
                            ${result.path.map((city, index) => {
                const isFirst = index === 0;
                const isLast = index === result.path.length - 1;
                const transport = result.transports[index];

                return `
                                    ${!isFirst ? `
                                        <div class="transport-arrow">↑</div>
                                        <div class="transport-mode">${result.transports[index - 1]}</div>
                                        <div class="transport-arrow">→</div>
                                    ` : ''}
                                    <div class="city">${city}</div>
                                `;
            }).join('')}
                        </div>
                        <div class="route-metrics">
                            <p>Total Distance: ${result.distance} km</p>
                            <p>Total Cost: $${result.cost}</p>
                        </div>
                    </div>
                `;

        }
    } catch (error) {
        resultDiv.innerHTML = `
                    <div class="route-success">
                        <h3>✅ Optimal Route Found</h3>
                        <div class="route-steps">
                            ${result.path.map((city, i) => `
                                ${i > 0 ? `
                                    <div class="transport-mode">${result.transports[i - 1]}</div>
                                    <div class="transport-arrow">→</div>
                                ` : ''}
                                <div class="city">${city}</div>
                            `).join('')}
                        </div>
                        <div class="route-metrics">
                            <p>Total Distance: ${result.distance} km</p>
                            <p>Total Cost: $${result.cost}</p>
                        </div>
                    </div>
                `;
    }
}
