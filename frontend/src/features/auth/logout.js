export function handleLogout(navigate) {
  localStorage.clear();
  sessionStorage.clear();
  if (navigate) {
    navigate("/login");
  } else {
    window.location.href = "/login";
  }
}