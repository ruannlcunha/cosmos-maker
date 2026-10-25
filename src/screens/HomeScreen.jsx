import { Link } from "react-router-dom";
import { Smile, ChevronRight } from "lucide-react";
import CreditsModal from "../components/CreditsModal";

// Para adicionar uma ferramenta: um item aqui + uma rota em router.jsx
const TOOLS = [
  {
    to: "/avatar",
    title: "Criador de Avatar",
    desc: "Monte seu personagem em pixel art: portrait, overworld e battle.",
    Icon: Smile,
  },
];

export default function HomeScreen() {
  return (
    <div className="home">
      <div className="home-inner">
        <header className="home-head">
          <h1>Cosmos Maker</h1>
          <p>Crie personagens em pixel art com sprites prontos para o seu jogo.</p>
        </header>

        <nav className="home-menu">
          {TOOLS.map(({ to, title, desc, Icon }) => (
            <Link key={to} to={to} className="home-item">
              <span className="home-icon">
                <Icon size={26} />
              </span>
              <span className="home-text">
                <strong>{title}</strong>
                <small>{desc}</small>
              </span>
              <ChevronRight size={20} className="home-arrow" />
            </Link>
          ))}
        </nav>
      </div>

      <CreditsModal />
    </div>
  );
}