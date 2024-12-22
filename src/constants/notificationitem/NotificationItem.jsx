import { Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotificationItem = ({ notification, onClose, onAccept, onDecline }) => {
  const navigate = useNavigate();

  const handleAccept = async (challengeId) => {
    await onAccept(challengeId);
    navigate('/balloongame');
  };

  const renderActions = () => {
    if (notification.type === 'challenge' && notification.metadata?.challengeId) {
      return (
        <div className="notification-actions">
          <button 
            onClick={() => handleAccept(notification.metadata.challengeId)}
            className="action-button accept-button"
          >
            <Check size={16} />
            Accept
          </button>
          <button 
            onClick={() => onDecline(notification.metadata.challengeId)}
            className="action-button decline-button"
          >
            <X size={16} />
            Decline
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="notification-item">
      <div className="notification-content">
        <p>{notification.message}</p>
        {renderActions()}
      </div>
      <button 
        onClick={() => onClose(notification._id)}
        className="close-button"
      >
        ✕
      </button>
    </div>
  );
};

export default NotificationItem;