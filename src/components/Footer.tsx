import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-parchment border-t border-border-color mt-auto">
      <div className="max-w-[1200px] mx-auto px-md py-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/logo-golf-ball.png" alt="" className="w-5 h-5 object-contain opacity-60" />
          <span className="font-body text-small text-text-muted">
            &copy; {new Date().getFullYear()} A Golfer's Blueprint
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/settings" className="font-body text-small text-text-muted hover:text-forest transition-colors duration-150 ease-smooth">
            Privacy
          </Link>
          <Link to="/settings" className="font-body text-small text-text-muted hover:text-forest transition-colors duration-150 ease-smooth">
            Terms
          </Link>
          <Link to="/settings" className="font-body text-small text-text-muted hover:text-forest transition-colors duration-150 ease-smooth">
            Feedback
          </Link>
        </div>
        <span className="font-body text-small italic text-text-muted">
          Made with care for golfers
        </span>
      </div>
    </footer>
  )
}
