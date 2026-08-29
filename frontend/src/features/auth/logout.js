export function handleLogout(navigate) {
   if (navigate) {
    navigate("/login");
  } else {
    window.location.href = "/login";
  }
}