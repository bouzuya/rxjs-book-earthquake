import Quake from './quake';

class QuakeCircle {
  quakeId: string;
  lat: number;
  lng: number;
  radius: number;

  static from(quake: Quake): QuakeCircle {
    const { net, code, mag } = quake.properties;
    const quakeId = net + code;
    const [lng, lat] = quake.geometry.coordinates;
    const radius = mag * 10000;
    return { quakeId, lat, lng, radius };
  }
}

export default QuakeCircle;