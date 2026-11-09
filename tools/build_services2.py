import re, os

TEMPLATE = 'services/heavy-duty-towing.html'
BASE = open(TEMPLATE, encoding='utf-8').read()

PAGES = [
    dict(
        file='services/long-distance-towing.html',
        title='Long-Distance Towing in Alabama | Wheeler Wrecker Service',
        desc='Wheeler Wrecker Service provides long-distance towing and vehicle transport across Alabama and beyond. Call 24-hour dispatch from Bessemer or Alabaster.',
        crumb='Long-Distance Towing', hero_sub='Transport across Alabama and beyond',
        h2='Long-Distance Towing when distance is not a problem.',
        body=('Wheeler Wrecker Service moves vehicles beyond the local area. Whether you need a car, truck or equipment moved between cities, across the state or on a planned route, '
              'our fleet can handle the transport. Call 24-hour dispatch to discuss your vehicle, pickup point, destination and timing.'),
        items=['Cars, SUVs, trucks and specialty vehicles','Planned transport between Alabama cities and regions','Commercial and fleet vehicle moves','Call dispatch to confirm route and availability'],
        img=('assets/img/wheeler-truck3.webp','Wheeler heavy-duty truck for long-distance transport',1600,561),
        rel=('../services/heavy-duty-towing.html','Heavy-Duty Towing'),
    ),
    dict(
        file='services/roadside-assistance.html',
        title='Roadside Assistance in Alabama | Wheeler Wrecker Service',
        desc='24-hour roadside assistance and towing from Wheeler Wrecker Service in Bessemer and Alabaster, Alabama. Call dispatch any time.',
        crumb='Roadside Assistance', hero_sub='Help when your vehicle lets you down',
        h2='Roadside assistance, day or night.',
        body=('Stranded on the roadside? Wheeler Wrecker Service provides 24-hour towing and roadside assistance from Bessemer and Alabaster. '
              'If your vehicle cannot be driven, our dispatch team will help arrange the right truck for the situation. For non-driving emergencies such as lockouts or fuel delivery, call dispatch to confirm what help is available for your location.'),
        items=['24-hour dispatch for stranded motorists','Towing when your vehicle cannot be driven','Light-, medium- and heavy-duty vehicles','Call to confirm service options for your situation'],
        img=('assets/img/wheeler-truck2.webp','Wheeler light-duty towing truck for roadside assistance',1249,524),
        rel=('../services/light-duty-towing.html','Light-Duty Towing'),
    ),
    dict(
        file='services/vehicle-storage.html',
        title='Vehicle Storage in Alabama | Wheeler Wrecker Service',
        desc='Wheeler Wrecker Service provides secure vehicle storage for towed, recovered and impounded vehicles in Bessemer and Alabaster, Alabama.',
        crumb='Vehicle Storage', hero_sub='Safe storage for towed and recovered vehicles',
        h2='Vehicle storage you can count on.',
        body=('Wheeler Wrecker Service stores vehicles that have been towed or recovered and need a safe place to wait for release or pickup. '
          'Storage details, fees and release procedures depend on your situation — call the Wheeler location handling your vehicle before visiting. '
          'Do not assume after-hours access; always call ahead to confirm.'),
        items=['Storage for towed and recovered vehicles','Two locations: Bessemer and Alabaster','Call ahead to confirm location, fees and release','Vehicle release details confirmed by phone only'],
        img=('assets/img/wheeler-wrecker1.webp','Wheeler wrecker truck at the storage yard',1440,1920),
        rel=('../vehicle-release.html','Vehicle Release Information'),
    ),
    dict(
        file='services/underwater-recovery.html',
        title='Underwater Towing & Recovery in Alabama | Wheeler Wrecker Service',
        desc='Underwater towing and recovery services from Wheeler Wrecker Service in Alabama. Call 24-hour dispatch to discuss your recovery needs.',
        crumb='Underwater Towing & Recovery', hero_sub='Specialized recovery for submerged vehicles',
        h2='Underwater towing & recovery.',
        body=('Wheeler Wrecker Service provides underwater towing and recovery for vehicles and equipment that have entered the water. '
              'Recovery operations are complex and site-specific — call 24-hour dispatch immediately with your location, what is submerged, water conditions and any safety concerns. '
              'Do not attempt water recovery yourself.'),
        items=['Submerged vehicle and equipment recovery','Coordination with Wheeler heavy-duty and rotator capability','24-hour dispatch for urgent situations','Call with location, water conditions and safety details'],
        img=('assets/img/wheeler-wrecker9.webp','Wheeler recovery equipment for complex recovery situations',1440,1920),
        rel=('../services/heavy-duty-recovery.html','Heavy-Duty Recovery'),
    ),
]

for p in PAGES:
    s = BASE
    f = p['file']
    s = s.replace('Heavy-Duty Towing in Alabama | 24-Hour Towing | Wheeler Wrecker Service', p['title'])
    s = s.replace('Wheeler Wrecker Service provides heavy-duty towing in Bessemer, Alabaster, Birmingham and throughout Alabama. Call 24-hour dispatch.', p['desc'])
    s = s.replace('https://wheelertowing.com/services/heavy-duty-towing.html', 'https://wheelertowing.com/' + f)
    s = s.replace('/ Heavy-Duty Towing</div>', '/ ' + p['crumb'] + '</div>')
    s = s.replace('<h1>Heavy-Duty Towing</h1><p>Semi-trucks, buses and commercial fleets</p>',
                  '<h1>%s</h1><p>%s</p>' % (p['crumb'], p['hero_sub']))
    start = s.find('<section class="page-section section-white">')
    end = s.find('<section class="final-cta">')
    items = ''.join('<li>%s</li>' % i for i in p['items'])
    img = '../' + p['img'][0]
    new_main = ('<section class="page-section section-white"><div class="container split-layout"><div>'
        '<span class="kicker">Wheeler service</span><h2>%s</h2><p>%s</p><ul class="check-list">%s</ul>'
        '<p class="subtle">Call dispatch with as many details as you can safely provide — vehicle type, location, destination (if applicable) and the situation.</p>'
        '<div class="small-cta"><a href="tel:+12054243200" class="button button-primary">Call Bessemer</a><a href="tel:+12056649000" class="button button-primary">Call Alabaster</a></div></div>'
        '<img src="%s" alt="%s" loading="lazy" width="%d" height="%d"></div></section>'
        '<section class="page-section section-muted"><div class="container"><h2>Discuss your request.</h2>'
        '<p class="section-intro">Call Wheeler with the details of your situation. For planned towing or transport, you can also make a non-urgent inquiry.</p>'
        '<div class="notice"><strong>Need a tow or recovery right now?</strong><p>Urgent towing and recovery requests must be made by phone. Please call 24-hour dispatch at <a href="tel:+12054243200">(205) 424-3200</a> (Bessemer) or <a href="tel:+12056649000">(205) 664-9000</a> (Alabaster). Forms and email are for non-urgent inquiries only.</p></div>'
        '<div class="small-cta"><a href="../services.html" class="text-cta">&larr; Browse all services</a><a href="%s" class="text-cta">%s &rarr;</a><a href="../contact.html" class="text-cta">Non-urgent contact &rarr;</a></div></div></section>'
        % (p['h2'], p['body'], items, img, p['img'][1], p['img'][2], p['img'][3], p['rel'][0], p['rel'][1]))
    s = s[:start] + new_main + s[end:]
    open(f, 'w', encoding='utf-8').write(s)
    print('wrote', f)
