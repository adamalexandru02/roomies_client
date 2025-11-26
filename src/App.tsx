import { useEffect, useRef, useState } from "react";
import CanvasDraw from "react-canvas-draw";
import { ReactSketchCanvas } from "react-sketch-canvas";

import { usePlayerStore } from "./store/playerStore";
import "./App.css";

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

const App = () => {
  const {
    initConnection,
    joinRoom,
    screen,
    setScreen,
    loading,
  } = usePlayerStore();

  const [error, setError] = useState("");

  // connect once (react 17+ trigaruieste efectele de 2 ori...)
  useEffect(() => {
    initConnection();
  }, []);

  const handleJoin = async () => {
    try {
      await joinRoom();
      setScreen(1);
    } catch {
      setError("Nu am gasit nicio camera cu codul asta...");
    }
  };

  if(loading) {
    return (<p>Loading...</p>)
  }
  switch (screen) {
    case 0:
      return <First  join={handleJoin} error={error} />;
    case 1:
      return <Second />;
    case 2:
      return <Third />;
    case 3:
      return <Fourth />;
    case 4:
      return <Fifth />;
    case 5:
      return <Sixth />;
    case 6:
      return <Seventh />
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

const First = ({ join, error }) => {
  const {
    setRoomCode,
  } = usePlayerStore();

  return (
    <div className="card">
      <h1>Sa desenam</h1>
      <input
        autoComplete="off"
        type={'number'}
        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        placeholder="Cod camera:"
        maxLength={6}
      />
      <div className="button" onClick={() => join()}>Alatura-te</div>
      {error && <p>{error}</p>}
    </div>
  )

};

const Second = ({  }) => {
  const canvasRef = useRef(null);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const {
    send,
    client,
    setScreen,
    session
  } = usePlayerStore();

  const  checkAndSave = async () => {
    // const url = canvasRef.current?.getDataURL();
    const url =  await canvasRef.current?.exportImage();
    console.log(url)
    if (url.length < 7000) return setMsg("Macar incearca sa desenezi ceva...");
    if (!name) return setMsg("Cum vrei sa te strigam?!");

    try {
      const key = `avatar_${Date.now()}`;
      const result = await uploadImage(url, key, client, session);

      send({
        type: "user_data",
        content: {
          user_id: session.user_id,
          nickname: name,
          avatar: result.payload.key
        }
      });

      setScreen(2);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      <div className="card">
        <h1>Sa desenam</h1>
        <p>Deseneaza-te pe tine</p>
      </div>

      <CustomizedCanvas canvasRef={canvasRef} />

      <input
        placeholder="Numele tau:"
        onChange={(e) => setName(e.target.value)}
      />

      <div className="button" onClick={() => checkAndSave()}>Salveaza</div>
      {msg && <p>{msg}</p>}
    </>
  );
};

const Third = ({}) => {
  const {
    send,
    client,
    session,
    setScreen
  } = usePlayerStore();

  const everyoneIn = () => {
    send({
      type: "start_game",
    });
  };

  return (
    <div className="card">
      <h1>Sa Desenam</h1>
      <p>Ii asteptam pe toti sa isi faca autoportretul</p>

      <div className="button" onClick={() => everyoneIn()}>Toata lumea prezenta</div>
    </div>
  );
};

const Fourth = ({ }) => {
  const canvasRef = useRef(null);
  const [msg, setMsg] = useState("");

  // 🚀 Listen for round_over event in case you didn't upload your avatar
  const {assignedTitle, roundOverTrigger, screen, client, send, session, setScreen} = usePlayerStore();

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

        setScreen(4);
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

const Fifth = () => {
  return (
    <div className="card">
      <h1>Sa Desenam</h1>
      <p>Desenul tau e pus deoparte.</p>
      <p>Asteptam sa sfarseasca toata lumea...</p>
    </div>
  );
};

const Sixth = () => {
  const [ pickedTitle, setPickedTitle ] = useState('');
  const { send, owner, session} = usePlayerStore();

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

const Seventh = () => {
  const { send, drawingTitles, owner, session } = usePlayerStore();
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

export default App;
