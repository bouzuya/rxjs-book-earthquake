import { Observable, Subscriber } from 'rxjs';
import * as L from 'leaflet';
import pairwise from './pairwise';

const QUAKE_URL = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/' +
  'summary/all_day.geojsonp';

function loadJSONP(url: string) {
  const script = document.createElement('script');
  script.src = url;
  const head = document.getElementsByTagName('head')[0];
  head.appendChild(script);
}

const map = L.map('map').setView([33.858631, -118.279602], 7);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);

interface Quake {
  id: string;
  lat: number;
  lng: number;
  size: number;
};

interface Feature {
  id: string;
  geometry: { coordinates: number[] };
  properties: {
    net: string; code: string; time: number; place: any, mag: number;
  };
};

const initialize = () => {
  const codeLayers: any = {};
  const quakeLayer = L.layerGroup([]).addTo(map);  

  const quakes = Observable
  .interval(5000)
  .mergeMap<any>(() => {
    // Rx.DOM.jsonpRequest
    return Observable.create((observer: Subscriber<any>): void => {
      (<any>window).eqfeed_callback = (response: any) => {
        observer.next(response);
        observer.complete();
      };
      loadJSONP(QUAKE_URL);
    });
  })
  .mergeMap<Feature>((response) => Observable.from(response.features))
  // .distinct (.scan.map.filter)
  .scan(({ h }, x) => {
    const k = x.properties.code;
    return h.indexOf(k) === -1 ? { h: h.concat([k]), v: x } : { h, v: null };
  }, <{ h: string[], v: Feature }>{ h: [], v: null })
  .map(({ v }) => v)
  .filter((v) => v !== null)
  .share();

  quakes
  .map((feature): Quake => {
    const id = feature.id;
    const [lng, lat] = feature.geometry.coordinates;
    const size = feature.properties.mag * 10000;
    return { id, lat, lng, size };
  })
  .subscribe((quake: Quake) => {
    const circle = L.circle([quake.lat, quake.lng], quake.size).addTo(map);
    quakeLayer.addLayer(circle);
    // getLayerId is undocumented method.
    codeLayers[quake.id] = L.Util.stamp(circle);
  });

  const makeRow = (feature: Feature): HTMLTableRowElement => {
    const { net, code, place, mag, time } = feature.properties;
    const row = document.createElement('tr');
    row.id = net + code;
    [place, mag, new Date(time).toString()].forEach((text) => {
      const cell = document.createElement('td');
      cell.textContent = text;
      row.appendChild(cell);
    });
    return row;
  };

  const isHovering = (element: Node): Observable<boolean> => {
    const over = Observable.fromEvent(element, 'mouseover').map(() => true);
    const out = Observable.fromEvent(element, 'mouseout').map(() => false);
    return over.merge(out);
  };

  var table = document.getElementById('quakes_info');
  quakes
    .map(makeRow)
    .subscribe(row => table.appendChild(row));

  const getRowFromEvent = (event: any) =>
    Observable
    .fromEvent(table, event)
    .filter((event: { target: HTMLElement }) => {
      const el = event.target;
      return el.tagName === 'TD' &&
        el.parentElement.getAttribute('id').length > 0;
    })
    .map((e: any) => e.target.parentNode)
    .distinctUntilChanged();
  
  pairwise(getRowFromEvent('mouseover'))
    .subscribe((rows) => {
      const prevCircle = quakeLayer.getLayer(codeLayers[rows[0].id]);
      const currCircle = quakeLayer.getLayer(codeLayers[rows[1].id]);
      prevCircle.setStyle({ color: '#0000ff' });
      currCircle.setStyle({ color: '#ff0000' });
    });
  
  getRowFromEvent('click')
    .subscribe((row) => {
      const circle = quakeLayer.getLayer(codeLayers[row.id]);
      map.panTo(circle.getLatLng());
    });
};

initialize();

export default function main(): void {
  console.log('OK');
}