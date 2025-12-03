import { useEffect, useRef, useState } from "react";
import CanvasDraw from "react-canvas-draw";
import { ReactSketchCanvas } from "react-sketch-canvas";

import { useGameStore } from "./store/gameStore";
import "./Desen.css";
import { usePlayerStore } from "../../store/playerStore";

function uploadImage(dataUrl, key,  client, session) {
  const data = {
    collection: "images",
    key,
    value: { image: dataUrl },
    user_id: session.user_id,
    permission_read: 2,
    permission_write: 1
  };

  return client.rpc(session, "store_data", data);
}

const Desen = () => {
  const {
    screen,
    loading,
  } = useGameStore();


  if(loading) {
    return (<p>Loading...</p>)
  }
  switch (screen) {
    case 0:
    return <DrawTitle/>;
    case 1:
      return <WaitingForOthers/>;
    case 2:
      return <PickTitle />;
    case 3:
      return <VoteTitle />;
    case 4: 
      return <Score />;
    case 5: 
      return <Restart />;
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


const DrawTitle = ({ }) => {
  const canvasRef = useRef(null);
  const [msg, setMsg] = useState("");

  // 🚀 Listen for round_over event in case you didn't upload your avatar
  const {assignedTitle, roundOverTrigger, setScreen} = useGameStore();
  const { client, send, session } = usePlayerStore();

  // When round_over is received from the host → send drawing
  useEffect(() => {
    if(roundOverTrigger !== 0) submit();
  }, [roundOverTrigger]);   // <— key line


  const submit = async () => {
    if (!canvasRef.current) return;

    // const url = canvasRef.current?.getDataURL();
    const url = await canvasRef.current?.exportImage();
    console.log("ce plm?!")
    if (url.length > 7000) {
      console.log("ROUND OVER → SENDING IMAGE:", url.length);

      try {
        const key = `drawing_${Date.now()}`;

        const result = await uploadImage(url, key, client, session);

        send({
          type: "user_drawing",
          content: {
            user_id: session.user_id,
            title: assignedTitle,
            drawing: result.payload.key
          }
        });

        setScreen(1);
      } catch (e) {
        console.log(e);
      }
    }  else {
      setMsg("Macar incearca ceva...");
    }
  };

  return (
    <>
      <div className="card">
        <h1>Sa Desenam</h1>
        <p>{assignedTitle}</p>      
      </div>
      <CustomizedCanvas canvasRef={canvasRef} />
      <div className="button" onClick={() => submit()}>Gata</div>
      {msg && <p>{msg}</p>}
    </>
  );
};

const WaitingForOthers = () => {
  return (
    <div className="card">
      <h1>Sa Desenam</h1>
      <p>Desenul tau e pus deoparte.</p>
      <p>Asteptam sa sfarseasca toata lumea...</p>
    </div>
  );
};

const PickTitle = () => {
  const [ pickedTitle, setPickedTitle ] = useState('');
  const { owner } = useGameStore();
  const { session, send } = usePlayerStore();

  const submit = () => {
    send({
      type: 'set_title',
      content: {
        title: pickedTitle,
        user_id: session.user_id,
      }
    })
    console.log(pickedTitle)
  }

  if (owner === session.user_id) {
    return (
    <div className="card">
        <h1>Sa Desenam</h1>
        <p>
          Atat ai putut... 
          Asteptam sa aleaga ceilalti un titlu.
        </p>
    </div>)
  }

  return (
    <>
      <div className="card">
        <h1>Sa Desenam</h1>
        <p>Alege un titlul:</p>
        
        <input
          placeholder="Un titlu:"
          onChange={(e) => setPickedTitle(e.target.value)}
        />

        <div className="button" onClick={() => submit()}>Gata</div>
      </div>
    </>
  );
};

const VoteTitle = () => {
  const { drawingTitles, owner } = useGameStore();
  const { session, send } = usePlayerStore();
  const submit = (title) => {
    send({
      type: 'vote_title',
      content: {
        title: title,
        user_id: session.user_id
      }
    })
    console.log(title)
  }

  if (owner === session.user_id) {
    return (
    <div className="card">
        <h1>Sa Desenam</h1>
        <p>
          Pastreaza linistea.
          Nu vrem sa influentam raspunsul...
        </p>
    </div>)
  }

  return (
    <div className="card">
      <h1>Sa Desenam</h1>
      <p>Care crezi ca este titlul initial?</p>
      {drawingTitles.map((title) => {
        return (
        <div key={title.title} className="button" onClick={() => submit(title.title)}>
            {title.title}
        </div> 
        )
      })}
    </div>
  );
};

const Score = () => {
  return(<p>sa vedem cine e cel mai mare sef</p>)
}

const Restart = () => {
  const { send } = usePlayerStore();

  const restart = () => {
    send({
      type: 'restart_game',
    });
  }

  return (
    <>
      <div className="card">
        <h1>Sa Desenam</h1>
        <p>Mai bagam unul?</p>

        <div className="button" onClick={() => restart()}>Restart</div>
      </div>
    </>
  );
}

export default Desen;
