export const submitGameResult = async (score: number, gameId: string) => {
  try {
    const response = await fetch('/api/game-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        score,
        gameId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit game result: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting game result:', error);
    throw error;
  }
};