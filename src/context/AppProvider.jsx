import { useState } from 'react';
import { AppContext } from './AppContext';
import { api } from '../services/api';

export function AppProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loaded, setLoaded] = useState(false);

  async function loadData() {
    try {
      const [rankingData, matchesData] = await Promise.all([
        api.getRanking(),
        api.getMatches(),
      ]);
      setPlayers(rankingData);
      setMatches(matchesData);
    } catch {
      setPlayers([]);
      setMatches([]);
    } finally {
      setLoaded(true);
    }
  }

  if (!loaded) {
    loadData();
  }

  async function initPlayer() {
    setLoaded(false);
    await loadData();
  }

  async function addMatch(whiteUserId, blackUserId, result) {
    try {
      const data = await api.submitMatch(whiteUserId, blackUserId, result);
      setPlayers(data.ranking);
      await loadData();
      return {
        white: data.white,
        black: data.black,
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  const sortedPlayers = [...players].sort((a, b) => b.rating - a.rating);

  return (
    <AppContext.Provider value={{ players, sortedPlayers, matches, initPlayer, addMatch }}>
      {children}
    </AppContext.Provider>
  );
}
