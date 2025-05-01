import { useRef } from 'react';

interface DynamicMenuButtonProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

const DynamicMenuButton: React.FC<DynamicMenuButtonProps> = ({ menuOpen, setMenuOpen }) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  return (
    <button
      onClick={() => setMenuOpen(!menuOpen)}
      className="menu-button fixed right-6 md:right-8 top-1/2 -translate-y-1/2 flex flex-col items-center"
    >
      <div
        ref={buttonRef}
        className="menu-text"
      >
        {menuOpen ? 'CLOSE' : 'MENU'}
      </div>

      <style jsx>{`
        .menu-button {
          color: #fff;
          cursor: pointer;
          font-size: 25px;
          font-weight: 600;
          line-height: 1;
          mix-blend-mode: difference;
          overflow: hidden;
          position: fixed;
          text-transform: uppercase;
          transition: .3s ease;
          z-index: 9999;
        }

        .menu-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: rotate(180deg);
          letter-spacing: 0.2em;
        }
      `}</style>
    </button>
  );
};

export default DynamicMenuButton;
