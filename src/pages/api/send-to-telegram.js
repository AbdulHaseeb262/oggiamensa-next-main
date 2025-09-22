// api/send-to-telegram.js
export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metodo non consentito' });
  }
  
  try {
    const { menu } = req.body;
    
    if (!menu) {
      return res.status(400).json({ message: 'Dati del menu mancanti' });
    }
    
    const message = `*Menu Aggiornato*
    Primo: ${menu.primo}
    Secondo: ${menu.secondo}
    Contorni: ${menu.contorni}
    Rosticceria: ${menu.rosticceria}`;    
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      return res.status(500).json({ message: 'Configurazione Telegram mancante sul server' });
    }
    
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      }),
    });
    
    // Verifica se la risposta è JSON
    const contentType = telegramResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Se non è JSON, leggi come testo e restituisci un errore
      const textResponse = await telegramResponse.text();
      console.error('Risposta non JSON da Telegram:', textResponse);
      return res.status(500).json({ 
        success: false, 
        message: 'Risposta non JSON da Telegram', 
        response: textResponse 
      });
    }
    
    const telegramData = await telegramResponse.json();
    
    if (!telegramData.ok) {
      console.error('Errore API Telegram:', telegramData);
      throw new Error(`Errore Telegram: ${telegramData.description || 'Errore sconosciuto'}`);
    } 
    
    return res.status(200).json({ success: true, message: 'Messaggio inviato a Telegram con successo' });
  } catch (error) {
    console.error('Errore durante l\'invio del messaggio:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Errore interno del server',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}