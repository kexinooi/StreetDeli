const http = require('http');
const mysql = require('mysql2');

// MySQL setup
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456789', // your MySQL password
    database: 'streetdeli' // your database name
});

connection.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('MySQL connected');
    }
});

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { email, phone, password } = data;

                if (!password || (!email && !phone)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Missing login info' }));
                    return;
                }

                // Check if user exists first
                let query = '';
                let value = '';
                if (email) {
                    query = 'SELECT * FROM users WHERE email = ?';
                    value = [email];
                } else {
                    query = 'SELECT * FROM users WHERE phone = ?';
                    value = [phone];
                }

                connection.query(query, value, (err, results) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Database error' }));
                        return;
                    }

                    if (results.length === 0) {
                        const msg = email ? 'Email not found' : 'Phone number not found';
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: msg }));
                        return;
                    }

                    // Check password
                    if (results[0].password !== password) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Wrong password' }));
                        return;
                    }

                    // Success
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Login successful' }));
                });

            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Route not found' }));
    }
});

server.listen(3000, () => console.log('Server running at http://localhost:3000'));
