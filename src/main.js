const electron = require("electron");

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
const url = require("url");
const ChromeManager = require("./chrome-manager");
let mainWindow, cManager;

exports.cManager = cManager;

async function getChromium() {
  console.log("loading…");
  mainWindow.webContents.send("chrome-load");
  cManager = new ChromeManager({
    app,
    mainWindow
  });
  await cManager.setup();
  mainWindow.webContents.send("chrome-success", cManager.executablePath);
  console.log("loaded √");
}

function createWindow() {
  mainWindow = new BrowserWindow({ width: 800, height: 600 });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file:",
      slashes: true
    })
  );

  mainWindow.webContents.openDevTools();
  mainWindow.on("closed", () => (mainWindow = null));

  mainWindow.webContents.once("dom-ready", () => {
    getChromium();
  });
}

app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
