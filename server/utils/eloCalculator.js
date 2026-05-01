function getKFactor(rating, gamesPlayed) {
  if (gamesPlayed < 30) return 40;
  if (rating < 2400) return 20;
  return 10;
}

function expectedScore(playerRating, opponentRating) {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

function calculateNewRatings(whiteRating, blackRating, result, whiteGames, blackGames) {
  const whiteExpected = expectedScore(whiteRating, blackRating);
  const blackExpected = expectedScore(blackRating, whiteRating);

  const whiteActual = result === 'white' ? 1 : result === 'draw' ? 0.5 : 0;
  const blackActual = result === 'black' ? 1 : result === 'draw' ? 0.5 : 0;

  const whiteK = getKFactor(whiteRating, whiteGames);
  const blackK = getKFactor(blackRating, blackGames);

  const newWhiteRating = Math.round(whiteRating + whiteK * (whiteActual - whiteExpected));
  const newBlackRating = Math.round(blackRating + blackK * (blackActual - blackExpected));

  return {
    white: { oldRating: whiteRating, newRating: newWhiteRating, change: newWhiteRating - whiteRating },
    black: { oldRating: blackRating, newRating: newBlackRating, change: newBlackRating - blackRating },
  };
}

export { getKFactor, expectedScore, calculateNewRatings };
