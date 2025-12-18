const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

app.get('/cities', (req, res) => {
    try {
        const data = fs.readFileSync('cities.csv', 'utf8');
        const cities = new Set();
        
        data.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const parts = trimmed.split(',');
                if (parts.length >= 2) {
                    const fromCity = parts[0].trim();
                    const toCity = parts[1].trim();
                    if (fromCity) cities.add(fromCity);
                    if (toCity) cities.add(toCity);
                }
            }
        });
        
        res.json(Array.from(cities).sort());
    } catch (err) {
        console.error('Cities endpoint error:', err);
        res.status(500).json({ 
            error: 'Failed to load cities data',
            details: err.message
        });
    }
});

app.post('/calculate-route', (req, res) => {
    const { start, end, optimizeType, transportType = 'all' } = req.body;

    if (!start || !end) {
        return res.status(400).json({ error: 'Missing start or end city' });
    }

    const args = [
        start.trim(),
        end.trim(),
        optimizeType.trim().toLowerCase(),
        transportType.trim().toUpperCase()
    ];

    const child = spawn('./djikstra.exe', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (data) => stdout += data);

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (data) => stderr += data);

    child.on('error', (err) => {
        console.error('Child process error:', err);
        res.status(500).json({ 
            error: 'Failed to start calculation',
            details: err.message
        });
    });

    child.on('close', (code) => {
        if (code !== 0) {
            console.error('Process exited with code', code, 'Stderr:', stderr);
            return res.status(500).json({
                error: 'Route calculation failed',
                details: stderr || 'Unknown error'
            });
        }

        try {
            const result = JSON.parse(stdout);
            
            if (result.error) {
                res.status(404).json(result);
            } else {
                if (!result.transports) {
                    result.transports = [];
                }
                res.json(result);
            }
        } catch (e) {
            console.error('JSON parse error:', e, 'Raw output:', stdout);
            res.status(500).json({
                error: 'Invalid response format',
                details: stdout
            });
        }
    });

    const csvStream = fs.createReadStream('cities.csv', 'utf8');
    csvStream.on('error', (err) => {
        console.error('CSV read error:', err);
        child.kill();
        res.status(500).json({ error: 'Failed to read cities data' });
    });

    csvStream.pipe(child.stdin);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Available endpoints:');
    console.log(`- GET  /cities`);
    console.log(`- POST /calculate-route`);
});