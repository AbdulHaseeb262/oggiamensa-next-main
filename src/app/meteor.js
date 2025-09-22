import React, { useEffect, useRef, useState, useCallback } from "react";
import "./meteor.css";

function MeteorGame() {
  const spaceshipRef = useRef(null);
  const meteorRef = useRef(null);
  const gameContainerRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    // Recuperare l'highscore dal localStorage se esiste
    const savedHighScore = localStorage.getItem('meteorGameHighScore');
    return savedHighScore ? parseInt(savedHighScore, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [currentMeteorImage, setCurrentMeteorImage] = useState(1);
  
  // Ref per valori che non devono causare re-render
  const gameStateRef = useRef({
    animationDuration: 2,
    cycleCompleted: false,
    lastSpeedTier: 0
  });

  // Funzione memoizzata per selezionare casualmente un'immagine del meteorite
  const getRandomMeteorImage = useCallback(() => {
    return Math.floor(Math.random() * 4) + 1;
  }, []);

  // Funzione memoizzata per calcolare la velocità in base al punteggio
  const getRandomSpeed = useCallback((currentScore) => {
    let baseDuration;
    
    if (currentScore < 1000) {
      baseDuration = 1.6;
    } else if (currentScore < 2000) {
      baseDuration = 1.4;
    } else if (currentScore < 3000) {
      baseDuration = 1.2;
    } else {
      baseDuration = 1.02;
    }
    
    return (Math.random() * 0.7 + baseDuration).toFixed(1);
  }, []);

  // Applica la velocità del meteorite
  const applyMeteorSpeed = useCallback((currentScore) => {
    if (!meteorRef.current) return;
    
    const newDuration = getRandomSpeed(currentScore);
    gameStateRef.current.animationDuration = newDuration;
    
    // Reset dell'animazione
    meteorRef.current.style.animation = "none";
    void meteorRef.current.offsetWidth; // Force reflow
    meteorRef.current.style.animation = `block ${newDuration}s infinite linear`;
    
    // Nuova immagine casuale
    setCurrentMeteorImage(getRandomMeteorImage());
  }, [getRandomSpeed, getRandomMeteorImage]);

  // Funzione memoizzata per il salto della navicella
  const jump = useCallback(() => {
    if (!spaceshipRef.current || spaceshipRef.current.classList.contains("jump")) return;
    
    spaceshipRef.current.classList.add("jump");
    setTimeout(() => {
      if (spaceshipRef.current) {
        spaceshipRef.current.classList.remove("jump");
      }
    }, 500);
  }, []);

  // Aggiorna l'highscore
// Controllo delle collisioni e aggiornamento del punteggio
useEffect(() => {
  if (!spaceshipRef.current || !meteorRef.current) return;

  const checkCollision = () => {
    if (gameOver) return;

    const spaceshipTop = parseInt(
      getComputedStyle(spaceshipRef.current).getPropertyValue("top")
    );
    const spaceshipLeft = parseInt(
      getComputedStyle(spaceshipRef.current).getPropertyValue("left")
    );
    const meteorLeft = parseInt(
      getComputedStyle(meteorRef.current).getPropertyValue("left")
    );

    if (meteorLeft < spaceshipLeft + 30 && meteorLeft > spaceshipLeft && spaceshipTop >= 140) {
      setGameOver(true);
      return;
    }

    // Aggiorna il punteggio
    setScore(prevScore => {
      const newScore = prevScore + 1;

      // Controlla e aggiorna l'high score
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem("meteorGameHighScore", newScore);
      }

      return newScore;
    });

    // Controllo della velocità
    let currentTier = 0;
    if (score >= 3000) currentTier = 3;
    else if (score >= 2000) currentTier = 2;
    else if (score >= 1000) currentTier = 1;

    if (currentTier !== gameStateRef.current.lastSpeedTier) {
      gameStateRef.current.lastSpeedTier = currentTier;
      gameStateRef.current.nextSpeed = getRandomSpeed(score);
    }

    if (meteorLeft <= 0 && !gameStateRef.current.cycleCompleted) {
      gameStateRef.current.cycleCompleted = true;
      if (gameStateRef.current.nextSpeed) {
        applyMeteorSpeed(score);
        gameStateRef.current.nextSpeed = null;
      } else {
        setCurrentMeteorImage(getRandomMeteorImage());
      }
    } else if (meteorLeft > 400) {
      gameStateRef.current.cycleCompleted = false;
    }
  };

  const collisionInterval = setInterval(checkCollision, 10);
  return () => clearInterval(collisionInterval);
}, [score, gameOver, applyMeteorSpeed, getRandomMeteorImage, getRandomSpeed, highScore]);



  // Funzione per riavviare il gioco
  const restartGame = useCallback(() => {
    if (!meteorRef.current) return;
    
    // Reset del meteorite
    meteorRef.current.style.display = "none";
    void meteorRef.current.offsetWidth; // Force reflow
    meteorRef.current.style.left = "580px";
    gameStateRef.current.animationDuration = 2;
    meteorRef.current.style.display = "block";
    meteorRef.current.style.animation = "none";
    void meteorRef.current.offsetWidth; // Force reflow
    meteorRef.current.style.animation = "block 2s infinite linear";
    
    // Reset dello stato
    gameStateRef.current.cycleCompleted = false;
    gameStateRef.current.lastSpeedTier = 0;
    setCurrentMeteorImage(getRandomMeteorImage());
    setGameOver(false);
    setScore(0);
  }, [getRandomMeteorImage]);

  // Gestione degli eventi di input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') && !e.repeat) {
        e.preventDefault();
        if (!gameOver) {
          jump();
        }
      }
    };

    // Solo per il salto durante il gioco (non per il restart)
    const handleGameInput = (e) => {
      if (!gameOver) {
        e.preventDefault();
        jump();
      }
    };

    document.addEventListener("click", handleGameInput);
    document.addEventListener("touchstart", handleGameInput);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleGameInput);
      document.removeEventListener("touchstart", handleGameInput);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameOver, jump]);

  // Gestione dello stato di pausa dell'animazione
  useEffect(() => {
    if (!meteorRef.current || !spaceshipRef.current) return;
    
    const animationState = gameOver ? "paused" : "running";
    meteorRef.current.style.animationPlayState = animationState;
    spaceshipRef.current.style.animationPlayState = animationState;
  }, [gameOver]);

  // Inizializzazione dell'immagine del meteorite
  useEffect(() => {
    setCurrentMeteorImage(getRandomMeteorImage());
  }, [getRandomMeteorImage]);

  // Handler per il click sull'icona di restart
  const handleRestartClick = (e) => {
    e.stopPropagation(); // Previene la propagazione dell'evento
    restartGame();
  };

  return (
    <div className="game" ref={gameContainerRef}>
      <div className="score-container">
        <div className="score">SCORE: {score}</div>
        <div className="high-score">HIGH SCORE: {highScore}</div>
      </div>
      <div 
        id="spaceship" 
        ref={spaceshipRef} 
        className="floating"
        style={{ animationPlayState: gameOver ? "paused" : "running" }}
      />
      <div
        id="meteor"
        ref={meteorRef}
        className={`meteor-image-${currentMeteorImage}`}
        style={{ animationPlayState: gameOver ? "paused" : "running" }}
      />
      
      {/* Separiamo l'overlay di game over in un portale React che viene renderizzato all'esterno del gioco */}
      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over">G A M E O V E R</div>
          <div 
            className="restart-icon" 
            onClick={handleRestartClick}
          />
        </div>
      )}
    </div>
  );
}

export default MeteorGame;