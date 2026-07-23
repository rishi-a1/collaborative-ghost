import { Link } from 'react-router-dom';
import './index.css'
function Home() {
  return (
    <div className="home-container">
      <h1>Collaborative Ghost Writer</h1>
      <p>Craft stories together in real-time.</p>
      
      <div className="button-group">
        <Link to="/join">
          <button className="btn btn-secondary">Join Story</button>
        </Link>
        
        <Link to="/create">
          <button className="btn btn-primary">Create Story</button>
        </Link>
      </div>
    </div>
  );
}

export default Home;