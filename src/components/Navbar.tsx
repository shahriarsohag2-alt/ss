import React from "react";

interface NavbarProps {
  onNavigate?: (hash: string) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const handleAnchorClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    hash: string
  ) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(hash);
    }
  };

  return (
    <header className="nav">
      <a
        className="mark"
        href="#top"
        aria-label="Altura, back to top"
        onClick={(e) => handleAnchorClick(e, "#top")}
      >
        <svg
          className="mark-emblem"
          viewBox="0 0 28 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 21L11.5 3.5L21 21"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <path
            d="M11.5 3.5L26 11.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="square"
            opacity="0.82"
          />
          <path
            d="M6.2 15.5H25.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="square"
          />
          <path
            d="M2 21H26"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="square"
            opacity="0.45"
          />
        </svg>
        <span className="mark-text">Altura</span>
      </a>
      <nav aria-label="Primary" className="nav-text">
        <a href="#wellness" onClick={(e) => handleAnchorClick(e, "#wellness")}>
          Residence
        </a>
        <a href="#suite" onClick={(e) => handleAnchorClick(e, "#suite")}>
          Rooms
        </a>
        <a href="#terrace" onClick={(e) => handleAnchorClick(e, "#terrace")}>
          Terrace
        </a>
        <a href="#exit" onClick={(e) => handleAnchorClick(e, "#exit")}>
          Viewings
        </a>
      </nav>
      <a
        href="#viewings-enquiry"
        className="cta-btn nav-action"
        onClick={(e) => handleAnchorClick(e, "#viewings-enquiry")}
      >
        Book viewing
      </a>
    </header>
  );
}
