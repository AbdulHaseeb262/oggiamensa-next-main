import React, { useState, useEffect } from "react";
import "./MenuEditor.css";

const MenuEditor = ({ todayMenu, onSave, onCancel }) => {
  const [editedMenu, setEditedMenu] = useState({ ...todayMenu });
  const [showThanks, setShowThanks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invalidFields, setInvalidFields] = useState({});
  const [isMenuModified, setIsMenuModified] = useState(false);

  const handleInputChange = (category, value) => {
    setEditedMenu({
      ...editedMenu,
      [category]: value
    });

    if (value.trim() !== "") {
      setInvalidFields({
        ...invalidFields,
        [category]: false
      });
    }
  };
  
  useEffect(() => {
    let modified = false;
    
    for (const key in editedMenu) {
      if (todayMenu[key] !== editedMenu[key]) {
        modified = true;
        break;
      }
    }
    
    setIsMenuModified(modified);
  }, [editedMenu, todayMenu]);

  const validateForm = () => {
    const newInvalidFields = {};
    let isValid = true;

    Object.entries(editedMenu).forEach(([key, value]) => {
      if (!value || value.trim() === "") {
        newInvalidFields[key] = true;
        isValid = false;
      } else {
        newInvalidFields[key] = false;
      }
    });
    setInvalidFields(newInvalidFields);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return; 
    }
    setIsSubmitting(true);

    const menuJSON = {
      primo: editedMenu.primo || "Pennette pomodorini capperi e olive, 🌱 Minestrone di verdura",
      secondo: editedMenu.secondo || "Straccetti di manzo con carote e piselli, Frittata spinaci e ricotta, Cotoletta di pesce",
      contorni: editedMenu.contorni || "Cavolfiore, 🌱 Carote julienne e insalata",
      rosticceria: editedMenu.rosticceria || "Piadina crudo e mozzarella"
    };

    try {
      const response = await fetch('/api/send-to-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ menu: menuJSON }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Risposta non JSON dalla nostra API:', textResponse);
        throw new Error(`Risposta non valida dal server`);
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }
      if (!data.success) {
        throw new Error(`Errore del server`);
      }

      setShowThanks(true);
      // Reimposta dopo 3 secondi e solo dopo salva
      setTimeout(() => {
        if (onSave) {
          onSave(menuJSON);
        }
        setShowThanks(false);
        setIsSubmitting(false);
      }, 3000);
    } catch (error) {
      console.error("Errore nell'invio del messaggio:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="menu-editor">
      {showThanks ? (
        <div className="thanks-message">
          <p>Grazie per la tua modifica!</p>
          <p>Se sarà approvata, vedrai presto il nuovo menu!</p>
        </div>
      ) : (
        <>

        <div className="submenu-text">
          <p>Usa il punto e virgola per separare i diversi piatti.</p> 
          <p>Se è vegano, digita 🌱 prima del suo nome</p>
        </div>

          {/* Sezione di modifica del menu */}
          {Object.entries(editedMenu).map(([key, value]) => (
            <div key={key} className="menu-section editor-section">
              <div className={`menu-section-icon menu-icon-${key}`}></div>
              <textarea
                className={`menu-editor-input ${invalidFields[key] ? 'invalid-field' : ''}`}
                value={value}
                onChange={(e) => handleInputChange(key, e.target.value)}
                rows={3}
                placeholder={`Inserisci ${key}...`}
              />
              {invalidFields[key] && (
                <div className="validation-message">Questo campo non può essere vuoto</div>
              )}
            </div>
          ))}
          
 <div className="submenu-text-admin">
          <p><b>IL CAMBIO DOVRÀ ESSERE<br/>APPROVATO DA UN ADMIN</b></p>
        </div>

          <div className="editor-buttons">
            <button
              className={`editor-button save-button ${isSubmitting ? 'submitting' : ''} ${!isMenuModified ? 'disabled-button' : ''}`}
              onClick={handleSubmit}
              disabled={isSubmitting || !isMenuModified}
              title={!isMenuModified ? "Nessuna modifica da inviare" : ""}
            >
              {isSubmitting ? 'Invio in corso...' : 'Invia modifica'}
            </button>
            <button
              className="editor-button cancel-button"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Annulla
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MenuEditor;