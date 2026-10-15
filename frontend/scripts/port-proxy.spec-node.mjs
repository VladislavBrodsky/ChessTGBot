import assert from 'node:assert/strict';
import { once } from 'node:events';
import net from 'node:net';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { createPortProxy } from './port-proxy.mjs';

async function listen(t, server) {
    const sockets = new Set();
    server.on('connection', (socket) => {
        sockets.add(socket);
        socket.once('close', () => sockets.delete(socket));
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    t.after(async () => {
        for (const socket of sockets) socket.destroy();
        await new Promise((resolve) => server.close(resolve));
    });
    return server.address().port;
}

async function connect(t, port) {
    const socket = net.connect(port, '127.0.0.1');
    t.after(() => socket.destroy());
    await once(socket, 'connect');
    return socket;
}

async function closes(socket) {
    await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Paired socket was left open')), 1000);
        socket.once('close', () => {
            clearTimeout(timer);
            resolve();
        });
    });
}

test('alternate port forwards traffic in both directions', { timeout: 5000 }, async (t) => {
    const targetPort = await listen(t, net.createServer((socket) => socket.pipe(socket)));
    const proxyPort = await listen(t, createPortProxy(targetPort));
    const socket = await connect(t, proxyPort);
    socket.write('health check');
    const [data] = await once(socket, 'data');
    assert.equal(data.toString(), 'health check');
});

test('graceful upstream close flushes a buffered response completely', { timeout: 5000 }, async (t) => {
    const payload = Buffer.alloc(8 * 1024 * 1024, 'x');
    const targetPort = await listen(t, net.createServer((socket) => socket.end(payload)));
    const proxyPort = await listen(t, createPortProxy(targetPort));
    const socket = await connect(t, proxyPort);
    await delay(50);
    let received = 0;
    for await (const chunk of socket) received += chunk.length;
    assert.equal(received, payload.length, 'Connection cleanup must not truncate pending writes');
});

test('refused upstream closes the incoming connection', { timeout: 5000 }, async (t) => {
    const unused = net.createServer();
    unused.listen(0, '127.0.0.1');
    await once(unused, 'listening');
    const targetPort = unused.address().port;
    await new Promise((resolve) => unused.close(resolve));
    const proxyPort = await listen(t, createPortProxy(targetPort));
    const socket = await connect(t, proxyPort);
    await closes(socket);
});

test('client disconnect closes its upstream connection', { timeout: 5000 }, async (t) => {
    const target = net.createServer();
    const targetPort = await listen(t, target);
    const proxyPort = await listen(t, createPortProxy(targetPort));
    const accepted = once(target, 'connection');
    const socket = await connect(t, proxyPort);
    const [upstream] = await accepted;
    upstream.on('error', () => {});
    const closed = closes(upstream);
    socket.resetAndDestroy();
    await closed;
});

test('upstream disconnect closes the incoming connection', { timeout: 5000 }, async (t) => {
    const target = net.createServer();
    const targetPort = await listen(t, target);
    const proxyPort = await listen(t, createPortProxy(targetPort));
    const accepted = once(target, 'connection');
    const socket = await connect(t, proxyPort);
    const [upstream] = await accepted;
    const closed = closes(socket);
    upstream.resetAndDestroy();
    await closed;
});
