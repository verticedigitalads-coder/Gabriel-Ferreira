import { footer, whatsappUrl } from './landingContent';

export function LandingFooter() {
  return (
    <footer style={{ borderTop: '1px solid #262a36', padding: '40px 0', color: '#7a7f8c', fontSize: 13 }}>
      <div className="lp-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 16, color: '#f4f5f7' }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#ff6a00,#ff8a3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 800 }}>{footer.brandInitial}</span>
            {footer.brand}
          </div>
          <div>{footer.local}</div>
          {/* CNPJ: entra aqui, numa linha abaixo de footer.local, quando existir. */}
          <a href={whatsappUrl('rodape')} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, color: 'inherit', textDecoration: 'none' }}>WhatsApp {footer.whatsappLabel}</a>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {footer.links.map(link => (
            <a key={link.href} href={link.href} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, color: 'inherit', textDecoration: 'none' }}>{link.label}</a>
          ))}
        </div>
        <div>{footer.copyright}</div>
      </div>
    </footer>
  );
}
