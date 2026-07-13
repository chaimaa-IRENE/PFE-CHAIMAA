import React from 'react';
import logoDanone from '../../assets/logo-danone.svg';
import { useTheme } from '../../contexts/ThemeContext';

const Footer: React.FC = () => {
  const { theme } = useTheme();

  return (
    <footer className={`border-t border-neutral-gray dark:border-dark-border ${theme === 'dark' ? 'bg-dark-surface' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-danone-blue to-danone-blue-dark rounded-xl flex items-center justify-center shadow-lg shadow-danone-blue/20 overflow-hidden">
                <img src={logoDanone} alt="Danone" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <p className="font-bold text-danone-blue dark:text-white text-sm">Danone</p>
                <p className="text-[10px] text-neutral-text-light dark:text-dark-text-secondary">Incidents</p>
              </div>
            </div>
            <p className="text-xs text-neutral-text-light dark:text-dark-text-secondary leading-relaxed">
              One Planet. One Health.
            </p>
          </div>

          {/* Plan du site */}
          <div>
            <h3 className="font-semibold text-neutral-text dark:text-white text-sm mb-3">Plan du site</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-xs text-neutral-text-light dark:text-dark-text-secondary hover:text-danone-blue transition-colors duration-200">Accueil</a></li>
              <li><a href="/chauffeur" className="text-xs text-neutral-text-light dark:text-dark-text-secondary hover:text-danone-blue transition-colors duration-200">Chauffeur</a></li>
              <li><a href="/prestataire" className="text-xs text-neutral-text-light dark:text-dark-text-secondary hover:text-danone-blue transition-colors duration-200">Prestataire</a></li>
              <li><a href="/support" className="text-xs text-neutral-text-light dark:text-dark-text-secondary hover:text-danone-blue transition-colors duration-200">Support</a></li>
            </ul>
          </div>

          {/* Mentions légales */}
          <div>
            <h3 className="font-semibold text-neutral-text dark:text-white text-sm mb-3">Mentions légales</h3>
            <ul className="space-y-2">
              <li><a href="/mentions-legales" className="text-xs text-neutral-text-light dark:text-dark-text-secondary hover:text-danone-blue transition-colors duration-200">Mentions légales</a></li>
              <li><a href="/confidentialite" className="text-xs text-neutral-text-light dark:text-dark-text-secondary hover:text-danone-blue transition-colors duration-200">Politique de confidentialité</a></li>
              <li><a href="/cookies" className="text-xs text-neutral-text-light dark:text-dark-text-secondary hover:text-danone-blue transition-colors duration-200">Gestion des cookies</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-neutral-text dark:text-white text-sm mb-3">Contact</h3>
            <ul className="space-y-2">
              <li className="text-xs text-neutral-text-light dark:text-dark-text-secondary">support@danone.ma</li>
              <li className="text-xs text-neutral-text-light dark:text-dark-text-secondary">+212 5XX XX XX XX</li>
              <li className="text-xs text-neutral-text-light dark:text-dark-text-secondary">Casablanca, Maroc</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-gray dark:border-dark-border">
          <p className="text-center text-xs text-neutral-text-light dark:text-dark-text-secondary">
            &copy; {new Date().getFullYear()} Danone. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;