import { useAppContext } from '../context/useAppContext';
import './History.css';

function getResultLabel(result) {
  switch (result) {
    case 'white':
      return 'Ganan Blancas';
    case 'black':
      return 'Ganan Negras';
    case 'draw':
      return 'Tablas';
    default:
      return result;
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function History() {
  const { matches } = useAppContext();

  if (matches.length === 0) {
    return (
      <div className="history-page">
        <h1>⏱ Historial de Partidas</h1>
        <div className="empty-state">
          <p>No hay partidas registradas todavía.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <h1>⏱ Historial de Partidas</h1>
      <div className="matches-list">
        {[...matches].reverse().map((match) => (
          <div key={match.id} className="match-card">
            <div className="match-header">
              <span className="match-date">{formatDate(match.date)}</span>
              <span className={`match-result-badge ${match.result}`}>
                {getResultLabel(match.result)}
              </span>
            </div>
            <div className="match-players">
              <div className={`match-player ${match.result === 'white' ? 'winner' : ''}`}>
                <span className="player-color white">◻</span>
                <span className="player-name">{match.whiteName}</span>
                {match.result === 'white' && <span className="result-icon">✔</span>}
              </div>
              <span className="vs">vs</span>
              <div className={`match-player ${match.result === 'black' ? 'winner' : ''}`}>
                <span className="player-color black">◼</span>
                <span className="player-name">{match.blackName}</span>
                {match.result === 'black' && <span className="result-icon">✔</span>}
              </div>
            </div>
            {match.result === 'draw' && (
              <div className="draw-indicator">🤝 Tablas</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
