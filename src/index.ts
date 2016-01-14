import { Observable, Subscriber } from 'rxjs';
import * as L from 'leaflet';
import distinct from './distinct';
import pairwise from './pairwise';

interface Quake {
  id: string;
  geometry: { coordinates: number[] };
  properties: {
    net: string;
    code: string;
    time: number;
    place: any,
    mag: number;
  };
}

interface Circle {
  quakeId: string;
  lat: number;
  lng: number;
  size: number;
}

const getRowFromEvent = (
  table: HTMLTableElement,
  eventName: string
): Observable<HTMLTableRowElement> =>
  Observable
  .fromEvent<Event>(table, eventName)
  .filter(event => (<HTMLElement>event.target).tagName === 'TD')
  .filter(event => (<HTMLElement>event.target).parentElement.id.length > 0)
  .map(event => <HTMLTableRowElement>(<HTMLElement>event.target).parentElement)
  .distinctUntilChanged();

const QUAKE_URL = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/' +
  'summary/all_day.geojsonp';

const loadJSONP = (url: string): void => {
  const script = document.createElement('script');
  script.src = url;
  const head = document.getElementsByTagName('head')[0];
  head.appendChild(script);
};

const fetchQuake = (): Observable<Quake> =>
  distinct(
    Observable
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
      .mergeMap<Quake>(response => Observable.from(response.features)),
    (x: { properties: { code: string } }) => x.properties.code
  ).share();
  
const quakeToCircle = (quake: Quake): Circle => {
  const { net, code, mag } = quake.properties;
  const [lng, lat] = quake.geometry.coordinates;
  const quakeId = net + code;
  const size = mag * 10000;
  return { quakeId, lat, lng, size };
};

const quakeToRow = (quake: Quake): HTMLTableRowElement => {
  const { net, code, place, mag, time } = quake.properties;
  const quakeId = net + code; 
  const row = document.createElement('tr');
  row.id = quakeId; // HTMLTableRowElement.id = Circle.id
  [place, mag, new Date(time).toString()].forEach((text) => {
    const cell = document.createElement('td');
    cell.textContent = text;
    row.appendChild(cell);
  });
  return row;
};

const initialize = () => {
  const map = L.map('map').setView([33.858631, -118.279602], 7);
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);

  const quakeLayerIds: any = {}; // Map<QuakeId, LayerId>
  const quakeLayer = L.layerGroup([]).addTo(map);
  const addCircleLayer = (circle: Circle): void => {
    const { quakeId, lat, lng, size } = circle;
    const layer = L.circle([lat, lng], size);
    quakeLayer.addLayer(layer);
    // getLayerId is undocumented method.
    quakeLayerIds[quakeId] = L.Util.stamp(layer);
  };
  const getCircleLayer = (quakeId: string): any =>
    quakeLayer.getLayer(quakeLayerIds[quakeId]);

  const table = <HTMLTableElement>document.getElementById('quakes_info');
  const addRow = (row: HTMLTableRowElement): void => {
    table.appendChild(row);
  };
  const mouseoveredRow$ = getRowFromEvent(table, 'mouseover');
  const clickedRow$ = getRowFromEvent(table, 'click');

  const quake$ = fetchQuake();

  quake$
    .map(quakeToCircle)
    .subscribe(addCircleLayer);

  quake$
    .map(quakeToRow)
    .subscribe(addRow);

  pairwise(mouseoveredRow$)
    .subscribe(([prevRow, currRow]) => {
      const prevCircle = getCircleLayer(prevRow.id);
      const currCircle = getCircleLayer(currRow.id);
      prevCircle.setStyle({ color: '#0000ff' });
      currCircle.setStyle({ color: '#ff0000' });
    });

  clickedRow$
    .subscribe((row) => {
      const circle = getCircleLayer(row.id);
      map.panTo(circle.getLatLng());
    });
};

initialize();

export default function main(): void {
  console.log('OK');
}