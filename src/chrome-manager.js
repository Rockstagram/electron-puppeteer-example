/**
 * This file checks if there is a puppeteer executable
 * on the machine if so, it will just use it
 * if not, it will download chromium and use that.
 *
 * executablePath:  the path of the chrome executable in our pc
 * setup() :    initialize Chromium handler
 * cleanup():   cleanup Chromium
 */

const rimraf = require("rimraf");
const extract = require("extract-zip");
const os = require("os");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");
const { download } = require("electron-dl");

module.exports = class PuppeteerWrapper {
  constructor({ logger, app, mainWindow }) {
    this._logger = logger || console;
    this._window = mainWindow;

    this.dataPath = app.getPath("userData");
    this.osType = this._getOs();
    this.defaultPath = this._getDefaultOsPath();
    this.chromiumPath = path.normalize(
      `${this.dataPath}/chrome-${this.osType}`
    );

    this.executablePath = undefined;

    this._logger.info(
      this.dataPath,
      this.osType,
      this.defaultPath,
      this.chromiumPath
    );
  }

  async setup() {
    this.executablePath = await this._getChromePath();
    return this;
  }

  async cleanup() {
    if (fs.existsSync(this.chromiumPath)) {
      rimraf.sync(this.chromiumPath);
      this._logger.info(`Unlinked ${this.chromiumPath}`);
    }
    if (fs.existsSync(`${this.chromiumPath}.zip`)) {
      fs.unlinkSync(`${this.chromiumPath}.zip`);
      this._logger.info(`Unlinked ${this.chromiumPath}.zip`);
    }
  }

  _getOs() {
    const osType = os.type().toLowerCase();
    this._logger.info(osType);
    if (osType.indexOf("dar") >= 0) {
      return "mac";
    } else if (osType.indexOf("lin") >= 0) {
      return "linux";
    } else {
      return "win";
    }
  }

  async _getChromePath() {
    if (fs.existsSync(this.defaultPath)) {
      this._logger.info(`User has chrome: ${this.defaultPath}`);
      return this.defaultPath;
    }

    const chromiumExecPath = this._getChromiumExecPath(this.chromiumPath);
    if (fs.existsSync(chromiumExecPath)) {
      this._logger.info(`User has Chromium: ${chromiumExecPath}`);
      return chromiumExecPath;
    }

    this._logger.info(`User has nothing. Downloading Chromium…`);
    await this._getChromium();
    return chromiumExecPath;
  }

  _getDefaultOsPath() {
    if (this.osType === "win") {
      return "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
    } else if (this.osType === "linux") {
      return false;
      // "/usr/bin/google-chrome"
    } else {
      return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    }
  }

  async _getChromium() {
    const url = await this._getUrl();
    this._logger.info("url:", url);
    this._logger.info("window:", this._window);
    await download(this._window, url, { directory: this.dataPath });
    this._logger.info("Success : Downloaded");
    await this._unzip();
    this._logger.info("Success : Unzip");
    fs.chmodSync(this.chromiumPath, 0o777);
    this._logger.info("Success : Permissions");
    return this.chromiumPath;
  }

  _getChromiumExecPath(folderPath = this.chromiumPath) {
    if (this.osType === "win") {
      return `${folderPath}\\chrome.exe`;
    } else if (this.osType === "linux") {
      return `${folderPath}/chrome`;
    } else {
      return `${folderPath}/Chromium.app/Contents/MacOS/Chromium`;
    }
  }

  async _getUrl() {
    const _base =
      "http://commondatastorage.googleapis.com/chromium-browser-snapshots";

    const osTypeCapital =
      this.osType.charAt(0).toUpperCase() + this.osType.slice(1);
    const base = `${_base}/${osTypeCapital}`;
    const resp = await fetch(`${base}/LAST_CHANGE`);
    const latest = await resp.text();

    return path.normalize(`${base}/${latest}/chrome-${this.osType}.zip`);
  }

  async _unzip() {
    const zipPath = `${this.chromiumPath}.zip`;
    return await new Promise(resolve => {
      extract(
        zipPath,
        { dir: this.dataPath, defaultDirMode: 777, defaultFileMode: 777 },
        err => {
          if (err) this._logger.error("Error : ", err);
          this._logger.info("Success : Unzipped");
          fs.unlinkSync(zipPath);
          this._logger.info("Success : Unlinked");
          resolve(this.chromiumPath);
        }
      );
    });
  }
};
