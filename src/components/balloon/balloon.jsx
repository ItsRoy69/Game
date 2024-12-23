import React, { useEffect, useState, useCallback } from "react";
import "./balloon.css";
import blueBalloon from "../../assets/blue-balloon.png";
import redBalloon from "../../assets/red-balloon.png";
import yellowBalloon from "../../assets/yellow-balloon.png";
import greenBalloon from "../../assets/green-balloon.png";
import blackBalloon from "../../assets/black-balloon.png";
import pinkBalloon from "../../assets/pink-balloon.png";
import balloonBurstSound from "../../assets/audio/balloon-burst.mp3";

const BALLOON_IMAGES = {
  blue: blueBalloon,
  red: redBalloon,
  yellow: yellowBalloon,
  green: greenBalloon,
  black: blackBalloon,
  pink: pinkBalloon,
};

const burstAudio = new Audio(balloonBurstSound);

function Balloon({ id, x, y, color, onPop }) {
  const [position, setPosition] = useState(y);
  const [isPopping, setIsPopping] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive) return;

    const moveInterval = setInterval(() => {
      setPosition(prev => {
        if (prev <= -20) {
          setIsActive(false);
          onPop(id, false);
          return prev;
        }
        return prev - 0.5;
      });
    }, 100);

    return () => clearInterval(moveInterval);
  }, [id, onPop, isActive]);

  const handlePop = useCallback(() => {
    if (!isPopping && isActive) {
      setIsPopping(true);
      setIsActive(false);
      burstAudio.currentTime = 0;
      burstAudio.play();

      setTimeout(() => {
        onPop(id, true);
      }, 300);
    }
  }, [id, onPop, isPopping, isActive]);

  if (!isActive && !isPopping) return null;

  return (
    <img
      src={BALLOON_IMAGES[color]}
      alt={`${color} balloon`}
      className={`balloon ${isPopping ? "balloon-pop" : ""}`}
      style={{
        left: `${x}%`,
        bottom: `${position}%`,
      }}
      onClick={handlePop}
    />
  );
}

export default Balloon;