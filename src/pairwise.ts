import { Observable } from 'rxjs';

export default function pairwise<T>(
  observable: Observable<T>
): Observable<[T, T]> {
  return observable
    .scan<{ hp: boolean; p: T; pair: [T, T] }>(({ hp, p }, x) => {
      return { hp: true, p: x, pair: (hp ? [p, x] : null) };
    }, { hp: false, p: null, pair: null })
    .map(({ pair }) => pair)
    .filter(pair => pair !== null);
}
