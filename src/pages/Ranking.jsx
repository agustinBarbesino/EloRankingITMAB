import { useAppContext } from '../context/useAppContext';
import './Ranking.css';

export default function Ranking() {
  const { sortedPlayers, players } = useAppContext();

  if (players.length === 0) {
    return (
      <div className="ranking-page">
        <h1>♟ Ranking de Elo</h1>
        <div className="empty-state">
          <p>No hay jugadores registrados todavía.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ranking-page">
      <h1>♟ Ranking de Elo</h1>
      <div className="ranking-table-container">
        <table className="ranking-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Jugador</th>
              <th>Curso</th>
              <th>Rol</th>
              <th>Elo</th>
              <th>PJ</th>
              <th>G</th>
              <th>E</th>
              <th>P</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player, index) => (
              <tr key={player.id} className={index < 3 ? `rank-${index + 1}` : ''}>
                <td className="rank-cell">
                  <span className={`rank-badge rank-${index + 1}`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </span>
                </td>
                <td className="name-cell">
                  <span className="player-display-name">
                    {player.first_name && player.last_name
                      ? `${player.first_name} ${player.last_name}`
                      : player.display_name || player.name}
                  </span>
                </td>
                <td className="course-cell">
                  {player.course_year ? (
                    <span className="course-badge">
                      {player.course_year}°{player.course_division ? ` ${player.course_division}` : ''}
                    </span>
                  ) : '-'}
                </td>
                <td>
                  <span className={`role-badge ${player.role}`}>
                    {player.role === 'student' ? 'Estudiante' : player.role === 'teacher' ? 'Docente' : 'Admin'}
                  </span>
                </td>
                <td className="elo-cell">
                  <span className="elo-value">{player.rating}</span>
                </td>
                <td className="stat">{player.games_played || player.gamesPlayed}</td>
                <td className="stat stat-win">{player.wins}</td>
                <td className="stat stat-draw">{player.draws}</td>
                <td className="stat stat-loss">{player.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
