import React, { useState, useEffect } from "react";
import { Settings, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./profilesettings.css";

const ProfileSettings = () => {
  const navigate = useNavigate();
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

  const handleBack = () => {
    navigate("/");
  };

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

        <form className="settings-form">
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

          <button type="submit" className="save-button">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
