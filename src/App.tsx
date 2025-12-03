import { useEffect, useRef, useState } from "react";
import CanvasDraw from "react-canvas-draw";
import { ReactSketchCanvas } from "react-sketch-canvas";

import { usePlayerStore } from "./store/playerStore";
import "./App.css";
import Desen from "./games/Desen/Desen";


const App = () => {
  const {
    initConnection,
    screen,
    loading,
  } = usePlayerStore();

  

  // connect once (react 17+ trigaruieste efectele de 2 ori...)
  useEffect(() => {
    initConnection();
  }, []);

  if(loading && screen !== 3) {
    return (<p>Loading...</p>)
  }
  switch (screen) {
    case 0:
      return <Connect />;
    case 1:
      return <Waiting />;
    case 2: 
      return <PickingGame />;
    case 3:
      return <Game />;

    default:
      return null;
  }
};

const CustomizedCanvas = ({ canvasRef }) => {
  const [dimensions] = useState({
    width: window.innerWidth - 40,
    height: window.innerHeight - 400
  });

  const undo = () => {
    canvasRef.current?.undo();
  }

  return (
    <div className="canvas">
      <div className="undo" onClick={() => undo()}></div>
      <ReactSketchCanvas ref={canvasRef}
                          strokeWidth={5}
                          width={dimensions.width + "px"}
                          height={dimensions.height + "px"}
                          strokeColor="black" />
    </div>
    
  )
};

const Connect = () => {
  const { joinRoom, setScreen, setLoading } = usePlayerStore();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleJoin = async () => {
    try {
      await joinRoom(name);
    } catch {
      setError("Nu am gasit nicio camera cu codul asta...");
    }
  };
  const {
    setRoomCode,
  } = usePlayerStore();

  const checkAndSave = () => {
    if (!name) return setMsg("Cum vrei sa te strigam?!");
    handleJoin();
  }
  return (
    <>
      <div className="logo"></div>
      <div className="box">
        <h1>Conecteaza-te</h1>
        <input
          autoComplete="off"
          type={'number'}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Cod camera:"
          maxLength={6}
        />
        <input
          placeholder="Numele tau:"
          onChange={(e) => setName(e.target.value)}
        />
        <div className="main-button" onClick={() => checkAndSave()}>Alatura-te</div>
        {error && <p>{error}</p>}
      </div>
    </>
    
  )

};

const Waiting = () => {
  const { send, users } = usePlayerStore();
  const [error, setError ] = useState("")

  const everyoneIn = () => {
    // if (users.length > 2) {
      send({
        type: "pick_game",
      });
    // }  else {
    //   setError("Acest joc se joaca in minim 3 jucatori")
    // }
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

const Game = () => {
  return (
    <div className="game">
      <Desen />
    </div>
  )
}


export default App;
