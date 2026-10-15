import net from 'node:net';

export function createPortProxy(targetPort) {
    return net.createServer((socket) => {
        const client = net.connect(targetPort, '127.0.0.1');
        socket.pipe(client).pipe(socket);
        // A pipe forwards data and EOF, but does not close its destination on
        // errors. Tear down both legs on resets/refused connections so Railway
        // does not wait on an orphaned socket until its gateway timeout.
        socket.on('error', () => client.destroy());
        client.on('error', () => socket.destroy());
        socket.once('close', () => {
            if (socket.readableEnded) client.end();
            else client.destroy();
        });
        client.once('close', () => {
            // Let pending downstream writes flush after an orderly EOF.
            if (client.readableEnded) socket.end();
            else socket.destroy();
        });
    });
}
