import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';

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
  const [scores, setScores] = useState<Record<string, any>>({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
      // Join the live scores room
      socket.emit('join-scores');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Listen for match updates
    socket.on('matchUpdated', (data: any) => {
      setScores((prevScores) => ({
        ...prevScores,
        [data._id]: data
      }));
    });

    return () => {
      socket.emit('leave-scores');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('matchUpdated');
    };
  }, []);

  return scores;
};
