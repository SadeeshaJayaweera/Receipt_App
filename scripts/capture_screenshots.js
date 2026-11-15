const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  console.log('Launching headless Chrome from', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1440,960'
    ],
    defaultViewport: {
      width: 1440,
      height: 960,
      deviceScaleFactor: 2
    }
  });

  const page = await browser.newPage();

  console.log('1. Navigating to Login page...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await wait(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-login.png') });
  console.log('Saved 01-login.png');

  console.log('2. Performing Authentication...');
  await page.type('#login-email', 'admin@citrusjuice.com');
  await page.type('#login-password', 'Password123!');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await wait(1500); // Allow Recharts animations and store fetches to settle

  console.log('3. Capturing Dashboard Analytics...');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-dashboard.png') });
  console.log('Saved 02-dashboard.png');

  console.log('4. Navigating to POS Create Receipt...');
  await page.goto(`${BASE_URL}/create-receipt`, { waitUntil: 'networkidle0' });
  await wait(1000);

  // Click on a few product cards to build a rich ticket
  const flavourCards = await page.$$('.MuiCard-root');
  if (flavourCards.length > 2) {
    // Click 1st card twice
    await flavourCards[1].click();
    await wait(300);
    await flavourCards[1].click();
    await wait(300);
    // Click 2nd card
    await flavourCards[2].click();
    await wait(300);
    // Click 3rd card
    if (flavourCards[3]) {
      await flavourCards[3].click();
      await wait(300);
    }
  }

  // Type customer notes or name if inputs present
  try {
    const inputs = await page.$$('input[type="text"]');
    for (const inp of inputs) {
      const ph = await page.evaluate(el => el.placeholder, inp);
      if (ph && ph.toLowerCase().includes('name')) {
        await inp.type('Sarah Jenkins');
        break;
      }
    }
  } catch (e) {
    console.log('Optional customer input fill bypassed:', e.message);
  }

  await wait(800);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-pos-terminal.png') });
  console.log('Saved 03-pos-terminal.png');

  console.log('5. Navigating to Receipts History...');
  await page.goto(`${BASE_URL}/receipts`, { waitUntil: 'networkidle0' });
  await wait(1200);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-receipt-history.png') });
  console.log('Saved 04-receipt-history.png');

  console.log('6. Opening Thermal Receipt Preview Modal...');
  const tableRows = await page.$$('tbody tr');
  if (tableRows.length > 0) {
    await tableRows[0].click();
    await wait(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-thermal-receipt-preview.png') });
    console.log('Saved 05-thermal-receipt-preview.png');
    // Press Escape or close modal
    await page.keyboard.press('Escape');
    await wait(500);
  }

  console.log('7. Navigating to Flavours & Inventory...');
  await page.goto(`${BASE_URL}/flavours`, { waitUntil: 'networkidle0' });
  await wait(1200);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-flavours-inventory.png') });
  console.log('Saved 06-flavours-inventory.png');

  console.log('8. Navigating to Settings & Branding...');
  await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle0' });
  await wait(1200);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-settings-branding.png') });
  console.log('Saved 07-settings-branding.png');

  console.log('9. Toggling Dark Theme...');
  // Look for theme toggle button (aria-label containing "theme" or "mode")
  const themeBtn = await page.$('button[aria-label*="mode" i], button[aria-label*="theme" i], button[aria-label*="dark" i]');
  if (themeBtn) {
    await themeBtn.click();
    await wait(800);
    console.log('Navigating to Dashboard in Dark Mode...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await wait(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-dashboard-dark-theme.png') });
    console.log('Saved 08-dashboard-dark-theme.png');
  }

  await browser.close();
  console.log('\n--- ALL SCREENSHOTS CAPTURED SUCCESSFULLY ---');
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
