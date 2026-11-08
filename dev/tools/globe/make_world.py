#!/usr/bin/env python3
"""World map for the globe (GLOBE_GEO in game/govorilki.html) from Natural Earth 1:110m countries (public domain).
Download once into its own empty folder and run with python3 -I:
  curl -sSL -o <dir>/ne110.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson
  python3 -I tools/globe/make_world.py <dir>/ne110.geojson > <dir>/world.js
Output: one line {"CC":[ring,…],…}; a ring is a flat list of whole tenths of a degree, the first point absolute
(lon, lat), the rest as differences from the point before. Antarctica is left out (the globe never shows the pole up close)."""
import json, sys

def rings(geom):
    if geom['type'] == 'Polygon': return [geom['coordinates'][0]]
    return [p[0] for p in geom['coordinates']]

data = json.load(open(sys.argv[1], encoding='utf-8'))
out = {}
for f in data['features']:
    p = f['properties']
    cc = p.get('ISO_A2_EH') or p.get('ISO_A2')
    if not cc or cc == '-99':
        cc = {'Kosovo': 'XK', 'N. Cyprus': 'CY', 'Somaliland': 'SO'}.get(p.get('NAME'), None)
    if not cc or cc == 'AQ': continue
    for r in rings(f['geometry']):
        pts, last = [], None
        for lon, lat in r:
            q = (round(lon * 10), round(lat * 10))
            if q != last: pts.append(q); last = q
        if len(pts) < 4: continue
        flat, px, py = [], 0, 0
        for x, y in pts: flat += [x - px, y - py]; px, py = x, y
        out.setdefault(cc, []).append(flat)
print(json.dumps(out, separators=(',', ':')))
