import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

interface Score {
  matchId: string;
  event: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  status: 'upcoming' | 'live' | 'completed';
  updatedAt: string;
}

export const useLiveScores = () => {
  const [scores, setScores] = useState<Score[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      setConnected(true);
      // Join the live scores room
      socket.emit('join-scores');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Listen for score updates
    socket.on('score-update', (data: Score) => {
      setScores((prevScores) => {
        const index = prevScores.findIndex((s) => s.matchId === data.matchId);
        if (index !== -1) {
          // Update existing score
          const newScores = [...prevScores];
          newScores[index] = data;
          return newScores;
        } else {
          // Add new score
          return [...prevScores, data];
        }
      });
    });

    // Listen for all scores (initial load)
    socket.on('all-scores', (data: Score[]) => {
      setScores(data);
    });

    return () => {
      socket.emit('leave-scores');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('score-update');
      socket.off('all-scores');
    };
  }, []);

  return { scores, connected };
};
