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

const quakes = Observable
.create((observer: Subscriber<any>) => {
  (<any>window).eqfeed_callback = (response: any) => {
    observer.next(response);
    observer.complete();
  };
  loadJSONP(QUAKE_URL);
})
.mergeMap((response: any) => Observable.from(response.features))
.subscribe((quake: any) => {
  const coords = quake.geometry.coordinates;
  const size = quake.properties.mag * 10000;
  L.circle([coords[1], coords[0]], size).addTo(map);
});

export default function main(): void {
  console.log('OK');
}