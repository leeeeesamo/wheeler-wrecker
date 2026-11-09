import re, os, glob

DOMAIN = "https://wheelertowing.com"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

def canon_for(path):
    path = path.replace(os.sep, '/')
    if path == 'reviews/index.html':
        return DOMAIN + "/reviews/"
    return DOMAIN + "/" + path

files = glob.glob('*.html') + glob.glob('services/*.html') + glob.glob('reviews/*.html') + glob.glob('admin/*.html')
for f in files:
    s = open(f, encoding='utf-8').read()
    orig = s
    s = s.replace('wheelercaleb030@gmail.com', 'info@wheelertowing.com')
    url = canon_for(f)
    if 'rel="canonical"' not in s:
        s = s.replace('<meta name="robots" content="noindex,follow">',
                      '<meta name="robots" content="noindex,follow"><link rel="canonical" href="%s">' % url, 1)
    if 'property="og:url"' not in s:
        s = s.replace('<meta name="twitter:card"',
                      '<meta property="og:url" content="%s"><meta name="twitter:card"' % url, 1)
    s = s.replace('content="assets/wheeler-social-preview.png"',
                  'content="%s/assets/wheeler-social-preview.png"' % DOMAIN)
    if s != orig:
        open(f, 'w', encoding='utf-8').write(s)
        print('updated', f)
