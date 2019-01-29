// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const puppeteer = require("puppeteer-core");

const remote = require("electron").remote;
const app = remote.app;
console.log("userData", app.getPath("userData"));

let executablePath;

// renderer process
var ipcRenderer = require("electron").ipcRenderer;
ipcRenderer.on("chrome-load", () => {
  document.querySelector("#chromium").innerHTML = "loading…";
  console.log("loading…");
});

ipcRenderer.on("chrome-success", (event, arg) => {
  document.querySelector("#chromium").innerHTML = arg;
  console.log("success", event, arg);
  executablePath = arg;
});

async function getPic(url) {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath
  });
  const page = await browser.newPage();
  await page.goto(url);
  await page.setViewport({ width: 1200, height: 800 });
  const screen = await page.screenshot({ encoding: "base64" });
  document
    .querySelector("#output")
    .setAttribute("src", `data:image/png;base64, ${screen}`);

  await browser.close();
}

document.getElementById("start").addEventListener("click", function() {
  event.preventDefault();
  console.log("start");
  getPic("https://www.google.de");
});
