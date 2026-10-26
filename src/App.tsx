import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  api,
  addDays,
  durationLabel,
  fromMin,
  isPast,
  longDate,
  mondayOf,
  MONTHS_SHORT,
  parseISO,
  roomStatusNow,
  shortDate,
  toISO,
  toMin,
  weekOccupancy,
  WEEKDAYS,
  WEEKDAYS_SHORT,
  type Booking,
  type User,
} from "./data";

// ================= Ícones =================
type IconName =
  | "home" | "calendar" | "door" | "chart" | "bell" | "search" | "plus" | "chevron-left" | "chevron-right"
  | "clock" | "pin" | "more" | "check" | "x" | "mail" | "lock" | "logout" | "edit" | "trash" | "user" | "alert";

const iconPaths: Record<IconName, ReactNode> = {
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  door: <><path d="M5 21h14M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17" /><path d="M10 12h.01" /></>,
  chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  "chevron-left": <path d="m15 18-6-6 6-6" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>,
};

function Icon({ name, size = "size-5" }: { name: IconName; size?: string }) {
  return (
    <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

function Action({ children, className = "", onClick, label }: { children: ReactNode; className?: string; onClick?: () => void; label?: string }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={`cursor-pointer select-none ${className}`}>
      {children}
    </button>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
const labelClass = "mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500";

const navItems: { label: View; icon: IconName }[] = [
  { label: "Início", icon: "home" },
  { label: "Agendamentos", icon: "calendar" },
  { label: "Salas", icon: "door" },
];
type View = "Início" | "Agendamentos" | "Salas";

const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

// ================= Menu "mais opções" =================
function MoreMenu({ items, className = "" }: { items: { label: string; icon: IconName; danger?: boolean; onClick: () => void }[]; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Action label="Mais opções" onClick={() => setOpen(!open)} className={`rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 ${className}`}>
        <Icon name="more" />
      </Action>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-40 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
            {items.map((it) => (
              <Action
                key={it.label}
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold ${it.danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <Icon name={it.icon} size="size-4" /> {it.label}
              </Action>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ================= Diálogo de confirmação =================
function ConfirmDialog({ booking, onCancel, onConfirm }: { booking: Booking; onCancel: () => void; onConfirm: () => void }) {
  const past = isPast(booking);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl md:p-8">
        <div className="flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Icon name="trash" />
        </div>
        <div className="mt-5 text-xl font-bold text-slate-900">{past ? "Excluir registro?" : "Cancelar agendamento?"}</div>
        <div className="mt-2 text-sm leading-6 text-slate-500">
          <span className="font-semibold text-slate-700">{booking.title}</span> em {api.room(booking.roomId)?.name}, {shortDate(booking.date).toLowerCase()} das {booking.start} às {booking.end}.
          {!past && " A sala ficará livre para outras reservas."}
        </div>
        <div className="mt-7 flex justify-end gap-3">
          <Action onClick={onCancel} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Voltar</Action>
          <Action onClick={onConfirm} className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700">
            {past ? "Excluir" : "Cancelar agendamento"}
          </Action>
        </div>
      </div>
    </div>
  );
}

// ================= Modal de agendamento =================
type ModalState = { booking?: Booking; roomId?: string; date?: string };

function BookingModal({ state, user, onClose, onSaved }: { state: ModalState; user: User; onClose: () => void; onSaved: () => void }) {
  const editing = state.booking;
  const defaultStart = () => {
    const now = new Date();
    const m = Math.min(Math.max(now.getHours() + 1, 8), 20) * 60;
    return fromMin(m);
  };
  const [form, setForm] = useState(() => {
    if (editing) return { title: editing.title, group: editing.group, owner: editing.owner, roomId: editing.roomId, date: editing.date, start: editing.start, end: editing.end };
    const start = defaultStart();
    return { title: "", group: "", owner: user.name, roomId: state.roomId ?? "", date: state.date ?? toISO(new Date()), start, end: fromMin(toMin(start) + 90) };
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
  };

  const validTime = form.start && form.end && toMin(form.end) > toMin(form.start);
  const rooms = api.rooms().map((r) => ({
    ...r,
    busy: Boolean(form.date && validTime && api.conflict({ ...form, roomId: r.id }, editing?.id)),
  }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const res = api.saveBooking(form, user.id, editing?.id);
    if (!res.ok) return setError(res.error);
    setSaved(true);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="my-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl md:p-8">
        {saved ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Icon name="check" size="size-8" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{editing ? "Agendamento atualizado" : "Agendamento confirmado"}</div>
            <div className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {api.room(form.roomId)?.name} reservada para {longDate(parseISO(form.date)).toLowerCase()}, das {form.start} às {form.end}.
            </div>
            <Action onClick={onClose} className="mt-7 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800">
              Voltar para a agenda
            </Action>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-bold text-slate-900">{editing ? "Editar agendamento" : "Novo agendamento"}</div>
                <div className="mt-1 text-sm text-slate-500">Preencha os dados para reservar um espaço.</div>
              </div>
              <Action onClick={onClose} label="Fechar" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <Icon name="x" />
              </Action>
            </div>
            <div className="mt-7 space-y-5">
              <div>
                <label className={labelClass} htmlFor="f-title">Atividade</label>
                <input id="f-title" autoFocus className={inputClass} placeholder="Ex.: Aula de Biologia" value={form.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="f-group">Turma</label>
                  <input id="f-group" className={inputClass} placeholder="Ex.: 2º Ano B" value={form.group} onChange={(e) => set("group", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="f-owner">Responsável</label>
                  <input id="f-owner" className={inputClass} value={form.owner} onChange={(e) => set("owner", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-3">
                <div>
                  <label className={labelClass} htmlFor="f-date">Data</label>
                  <input id="f-date" type="date" className={inputClass} value={form.date} onChange={(e) => set("date", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="f-start">Início</label>
                  <input id="f-start" type="time" step={900} className={inputClass} value={form.start} onChange={(e) => set("start", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="f-end">Término</label>
                  <input id="f-end" type="time" step={900} className={inputClass} value={form.end} onChange={(e) => set("end", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="f-room">Sala</label>
                <select
                  id="f-room"
                  className={`${inputClass} ${form.roomId && !rooms.find((r) => r.id === form.roomId)?.busy ? "border-emerald-200 bg-emerald-50 font-semibold text-emerald-800" : ""}`}
                  value={form.roomId}
                  onChange={(e) => set("roomId", e.target.value)}
                >
                  <option value="">Selecione uma sala…</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id} disabled={r.busy}>
                      {r.name} · {r.block} · {r.capacity} lugares{r.busy ? " — ocupada nesse horário" : ""}
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-slate-400">
                  {validTime ? `${rooms.filter((r) => !r.busy).length} de ${rooms.length} salas livres nesse horário` : "Defina um horário válido para ver a disponibilidade"}
                </div>
              </div>
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  <Icon name="alert" size="size-4 mt-0.5 shrink-0" /> {error}
                </div>
              )}
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Action onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</Action>
              <button type="submit" className="cursor-pointer rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-800">
                {editing ? "Salvar alterações" : "Confirmar agendamento"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ================= Login =================
function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [remember, setRemember] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [forgot, setForgot] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return setError("Preencha e-mail e senha.");
    const u = api.login(email, password, remember);
    if (!u) return setError("E-mail ou senha incorretos.");
    onLogin(u);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl md:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-emerald-800 p-12 text-white lg:flex">
          <div className="absolute -right-24 -top-24 size-80 rounded-full border border-emerald-500/30"></div>
          <div className="absolute -right-8 -top-8 size-52 rounded-full border border-emerald-400/30"></div>
          <div className="relative flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-white text-emerald-800"><Icon name="calendar" /></div>
            <div>
              <div className="text-xl font-extrabold tracking-tight">SalaFácil</div>
              <div className="text-xs font-medium text-emerald-200">Gestão educacional</div>
            </div>
          </div>
          <div className="relative max-w-lg">
            <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-emerald-700 text-emerald-100"><Icon name="door" size="size-7" /></div>
            <div className="text-4xl font-extrabold leading-tight tracking-tight">Todos os espaços da sua escola, organizados.</div>
            <div className="mt-5 max-w-md text-base leading-7 text-emerald-100">Consulte salas disponíveis, faça reservas e acompanhe toda a agenda em um só lugar.</div>
          </div>
          <div className="relative flex items-center gap-8 border-t border-emerald-700 pt-7 text-sm text-emerald-100">
            <span className="flex items-center gap-2"><Icon name="check" size="size-4" /> Reservas rápidas</span>
            <span className="flex items-center gap-2"><Icon name="check" size="size-4" /> Agenda centralizada</span>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-12">
          <form className="w-full max-w-md" onSubmit={submit}>
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-700 text-white"><Icon name="calendar" /></div>
              <span className="text-xl font-extrabold">SalaFácil</span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-slate-900">Bem-vinda de volta</div>
            <div className="mt-2 text-sm leading-6 text-slate-500">Entre com seus dados institucionais para acessar as salas.</div>

            <div className="mt-9 space-y-5">
              <div>
                <label className={labelClass} htmlFor="l-email">E-mail institucional</label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 text-sm text-slate-700 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                  <Icon name="mail" size="size-4 text-slate-400 shrink-0" />
                  <input id="l-email" type="email" autoComplete="username" placeholder="nome@escola.edu.br" className="w-full bg-transparent py-3.5 outline-none" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} />
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="l-pass">Senha</label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 text-sm text-slate-700 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                  <Icon name="lock" size="size-4 text-slate-400 shrink-0" />
                  <input id="l-pass" type="password" autoComplete="current-password" placeholder="••••••••" className="w-full bg-transparent py-3.5 outline-none" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <Action onClick={() => setRemember(!remember)} className="flex items-center gap-2 text-slate-600">
                  <span className={`flex size-5 items-center justify-center rounded-md border ${remember ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300"}`}>
                    {remember && <Icon name="check" size="size-3.5" />}
                  </span>
                  Manter conectado
                </Action>
                <Action onClick={() => setForgot(!forgot)} className="font-semibold text-emerald-700 hover:text-emerald-800">Esqueci minha senha</Action>
              </div>
              {forgot && <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Para redefinir sua senha, entre em contato com a secretaria.</div>}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  <Icon name="alert" size="size-4 shrink-0" /> {error}
                </div>
              )}
              <button type="submit" className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-emerald-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 hover:bg-emerald-800">
                Entrar no sistema
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-dashed border-slate-200 px-4 py-3 text-center text-xs leading-5 text-slate-500">
              Acesso de demonstração: <span className="font-semibold text-slate-700">carla.souza@escola.edu.br</span> · senha <span className="font-semibold text-slate-700">salafacil</span>
            </div>
            <div className="mt-8 text-center text-xs leading-5 text-slate-400">Acesso exclusivo para colaboradores cadastrados.<br />Em caso de dúvidas, contate a secretaria.</div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ================= Cartão de agendamento (agenda do dia) =================
function ScheduleCard({ b, onEdit, onDelete }: { b: Booking; onEdit: () => void; onDelete: () => void }) {
  const c = api.roomColor(b.roomId);
  const past = isPast(b);
  return (
    <div className={`group flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:gap-5 md:p-5 ${past ? "opacity-60" : ""}`}>
      <div className="w-14 shrink-0 border-r border-slate-100 pr-3 text-right md:w-20 md:pr-5">
        <div className="text-sm font-extrabold text-slate-800">{b.start}</div>
        <div className="mt-1 text-xs text-slate-400">{b.end}</div>
      </div>
      <div className={`w-1 shrink-0 rounded-full ${c.color}`}></div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-bold text-slate-900">{b.title}</div>
            <div className="mt-1 text-sm text-slate-500">{[b.group, b.owner].filter(Boolean).join(" · ")}</div>
          </div>
          <MoreMenu
            className="md:opacity-0 md:group-hover:opacity-100"
            items={past ? [{ label: "Excluir registro", icon: "trash", danger: true, onClick: onDelete }] : [
              { label: "Editar", icon: "edit", onClick: onEdit },
              { label: "Cancelar agendamento", icon: "trash", danger: true, onClick: onDelete },
            ]}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold ${c.soft} ${c.text}`}>
            <Icon name="pin" size="size-3.5" /> {api.room(b.roomId)?.name}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Icon name="clock" size="size-3.5" /> {durationLabel(b.start, b.end)} de duração
          </span>
          {past && <span className="text-xs font-semibold text-slate-400">Concluído</span>}
        </div>
      </div>
    </div>
  );
}

// ================= Tela: Agendamentos =================
type Filter = "Todos" | "Próximos" | "Concluídos";

function BookingsView({ bookings, now, query, setQuery, onNew, onEdit, onDelete }: {
  bookings: Booking[]; now: Date; query: string; setQuery: (q: string) => void;
  onNew: () => void; onEdit: (b: Booking) => void; onDelete: (b: Booking) => void;
}) {
  const [filter, setFilter] = useState<Filter>("Próximos");
  const q = query.trim().toLowerCase();
  const matches = (b: Booking) =>
    !q || [b.title, b.group, b.owner, api.room(b.roomId)?.name ?? ""].some((s) => s.toLowerCase().includes(q));
  const base = bookings.filter(matches);
  const upcoming = base.filter((b) => !isPast(b, now));
  const done = base.filter((b) => isPast(b, now)).reverse();
  const list = filter === "Todos" ? [...upcoming, ...done] : filter === "Próximos" ? upcoming : done;

  return (
    <div className="mx-auto max-w-7xl p-5 pb-28 md:p-8 md:pb-28 lg:p-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="text-sm font-semibold text-emerald-700">Gestão de reservas</div>
          <div className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Agendamentos</div>
          <div className="mt-2 text-sm text-slate-500">Consulte e gerencie todos os agendamentos gerados.</div>
        </div>
        <Action onClick={onNew} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">
          <Icon name="plus" size="size-4" /> Novo agendamento
        </Action>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {([["Todos", base.length], ["Próximos", upcoming.length], ["Concluídos", done.length]] as [Filter, number][]).map(([f, n]) => (
          <Action key={f} onClick={() => setFilter(f)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${filter === f ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}>
            {f} {n}
          </Action>
        ))}
        {q && (
          <span className="ml-1 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
            <Icon name="search" size="size-4" /> “{query}”
            <Action label="Limpar busca" onClick={() => setQuery("")} className="rounded p-0.5 hover:bg-emerald-100"><Icon name="x" size="size-3.5" /></Action>
          </span>
        )}
      </div>

      <div className="mt-5 overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
        {list.length === 0 && (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Icon name="calendar" /></div>
            <div className="mt-4 font-bold text-slate-800">Nenhum agendamento encontrado</div>
            <div className="mt-1 text-sm text-slate-500">{q ? "Tente outra busca ou limpe o filtro." : "Crie um novo agendamento para começar."}</div>
          </div>
        )}
        {list.map((b, index) => {
          const c = api.roomColor(b.roomId);
          const past = isPast(b, now);
          return (
            <div key={b.id} className={`grid gap-4 p-5 md:grid-cols-[7rem_1fr_10rem_9rem] md:items-center ${index !== list.length - 1 ? "border-b border-slate-100" : ""}`}>
              <div>
                <div className="text-sm font-extrabold text-slate-800">{shortDate(b.date)}</div>
                <div className="mt-1 text-xs text-slate-400">{b.start} — {b.end}</div>
              </div>
              <div className="min-w-0">
                <div className="truncate font-bold text-slate-900">{b.title}</div>
                <div className="mt-1 text-sm text-slate-500">{[b.group, b.owner].filter(Boolean).join(" · ")}</div>
              </div>
              <div className={`inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${c.soft} ${c.text}`}>
                <Icon name="pin" size="size-3.5" /> {api.room(b.roomId)?.name}
              </div>
              <div className="flex items-center justify-between gap-3 md:justify-end">
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${past ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>{past ? "Concluído" : "Confirmado"}</span>
                <MoreMenu items={past ? [{ label: "Excluir registro", icon: "trash", danger: true, onClick: () => onDelete(b) }] : [
                  { label: "Editar", icon: "edit", onClick: () => onEdit(b) },
                  { label: "Cancelar agendamento", icon: "trash", danger: true, onClick: () => onDelete(b) },
                ]} />
              </div>
            </div>
          );
        })}
        {list.length > 0 && (
          <div className="rounded-b-2xl border-t border-slate-100 bg-slate-50 px-5 py-4 text-center text-xs font-medium text-slate-400">
            Mostrando {list.length} de {bookings.length} agendamentos
          </div>
        )}
      </div>
    </div>
  );
}

// ================= Tela: Salas =================
function RoomsView({ bookings, now, onNew, onSeeAgenda }: { bookings: Booking[]; now: Date; onNew: (roomId: string) => void; onSeeAgenda: (roomName: string) => void }) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const rooms = api.rooms().filter((r) => !q || r.name.toLowerCase().includes(q) || r.block.toLowerCase().includes(q) || String(r.capacity).includes(q));

  return (
    <div className="mx-auto max-w-7xl p-5 pb-28 md:p-8 md:pb-28 lg:p-10">
      <div>
        <div className="text-sm font-semibold text-emerald-700">Espaços da instituição</div>
        <div className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Salas disponíveis</div>
        <div className="mt-2 text-sm text-slate-500">Encontre o melhor espaço para sua próxima atividade.</div>
      </div>
      <label className="mt-7 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-400 shadow-sm focus-within:border-emerald-500">
        <Icon name="search" />
        <input className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" placeholder="Buscar por nome, bloco ou capacidade..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <span className="ml-auto hidden shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 sm:inline">{rooms.length} espaços</span>
      </label>
      {rooms.length === 0 && <div className="mt-10 text-center text-sm text-slate-500">Nenhuma sala encontrada para “{search}”.</div>}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rooms.map((room) => {
          const st = roomStatusNow(room.id, bookings, now);
          return (
            <div key={room.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className={`flex size-11 items-center justify-center rounded-xl ${st.free ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}><Icon name="door" /></div>
                <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${st.free ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                  <span className={`size-1.5 rounded-full ${st.free ? "bg-emerald-500" : "bg-rose-500"}`}></span>{st.free ? "Disponível" : "Ocupada"}
                </span>
              </div>
              <div className="mt-5 text-lg font-bold text-slate-900">{room.name}</div>
              <div className="mt-1 text-sm text-slate-400">{room.capacity} lugares · {room.block}</div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span className="text-xs font-semibold text-slate-500">{st.label}</span>
                <div className="flex items-center gap-4">
                  <Action onClick={() => onSeeAgenda(room.name)} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Ver agenda</Action>
                  <Action onClick={() => onNew(room.id)} className="text-sm font-bold text-emerald-700 hover:text-emerald-800">Agendar</Action>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ================= App =================
export default function App() {
  const [user, setUser] = useState<User | null>(() => api.currentUser());
  const [view, setView] = useState<View>("Início");
  const [version, setVersion] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeDay, setActiveDay] = useState(() => {
    const d = new Date().getDay();
    return d >= 1 && d <= 5 ? d - 1 : 0;
  });
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toDelete, setToDelete] = useState<Booking | null>(null);
  const [query, setQuery] = useState("");
  const [headerSearch, setHeaderSearch] = useState("");
  const [bellOpen, setBellOpen] = useState(false);
  const [toast, setToast] = useState("");

  // atualiza status "agora" a cada 30s
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bookings = useMemo(() => api.bookings(), [version]);
  const refresh = () => setVersion((v) => v + 1);

  // Semana exibida (segunda a sexta). No fim de semana, mostra a próxima.
  const baseMonday = useMemo(() => {
    const m = mondayOf(now);
    return now.getDay() === 0 || now.getDay() === 6 ? addDays(m, 7) : m;
  }, [now]);
  const weekStart = addDays(baseMonday, weekOffset * 7);
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  const selectedDate = weekDays[activeDay];
  const selectedISO = toISO(selectedDate);
  const todayISO = toISO(now);
  const dayBookings = bookings.filter((b) => b.date === selectedISO);
  const upcomingCount = bookings.filter((b) => !isPast(b, now)).length;
  const todayUpcoming = bookings.filter((b) => b.date === todayISO && !isPast(b, now));

  const occ = weekOccupancy(weekStart, bookings, api.rooms().length);
  const prevOcc = weekOccupancy(addDays(weekStart, -7), bookings, api.rooms().length);
  const diff = occ.pct - prevOcc.pct;

  const weekLabel = (() => {
    const a = weekDays[0];
    const b = weekDays[4];
    return a.getMonth() === b.getMonth()
      ? `${a.getDate()} — ${b.getDate()} ${MONTHS_SHORT[b.getMonth()]}, ${b.getFullYear()}`
      : `${a.getDate()} ${MONTHS_SHORT[a.getMonth()]} — ${b.getDate()} ${MONTHS_SHORT[b.getMonth()]}, ${b.getFullYear()}`;
  })();

  if (!user) return <LoginScreen onLogin={(u) => { setUser(u); setView("Início"); }} />;

  const logout = () => {
    api.logout();
    setUser(null);
  };
  const openNew = (preset: ModalState = {}) => setModal({ date: view === "Início" ? selectedISO : undefined, ...preset });
  const goToday = () => {
    setWeekOffset(0);
    const d = now.getDay();
    setActiveDay(d >= 1 && d <= 5 ? d - 1 : 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white p-5 lg:flex">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/15"><Icon name="calendar" /></div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-slate-900">SalaFácil</div>
              <div className="text-xs font-medium text-slate-400">Gestão educacional</div>
            </div>
          </div>

          <div className="mt-8 flex-1 space-y-1">
            <div className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-slate-400">Menu principal</div>
            {navItems.map((item) => (
              <Action
                key={item.label}
                onClick={() => setView(item.label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${view === item.label ? "bg-emerald-50 text-emerald-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.label === "Agendamentos" && upcomingCount > 0 && <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">{upcomingCount}</span>}
              </Action>
            ))}
          </div>

          <Action onClick={logout} className="mb-5 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-rose-600">
            <Icon name="logout" />
            <span>Sair do sistema</span>
          </Action>
          <div className="flex items-center gap-3 border-t border-slate-100 px-2 pt-5">
            <div className="flex size-10 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">{initials(user.name)}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-slate-800">{user.name}</div>
              <div className="truncate text-xs text-slate-400">{user.role}</div>
            </div>
            <Action onClick={logout} label="Sair"><Icon name="logout" size="size-5 text-slate-400" /></Action>
          </div>
        </aside>

        <main className="w-full min-w-0 lg:ml-64">
          <header className="sticky top-0 z-20 flex h-20 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-5 backdrop-blur-md md:px-8 lg:px-10">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-700 text-white"><Icon name="calendar" size="size-4" /></div>
              <span className="font-extrabold">SalaFácil</span>
            </div>
            <form
              className="hidden w-80 items-center gap-3 rounded-xl bg-slate-100 px-4 text-slate-400 focus-within:ring-2 focus-within:ring-emerald-100 md:flex"
              onSubmit={(e) => {
                e.preventDefault();
                setQuery(headerSearch);
                setView("Agendamentos");
              }}
            >
              <Icon name="search" size="size-4 shrink-0" />
              <input className="w-full bg-transparent py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400" placeholder="Buscar agendamentos, salas..." value={headerSearch} onChange={(e) => setHeaderSearch(e.target.value)} />
            </form>
            <div className="ml-auto flex items-center gap-3">
              <div className="relative">
                <Action label="Notificações" onClick={() => setBellOpen(!bellOpen)} className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50">
                  <Icon name="bell" />
                  {todayUpcoming.length > 0 && <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-rose-500"></span>}
                </Action>
                {bellOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setBellOpen(false)} />
                    <div className="absolute right-0 top-14 z-40 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                      <div className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-800">Próximos hoje</div>
                      {todayUpcoming.length === 0 && <div className="px-4 py-6 text-center text-sm text-slate-400">Nenhum agendamento restante hoje.</div>}
                      {todayUpcoming.slice(0, 5).map((b) => (
                        <div key={b.id} className="flex items-center gap-3 border-b border-slate-50 px-4 py-3 last:border-0">
                          <div className={`h-8 w-1 rounded-full ${api.roomColor(b.roomId).color}`} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-slate-800">{b.title}</div>
                            <div className="text-xs text-slate-400">{b.start} — {b.end} · {api.room(b.roomId)?.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <Action onClick={() => openNew()} className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-800">
                <Icon name="plus" size="size-4" />
                <span className="hidden sm:inline">Novo agendamento</span>
                <span className="sm:hidden">Agendar</span>
              </Action>
              <Action onClick={logout} label="Sair" className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:text-rose-600 lg:hidden">
                <Icon name="logout" />
              </Action>
            </div>
          </header>

          <div className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-around rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur lg:hidden">
            {navItems.map((item) => (
              <Action key={item.label} onClick={() => setView(item.label)} className={`flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold ${view === item.label ? "bg-emerald-50 text-emerald-700" : "text-slate-400"}`}>
                <Icon name={item.icon} size="size-5" />
                {item.label}
              </Action>
            ))}
          </div>

          {view === "Início" && (
            <div className="mx-auto max-w-7xl p-5 pb-28 md:p-8 md:pb-28 lg:p-10">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div>
                  <div className="text-sm font-semibold text-emerald-700">{longDate(selectedDate)}{selectedISO === todayISO ? " · hoje" : ""}</div>
                  <div className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Olá, {user.name.split(" ")[0]}!</div>
                  <div className="mt-2 text-sm text-slate-500">Acompanhe os espaços e compromissos da sua instituição.</div>
                </div>
                <div className="flex items-center gap-2">
                  <Action label="Semana anterior" onClick={() => setWeekOffset(weekOffset - 1)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50"><Icon name="chevron-left" size="size-4" /></Action>
                  <div className="px-2 text-sm font-bold text-slate-700">{weekLabel}</div>
                  <Action label="Próxima semana" onClick={() => setWeekOffset(weekOffset + 1)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50"><Icon name="chevron-right" size="size-4" /></Action>
                  {(weekOffset !== 0 || selectedISO !== todayISO) && (
                    <Action onClick={goToday} className="ml-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Hoje</Action>
                  )}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-5 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm md:gap-3">
                {weekDays.map((day, index) => {
                  const iso = toISO(day);
                  const has = bookings.some((b) => b.date === iso);
                  const isToday = iso === todayISO;
                  const active = activeDay === index;
                  return (
                    <Action
                      key={iso}
                      onClick={() => setActiveDay(index)}
                      label={WEEKDAYS[day.getDay()]}
                      className={`flex flex-col items-center rounded-xl py-3 transition-colors md:flex-row md:justify-center md:gap-3 ${active ? "bg-emerald-700 text-white shadow-md shadow-emerald-900/10" : "text-slate-400 hover:bg-slate-50"}`}
                    >
                      <span className="text-xs font-bold tracking-wider">{WEEKDAYS_SHORT[day.getDay()]}</span>
                      <span className={`mt-1 text-lg font-extrabold md:mt-0 ${active ? "text-white" : isToday ? "text-emerald-700" : "text-slate-800"}`}>{day.getDate()}</span>
                      {has && <span className={`mt-1 size-1 rounded-full md:mt-0 ${active ? "bg-white" : "bg-emerald-600"}`}></span>}
                    </Action>
                  );
                })}
              </div>

              <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,0.8fr)]">
                <section className="min-w-0">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-slate-900">Agenda do dia</div>
                      <div className="mt-1 text-xs text-slate-400">{dayBookings.length} {dayBookings.length === 1 ? "atividade programada" : "atividades programadas"}</div>
                    </div>
                    <Action onClick={() => setView("Agendamentos")} className="text-sm font-bold text-emerald-700 hover:text-emerald-800">Ver agenda completa</Action>
                  </div>
                  <div className="space-y-3">
                    {dayBookings.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
                        <div className="font-bold text-slate-800">Nenhuma atividade neste dia</div>
                        <div className="mt-1 text-sm text-slate-500">Todas as salas estão livres.</div>
                        <Action onClick={() => openNew({ date: selectedISO })} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
                          <Icon name="plus" size="size-4" /> Agendar uma sala
                        </Action>
                      </div>
                    )}
                    {dayBookings.map((b) => (
                      <ScheduleCard key={b.id} b={b} onEdit={() => setModal({ booking: b })} onDelete={() => setToDelete(b)} />
                    ))}
                  </div>
                </section>

                <aside>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-slate-900">Salas agora</div>
                      <div className="mt-1 text-xs text-slate-400">Disponibilidade às {now.getHours().toString().padStart(2, "0")}:{now.getMinutes().toString().padStart(2, "0")}</div>
                    </div>
                    <Action onClick={() => setView("Salas")} className="text-sm font-bold text-emerald-700 hover:text-emerald-800">Ver todas</Action>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {api.rooms().map((room, index, arr) => {
                      const st = roomStatusNow(room.id, bookings, now);
                      return (
                        <div key={room.id} className={`flex items-center gap-3 p-4 ${index !== arr.length - 1 ? "border-b border-slate-100" : ""}`}>
                          <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${st.free ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}><Icon name="door" /></div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-800">{room.name}</div>
                            <div className="mt-0.5 truncate text-xs text-slate-400">{room.capacity} lugares · {room.block}</div>
                          </div>
                          <div className={`flex items-center gap-1.5 text-xs font-bold ${st.free ? "text-emerald-700" : "text-rose-500"}`}>
                            <span className={`size-1.5 rounded-full ${st.free ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                            <span className="hidden sm:inline xl:hidden 2xl:inline">{st.label}</span>
                          </div>
                        </div>
                      );
                    })}
                    <Action onClick={() => openNew({ date: todayISO })} className="flex w-full items-center justify-center gap-2 bg-slate-50 p-4 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">
                      <Icon name="plus" size="size-4" /> Reservar uma sala livre
                    </Action>
                  </div>

                  <div className="mt-6 overflow-hidden rounded-2xl bg-slate-900 p-5 text-white shadow-xl shadow-slate-900/10">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-300">Ocupação semanal</div>
                      <Icon name="chart" size="size-5 text-emerald-400" />
                    </div>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-3xl font-extrabold">{occ.pct}%</span>
                      <span className={`mb-1 text-xs font-semibold ${diff >= 0 ? "text-emerald-400" : "text-slate-400"}`}>
                        {diff >= 0 ? "+" : ""}{diff} p.p. vs. semana anterior
                      </span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-700">
                      <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${Math.min(occ.pct, 100)}%` }}></div>
                    </div>
                    <div className="mt-3 text-xs leading-5 text-slate-400">
                      {occ.peak ? `O período mais concorrido é entre ${occ.peak}.` : "Nenhuma reserva nesta semana ainda."} Base: 8h–18h, seg. a sex.
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}
          {view === "Agendamentos" && (
            <BookingsView
              bookings={bookings}
              now={now}
              query={query}
              setQuery={(q) => { setQuery(q); setHeaderSearch(q); }}
              onNew={() => openNew()}
              onEdit={(b) => setModal({ booking: b })}
              onDelete={(b) => setToDelete(b)}
            />
          )}
          {view === "Salas" && (
            <RoomsView
              bookings={bookings}
              now={now}
              onNew={(roomId) => openNew({ roomId, date: todayISO })}
              onSeeAgenda={(name) => { setQuery(name); setHeaderSearch(name); setView("Agendamentos"); }}
            />
          )}
        </main>
      </div>

      {modal && <BookingModal state={modal} user={user} onClose={() => setModal(null)} onSaved={refresh} />}
      {toDelete && (
        <ConfirmDialog
          booking={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            const past = isPast(toDelete, now);
            api.deleteBooking(toDelete.id);
            setToDelete(null);
            refresh();
            setToast(past ? "Registro excluído." : "Agendamento cancelado.");
          }}
        />
      )}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl lg:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}
