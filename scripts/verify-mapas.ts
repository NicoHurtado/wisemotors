// ============================================================================
// Verificación de mapas y distancias (lib/mapas.ts, lib/distancia.ts). Sin BD ni red.
//   npx tsx scripts/verify-mapas.ts
// ============================================================================

import { coordenadasDeLink, esLinkDeMaps, urlComoLlegar, urlMapaIncrustado } from '../lib/mapas';
import { kmEntre, porCercania, textoDistancia } from '../lib/distancia';

let fallas = 0;
function check(nombre: string, ok: boolean, detalle = '') {
  if (ok) console.log(`  ✓ ${nombre}`);
  else {
    fallas++;
    console.error(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  }
}

// Links reales de Google Maps (formas que pega la gente)
const lugar = 'https://www.google.com/maps/place/Mazda/@6.2087,-75.5714,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d6.20912!4d-75.56985!16s';
const c1 = coordenadasDeLink(lugar);
check('del link de un lugar se toma el pin (!3d!4d), no el centro de la vista', c1?.lat === 6.20912 && c1?.lng === -75.56985, JSON.stringify(c1));
check('link con @lat,lng', coordenadasDeLink('https://www.google.com/maps/@6.25184,-75.56359,15z')?.lat === 6.25184);
check('link con ?q=lat,lng', coordenadasDeLink('https://maps.google.com/?q=6.2442,-75.5812')?.lng === -75.5812);
check('link codificado (%2C)', coordenadasDeLink('https://www.google.com/maps/search/?api=1&query=6.2442%2C-75.5812')?.lat === 6.2442);
check('link corto no trae coordenadas (se resuelve en el servidor)', coordenadasDeLink('https://maps.app.goo.gl/AbCdEf123') === null);
check('0,0 no es una ubicación', coordenadasDeLink('https://www.google.com/maps/@0,0,3z') === null);

check('maps.app.goo.gl es link de Maps', esLinkDeMaps('https://maps.app.goo.gl/AbCdEf123'));
check('google.com.co/maps es link de Maps', esLinkDeMaps('https://www.google.com.co/maps/place/x'));
check('otro dominio NO (el servidor no lo sigue)', !esLinkDeMaps('https://evil.example.com/maps') && !esLinkDeMaps('https://google.com.evil.io/maps'));
check('file:// NO', !esLinkDeMaps('file:///etc/passwd'));

const p = { name: 'Mazda Poblado', address: 'Cra 43A #9 Sur-91', location: 'Medellín', lat: 6.2, lng: -75.57 };
check('sin clave: embed clásico con coordenadas', urlMapaIncrustado(p, '')!.startsWith('https://maps.google.com/maps?q=6.2%2C-75.57'));
check('con clave: Maps Embed API con nombre y dirección', /maps\/embed\/v1\/place\?key=K&q=Mazda%20Poblado/.test(urlMapaIncrustado(p, 'K')!));
check('sin coordenadas ni dirección: no hay mapa', urlMapaIncrustado({ name: 'X' }, '') === null);
check('cómo llegar usa las coordenadas', urlComoLlegar(p).includes('destination=6.2%2C-75.57'));

// Distancias (Medellín)
const poblado = { lat: 6.2087, lng: -75.5714 };
const envigado = { lat: 6.1719, lng: -75.5876 };
const bello = { lat: 6.3373, lng: -75.5579 };
const km = kmEntre(poblado, envigado);
check('El Poblado → Envigado ≈ 4,4 km en línea recta', km > 4 && km < 4.8, km.toFixed(2));
check('Medellín → Bogotá ≈ 240 km en línea recta', Math.abs(kmEntre(poblado, { lat: 4.711, lng: -74.0721 }) - 240) < 15);
check('texto: metros, decimales y enteros', textoDistancia(0.42) === '400 m' && textoDistancia(3.24) === '3,2 km' && textoDistancia(48.6) === '49 km', `${textoDistancia(0.42)} ${textoDistancia(3.24)} ${textoDistancia(48.6)}`);
const orden = porCercania([{ n: 'bello', ...bello }, { n: 'sin', lat: null, lng: null }, { n: 'envigado', ...envigado }], poblado).map(x => x.n);
check('ordena por cercanía y deja al final los sin ubicación', orden.join(',') === 'envigado,bello,sin', orden.join(','));
check('sin mi ubicación no cambia el orden', porCercania([{ n: 'a', lat: 1, lng: 1 }, { n: 'b', lat: 0.5, lng: 0.5 }], null)[0].n === 'a');

console.log(fallas ? `\n${fallas} fallas` : '\nTodo bien');
process.exit(fallas ? 1 : 0);
