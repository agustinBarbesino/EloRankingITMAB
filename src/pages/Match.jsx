import { useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import './Match.css';

function getPlayerName(p) {
  return p.first_name && p.last_name
    ? `${p.first_name} ${p.last_name}`
    : p.display_name || p.name || '';
}

export default function Match() {
  const { players, addMatch } = useAppContext();
  const [whiteId, setWhiteId] = useState('');
  const [blackId, setBlackId] = useState('');
  const [result, setResult] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [error, setError] = useState('');

  const whitePlayer = players.find((p) => p.user_id === whiteId || p.userId === whiteId);
  const blackPlayer = players.find((p) => p.user_id === blackId || p.userId === blackId);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMatchResult(null);

    if (!whiteId || !blackId || !result) {
      setError('Completá todos los campos.');
      return;
    }

    if (whiteId === blackId) {
      setError('Un jugador no puede jugar contra sí mismo.');
      return;
    }

    addMatch(whiteId, blackId, result).then((outcome) => {
      if (outcome) {
        setMatchResult(outcome);
        setWhiteId('');
        setBlackId('');
        setResult('');
      }
    });
  }

  return (
    <div className="match-page">
      <h1>⚔ Registrar Duelo</h1>

      <form className="match-form" onSubmit={handleSubmit}>
        <div className="players-selection">
          <div className="player-select">
            <label htmlFor="white">◻ Blancas</label>
            <select id="white" value={whiteId} onChange={(e) => setWhiteId(e.target.value)}>
              <option value="">Seleccionar...</option>
              {players.map((p) => (
                <option key={p.user_id || p.userId} value={p.user_id || p.userId} disabled={(p.user_id || p.userId) === blackId}>
                  {getPlayerName(p)} (Elo: {p.rating})
                </option>
              ))}
            </select>
          </div>

          <div className="vs-divider">VS</div>

          <div className="player-select">
            <label htmlFor="black">◼ Negras</label>
            <select id="black" value={blackId} onChange={(e) => setBlackId(e.target.value)}>
              <option value="">Seleccionar...</option>
              {players.map((p) => (
                <option key={p.user_id || p.userId} value={p.user_id || p.userId} disabled={(p.user_id || p.userId) === whiteId}>
                  {getPlayerName(p)} (Elo: {p.rating})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Resultado</label>
          <div className="result-options">
            <label className={`result-option ${result === 'white' ? 'selected' : ''}`}>
              <input type="radio" name="result" value="white" checked={result === 'white'} onChange={() => setResult('white')} disabled={!whiteId || !blackId} />
              <span>Ganan Blancas</span>
            </label>
            <label className={`result-option ${result === 'draw' ? 'selected' : ''}`}>
              <input type="radio" name="result" value="draw" checked={result === 'draw'} onChange={() => setResult('draw')} disabled={!whiteId || !blackId} />
              <span>Tablas</span>
            </label>
            <label className={`result-option ${result === 'black' ? 'selected' : ''}`}>
              <input type="radio" name="result" value="black" checked={result === 'black'} onChange={() => setResult('black')} disabled={!whiteId || !blackId} />
              <span>Ganan Negras</span>
            </label>
          </div>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <button type="submit" className="btn-primary" disabled={!whiteId || !blackId || !result}>
          Registrar Resultado
        </button>
      </form>

      {matchResult && (
        <div className="match-result">
          <h3>Resultado del Duelo</h3>
          <div className="result-cards">
            <div className={`result-card ${matchResult.white.change > 0 ? 'positive' : matchResult.white.change < 0 ? 'negative' : 'neutral'}`}>
              <p className="player-name">{whitePlayer ? getPlayerName(whitePlayer) : ''}</p>
              <p className="rating-change">{matchResult.white.change >= 0 ? '+' : ''}{matchResult.white.change}</p>
              <p className="new-rating">{matchResult.white.oldRating} → {matchResult.white.newRating}</p>
            </div>
            <div className={`result-card ${matchResult.black.change > 0 ? 'positive' : matchResult.black.change < 0 ? 'negative' : 'neutral'}`}>
              <p className="player-name">{blackPlayer ? getPlayerName(blackPlayer) : ''}</p>
              <p className="rating-change">{matchResult.black.change >= 0 ? '+' : ''}{matchResult.black.change}</p>
              <p className="new-rating">{matchResult.black.oldRating} → {matchResult.black.newRating}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
