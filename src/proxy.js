import fetch from 'node-fetch';
import {set} from './cache.js';

export async function fetchEarthquakes(type, period) {
  const URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/'+type+'_'+period+'.geojson';
  let result;
  try {
    result = await fetch(URL);
    } catch (e) {
    console.error('Villa við að sækja', e);
    return null;
  }

  if (!result.ok) {
    console.error('Ekki 200 svar', await result.text());
    return null;
  }
  const data = await result.json();
  await set(type+period, data.features, 10);
  return data.features;
}