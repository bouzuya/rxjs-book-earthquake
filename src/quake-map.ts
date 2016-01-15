import * as L from 'leaflet';
import QuakeCircle from './quake-circle';

// wrap leaflet classes
// map with quake circles
class QuakeMap {
  private map: L.Map;
  private circles: L.LayerGroup<L.Circle>;
  private circleIds: any; // like a Map<QuakeId, CircleId>

  constructor(
    elementId: string,
    options: {
      center: {
        lat: number;
        lng: number;
      },
      zoom: number
    }
  ) {
    const map = L.map(elementId).setView(options.center, options.zoom);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);
    this.map = map;
    this.circles = L.layerGroup([]).addTo(map);
    this.circleIds = {};
  }

  addCircle(circle: QuakeCircle, style: { color: string }): void {
    const { quakeId, lat, lng, radius } = circle;
    const layer = L.circle([lat, lng], radius, style);
    this.circles.addLayer(layer);
    this.circleIds[quakeId] = L.Util.stamp(layer);
  }
  
  panToCircle(quakeId: string): void {
    const circleId = this.circleIds[quakeId];
    const circle = this.circles.getLayer(circleId)
    const latlng = circle.getLatLng();
    this.map.panTo(latlng);
  }

  setCircleStyle(quakeId: string, style: { color: string }): void {
    const circleId = this.circleIds[quakeId];
    const pathOptions: L.PathOptions = style;
    const circle = this.circles.getLayer(circleId);
    circle.setStyle(pathOptions);
  }
}

export default QuakeMap;