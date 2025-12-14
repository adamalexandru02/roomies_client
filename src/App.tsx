import { useEffect, useState } from "react";
import { usePlayerStore } from "./store/playerStore";
import "./App.css";
import Desen from "./games/Desen/Desen";
import Dannegru from "./games/Dannegru/Dannegru";
import Header from "./components/Header";

const App = () => {
  const {
    initConnection,
    screen,
    loading,
    game,
    hostDisconnected,
    hostDisconnectMessage
  } = usePlayerStore();

  // Connect once on mount (React 18+ runs effects twice in dev mode)
  useEffect(() => {
    initConnection();
  }, [initConnection]);

  if(loading && screen !== 3 && !hostDisconnected) {
    return (
      <>
        <Header/>
        <p>Loading...</p>
      </>
    )
  }
  
  return (
    <>
      <Header/>
      {hostDisconnected && <HostDisconnectedOverlay message={hostDisconnectMessage} />}
      {screen === 0  && <Connect />}
      {screen === 1 && <Waiting />}
      {screen === 2 && <PickingGame />}
      {screen === 3 && <Game>
          {game === "desen" && <Desen/>}
          {game === "dannegru" && <Dannegru />}
        </Game>}
  
    </>
  );
};

const HostDisconnectedOverlay = ({ message }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      color: 'white',
      padding: '20px'
    }}>
      <div className="logo" style={{ marginBottom: '20px' }}></div>
      <h2>⚠️ Host Deconectat</h2>
      <p>{message || "Așteptăm să se reconecteze..."}</p>
      <div style={{ marginTop: '20px' }}>
        <div className="loading-spinner">●●●</div>
      </div>
    </div>
  );
};

const Connect = () => {
  const { joinRoom, setRoomCode } = usePlayerStore();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleJoin = async () => {
    if (!name.trim()) {
      setError("Cum vrei sa te strigam?!");
      return;
    }
    
    try {
      await joinRoom(name);
    } catch (err) {
      console.error("Failed to join room:", err);
      setError("Nu am gasit nicio camera cu codul asta...");
    }
  }
  return (
    <>
      <div className="logo"></div>
      <div className="box">
        <h1>Conecteaza-te</h1>
        <input
          autoComplete="off"
          type="number"
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Cod camera:"
          maxLength={6}
        />
        <input
          placeholder="Numele tau:"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        />
        <div className="main-button" onClick={handleJoin}>Alatura-te</div>
        {error && <p>{error}</p>}
      </div>
    </>
    
  )

};

const Waiting = () => {
  const { send, users } = usePlayerStore();
  const [error, setError] = useState("");

  const everyoneIn = () => {
    const MIN_PLAYERS = 3;
    if (Object.keys(users).length < MIN_PLAYERS) {
      setError(`Acest joc se joaca in minim ${MIN_PLAYERS} jucatori`);
      return;
    }
    
    console.log("All players ready, requesting game selection");
    send({ type: "pick_game" });
  };

  return (
    <>
      <div className="logo"></div>
      <div className="box">
        <h2>Asteptam sa intre toata lumea</h2>
        <div className="main-button" onClick={() => everyoneIn()}>Toata lumea prezenta</div>
        {error && <p>{error}</p>}
      </div>
    </>
  )
}

const PickingGame = () => {
  return (
    <>
      <div className="logo"></div>
      <div className="box">
        <h2>Alegem jocul</h2>
        <p>Greu de decis, prea multe variante...</p>
      </div>
    </>
  )
}

const Game = ({ children }) => {
  return (
    <div className="game">
      {children}
    </div>
  );
};


export default App;
