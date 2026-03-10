import puppeteer from 'puppeteer';

(async () => {
    console.log("Launching headless browser...");
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER EXCEPTION:', err.message));

    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 10000 });
        console.log("Page loaded. Generating screenshot to confirm what we see...");
        await page.screenshot({ path: 'frontend_error.png' });
    } catch (e) {
        console.log("Navigation Error:", e.message);
    }
    
    await browser.close();
})();
