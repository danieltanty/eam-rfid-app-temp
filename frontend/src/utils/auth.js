import { useAuthStore } from "../store";

export const getLoggedInUsername = () => {
  const user = useAuthStore.getState().user;

  return user?.username;
};