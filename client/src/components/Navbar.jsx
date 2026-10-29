import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
      <Link to="/" className="font-display text-2xl text-gold hover:text-gold/80 transition-colors">
        GoldenSoul
      </Link>
    </nav>
  );
}

export default Navbar;
