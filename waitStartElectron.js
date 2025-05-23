const net = require("net");
const port = process.env.PORT ?? 3000;

process.env.ELECTRON_START_URL = `http://localhost:${port}`;

const client = new net.Socket();

let startedElectron = false;
const tryConnection = () => {
  client.connect({ port: port }, () => {
    console.log("try to connect to " + port);
    client.end();
    if (!startedElectron) {
      console.log("starting electron");
      startedElectron = true;
      const exec = require("child_process").exec;
      exec("pnpm run start:electron");
    }
  });
};

tryConnection();

client.on("error", (error) => {
  setTimeout(tryConnection, 1000);
});
