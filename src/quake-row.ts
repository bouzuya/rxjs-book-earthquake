import Quake from './quake';

class QuakeRow {
  quakeId: string;
  place: string;
  mag: string;
  date: string;
  
  static from(quake: Quake): QuakeRow {
    const { net, code, place, mag, time } = quake.properties;
    const quakeId = net + code;
    return {
      quakeId,
      place,
      mag: '' + mag,
      date: new Date(time).toString()
    };
  }
}

export default QuakeRow;