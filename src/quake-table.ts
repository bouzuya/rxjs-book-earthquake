import { Observable, Subscriber } from 'rxjs';
import Quake from './quake';
import QuakeRow from './quake-row';

class QuakeTable {
  private table: HTMLTableElement;

  constructor(elementId: string) {
    this.table = <HTMLTableElement>document.getElementById(elementId);
  }

  addRow(row: QuakeRow): void {
    const addTd = (tr: HTMLTableRowElement, text: string): void => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    };
    const tr = document.createElement('tr');
    tr.id = row.quakeId;
    addTd(tr, row.place);
    addTd(tr, row.mag);
    addTd(tr, row.date);
    this.table.appendChild(tr);
  }

  getQuakeIdFromEvent(eventName: string): Observable<string> {
    const table = this.table;
    return Observable
      .fromEvent<Event>(table, eventName)
      .filter(event => (<HTMLElement>event.target).tagName === 'TD')
      .filter(event => (<HTMLElement>event.target).parentElement.id.length > 0)
      .map(event => <HTMLElement>event.target)
      .map(element => <HTMLTableRowElement>element.parentElement)
      .distinctUntilChanged()
      .map(row => row.id);
  }
}

export default QuakeTable;