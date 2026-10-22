import LocationSettingsScreen from '@user/features/location/LocationSettingsScreen';
import { useOnboarding } from '@user/features/onboarding/useOnboarding';

const OnboardingLocationPage = () => {
  const { consents, setLocationCompleted } = useOnboarding();

  return (
    <LocationSettingsScreen
      mode="onboarding"
      onboardingLocationOptIn={consents.location}
      onOnboardingContinue={() => setLocationCompleted(true)}
    />
  );
};

export default OnboardingLocationPage;
