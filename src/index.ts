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
  lat: number;
  lng: number;
  size: number;
};

interface Feature {
  geometry: { coordinates: number[] };
  properties: { code: string; mag: number; };
};

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
.map((feature): Quake => {
  const [lng, lat] = feature.geometry.coordinates;
  const size = feature.properties.mag * 10000;
  return { lat, lng, size };
})
.subscribe((quake: Quake) => {
  L.circle([quake.lat, quake.lng], quake.size).addTo(map);
});

export default function main(): void {
  console.log('OK');
}