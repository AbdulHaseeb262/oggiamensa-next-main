'use client'
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import menuData from "./menu";
import todayMenuData from "./todayMenu";
import menuEnglishData from "./menuEnglish";
import todayEnglishMenuData from "./todayEnglishMenu";
import lunchboxMenuData from "./menuLunchbox";
// import { Analytics } from "@vercel/analytics/react"; 
import MeteorGame from "./meteor";
import MenuEditor from "./MenuEditor";
import "./styles.css";

export default function DailyMenu() {
  const [todayMenu, setTodayMenu] = useState({});
  const [showGame, setShowGame] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isEnglish, setIsEnglish] = useState(false);
  const [showlunchbox, setShowlunchbox] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const menuRef = useRef(null);
  const hasLostFocus = useRef(false);

  const calculateDateContext = () => {
    const today = new Date(); // = new Date("2025-03-31T11:32:00"); //
    const currentHour = today.getHours();
    let dayName = today.toLocaleDateString("en-US", { weekday: "long" });
    let menuDate = new Date(today);

    // Logica per determinare il giorno del menu
    const isWeekend = (dayName === "Friday" && currentHour >= 16) || dayName === "Saturday" || (dayName === "Sunday" && currentHour < 16);
    const isAfterFourPM = currentHour >= 16;

    if ((isWeekend || isAfterFourPM) && dayName !== "Saturday" && !(dayName === "Sunday" && currentHour < 16)) {
      menuDate.setDate(menuDate.getDate() + 1);
      dayName = menuDate.toLocaleDateString("en-US", { weekday: "long" });
    }

    // Calcola il numero della settimana dell'anno
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today - firstDayOfYear) / (24 * 60 * 60 * 1000); //ms in a day
    const currentWeekOfYear = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    // Calcola la settimana del menu (ciclo di 4 settimane)
    // La settimana 2 dell'anno corrisponde alla settimana 1 del menu. Quindi aggiungiamo un offset di 1 (2-1) e poi facciamo modulo 4
    const weekNumber = ((currentWeekOfYear + 1) % 4) || 4;

    return {
      today,
      menuDate,
      dayName,
      currentHour,
      isWeekend,
      isAfterFourPM,
      weekNumber
    };
  };


  const shouldShowlunchboxButton = () => {
    const now = new Date(); //= new Date("2025-03-28T12:32:00");   
    const currentHour = now.getHours();
    let dayName = now.toLocaleDateString("en-US", { weekday: "long" });
    return (currentHour >= 0 && currentHour < 16) && (dayName !== "Saturday" && dayName !== "Sunday" && dayName !== "Friday");
  };


  // Funzione per ottenere il menu lunchbox del giorno
  const getlunchboxMenu = () => {
    const { dayName } = calculateDateContext();
    const language = isEnglish ? 'en' : 'it';
    return lunchboxMenuData[language][dayName] || {};
  };

  // Effect per gestire il focus della pagina
  useEffect(() => {
    const isInRefreshTimeWindow = () => {
      const now = new Date();
      const currentHour = now.getHours();
      let dayName = now.toLocaleDateString("en-US", { weekday: "long" });
      // Controlla se è tra le 12 e le 15 E non è sabato o domenica
      return (currentHour >= 12 && currentHour < 15) && (dayName !== "Saturday" && dayName !== "Sunday");
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hasLostFocus.current = true;
      } else {
        if (hasLostFocus.current && isInRefreshTimeWindow()) {
          window.location.reload();
        }
      }
    };

    const handleFocusLoss = () => {
      hasLostFocus.current = true;
    };

    const handleFocusGain = () => {
      if (hasLostFocus.current && isInRefreshTimeWindow()) {
        window.location.reload();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleFocusLoss);
    window.addEventListener('focus', handleFocusGain);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleFocusLoss);
      window.removeEventListener('focus', handleFocusGain);
    };
  }, []);

  useEffect(() => {
    const { menuDate, dayName, weekNumber } = calculateDateContext();

    // Verifica se todayMenu ha contenuto valido
    const hasTodayMenuContent = todayMenuData &&
      todayMenuData.Today &&
      Object.values(todayMenuData.Today).some(value => value !== "");

    // Verifica se todayEnglishMenu ha contenuto valido
    const hasTodayEnglishMenuContent = todayEnglishMenuData &&
      todayEnglishMenuData.Today &&
      Object.values(todayEnglishMenuData.Today).some(value => value !== "");

    if (hasTodayMenuContent) {
      if (isEnglish && hasTodayEnglishMenuContent) {
        // Usa il menu inglese da todayEnglishMenu.js se disponibile
        setTodayMenu(todayEnglishMenuData.Today);
      } else {
        // Usa il menu italiano da todayMenu.js
        setTodayMenu(todayMenuData.Today);
      }
    } else {
      // Usa il menu appropriato basato sulla lingua dai menu settimanali
      const currentMenuData = isEnglish ? menuEnglishData : menuData;
      const currentWeek = currentMenuData[`week${weekNumber}`] || currentMenuData.week4;
      setTodayMenu(currentWeek[dayName] || {});
    }
  }, [isEnglish]);

  const handleTitleClick = () => {
    if (showGame) {
      setShowGame(false);

      const { menuDate, dayName, weekNumber } = calculateDateContext();

      const hasTodayMenuContent = todayMenuData &&
        todayMenuData.Today &&
        Object.values(todayMenuData.Today).some(value => value !== "");

      const hasTodayEnglishMenuContent = todayEnglishMenuData &&
        todayEnglishMenuData.Today &&
        Object.values(todayEnglishMenuData.Today).some(value => value !== "");

      if (hasTodayMenuContent) {
        if (isEnglish && hasTodayEnglishMenuContent) {
          setTodayMenu(todayEnglishMenuData.Today);
        } else {
          setTodayMenu(todayMenuData.Today);
        }
      } else {
        const currentMenuData = isEnglish ? menuEnglishData : menuData;
        const currentWeek = currentMenuData[`week${weekNumber}`] || currentMenuData.week4;
        setTodayMenu(currentWeek[dayName] || {});
      }
    } else {
      setShowGame(true);
      setTodayMenu({});
    }

    if (editMode) {
      setEditMode(false);
    }
    if (showlunchbox) {
      setShowlunchbox(false);
    }
  };

  const handlelunchboxToggle = () => {
    if (isFlipping) return;

    setIsFlipping(true);

    // Cambia contenuto leggermente prima della metà per evitare flash
    setTimeout(() => {
      setShowlunchbox(!showlunchbox);
    }, 280); // Leggermente prima dei 300ms (metà di 600ms)

    // Termina lo stato flipping dopo l'animazione completa
    setTimeout(() => {
      setIsFlipping(false);
    }, 600); // Uguale alla durata CSS
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleBackFromEdit = () => {
    setEditMode(false);
  };

  const handleLanguageToggle = () => {
    setIsEnglish(!isEnglish);
    setMenuOpen(false);
  };

  const shootingStars = Array.from({ length: 7 }).map((_, index) => ({
    id: index,
    delay: Math.random() * 10,
    top: Math.random() * 100,
    left: Math.random() * 100,
  }));

  const {
    dayName,
    currentHour,
    isWeekend,
    isAfterFourPM
  } = calculateDateContext();

  const getSubmenuText = () => {
    if (showGame) {
      return "Tocca per saltare ed evita i pianeti!";
    }

    if (editMode) {
      return "";
    }

    if (showlunchbox) {
      return isEnglish ? "Includes cold dishes, water, fruit, bread, disposable cutlery, and a condiment kit. Available from Monday to Thursday, no need to queue." : "Include piatti freddi, acqua, frutta, pane, posate monouso e kit condimenti. Disponibile da lunedì a giovedì, senza bisogno di fare la fila.";
    }

    // Vuol dire che in realtà è Giovedi
    if (dayName === "Friday" && currentHour >= 16) {
      return isEnglish ? "Tomorrow's menu preview for you!" : "Il menù di domani in anteprima per te!";
    }

    if (dayName === "Saturday" || dayName === "Friday") {
      return isEnglish ? "Come back Sunday after 4:00 PM<br>and discover Monday's menu!" : "Torna domenica dopo le 16:00<br>e scopri il menu di lunedì!";
    }

    if (currentHour < 16) {
      return isEnglish ? "From 4:00 PM discover tomorrow's dishes!" : "Dalle 16:00 scopri i piatti di domani!";
    }

    return isEnglish ? "Tomorrow's menu preview for you!" : "Il menù di domani in anteprima per te!";
  };

  const getItalianMenu = () => {
    const { menuDate, dayName, weekNumber } = calculateDateContext();

    // Verifica se todayMenu ha contenuto valido (sempre quello italiano)
    const hasTodayMenuContent = todayMenuData &&
      todayMenuData.Today &&
      Object.values(todayMenuData.Today).some(value => value !== "");

    if (hasTodayMenuContent) {
      // Usa sempre il menu italiano da todayMenu.js
      return todayMenuData.Today;
    } else {
      // Usa sempre il menu italiano dai menu settimanali
      const currentWeek = menuData[`week${weekNumber}`] || menuData.week4;
      return currentWeek[dayName] || {};
    }
  };

  const [cardHeight, setCardHeight] = useState(null);
  const cardRef = useRef(null);

  // Aggiungi questo useEffect per misurare l'altezza
  useEffect(() => {
    if (cardRef.current && !showlunchbox) {
      const height = cardRef.current.offsetHeight;
      setCardHeight(height);
    }
  }, [todayMenu, showlunchbox, editMode, showGame]);

  const formatText = (text) => {
    return (
      <div className="menu-section-list">
        {text.split(/;\s*/g).map((part, index) => {
          const isVegan = part.includes("🌱");
          return (
            <div key={index} className="menu-value">
              {part.replace("🌱", "")} {isVegan ? <span className="icon-vegan"></span> : null}
            </div>
          );
        })}
      </div>
    );
  };

  // Gestori per la modalità modifica
  const handleEditModeToggle = () => {
    setEditMode(true);
    setMenuOpen(false);
    setShowGame(false);
    setShowlunchbox(false);
  };

  const handleSaveMenu = () => {
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };

  return (
    <div className="space-background">
      {shootingStars.map((star) => (
        <div
          key={star.id}
          className="shooting-star"
          style={{ "--delay": star.delay, "--top": star.top, "--left": star.left }}
        />
      ))}

      {/* <Analytics/> */}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
        <div className={`card-container ${isFlipping ? 'flipping' : ''}`}>
          <Card
            ref={cardRef}
            className="menu-card"
            style={{
              minHeight: showlunchbox && cardHeight ? `${cardHeight}px` :
                (dayName === "Saturday" || dayName === "Sunday") ? "200px" : "auto",
            }}>
            <div className="title-container">
              {!showGame && (
                <>
                  {editMode ? (
                    // Mostra la freccia indietro quando sei in modalità modifica
                    <div className="back-arrow-container" onClick={handleBackFromEdit}>
                      <div className="back-arrow">←</div>
                    </div>
                  ) : (
                    // Mostra il menu hamburger quando non sei in modalità modifica
                    <div className="hamburger-menu-container" ref={menuRef}>
                      <div className={`hamburger-menu ${menuOpen ? "open" : ""}`} onClick={toggleMenu}>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>

                      <AnimatePresence>
                        {menuOpen && (
                          <motion.div
                            className="menu-bubble"
                            initial={{ opacity: 0, scale: 0.8, transformOrigin: "top left" }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                          >
                            <div className="menu-options">
                              <div className="menu-option" onClick={() => window.open("https://t.me/oggiamensa_bot", "_blank")}>
                                <span>Invia segnalazione</span>
                                <div className="telegram-icon"></div>
                              </div>
                              {/* Mostra "Modifica menù" solo se NON è DOMANIAMENSA e NON è weekend */}
                              {!(isAfterFourPM && !isWeekend) && !isWeekend && (
                                <div className="menu-option" onClick={handleEditModeToggle}>
                                  <span>Modifica menù</span>
                                  <div className="edit-icon"></div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}

              <Typography variant="h5" className="menu-title">
                <span onClick={handleTitleClick} style={{ cursor: "pointer" }}>
                  {showGame ? "← Torna al menù" : editMode ? <span style={{ fontSize: 'calc(100% - 2pt)' }}>MODIFICA MENÙ</span> : showlunchbox ? <span style={{ fontSize: 'calc(100% - 2pt)' }}>OGGILUNCHBOX</span> : isAfterFourPM && !isWeekend ? (
                    <span style={{ fontSize: 'calc(100% - 2pt)' }}>DOMANIAMENSA</span>
                  ) : (
                    "OGGIAMENSA"
                  )}
                </span>
              </Typography>

              {/* Bandiera inglese */}
              {!showGame && !editMode && (
                <div className="uk-flag-container " onClick={handleLanguageToggle}>
                  <div className={isEnglish ? "ita-flag" : "uk-flag"}></div>
                </div>
              )}
            </div>

            <CardContent>
              {showGame ? (
                <MeteorGame />
              ) : editMode ? (
                <MenuEditor
                  todayMenu={getItalianMenu()} // Usa sempre il menu italiano
                  onSave={handleSaveMenu}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <>
                  <div className="menu-list">
                    {showlunchbox ? (
                      // Mostra il menu lunchbox del giorno corrente
                      Object.entries(getlunchboxMenu()).map(([key, value]) => (
                        <div key={key} className="menu-section">
                          <div className={`menu-section-icon menu-icon-${key}`}></div>
                          {formatText(value)}
                        </div>
                      ))
                    ) : (
                      // Mostra il menu normale
                      todayMenu &&
                      Object.entries(todayMenu).map(([key, value]) => (
                        <div key={key} className="menu-section">
                          <div className={`menu-section-icon menu-icon-${key}`}></div>
                          {formatText(value)}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </CardContent>

            {!showGame && !editMode && showlunchbox && (
              <div className="alien-container">
                <div className="bento-image fade-in"></div>
              </div>
            )}

            {/* Pulsante Menu lunchbox - nascosto il venerdì */}
            {!showGame && !editMode && shouldShowlunchboxButton() && (
              <div className="lunchbox-button-container">
                <button
                  className="lunchbox-button"
                  onClick={handlelunchboxToggle}
                  disabled={isFlipping}
                >
                  {showlunchbox ? "← Menù Mensa" : "Menù Lunchbox →"}
                </button>
              </div>
            )}

            <Typography
              variant="body2"
              className={!showGame && !editMode && isWeekend && !(dayName === "Friday" && currentHour >= 16) ? "submenu-text-weekend" : "submenu-text"}
              dangerouslySetInnerHTML={{ __html: getSubmenuText() }}
            />

            {/* !(dayName === "Friday" && currentHour >= 16) perchè è in realtà un giovedi modificato*/}
            {!showGame && !editMode && isWeekend && !(dayName === "Friday" && currentHour >= 16) && (
              <div className="alien-container">
                <div className="alien-image"></div>
              </div>
            )}

            {!showGame && !editMode && !showlunchbox && (
              <Typography
                variant="body2"
                className="submenu-disclaimer"
              >
                {isEnglish
                  ? "Independent project, indicative menu only."
                  : "Progetto indipendente, menù solo indicativo."}
              </Typography>
            )}

          </Card>
        </div>
      </motion.div>
    </div>
  );
}
