import { useUserContext } from "../context/userContext";

const useFetchUser = () => {
  const { user, isLoggedIn, loading, fetchUser, mutate, logout } =
    useUserContext();
  return { user, isLoggedIn, loading, fetchUser, mutate, logout };
};

export default useFetchUser;
