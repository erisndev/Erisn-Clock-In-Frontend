import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <div className="flex space-x-4">
        <Link to="/" className="font-bold">Dashboard</Link>
        <Link to="/reports" className="font-bold">Reports</Link>
      </div>

      <div>
        {user ? (
          <button
            onClick={logout}
            className="bg-red-500 px-3 py-1 rounded"
          >
            Logout
          </button>
        ) : (
          <Link to="/login" className="font-bold">Login</Link>
        )}
      </div>
    </nav>
  );
}
