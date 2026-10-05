import { spawn } from 'node:child_process';
import net from 'node:net';

const mainPort = parseInt(process.env.PORT || '8080', 10);
const altPort = mainPort === 8080 ? 3000 : 8080;

process.env.PORT = String(mainPort);
process.env.HOSTNAME = '0.0.0.0';

console.log(`[runner] Starting Next.js standalone on port ${mainPort} (alt port ${altPort})...`);

const child = spawn('node', ['server.js'], { stdio: 'inherit' });

// Forward altPort to mainPort so that whether Railway's domain router targets 8080 or 3000,
// incoming connections always reach Next.js and never fail with 502 Bad Gateway.
const proxy = net.createServer((socket) => {
    const client = net.connect(mainPort, '127.0.0.1');
    socket.pipe(client).pipe(socket);
    socket.on('error', () => {});
    client.on('error', () => {});
});

proxy.on('error', (err) => {
    // Non-fatal if alt port is already in use
    console.warn(`[runner] Alt port ${altPort} proxy note:`, err.message);
});

setTimeout(() => {
    try {
        proxy.listen(altPort, '0.0.0.0', () => {
            console.log(`[runner] Alt port ${altPort} -> ${mainPort} proxy active`);
        });
    } catch (e) {
        // Ignored
    }
}, 1500);

const forwardSignal = (sig) => {
    try {
        child.kill(sig);
    } catch (_) {}
};

process.on('SIGTERM', () => forwardSignal('SIGTERM'));
process.on('SIGINT', () => forwardSignal('SIGINT'));

child.on('exit', (code) => process.exit(code ?? 0));
