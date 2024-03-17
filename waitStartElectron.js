const net = require('net');
const port = process.env.PORT ?? 3000;

process.env.ELECTRON_START_URL = `http://localhost:${port}`;

const client = new net.Socket();

console.log('tryConnection line 8');
let startedElectron = false;
console.log(port);
const tryConnection = () => client.connect({port: port}, () => {
    console.log('tryConnection');
        client.end();
        if(!startedElectron) {
            console.log('starting electron');
            startedElectron = true;
            const exec = require('child_process').exec;
            exec('npm run start:electron');
        }
    }
);

tryConnection();

client.on('error', (error) => {
    console.log(error);
    setTimeout(tryConnection, 1000);
});