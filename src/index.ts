import { Observable } from 'rxjs';
import pairwise from './pairwise';
import Quake from './quake';
import QuakeCircle from './quake-circle';
import QuakeMap from './quake-map';
import QuakeRow from './quake-row';
import QuakeTable from './quake-table';

export default function main(): void {
  const quakeMapElementId = 'quake_map';
  const quakeTableElementId = 'quake_table';
  const defaultStyle = { color: '#0000ff' };
  const focusedStyle = { color: '#ff0000' };
  const quakeMap = new QuakeMap(quakeMapElementId, {
    center: { lat: 33.858631, lng: -118.279602 },
    zoom: 7
  });
  const quakeTable = new QuakeTable(quakeTableElementId);
  const quake$ = Quake.fetch();

  quake$
    .map(quake => QuakeCircle.from(quake))
    .subscribe(circle => quakeMap.addCircle(circle, defaultStyle));

  quake$
    .map(quake => QuakeRow.from(quake))
    .subscribe(row => quakeTable.addRow(row));

  pairwise(quakeTable.getQuakeIdFromEvent('mouseover'))
    .subscribe(([prevQuakeId, currQuakeId]) => {
      quakeMap.setCircleStyle(prevQuakeId, defaultStyle);
      quakeMap.setCircleStyle(currQuakeId, focusedStyle);
    });

  quakeTable.getQuakeIdFromEvent('click')
    .subscribe(id => quakeMap.panToCircle(id));
};
