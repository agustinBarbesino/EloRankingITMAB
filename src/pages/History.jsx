import { useAppContext } from '../context/useAppContext';
import './History.css';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function getResultLabel(result) {
  switch (result) {
    case 'white': return 'Ganan Blancas';
    case 'black': return 'Ganan Negras';
    case 'draw': return 'Tablas';
    default: return result;
  }
}

function getWhiteName(match) {
  return match.white_name || match.whiteName || 'Jugador';
}

function getBlackName(match) {
  return match.black_name || match.blackName || 'Jugador';
}

function getDate(match) {
  return new Date(match.created_at || match.date);
}

function groupMatchesByDate(matches) {
  const sorted = [...matches].sort((a, b) => getDate(b) - getDate(a));
  const groups = [];
  let currentMonth = '';
  let currentDay = '';
  let monthGroup = null;
  let dayGroup = null;

  for (const match of sorted) {
    const date = getDate(match);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const dayKey = `${monthKey}-${String(date.getDate()).padStart(2, '0')}`;

    if (monthKey !== currentMonth) {
      currentMonth = monthKey;
      monthGroup = {
        label: `${MESES[date.getMonth()]} ${date.getFullYear()}`,
        days: [],
      };
      groups.push(monthGroup);
      currentDay = '';
      dayGroup = null;
    }

    if (dayKey !== currentDay) {
      currentDay = dayKey;
      dayGroup = {
        label: `${DIAS[date.getDay()]} ${date.getDate()}`,
        matches: [],
      };
      monthGroup.days.push(dayGroup);
    }

    dayGroup.matches.push(match);
  }

  return groups;
}

export default function History() {
  const { matches } = useAppContext();

  if (matches.length === 0) {
    return (
      <div className="history-page">
        <h1>Histórico de Partidas</h1>
        <div className="empty-state">
          <p>No hay partidas registradas todavía.</p>
        </div>
      </div>
    );
  }

  const grouped = groupMatchesByDate(matches);

  return (
    <div className="history-page">
      <h1>Histórico de Partidas</h1>
      <div className="history-timeline">
        {grouped.map((monthGroup) => (
          <div key={monthGroup.label} className="month-group">
            <h2 className="month-header">{monthGroup.label}</h2>
            {monthGroup.days.map((dayGroup) => (
              <div key={dayGroup.label} className="day-group">
                <h3 className="day-header">{dayGroup.label}</h3>
                <div className="day-matches">
                  {dayGroup.matches.map((match) => (
                    <div key={match.id} className="match-card">
                      <div className="match-players">
                        <div className={`match-player ${match.result === 'white' ? 'winner' : ''}`}>
                          <span className="player-color white">◻</span>
                          <span className="player-name">{getWhiteName(match)}</span>
                          {match.result === 'white' && <span className="result-icon">✔</span>}
                        </div>
                        <span className="vs">vs</span>
                        <div className={`match-player ${match.result === 'black' ? 'winner' : ''}`}>
                          <span className="player-color black">◼</span>
                          <span className="player-name">{getBlackName(match)}</span>
                          {match.result === 'black' && <span className="result-icon">✔</span>}
                        </div>
                      </div>
                      <div className="match-footer">
                        <span className={`match-result-badge ${match.result}`}>
                          {getResultLabel(match.result)}
                        </span>
                        <span className="match-time">
                          {getDate(match).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {match.result === 'draw' && (
                        <div className="draw-indicator">🤝 Tablas</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
