import { Observable, Subscriber } from 'rxjs';
import * as L from 'leaflet';

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
    .bufferTime(500)
    .filter(rows => rows.length > 0)
    .map(rows => {
      const fragment = document.createDocumentFragment();
      rows.forEach((row) => fragment.appendChild(row));
      return fragment;
    })
    .subscribe(fragment => {
      const row = <HTMLElement>fragment.firstChild;
      const id = row.getAttribute('id');
      const circleLayer = quakeLayer.getLayer(codeLayers[id]);
      
      isHovering(row)
      .subscribe((hovering) => {
        circleLayer.setStyle({ color: hovering ? '#ff0000' : '#0000ff' });
      });
      
      Observable
      .fromEvent(row, 'click')
      .subscribe(() => {
        map.panTo(circleLayer.getLatLng());
      });

      table.appendChild(fragment);
    });
};

initialize();

export default function main(): void {
  console.log('OK');
}