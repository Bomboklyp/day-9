import { useAuth } from "~/features/auth/composables/useAuth";
import { storeToRefs } from "pinia";
import { usePreferencesStore } from "~/stores/preferences";
import type { UserProfile } from "~/types/workflow";
import { roleLabels } from "#shared/utils/roles";
import { initials } from "~/utils/format";
export function useProfile() {
  const preferences = usePreferencesStore(),
    auth = useAuth();
  const profile = computed<UserProfile>(() => ({
    name: auth.user.value?.name ?? "Гость",
    email: auth.user.value?.email ?? "",
    position: auth.user.value ? roleLabels[auth.user.value.role] : "Гость",
    department: "",
    about: "",
    density: preferences.density,
    notifications: preferences.notifications,
  }));
  const currentPerson = computed(() => ({
    name: profile.value.name,
    initials: initials(profile.value.name),
    color: "purple",
  }));
  async function updateProfile(value: UserProfile) {
    preferences.save(value.density, value.notifications);
    if (
      auth.user.value &&
      (value.name !== auth.user.value.name ||
        value.email !== auth.user.value.email)
    )
      await auth.updateUser({ name: value.name, email: value.email });
  }
  return {
    profile,
    currentPerson,
    signedIn: computed(() => auth.user.value !== null),
    ...storeToRefs(preferences),
    updateProfile,
    hydrate: preferences.hydrate,
    login: auth.login,
    logout: auth.logout,
  };
}
