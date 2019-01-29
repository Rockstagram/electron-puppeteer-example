# electron-puppeteer-example

An example of Puppeteer launch within an Electron APP.

## chrome-manager

This file handles the chromium logic.
If the user has Chrome, then the executable path will be the one from the local chrome.
If the user does not have Chrome, then the chromium matching his OS is downloaded and used as executable path.
