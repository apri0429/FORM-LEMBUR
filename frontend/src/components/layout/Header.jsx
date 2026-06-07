import { Menu01 } from './icons.jsx'

import logoPiagam from '../../assets/logo-piagam.png'
import logoPiagamTransparent from '../../assets/logo-piagam2.png'
import '../../styles/templateComponents.css'

function Header({
  onMenuToggle,
  showMenuButton = false,
}) {
  return (
    <header className="header-main">
      <img
        src={logoPiagamTransparent}
        alt=""
        aria-hidden="true"
        className="header-accent-logo"
      />

      <div className="header-content">
        <div className="header-left">
          {showMenuButton ? (
            <button
              type="button"
              className="header-menu-button"
              aria-label="Open sidebar"
              onClick={onMenuToggle}
            >
              <Menu01 size={20} />
            </button>
          ) : null}

          <div className="header-brand">
            <img src={logoPiagam} alt="Logo Piagam" className="header-brand-logo" />
          </div>
        </div>

        <div className="header-right">
          <span className="header-brand-title">Overtime Form</span>
        </div>
      </div>
    </header>
  )
}

export default Header
