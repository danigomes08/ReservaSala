// Camada de dados do SalaFácil.
// Tudo é salvo no localStorage do navegador (cada navegador tem a sua própria agenda).
// Todo acesso a dados passa por aqui: para ligar a um backend no futuro, basta trocar este arquivo.

export type User = { id: string; name: string; email: string; password: string; role: string };
export type Room = { id: string; name: string; capacity: number; block: string };
export type Booking = {
  id: string;
  title: string;
  group: string; // turma
  owner: string; // responsável / professor
  roomId: string;
  date: string; // AAAA-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  createdBy: string;
};

type DB = { users: User[]; rooms: Room[]; bookings: Booking[] };

const DB_KEY = "salafacil:db:v1";
const SESSION_KEY = "salafacil:session";

// ---------- datas ----------
export const pad = (n: number) => String(n).padStart(2, "0");
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};
export const mondayOf = (d: Date) => {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = r.getDay(); // 0 = domingo
  return addDays(r, dow === 0 ? -6 : 1 - dow);
};
export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
export const fromMin = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export const nowMin = () => {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
};
export const durationLabel = (start: string, end: string) => {
  const d = toMin(end) - toMin(start);
  const h = Math.floor(d / 60);
  const m = d % 60;
  if (h === 0) return `${m} min`;
  return m ? `${h}h${pad(m)}` : `${h}h`;
};

export const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
export const WEEKDAYS_SHORT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
export const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export const longDate = (d: Date) => `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
export const shortDate = (iso: string) => {
  const d = parseISO(iso);
  return `${pad(d.getDate())} ${MONTHS_SHORT[d.getMonth()].toUpperCase()}`;
};

// ---------- cores por sala (classes literais para o Tailwind encontrar) ----------
export const PALETTE = [
  { color: "bg-emerald-500", soft: "bg-emerald-50", text: "text-emerald-700" },
  { color: "bg-violet-500", soft: "bg-violet-50", text: "text-violet-700" },
  { color: "bg-amber-500", soft: "bg-amber-50", text: "text-amber-700" },
  { color: "bg-sky-500", soft: "bg-sky-50", text: "text-sky-700" },
  { color: "bg-rose-500", soft: "bg-rose-50", text: "text-rose-700" },
  { color: "bg-teal-500", soft: "bg-teal-50", text: "text-teal-700" },
  { color: "bg-indigo-500", soft: "bg-indigo-50", text: "text-indigo-700" },
];

// ---------- armazenamento seguro ----------
const memory: Record<string, string> = {};
function storageGet(key: string, session = false): string | null {
  try {
    return (session ? sessionStorage : localStorage).getItem(key);
  } catch {
    return memory[key] ?? null;
  }
}
function storageSet(key: string, value: string, session = false) {
  try {
    (session ? sessionStorage : localStorage).setItem(key, value);
  } catch {
    memory[key] = value;
  }
}
function storageRemove(key: string) {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch {
    delete memory[key];
  }
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ---------- dados iniciais ----------
function seed(): DB {
  const users: User[] = [
    { id: "u1", name: "Carla Souza", email: "carla.souza@escola.edu.br", password: "salafacil", role: "Coordenação" },
    { id: "u2", name: "Lucas Martins", email: "lucas.martins@escola.edu.br", password: "salafacil", role: "Professor" },
    { id: "u3", name: "Marina Alves", email: "marina.alves@escola.edu.br", password: "salafacil", role: "Professora" },
  ];
  const rooms: Room[] = [
    { id: "r1", name: "Sala 101", capacity: 30, block: "Bloco A" },
    { id: "r2", name: "Sala 108", capacity: 35, block: "Bloco A" },
    { id: "r3", name: "Sala 204", capacity: 40, block: "Bloco B" },
    { id: "r4", name: "Lab. 01", capacity: 24, block: "Bloco C" },
    { id: "r5", name: "Lab. 02", capacity: 24, block: "Bloco C" },
    { id: "r6", name: "Auditório", capacity: 120, block: "Bloco A" },
    { id: "r7", name: "Sala Maker", capacity: 20, block: "Bloco C" },
  ];
  // Agendamentos de exemplo na semana atual (para o app não começar vazio)
  const mon = mondayOf(new Date());
  const d = (i: number) => toISO(addDays(mon, i));
  const b = (day: number, start: string, end: string, title: string, group: string, owner: string, roomId: string): Booking => ({
    id: uid(), title, group, owner, roomId, date: d(day), start, end, createdBy: "u1",
  });
  const bookings: Booking[] = [
    b(0, "08:00", "09:30", "Matemática Aplicada", "3º Ano A", "Prof. Lucas", "r3"),
    b(0, "13:30", "15:00", "Robótica", "9º Ano B", "Profa. Marina", "r7"),
    b(1, "10:00", "11:30", "Laboratório de Química", "2º Ano B", "Profa. Marina", "r4"),
    b(1, "14:00", "16:00", "Reunião Pedagógica", "Equipe docente", "Carla Souza", "r6"),
    b(2, "08:00", "09:30", "Matemática Aplicada", "3º Ano A", "Prof. Lucas", "r3"),
    b(2, "10:00", "11:30", "Laboratório de Química", "2º Ano B", "Profa. Marina", "r4"),
    b(2, "14:00", "15:30", "História do Brasil", "1º Ano C", "Prof. André", "r2"),
    b(3, "09:00", "10:30", "Física Experimental", "3º Ano B", "Prof. Lucas", "r5"),
    b(3, "10:00", "12:00", "Oficina de Redação", "2º Ano A", "Profa. Júlia", "r1"),
    b(4, "08:00", "09:30", "Biologia", "1º Ano A", "Profa. Marina", "r5"),
    b(4, "15:00", "17:00", "Palestra: Carreiras", "3º Anos", "Carla Souza", "r6"),
  ];
  return { users, rooms, bookings };
}

function load(): DB {
  const raw = storageGet(DB_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as DB;
    } catch {
      /* dados corrompidos: recria */
    }
  }
  const db = seed();
  storageSet(DB_KEY, JSON.stringify(db));
  return db;
}

let db = load();
const save = () => storageSet(DB_KEY, JSON.stringify(db));

// ---------- API pública ----------
export const api = {
  // Sessão
  login(email: string, password: string, remember: boolean): User | null {
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
    if (!user) return null;
    storageRemove(SESSION_KEY);
    storageSet(SESSION_KEY, user.id, !remember);
    return user;
  },
  logout() {
    storageRemove(SESSION_KEY);
  },
  currentUser(): User | null {
    const id = storageGet(SESSION_KEY) ?? storageGet(SESSION_KEY, true);
    return db.users.find((u) => u.id === id) ?? null;
  },

  // Salas
  rooms(): Room[] {
    return db.rooms;
  },
  room(id: string) {
    return db.rooms.find((r) => r.id === id);
  },
  roomColor(id: string) {
    const i = db.rooms.findIndex((r) => r.id === id);
    return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
  },

  // Agendamentos
  bookings(): Booking[] {
    return [...db.bookings].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  },
  conflict(data: Omit<Booking, "id" | "createdBy">, ignoreId?: string): Booking | undefined {
    const s = toMin(data.start);
    const e = toMin(data.end);
    return db.bookings.find(
      (b) => b.id !== ignoreId && b.roomId === data.roomId && b.date === data.date && s < toMin(b.end) && e > toMin(b.start),
    );
  },
  saveBooking(data: Omit<Booking, "id" | "createdBy">, userId: string, id?: string): { ok: true } | { ok: false; error: string } {
    if (!data.title.trim()) return { ok: false, error: "Informe o nome da atividade." };
    if (!data.date) return { ok: false, error: "Informe a data." };
    if (!data.start || !data.end) return { ok: false, error: "Informe o horário de início e de término." };
    if (toMin(data.end) <= toMin(data.start)) return { ok: false, error: "O término precisa ser depois do início." };
    if (!data.roomId) return { ok: false, error: "Escolha uma sala." };
    const c = this.conflict(data, id);
    if (c) return { ok: false, error: `Essa sala já está reservada das ${c.start} às ${c.end} (${c.title}).` };
    if (id) {
      db.bookings = db.bookings.map((b) => (b.id === id ? { ...b, ...data } : b));
    } else {
      db.bookings.push({ ...data, id: uid(), createdBy: userId });
    }
    save();
    return { ok: true };
  },
  deleteBooking(id: string) {
    db.bookings = db.bookings.filter((b) => b.id !== id);
    save();
  },
  resetDemo() {
    db = seed();
    save();
  },
};

// ---------- cálculos derivados ----------
export const isPast = (b: Booking, now = new Date()) => {
  const today = toISO(now);
  if (b.date < today) return true;
  if (b.date > today) return false;
  return toMin(b.end) <= now.getHours() * 60 + now.getMinutes();
};

export type RoomStatus = { free: boolean; label: string };
export function roomStatusNow(roomId: string, bookings: Booking[], now = new Date()): RoomStatus {
  const today = toISO(now);
  const m = now.getHours() * 60 + now.getMinutes();
  const todays = bookings.filter((b) => b.roomId === roomId && b.date === today).sort((a, b) => a.start.localeCompare(b.start));
  const current = todays.find((b) => toMin(b.start) <= m && m < toMin(b.end));
  if (current) {
    // emenda reservas consecutivas para mostrar quando a sala libera de fato
    let until = toMin(current.end);
    for (const b of todays) if (toMin(b.start) <= until && toMin(b.end) > until) until = toMin(b.end);
    return { free: false, label: `Ocupada até ${fromMin(until)}` };
  }
  const next = todays.find((b) => toMin(b.start) > m);
  return next ? { free: true, label: `Livre até ${next.start}` } : { free: true, label: "Livre o dia todo" };
}

// Expediente considerado para o cálculo de ocupação
const OPEN = 8 * 60;
const CLOSE = 18 * 60;

export function weekOccupancy(weekStart: Date, bookings: Booking[], roomCount: number) {
  const days = new Set(Array.from({ length: 5 }, (_, i) => toISO(addDays(weekStart, i))));
  let used = 0;
  const perHour = new Array(24).fill(0);
  for (const b of bookings) {
    if (!days.has(b.date)) continue;
    const s = Math.max(toMin(b.start), OPEN);
    const e = Math.min(toMin(b.end), CLOSE);
    if (e > s) used += e - s;
    for (let h = 0; h < 24; h++) {
      const overlap = Math.min(toMin(b.end), (h + 1) * 60) - Math.max(toMin(b.start), h * 60);
      if (overlap > 0) perHour[h] += overlap;
    }
  }
  const capacity = roomCount * 5 * (CLOSE - OPEN);
  const pct = capacity ? Math.round((used / capacity) * 100) : 0;
  // janela de 2h mais concorrida
  let best = -1;
  let bestH = 0;
  for (let h = 6; h < 22; h++) {
    const v = perHour[h] + perHour[h + 1];
    if (v > best) {
      best = v;
      bestH = h;
    }
  }
  return { pct, peak: best > 0 ? `${bestH}h e ${bestH + 2}h` : null };
}
