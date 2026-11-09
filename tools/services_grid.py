s = open('services.html', encoding='utf-8').read()

cards = [
    ("Heavy-Duty Towing", "Towing for semi-trucks, buses and large commercial vehicles across Alabama.", "assets/img/wheeler-truck3.webp", 1600, 561, "services/heavy-duty-towing.html", "Wheeler heavy-duty towing truck"),
    ("Heavy-Duty Recovery", "Complex recovery for disabled commercial vehicles in difficult positions.", "assets/img/wheeler-wrecker4.webp", 1920, 1105, "services/heavy-duty-recovery.html", "Wheeler heavy-duty recovery truck"),
    ("Mobile Rotator / Crane Recovery", "Rotator and crane recovery support for demanding recovery situations.", "assets/img/wheeler-wrecker9.webp", 1440, 1920, "services/rotator-recovery.html", "Wheeler rotator recovery equipment"),
    ("Accident Recovery", "Recovery support for accident-damaged, disabled or hard-to-access vehicles.", "assets/img/wheeler-wrecker8.webp", 1440, 1920, "services/accident-recovery.html", "Wheeler accident recovery operation"),
    ("Commercial Truck &amp; Bus Towing", "Towing and transport for semi-trucks, buses and commercial fleets.", "assets/img/wheeler-wrecker1.webp", 1440, 1920, "services/heavy-duty-towing.html", "Wheeler commercial truck towing"),
    ("Commercial Fleet Towing &amp; Recovery", "Ongoing towing and recovery support for fleet operators and businesses.", "assets/img/wheeler-wrecker3.webp", 1080, 1920, "commercial-accounts.html", "Wheeler commercial fleet truck"),
    ("Medium-Duty Towing &amp; Recovery", "Towing and recovery for medium-duty trucks, RVs and work vehicles.", "assets/img/wheeler-wrecker7.webp", 1242, 905, "services/medium-duty-towing.html", "Wheeler medium-duty towing truck"),
    ("Off-Road Recovery &amp; Winching", "Winching and recovery for vehicles stuck off the roadway or in rough terrain.", "assets/img/wheeler-wrecker5.webp", 1920, 1440, "services/off-road-winching.html", "Wheeler off-road recovery winching"),
    ("Equipment Transportation", "Equipment hauling for owners, contractors and businesses across Alabama.", "assets/img/wheeler-wrecker2.webp", 1440, 1920, "services/equipment-transportation.html", "Wheeler equipment transportation truck"),
    ("Heavy Equipment Transport", "Movement of heavy equipment between job sites, shops and storage locations.", "assets/img/wheeler-wrecker6.webp", 1920, 1507, "services/equipment-transportation.html", "Wheeler heavy equipment transport"),
    ("Light-Duty Towing &amp; Recovery", "Fast, careful towing for cars, SUVs, motorcycles and light trucks.", "assets/img/wheeler-truck2.webp", 1249, 524, "services/light-duty-towing.html", "Wheeler light-duty towing truck"),
    ("Classic-Car &amp; Passenger-Vehicle Towing", "Specialized towing for classic cars and passenger vehicles that need extra care.", "assets/img/wheeler-truck1.webp", 1212, 1600, "services/light-duty-towing.html", "Wheeler passenger vehicle towing truck"),
]

parts = []
for i, (title, desc, img, w, h, href, alt) in enumerate(cards, 1):
    parts.append(
        '<article class="service-photo-card">'
        '<a class="service-photo-media" href="%s">'
        '<img src="%s" alt="%s" loading="lazy" width="%d" height="%d">'
        '<span class="service-photo-overlay" aria-hidden="true"></span>'
        '<span class="service-photo-title">%s</span>'
        '</a>'
        '<div class="service-photo-body">'
        '<p>%s</p>'
        '<div class="service-photo-links">'
        '<a class="text-cta" href="%s">Learn more &rarr;</a>'
        '<a class="service-photo-call" href="tel:+12054243200">Call dispatch</a>'
        '</div></div></article>' % (href, img, alt, w, h, title, desc, href)
    )

grid = '<div class="service-photo-grid">' + ''.join(parts) + '</div>'

start = s.find('<div class="service-overview-grid">')
end = s.find('</div><div class="notice">', start)
assert start != -1 and end != -1, (start, end)
s = s[:start] + grid + s[end+6:]

# add grouping headings? keep simple. Update intro to mention all services.
s = s.replace('Call dispatch for assistance with an urgent situation or to confirm the right equipment for your job.',
              'From light-duty cars and classic vehicles to semi-trucks, buses, heavy equipment and complex recovery scenes, call dispatch for assistance with an urgent situation or to confirm the right equipment for your job.')

# update title/description to reflect broader range
s = s.replace('<title>Towing, Recovery &amp; Equipment Transportation Services | Wheeler Wrecker Service</title>',
              '<title>Towing &amp; Recovery Services in Alabama | Wheeler Wrecker Service</title>')
s = s.replace('Explore 24-hour light-, medium- and heavy-duty towing, accident recovery, rotator services, equipment transportation and off-road winching in Alabama.',
              'Explore 24-hour light-, medium- and heavy-duty towing, heavy-duty and accident recovery, rotator services, equipment transport and off-road winching across Alabama.')

open('services.html', 'w', encoding='utf-8').write(s)
print('services.html updated')
