import { NavLink, Route, Routes } from 'react-router-dom';
import { ThemeToggle } from './ui/ThemeToggle.js';
import { Overview } from './pages/Overview.js';
import { Colour } from './pages/Colour.js';
import { Typography } from './pages/Typography.js';
import { SpaceAndShape } from './pages/SpaceAndShape.js';
import { ButtonPage } from './pages/ButtonPage.js';
import { Decisions } from './pages/Decisions.js';

const NAV = [
  {
    title: 'Start here',
    items: [
      { to: '/', label: 'Overview' },
      { to: '/decisions', label: 'Decisions' },
    ],
  },
  {
    title: 'Foundations',
    items: [
      { to: '/colour', label: 'Colour' },
      { to: '/typography', label: 'Typography' },
      { to: '/space', label: 'Space and shape' },
    ],
  },
  {
    title: 'Components',
    items: [{ to: '/button', label: 'Button' }],
  },
];

export function App() {
  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Documentation">
        <NavLink to="/" className="brand">
          Alpenglow
        </NavLink>
        <p className="brandNote">Theme: Eleonora</p>

        {NAV.map((group) => (
          <div className="navGroup" key={group.title}>
            <p className="navTitle">{group.title}</p>
            <ul className="navList">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.to === '/'} className="navLink">
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="main">
        <header className="topbar">
          <ThemeToggle />
        </header>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/decisions" element={<Decisions />} />
          <Route path="/colour" element={<Colour />} />
          <Route path="/typography" element={<Typography />} />
          <Route path="/space" element={<SpaceAndShape />} />
          <Route path="/button" element={<ButtonPage />} />
        </Routes>
      </div>
    </div>
  );
}
