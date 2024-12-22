import React, { useState, useEffect, useRef } from "react";
import { Settings, ArrowLeft, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import popSound from "../../assets/audio/save.mp3";
import backSound from "../../assets/audio/back.mp3";
import relaxingSound from "../../assets/audio/relaxing.mp3";
import "./profilesettings.css";

const MinecraftAlert = ({ message, onClose }) => {
  return (
    <div className="minecraft-alert-overlay">
      <div className="minecraft-alert">
        <div className="minecraft-alert-message">{message}</div>
        <button className="minecraft-alert-button" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

const audio = new Audio(popSound);
const backAudio = new Audio(backSound);

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { getAccessTokenSilently, user } = useAuth0();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
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
  const relaxingAudio = useRef(new Audio(relaxingSound));

  useEffect(() => {
    relaxingAudio.current.loop = true;
    relaxingAudio.current.play();

    return () => {
      relaxingAudio.current.pause();
      relaxingAudio.current.currentTime = 0;
    };
  }, []);

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
            .split("T")[0];
        }

        setUserProfile((prev) => ({
          ...prev,
          ...profileData,
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

  const showMinecraftAlert = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

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

      audio.play();
      showMinecraftAlert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      showMinecraftAlert("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fileInputRef = useRef(null);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxPhotos = 4;

    if (userProfile.photos.length + files.length > maxPhotos) {
      showMinecraftAlert(`You can only upload up to ${maxPhotos} photos`);
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        showMinecraftAlert("Each photo must be under 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile((prev) => ({
          ...prev,
          photos: [...prev.photos, reader.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setUserProfile((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-container">
            <h3 className="step-title">Basic Information</h3>
            <div className="form-group box-input">
              <label>Gender</label>
              <select
                value={userProfile.gender}
                onChange={(e) =>
                  setUserProfile((prev) => ({
                    ...prev,
                    gender: e.target.value,
                  }))
                }
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
              </select>
            </div>

            <div className="form-group box-input">
              <label>Dating Preferences</label>
              <div className="checkbox-group">
                {["male", "female", "non-binary"].map((preference) => (
                  <label key={preference}>
                    <input
                      type="checkbox"
                      checked={userProfile.datingPreferences.includes(
                        preference
                      )}
                      onChange={(e) => {
                        setUserProfile((prev) => ({
                          ...prev,
                          datingPreferences: e.target.checked
                            ? [...prev.datingPreferences, preference]
                            : prev.datingPreferences.filter(
                                (p) => p !== preference
                              ),
                        }));
                      }}
                    />
                    {preference.charAt(0).toUpperCase() + preference.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group box-input">
              <label>About Me</label>
              <textarea
                className="about-textarea"
                value={userProfile.about}
                onChange={(e) =>
                  setUserProfile((prev) => ({ ...prev, about: e.target.value }))
                }
              />
            </div>

            <div className="form-group box-input">
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
          </div>
        );

      case 2:
        return (
          <div className="step-container">
            <h3 className="step-title">Profile Photos</h3>
            <div className="photo-upload-container box-input">
              <div className="photo-grid">
                {userProfile.photos.map((photo, index) => (
                  <div key={index} className="photo-preview">
                    <img src={photo} alt={`Profile photo ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-photo"
                      onClick={() => removePhoto(index)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              {userProfile.photos.length < 4 && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    ref={fileInputRef}
                    className="photo-input"
                  />
                  <button
                    type="button"
                    className="photo-upload-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Add Photos (Max 4)
                  </button>
                </>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-container">
            <h3 className="step-title">Interests & Preferences</h3>
            <div className="form-group box-input">
              <label>Favorite Games</label>
              <input
                type="text"
                placeholder="Enter your favorite games"
                value={userProfile.favoriteGames.join(", ")}
                onChange={(e) =>
                  setUserProfile((prev) => ({
                    ...prev,
                    favoriteGames: e.target.value
                      .split(",")
                      .map((game) => game.trim()),
                  }))
                }
              />
            </div>

            <div className="form-group box-input">
              <label>Preferred Cartoons</label>
              <input
                type="text"
                placeholder="Enter your preferred cartoons"
                value={userProfile.preferredCartoons.join(", ")}
                onChange={(e) =>
                  setUserProfile((prev) => ({
                    ...prev,
                    preferredCartoons: e.target.value
                      .split(",")
                      .map((cartoon) => cartoon.trim()),
                  }))
                }
              />
            </div>

            <div className="form-group box-input">
              <label>Language Preference</label>
              <select
                value={userProfile.languagePreference}
                onChange={(e) =>
                  setUserProfile((prev) => ({
                    ...prev,
                    languagePreference: e.target.value,
                  }))
                }
              >
                <option value="">Select Language</option>
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
                <option value="bengali">Bengali</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleNext = () => {
    audio.play();
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    backAudio.play();
    setCurrentStep((prev) => prev - 1);
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="profile-settings">
      {showAlert && (
        <MinecraftAlert
          message={alertMessage}
          onClose={() => setShowAlert(false)}
        />
      )}
      <div className="profile-settings-container">
        <div className="header-container">
          <button
            onClick={() => navigate("/")}
            className="back-settings-button"
          >
            <ArrowLeft size={24} />
            Back
          </button>
          <h2 className="settings-title">Profile Settings</h2>
        </div>

        <div className="step-indicator">
          <div className={`step ${currentStep >= 1 ? "active" : ""}`}>1</div>
          <div className={`step ${currentStep >= 2 ? "active" : ""}`}>2</div>
          <div className={`step ${currentStep >= 3 ? "active" : ""}`}>3</div>
        </div>

        <form className="settings-form" onSubmit={handleSubmit}>
          {renderStepContent()}

          <div className="form-navigation">
            {currentStep > 1 && (
              <button
                type="button"
                className="nav-button"
                onClick={handlePrevious}
              >
                Previous
              </button>
            )}
            {currentStep < 3 && (
              <button
                type="button"
                className="nav-button next"
                onClick={handleNext}
              >
                Next
              </button>
            )}
            {currentStep === 3 && (
              <button
                type="submit"
                className="save-button"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
