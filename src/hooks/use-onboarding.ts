'use client';

import { useState, useEffect } from 'react';

export type OnboardingTour =
  | 'collaboration'
  | 'folders'
  | 'mobile-gestures'
  | 'export'
  | 'webhooks';

interface OnboardingState {
  [key: string]: boolean;
}

export function useOnboarding() {
  const [completedTours, setCompletedTours] = useState<OnboardingState>({});
  const [activeTour, setActiveTour] = useState<OnboardingTour | null>(null);

  useEffect(() => {
    // Load completed tours from localStorage
    const stored = localStorage.getItem('onboarding-completed');
    if (stored) {
      try {
        setCompletedTours(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse onboarding state:', error);
      }
    }
  }, []);

  const startTour = (tour: OnboardingTour) => {
    setActiveTour(tour);
  };

  const completeTour = (tour: OnboardingTour) => {
    const newState = { ...completedTours, [tour]: true };
    setCompletedTours(newState);
    localStorage.setItem('onboarding-completed', JSON.stringify(newState));
    setActiveTour(null);
  };

  const skipTour = (tour: OnboardingTour) => {
    completeTour(tour);
  };

  const resetTour = (tour: OnboardingTour) => {
    const newState = { ...completedTours, [tour]: false };
    setCompletedTours(newState);
    localStorage.setItem('onboarding-completed', JSON.stringify(newState));
  };

  const resetAllTours = () => {
    setCompletedTours({});
    localStorage.removeItem('onboarding-completed');
  };

  const hasCompletedTour = (tour: OnboardingTour): boolean => {
    return completedTours[tour] === true;
  };

  const shouldShowTour = (tour: OnboardingTour): boolean => {
    return !hasCompletedTour(tour);
  };

  return {
    activeTour,
    completedTours,
    startTour,
    completeTour,
    skipTour,
    resetTour,
    resetAllTours,
    hasCompletedTour,
    shouldShowTour,
  };
}
