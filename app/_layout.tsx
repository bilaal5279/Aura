import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RatingModal } from '../src/components/RatingModal';
import { RadarProvider, useRadar } from '../src/context/RadarContext';
import { ThemeProvider } from '../src/context/ThemeContext';

function AppContent() {
  const { appLaunchCount, hasRated, rateApp } = useRadar();
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    // Trigger on 3rd launch if not rated
    if (appLaunchCount === 3 && !hasRated) {
      const timer = setTimeout(() => setShowRating(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [appLaunchCount, hasRated]);

  const handleRate = async () => {
    await rateApp();
    setShowRating(false);
  };

  const handleDontAsk = async () => {
    // Treat "Don't Ask Again" as rated so it doesn't show again
    await rateApp();
    setShowRating(false);
  };

  return (
    <>
      <Stack />
      <RatingModal
        visible={showRating}
        onRate={handleRate}
        onClose={() => setShowRating(false)}
        onDontAskAgain={handleDontAsk}
      />
    </>
  );
}

export default function Layout() {
  return (
    <RadarProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </RadarProvider>
  );
}
