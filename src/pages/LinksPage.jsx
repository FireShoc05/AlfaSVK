import { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { GlassCard } from '../components/ui';
import '../styles/wizard.css';

export function LinksPage() {
  const { links, customLinks, loaded, fetchLinks } = useSettingsStore();

  useEffect(() => {
    if (!loaded) fetchLinks();
  }, [loaded, fetchLinks]);

  const quickLinks = [
    { title: 'MAX', url: links.max_url },
    { title: 'SFAGo', url: links.sfago_url },
  ].filter(l => l.url);

  const hasAny = quickLinks.length > 0 || customLinks.length > 0;

  return (
    <div className="links-page">
      <div className="page-header">
        <h1 className="page-header__title">Полезные ссылки</h1>
        <p className="page-header__subtitle">Быстрый доступ к внешним сервисам</p>
      </div>

      {!hasAny && (
        <div className="links-page__empty">
          <ExternalLink size={40} style={{ opacity: 0.3 }} />
          <p>Администратор пока не добавил ссылок</p>
        </div>
      )}

      {/* Quick links (MAX, SFAGo) */}
      {quickLinks.length > 0 && (
        <div className="links-page__section">
          <div className="links-page__grid">
            {quickLinks.map((link) => (
              <a
                key={link.title}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="links-page__card links-page__card--quick"
              >
                <div className="links-page__card-badge">{link.title}</div>
                <ExternalLink size={16} className="links-page__card-arrow" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Custom links */}
      {customLinks.length > 0 && (
        <div className="links-page__section">
          {quickLinks.length > 0 && (
            <div className="links-page__divider" />
          )}
          <div className="links-page__list">
            {customLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="links-page__card links-page__card--custom"
              >
                <div className="links-page__card-content">
                  <div className="links-page__card-title">{link.title}</div>
                  {link.description && (
                    <div className="links-page__card-desc">{link.description}</div>
                  )}
                </div>
                <ExternalLink size={16} className="links-page__card-arrow" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
