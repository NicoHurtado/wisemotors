// Id anónimo del navegador (no identifica a nadie): una calificación por
// respuesta y personas únicas en la demanda. El servidor lo guarda con hash.
export function sesionAnonima(): string {
  try {
    let s = localStorage.getItem('wise.sesion');
    if (!s) {
      s = crypto.randomUUID();
      localStorage.setItem('wise.sesion', s);
    }
    return s;
  } catch {
    return crypto.randomUUID();
  }
}
