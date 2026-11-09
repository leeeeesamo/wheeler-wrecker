import os
os.makedirs('reviews', exist_ok=True)

# Clone reviews.html shell, swap head metadata and main content
s = open('reviews.html', encoding='utf-8').read()

s = s.replace('<title>Customer Reviews | Wheeler Wrecker Service</title>',
              '<title>Share Your Experience | Wheeler Wrecker Service</title>')
s = s.replace('<meta name="description" content="Learn how to find Wheeler Wrecker Service customer reviews for Bessemer and Alabaster, Alabama. Call for 24-hour towing and recovery.">',
              '<meta name="description" content="Had Wheeler Wrecker Service tow or recover your vehicle? Share your honest feedback — it helps our family-owned Alabama towing company. Call 24-hour dispatch.">')
s = s.replace('content="Customer Reviews | Wheeler Wrecker Service"',
              'content="Share Your Experience | Wheeler Wrecker Service"', 1)  # og:title first occurrence after description? careful
# fix og:title/og:description precisely
import re
s = re.sub(r'<meta property="og:title" content="[^"]*">',
           '<meta property="og:title" content="Share Your Experience | Wheeler Wrecker Service">', s)
s = re.sub(r'<meta property="og:description" content="[^"]*">',
           '<meta property="og:description" content="Had Wheeler Wrecker Service tow or recover your vehicle? Share your honest feedback — it helps our family-owned Alabama towing company.">', s)
s = s.replace('https://wheelertowing.com/reviews.html', 'https://wheelertowing.com/reviews/')

# Fix nav: reviews.html link -> reviews/ (this IS the reviews page); mark current
s = s.replace('<a href="reviews.html">Reviews</a>', '<a href="reviews/index.html" aria-current="page">Reviews</a>')
# asset paths need ../ since we're in /reviews/
s = s.replace('href="assets/', 'href="../assets/')
s = s.replace('src="assets/', 'src="../assets/')
s = s.replace('href="index.html"', 'href="../index.html"')
s = s.replace('href="services.html"', 'href="../services.html"')
s = s.replace('href="about.html"', 'href="../about.html"')
s = s.replace('href="fleet.html"', 'href="../fleet.html"')
s = s.replace('href="service-areas.html"', 'href="../service-areas.html"')
s = s.replace('href="faq.html"', 'href="../faq.html"')
s = s.replace('href="vehicle-release.html"', 'href="../vehicle-release.html"')
s = s.replace('href="contact.html"', 'href="../contact.html"')
s = s.replace('href="reviews.html"', 'href="index.html"')  # any leftover
s = s.replace('src="script.js"', 'src="../script.js"')
s = s.replace('href="styles.css"', 'href="../styles.css"')
s = s.replace('href="client-updates.css"', 'href="../client-updates.css"')

# Replace main content
start = s.find('<main id="main">')
end = s.find('</main>', start) + len('</main>')
assert start != -1 and end > start

main = '''<main id="main">
<section class="interior-hero"><div class="container"><div class="breadcrumb"><a href="../index.html">Home</a> <span>/</span> Share your experience</div><h1>How was your experience?</h1><p>Wheeler Wrecker Service is family-owned and has served Alabama since 1967. Honest feedback helps us serve you better.</p></div></section>
<section class="page-section section-white"><div class="container review-hero">
<img class="review-logo" src="../assets/wheeler-logo-primary-light.png" alt="Wheeler Wrecker Service" width="600" height="200">
<span class="kicker">We'd love to hear from you</span>
<h2>Tell us about your tow or recovery.</h2>
<p class="section-intro" style="margin-left:auto;margin-right:auto">Whether you used our Bessemer or Alabaster location, your honest experience matters to our family business. Thank you for trusting Wheeler.</p>
<div class="review-actions">
<div class="review-card"><h3>Leave a public review</h3><p>Share your experience on our Facebook page or Google listing. Public review links are being finalized — check back soon or find us on Facebook.</p><a class="button button-primary" href="https://www.facebook.com/share/19WNFRZdFH/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">Find us on Facebook</a></div>
<div class="review-card"><h3>Send us private feedback</h3><p>Have a question, concern or compliment? Reach our team directly by phone or email. We read every message.</p><a class="button button-primary" href="tel:+12054243200">Call Bessemer</a><a class="button button-ghost" href="tel:+12056649000">Call Alabaster</a><a class="button button-ghost" href="mailto:info@wheelertowing.com">Email Wheeler</a></div>
</div>
<p class="review-pending" style="margin-top:26px"><strong>Good to know:</strong> You never have to leave a review to receive service, and we never ask for something in exchange for a review. Some customers may see information about a Wheeler customer appreciation offer — it is completely separate from reviews and entirely optional.</p>
</div></section>
<section class="page-section section-muted"><div class="container"><h2>Need towing or recovery?</h2><p class="section-intro">This page is for sharing feedback. If you need a tow or recovery right now, please call 24-hour dispatch — do not wait on a form or email.</p><div class="notice"><strong>Urgent towing and recovery requests must be made by phone.</strong><p>Call <a href="tel:+12054243200">(205) 424-3200</a> (Bessemer) or <a href="tel:+12056649000">(205) 664-9000</a> (Alabaster), 24 hours a day, 7 days a week.</p></div></div></section>
</main>'''

s = s[:start] + main + s[end:]
open('reviews/index.html', 'w', encoding='utf-8').write(s)
print('wrote reviews/index.html', len(s))
