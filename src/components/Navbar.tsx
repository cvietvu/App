import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
  { path: '/', label: 'Dashboard' },
  { path: '/new-round', label: 'New Round' },
  { path: '/history', label: 'History' },
  { path: '/analytics', label: 'Analytics' },
]

export default function Navbar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-parchment border-b border-border-color">
      <div className="max-w-[1200px] mx-auto px-md h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/logo-golf-ball.png"
            alt=""
            className="w-8 h-8 object-contain"
          />
          <span className="font-display text-brand text-forest tracking-tight">
            A Golfer's Blueprint
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                className="relative font-body text-nav text-charcoal transition-colors duration-150 ease-smooth hover:text-forest"
              >
                <span className={isActive ? 'text-forest font-semibold' : ''}>
                  {link.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-[18px] left-0 right-0 h-[2px] bg-forest"
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                  />
                )}
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center px-3 py-1.5 rounded-full bg-sand border border-border-color">
            <span className="font-mono text-small text-forest font-bold">HCP 14.2</span>
          </div>
          <Link
            to="/settings"
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-md hover:bg-green-light transition-colors duration-150 ease-smooth"
          >
            <Settings className="w-5 h-5 text-forest" />
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6 text-forest" /> : <Menu className="w-6 h-6 text-forest" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="fixed top-16 right-0 bottom-0 w-64 bg-white border-l border-border-color shadow-card-hover z-40 md:hidden"
          >
            <div className="flex flex-col p-lg gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 rounded-md font-body text-nav transition-colors duration-150 ease-smooth ${
                      isActive ? 'bg-green-light text-forest font-semibold' : 'text-charcoal hover:bg-sand'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <div className="border-t border-border-color my-2" />
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-md font-body text-nav text-charcoal hover:bg-sand transition-colors duration-150 ease-smooth flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
