import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./navbar.css";

const NavBar = () => {
  const { isAuthenticated, loginWithRedirect, logout, user, isLoading } =
    useAuth0();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <h1>GameZ</h1>
          </div>
          <div className="navbar-right">
            {isAuthenticated ? (
              <>
                <div className="user-profile">
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="user-avatar"
                  />
                  <span className="user-name">{user.name}</span>
                </div>
                <button
                  onClick={() => logout({ returnTo: window.location.origin })}
                  className="auth-button logout-button"
                >
                  Log Out
                </button>
              </>
            ) : (
              <button
                onClick={() => loginWithRedirect()}
                className="auth-button login-button"
              >
                Log In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
