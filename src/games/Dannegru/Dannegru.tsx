import { useEffect, useRef, useState, useMemo } from "react";

import { useGameStore } from "./store/gameStore";
import "./Dannegru.css";
import { usePlayerStore } from "../../store/playerStore";

const Dannegru = () => {
  const {
    screen,
    loading,
  } = useGameStore();


  if(loading) {
    return (<p>Loading...</p>)
  }

  return(
    <div className="dannegru">
      {screen === -1 && <Start />}
      {screen === 0 && <PickTitle />}
    </div>
  )
  // switch (screen) {
  //   case -1:
  //     return <Start />;
  //   case 0:
  //     return <PickTitle />;
  //   case 1: 
  //     return null //<Restart />;
  //   default:
  //     return null;
  // }
};

const Start = ({ }) => {
  return(
    <div className="card">
      <h1>Sa Dannegruam</h1>
      <p>Trebuie sa ghicesti mai multe cuvinte ca cel de langa tine...</p>      
    </div>
  )
}

const PickTitle = () => {
  const [ word, setWord ] = useState('');
  const { currentWord } = useGameStore();
  const { session, send } = usePlayerStore();

  const submit = () => {
    if (word)
    send({
      type: 'guess_word',
      content: {
        word: word,
        user_id: session.user_id,
      }
    })
    console.log(word)
  }

  return (
    <>
      <div className="card">
        <h1>Sa Dannegruam</h1>
        <p>Ghiceste cuvantul:</p>
        
        <input
          placeholder="Cuvantul:"
          onChange={(e) => setWord(e.target.value)}
        />

        <div className="button" onClick={() => submit()}>Gata</div>
      </div>
    </>
  );
};

export default Dannegru;
