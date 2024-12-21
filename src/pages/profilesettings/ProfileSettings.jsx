import React, { useState, useEffect } from "react";
import { Settings, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import "./profilesettings.css";

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { getAccessTokenSilently, user } = useAuth0();
  const [userProfile, setUserProfile] = useState({
    gender: "",
    datingPreferences: [],
    about: "",
    location: "",
    dateOfBirth: "",
    occupation: {
      type: "",
      details: "",
    },
    photos: [],
    favoriteGames: [],
    preferredCartoons: [],
    datingAgeRange: {
      min: 18,
      max: 99,
    },
    datingGoal: "",
    languagePreference: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = await getAccessTokenSilently();
        const API_BASE_URL = import.meta.env.VITE_API_URL;
        
        const response = await axios.get(
          `${API_BASE_URL}/api/users/${user.sub}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        const profileData = response.data;
        if (profileData.dateOfBirth) {
          profileData.dateOfBirth = new Date(profileData.dateOfBirth)
            .toISOString()
            .split('T')[0];
        }

        setUserProfile(prev => ({
          ...prev,
          ...profileData
        }));
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.sub) {
      fetchUserProfile();
    }
  }, [user, getAccessTokenSilently]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserProfile((prev) => ({
          ...prev,
          location: `${position.coords.latitude}, ${position.coords.longitude}`,
        }));
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const API_BASE_URL = import.meta.env.VITE_API_URL;

      await axios.put(
        `${API_BASE_URL}/api/users/${user.sub}/profile`,
        userProfile,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Profile updated successfully!");
      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="profile-settings">
      <div className="profile-settings-container">
        <div className="header-container">
          <button onClick={handleBack} className="back-button">
            <ArrowLeft size={24} />
            Back
          </button>
          <h2 className="settings-title">Profile Settings</h2>
        </div>

        <form className="settings-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Gender</label>
            <select
              value={userProfile.gender}
              onChange={(e) =>
                setUserProfile((prev) => ({ ...prev, gender: e.target.value }))
              }
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
            </select>
          </div>

          <div className="form-group">
            <label>Dating Preferences</label>
            <div className="checkbox-group">
              {['male', 'female', 'non-binary'].map(preference => (
                <label key={preference}>
                  <input
                    type="checkbox"
                    checked={userProfile.datingPreferences.includes(preference)}
                    onChange={(e) => {
                      setUserProfile(prev => ({
                        ...prev,
                        datingPreferences: e.target.checked
                          ? [...prev.datingPreferences, preference]
                          : prev.datingPreferences.filter(p => p !== preference)
                      }));
                    }}
                  />
                  {preference.charAt(0).toUpperCase() + preference.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>About Me</label>
            <textarea
              rows="4"
              value={userProfile.about}
              onChange={(e) =>
                setUserProfile((prev) => ({ ...prev, about: e.target.value }))
              }
              className="about-textarea"
            />
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              value={userProfile.dateOfBirth}
              onChange={(e) =>
                setUserProfile((prev) => ({
                  ...prev,
                  dateOfBirth: e.target.value,
                }))
              }
            />
          </div>

          <div className="form-group">
            <label>Currently</label>
            <div className="occupation-inputs">
              <select
                value={userProfile.occupation.type}
                onChange={(e) =>
                  setUserProfile((prev) => ({
                    ...prev,
                    occupation: { ...prev.occupation, type: e.target.value },
                  }))
                }
              >
                <option value="">Select Status</option>
                <option value="studying">Studying</option>
                <option value="working">Working</option>
              </select>
              <input
                type="text"
                placeholder={
                  userProfile.occupation.type === "studying"
                    ? "College/University"
                    : "Profession"
                }
                value={userProfile.occupation.details}
                onChange={(e) =>
                  setUserProfile((prev) => ({
                    ...prev,
                    occupation: { ...prev.occupation, details: e.target.value },
                  }))
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label>Dating Goal</label>
            <select
              value={userProfile.datingGoal}
              onChange={(e) =>
                setUserProfile((prev) => ({
                  ...prev,
                  datingGoal: e.target.value,
                }))
              }
            >
              <option value="">Select Goal</option>
              <option value="casual">Keep it Casual</option>
              <option value="short-term">Short Term Relationship</option>
              <option value="long-term">Long Term Relationship</option>
              <option value="flow">Go with the Flow</option>
            </select>
          </div>

          <div className="form-group">
            <label>Preferred Age Range to Date</label>
            <div className="age-range-inputs">
              <input
                type="number"
                placeholder="Min Age"
                value={userProfile.datingAgeRange.min}
                onChange={(e) =>
                  setUserProfile((prev) => ({
                    ...prev,
                    datingAgeRange: {
                      ...prev.datingAgeRange,
                      min: parseInt(e.target.value),
                    },
                  }))
                }
              />
              <input
                type="number"
                placeholder="Max Age"
                value={userProfile.datingAgeRange.max}
                onChange={(e) =>
                  setUserProfile((prev) => ({
                    ...prev,
                    datingAgeRange: {
                      ...prev.datingAgeRange,
                      max: parseInt(e.target.value),
                    },
                  }))
                }
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="save-button"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;