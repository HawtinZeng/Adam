import { appendFile } from "fs";

appendFile("child.txt", "hi", () => {});
setTimeout(() => {
  process.send("Hello father, I send this information");
}, 5000);
