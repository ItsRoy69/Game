import React, { useEffect, useState, useCallback } from 'react';
import './balloon.css';
import blueBalloon from '../../assets/blue-balloon.png';
import redBalloon from '../../assets/red-balloon.png';
import yellowBalloon from '../../assets/yellow-balloon.png';
import greenBalloon from '../../assets/green-balloon.png';
import blackBalloon from '../../assets/black-balloon.png';
import pinkBalloon from '../../assets/pink-balloon.png';

const BALLOON_IMAGES = {
  blue: blueBalloon,
  red: redBalloon,
  yellow: yellowBalloon,
  green: greenBalloon,
  black: blackBalloon,
  pink: pinkBalloon
};

function Balloon({ id, x, y, color, onPop }) {
  const [position, setPosition] = useState(y);
  const [isPopping, setIsPopping] = useState(false);

  useEffect(() => {
    const moveInterval = setInterval(() => {
      setPosition((prev) => {
        if (prev <= -20) {
          onPop(id, false);
          return -20;
        }
        return prev - 1;
      });
    }, 50);

    return () => clearInterval(moveInterval);
  }, [onPop, id]);

  const handlePop = useCallback(() => {
    if (!isPopping) {
      setIsPopping(true);
      setTimeout(() => {
        onPop(id, true);
      }, 300);
    }
  }, [id, onPop, isPopping]);

  return (
    <img
      src={BALLOON_IMAGES[color]}
      alt={`${color} balloon`}
      className={`balloon ${isPopping ? 'balloon-pop' : ''}`}
      style={{
        left: `${x}%`,
        bottom: `${position}%`,
      }}
      onClick={handlePop}
    />
  );
}

export default Balloon;