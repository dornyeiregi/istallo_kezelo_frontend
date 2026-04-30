const { existsSync } = require('fs');

function findFirstExisting(paths) {
  return paths.find((candidate) => existsSync(candidate));
}

function detectPuppeteerChromeBinary() {
  try {
    return require('puppeteer').executablePath();
  } catch {
    return undefined;
  }
}

function detectChromeBinary() {
  const puppeteerChromeBinary = detectPuppeteerChromeBinary();
  if (puppeteerChromeBinary) {
    return puppeteerChromeBinary;
  }

  if (process.env.CHROME_BIN) {
    return process.env.CHROME_BIN;
  }

  return findFirstExisting([
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Chromium\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Chromium\\Application\\chrome.exe',
  ]);
}

function detectFirefoxBinary() {
  return findFirstExisting([
    '/Applications/Firefox.app/Contents/MacOS/firefox',
    '/usr/bin/firefox',
    '/snap/bin/firefox',
    'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
    'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
  ]);
}

function detectDefaultBrowsers() {
  const explicit = process.env.KARMA_BROWSERS;
  if (explicit) {
    return explicit
      .split(',')
      .map((browser) => browser.trim())
      .filter(Boolean);
  }

  const chromeBinary = detectChromeBinary();
  if (chromeBinary) {
    process.env.CHROME_BIN = chromeBinary;
    return ['ChromeHeadless'];
  }

  if (detectFirefoxBinary()) {
    return ['FirefoxHeadless'];
  }

  if (process.platform === 'darwin') {
    return ['Safari'];
  }

  throw new Error(
    'No supported test browser found. Install Chrome/Chromium or Firefox, or set KARMA_BROWSERS.'
  );
}

// Karma configuration used by Angular tests.
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-safari-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],
    client: {
      clearContext: true,
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/istallo_kezelo_frontend'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }],
    },
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-dev-shm-usage'],
      },
    },
    reporters: ['progress', 'kjhtml'],
    browsers: detectDefaultBrowsers(),
    browserDisconnectTolerance: 2,
    browserDisconnectTimeout: 10000,
    browserNoActivityTimeout: 60000,
    captureTimeout: 120000,
    restartOnFileChange: true,
  });
};
