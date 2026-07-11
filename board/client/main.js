import './style.css';
import { createScene } from './scene.js';

const app = document.getElementById('app');
const count = document.getElementById('count');
const view = createScene(app);

function connect() {
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`);
  ws.onmessage = (e) => {
    let m; try { m = JSON.parse(e.data); } catch { return; }
    if (m.t === 'roster' && Array.isArray(m.ships)) {
      view.update(m.ships);
      if (count) count.textContent = `${m.ships.length} ship${m.ships.length === 1 ? '' : 's'}`;
    }
  };
  ws.onclose = () => setTimeout(connect, 1000);
  ws.onerror = () => ws.close();
}
connect();
