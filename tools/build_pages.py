import re

SRC = 'services/heavy-duty-towing.html'
DST = 'services/heavy-duty-recovery.html'

s = open(SRC, encoding='utf-8').read()

TITLE = 'Heavy-Duty Recovery in Alabama | 24-Hour Recovery | Wheeler Wrecker Service'
DESC = 'Wheeler Wrecker Service provides heavy-duty recovery for commercial trucks, buses and large vehicles across Alabama. Call 24-hour dispatch.'

s = s.replace('Heavy-Duty Towing in Alabama | 24-Hour Towing | Wheeler Wrecker Service', TITLE)
s = s.replace('Wheeler Wrecker Service provides heavy-duty towing in Bessemer, Alabaster, Birmingham and throughout Alabama. Call 24-hour dispatch.', DESC)
s = s.replace('https://wheelertowing.com/services/heavy-duty-towing.html', 'https://wheelertowing.com/services/heavy-duty-recovery.html')
s = s.replace('/ Heavy-Duty Towing</div>', '/ Heavy-Duty Recovery</div>')
s = s.replace('<h1>Heavy-Duty Towing</h1><p>Semi-trucks, buses and commercial fleets</p>',
              '<h1>Heavy-Duty Recovery</h1><p>Complex recovery for large commercial vehicles</p>')

# Replace the main content section between interior-hero end and final-cta
start = s.find('<section class="page-section section-white">')
end = s.find('<section class="final-cta">')
assert start != -1 and end != -1

new_main = '''<section class="page-section section-white"><div class="container split-layout"><div><span class="kicker">Wheeler service</span><h2>Heavy-Duty Recovery when the situation demands it.</h2><p>When a commercial truck, bus or large vehicle can&rsquo;t simply be hooked and hauled, Wheeler&rsquo;s heavy-duty recovery capability is built for complex situations &mdash; disabled loads, off-road recoveries and challenging roadside scenes across Alabama. Call our 24-hour dispatch with your vehicle and site details.</p><ul class="check-list"><li>Recovery of disabled or damaged commercial trucks and buses</li><li>Heavy vehicles in difficult roadside or off-road positions</li><li>Coordinated recovery support alongside Wheeler&rsquo;s rotator and heavy-duty fleet</li><li>Planned heavy recovery moves &mdash; contact us in advance for non-urgent requests</li></ul><p class="subtle">For the safest and fastest outcome, share the vehicle type, what happened, access conditions and whether any cargo or load is involved when you call.</p><div class="small-cta"><a href="tel:+12054243200" class="button button-primary">Call Bessemer</a><a href="tel:+12056649000" class="button button-primary">Call Alabaster</a></div></div><img src="../assets/img/wheeler-wrecker4.webp" alt="Wheeler Wrecker Service heavy-duty recovery truck" loading="lazy" width="1920" height="1105"></div></section><section class="page-section section-muted"><div class="container"><h2>Discuss your recovery request.</h2><p class="section-intro">Call Wheeler with your vehicle type, what happened, pickup location and the details of the situation. For planned heavy recovery or equipment moves, you can also make a non-urgent inquiry.</p><div class="notice"><strong>Need a tow or recovery right now?</strong><p>Urgent towing and recovery requests must be made by phone. Please call 24-hour dispatch at <a href="tel:+12054243200">(205) 424-3200</a> (Bessemer) or <a href="tel:+12056649000">(205) 664-9000</a> (Alabaster). Forms and email are for non-urgent inquiries only.</p></div><div class="small-cta"><a href="../services.html" class="text-cta">&larr; Browse all services</a><a href="../services/heavy-duty-towing.html" class="text-cta">Heavy-Duty Towing &rarr;</a><a href="../services/rotator-recovery.html" class="text-cta">Rotator Recovery &rarr;</a></div></div></section>'''

s = s[:start] + new_main + s[end:]
open(DST, 'w', encoding='utf-8').write(s)
print('wrote', DST)
