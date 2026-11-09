import sys, json
sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:8123'
PAGES = ['/', '/services.html', '/services/heavy-duty-recovery.html', '/services/underwater-recovery.html',
         '/fleet.html', '/contact.html', '/reviews/', '/reviews.html', '/about.html', '/commercial-accounts.html']
VIEWPORTS = [320, 375, 390, 768, 1024, 1440]

report = {}
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for vw in VIEWPORTS:
        page = browser.new_page(viewport={'width': vw, 'height': 900})
        issues = []
        console_errs, page_errs, failed = [], [], []
        page.on('console', lambda m: console_errs.append(m.text) if m.type == 'error' else None)
        page.on('pageerror', lambda e: page_errs.append(str(e)))
        page.on('requestfailed', lambda r: failed.append(r.url))
        page.on('response', lambda r: failed.append(r.url) if r.status >= 400 else None)
        for path in PAGES:
            try:
                page.goto(BASE + path, wait_until='networkidle', timeout=20000)
            except Exception as e:
                issues.append(f'{path}: NAV FAIL {e}')
                continue
            # horizontal overflow
            ow = page.evaluate('document.documentElement.scrollWidth')
            iw = page.evaluate('window.innerWidth')
            if ow > iw + 1:
                issues.append(f'{path}: horizontal overflow scrollW={ow} innerW={iw}')
            # broken images
            broken = page.evaluate('''Array.from(document.images).filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src)''')
            for b in broken:
                issues.append(f'{path}: broken img {b}')
        # mobile menu test at <=768
        if vw <= 768:
            page.goto(BASE + '/', wait_until='networkidle')
            btn = page.query_selector('.menu-toggle')
            if btn:
                btn.click()
                open_state = page.evaluate('document.querySelector(".site-nav").classList.contains("open")')
                if not open_state:
                    issues.append('mobile menu did not open')
                else:
                    page.keyboard.press('Escape')
                    closed = not page.evaluate('document.querySelector(".site-nav").classList.contains("open")')
                    if not closed:
                        issues.append('mobile menu did not close on Escape')
        report[vw] = {'console': console_errs[:10], 'pageerrors': page_errs[:10],
                      'failed_requests': failed[:15], 'issues': issues}
        page.close()
    browser.close()

print(json.dumps(report, indent=1))
