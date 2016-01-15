import { Observable, Subscriber } from 'rxjs';
import distinct from './distinct';

const QUAKE_URL = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/' +
  'summary/all_day.geojsonp';

const loadJSONP = (url: string): void => {
  const script = document.createElement('script');
  script.src = url;
  const head = document.getElementsByTagName('head')[0];
  head.appendChild(script);
};

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

class Quake {
  static fetch(): Observable<Quake> {
    return distinct(
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
  }
}

export default Quake;