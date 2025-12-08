import exit from '../assets/images/exit.svg'

const Header = () => {
  return (
    <div className='header'>
      <div className="icon-button margin-left-auto mt-20 mr-20 " onClick={() => window.location.reload()}>
        <img src={exit}/>
      </div>
    </div>
  );
}

export default Header