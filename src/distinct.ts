import { Observable } from 'rxjs';

export default function distinct<T>(
  observable: Observable<T>,
  keySelector?: (v: T) => any
): Observable<T> {
  const key = keySelector ? keySelector : ((v: T): any => v);
  return observable
    .scan<{ a: any[], v: T }>(({ a }, v) => {
      const k = key(v);
      return a.indexOf(k) === -1
        ? { a: a.concat([k]), v: v }
        : { a: a, v: null };
    }, { a: [], v: null })
    .map(({ v }) => v)
    .filter(v => v !== null);
}