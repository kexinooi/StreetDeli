const http = require('http');
const mysql = require('mysql2');

// MySQL setup
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456789', // your MySQL password
    database: 'streetdeli'
});

connection.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('MySQL connected');
    }
});

// Helper to send JSON
function sendJSON(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

// Create HTTP server
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

    // Read request body
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        let data;
        try {
            if (body) data = JSON.parse(body);
        } catch (e) {
            return sendJSON(res, 400, { success: false, message: 'Invalid JSON' });
        }

        // --- SIGNUP ---
        if (req.url === '/signup' && req.method === 'POST') {
            const { email, phone, password } = data || {};

            console.log('[SIGNUP] Request received:', data);

            if (!password || (!email && !phone)) {
                return sendJSON(res, 400, { success: false, message: 'Missing signup info' });
            }

            // Check if user exists
            const checkField = email ? 'email' : 'phone';
            const checkValue = email || phone;

            connection.query(`SELECT * FROM users WHERE ${checkField} = ?`, [checkValue], (err, results) => {
                if (err) {
                    console.error('[SIGNUP] DB error:', err.sqlMessage);
                    return sendJSON(res, 500, { success: false, message: 'Database error' });
                }

                if (results.length > 0) {
                    const msg = email ? 'Email already registered' : 'Phone already registered';
                    console.log('[SIGNUP] Failed:', msg);
                    return sendJSON(res, 200, { success: false, message: msg });
                }

                // Insert new user
                connection.query(
                    'INSERT INTO users (phone, email, password) VALUES (?, ?, ?)',
                    [phone || null, email || null, password],
                    (err2, result) => {
                        if (err2) {
                            console.error('[SIGNUP] Insert error:', err2.sqlMessage);
                            return sendJSON(res, 500, { success: false, message: 'Database insert error' });
                        }
                        console.log('[SIGNUP] User registered successfully:', result.insertId);
                        sendJSON(res, 200, { success: true, message: 'User registered successfully' });
                    }
                );
            });
        }

        // --- LOGIN ---
        else if (req.url === '/login' && req.method === 'POST') {
            const { email, phone, password } = data || {};

            console.log('[LOGIN] Request received:', data);

            if (!password || (!email && !phone)) {
                return sendJSON(res, 400, { success: false, message: 'Missing login info' });
            }

            const checkField = email ? 'email' : 'phone';
            const checkValue = email || phone;

            connection.query(`SELECT * FROM users WHERE ${checkField} = ?`, [checkValue], (err, results) => {
                if (err) {
                    console.error('[LOGIN] DB error:', err.sqlMessage);
                    return sendJSON(res, 500, { success: false, message: 'Database error' });
                }

                if (results.length === 0) {
                    const msg = email ? 'Email not found' : 'Phone number not found';
                    console.log('[LOGIN] Failed:', msg);
                    return sendJSON(res, 200, { success: false, message: msg });
                }

                if (results[0].password !== password) {
                    console.log('[LOGIN] Failed: Wrong password');
                    return sendJSON(res, 200, { success: false, message: 'Wrong password' });
                }

                console.log('[LOGIN] Login successful for user id:', results[0].id);
                sendJSON(res, 200, { success: true, message: 'Login successful' });
            });
        }

        // --- UNKNOWN ROUTE ---
        else {
            sendJSON(res, 404, { success: false, message: 'Route not found' });
        }
    });
});

server.listen(3000, () => console.log('Server running at http://localhost:3000'));
