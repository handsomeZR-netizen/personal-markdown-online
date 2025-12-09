'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useOnboarding } from '@/hooks/use-onboarding';
import {
  OnboardingTooltips,
  collaborationOnboarding,
  folderOnboarding,
  mobileGestureOnboarding,
} from './onboarding-tooltips';

export function OnboardingManager() {
  const pathname = usePathname();
  const {
    activeTour,
    startTour,
    completeTour,
    skipTour,
    shouldShowTour,
  } = useOnboarding();

  useEffect(() => {
    // Auto-start onboarding based on route
    if (pathname?.includes('/notes/') && shouldShowTour('collaboration')) {
      // Delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startTour('collaboration');
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (pathname === '/notes' && shouldShowTour('folders')) {
      const timer = setTimeout(() => {
        startTour('folders');
      }, 1000);
      return () => clearTimeout(timer);
    }

    // Check if mobile and show gesture onboarding
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      if (isMobile && shouldShowTour('mobile-gestures')) {
        const timer = setTimeout(() => {
          startTour('mobile-gestures');
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [pathname, shouldShowTour, startTour]);

  return (
    <>
      {activeTour === 'collaboration' && (
        <OnboardingTooltips
          steps={collaborationOnboarding}
          storageKey="onboarding-collaboration"
          onComplete={() => completeTour('collaboration')}
          onSkip={() => skipTour('collaboration')}
        />
      )}

      {activeTour === 'folders' && (
        <OnboardingTooltips
          steps={folderOnboarding}
          storageKey="onboarding-folders"
          onComplete={() => completeTour('folders')}
          onSkip={() => skipTour('folders')}
        />
      )}

      {activeTour === 'mobile-gestures' && (
        <OnboardingTooltips
          steps={mobileGestureOnboarding}
          storageKey="onboarding-mobile-gestures"
          onComplete={() => completeTour('mobile-gestures')}
          onSkip={() => skipTour('mobile-gestures')}
        />
      )}
    </>
  );
}
