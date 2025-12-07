import { Stack } from 'expo-router';
import React from 'react';
import { RatingModal } from '../src/components/RatingModal';
import { RadarProvider, useRadar } from '../src/context/RadarContext';
import { ThemeProvider } from '../src/context/ThemeContext';

function AppContent() {
  const { showRatingModal, setShowRatingModal, rateApp } = useRadar();

  const handleRate = async (rating: number) => {
    // If 5 stars, open store (true). If less, just close and mark rated (false).
    await rateApp(rating === 5);
  };

  const handleDontAsk = async () => {
    // Treat "Don't Ask Again" as rated so it doesn't show again, no store opening
    await rateApp(false);
  };

  return (
    <>
      <Stack />
      <RatingModal
        visible={showRatingModal}
        onRate={handleRate}
        onClose={() => setShowRatingModal(false)}
        onDontAskAgain={handleDontAsk}
      />
    </>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <RadarProvider>
        <AppContent />
      </RadarProvider>
    </ThemeProvider>
  );
}
