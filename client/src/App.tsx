import { Link, Route, Routes } from "react-router-dom";
import { Board } from "./pages/Board";
import { Home } from "./pages/Home";

function App() {
  return (
    <>
      <header className="navbar">
        <Link to="/" className="brand">
          CollabBoard
        </Link>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/board/:id" element={<Board />} />
      </Routes>
    </>
  );
}

export default App;
