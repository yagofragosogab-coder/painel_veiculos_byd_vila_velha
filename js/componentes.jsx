/* Painel de Veículos — componentes de interface (gerado do design system). */
window.PainelDeVeCulosVMBYDDesignSystem_23295c = window.PainelDeVeCulosVMBYDDesignSystem_23295c || {};
(function (__ex) {

/* core/Icon */
(function () {


function toPascal(n){return String(n||'').split(/[-_ ]/).map(function(p){return p.charAt(0).toUpperCase()+p.slice(1);}).join('');}

function Icon({ name, size = 20, strokeWidth = 2, color = 'currentColor', style, title }) {
  const [, force] = React.useState(0);
  const lib = typeof window !== 'undefined' && window.lucide && window.lucide.icons;
  React.useEffect(function () {
    if (lib) return;
    const t = setInterval(function () { if (window.lucide && window.lucide.icons) { clearInterval(t); force(function (x) { return x + 1; }); } }, 150);
    return function () { clearInterval(t); };
  }, [lib]);
  let node = lib ? (lib[toPascal(name)] || lib[name]) : null;
  if (node && node[0] === 'svg') node = node[2];
  const kids = (node || []).map(function (n, i) { return React.createElement(n[0], Object.assign({ key: i }, n[1])); });
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} style={Object.assign({ flex: 'none', display: 'block' }, style)}>
      {title ? <title>{title}</title> : null}{kids}
    </svg>
  );
}

  Object.assign(__ex, { Icon });
})();

/* core/Spinner */
(function () {
  const { Icon } = __ex;

function Spinner({ size = 20, color = 'currentColor' }) {
  return <span role="status" aria-label="Carregando" style={{ width: size, height: size, flex: 'none', display: 'inline-block', borderRadius: '50%', border: '2px solid ' + color, borderRightColor: 'transparent', opacity: .8, animation: 'pv-spin .8s linear infinite' }} />;
}

  Object.assign(__ex, { Spinner });
})();

/* core/Button */
(function () {
  const { Icon, Spinner } = __ex;




const V = {
  primary: { bg: 'var(--action-primary)', hover: 'var(--action-primary-hover)', press: 'var(--action-primary-press)', fg: 'var(--text-inverse)', bd: 'transparent' },
  secondary: { bg: 'var(--surface-card)', hover: 'var(--slate-100)', press: 'var(--slate-150)', fg: 'var(--text-1)', bd: 'var(--border-strong)' },
  ghost: { bg: 'transparent', hover: 'var(--slate-100)', press: 'var(--slate-150)', fg: 'var(--text-accent)', bd: 'transparent' },
  danger: { bg: 'var(--danger-solid)', hover: 'var(--vermelho-700)', press: 'var(--vermelho-700)', fg: 'var(--text-inverse)', bd: 'transparent' },
  success: { bg: 'var(--ok-solid)', hover: 'var(--verde-700)', press: 'var(--verde-700)', fg: 'var(--text-inverse)', bd: 'transparent' }
};

function Button({ children, variant = 'primary', size = 'md', icon, iconRight, fullWidth, disabled, loading, onClick, type = 'button', style }) {
  const [h, setH] = React.useState(false);
  const [p, setP] = React.useState(false);
  const v = V[variant] || V.primary;
  const off = disabled || loading;
  const height = size === 'lg' ? 'var(--touch-lg)' : size === 'sm' ? '40px' : 'var(--touch-min)';
  const fs = size === 'lg' ? 'var(--fs-body-lg)' : 'var(--fs-body)';
  return (
    <button type={type} disabled={off} onClick={onClick}
      onMouseEnter={function () { setH(true); }} onMouseLeave={function () { setH(false); setP(false); }}
      onMouseDown={function () { setP(true); }} onMouseUp={function () { setP(false); }}
      style={Object.assign({
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: height,
        padding: size === 'sm' ? '0 14px' : '0 20px', width: fullWidth ? '100%' : undefined,
        font: 'var(--fw-bold) ' + fs + '/1.2 var(--font-sans)', color: off ? 'var(--text-disabled)' : v.fg,
        background: off ? (variant === 'ghost' ? 'transparent' : 'var(--slate-100)') : (p ? v.press : h ? v.hover : v.bg),
        border: '1px solid ' + (off ? 'var(--border-default)' : v.bd), borderRadius: 'var(--radius-md)',
        cursor: off ? 'not-allowed' : 'pointer', transform: p && !off ? 'scale(.98)' : 'none',
        transition: 'background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)', textAlign: 'center'
      }, style)}>
      {loading ? <Spinner size={18} /> : icon ? <Icon name={icon} size={size === 'lg' ? 22 : 20} /> : null}
      <span style={{ whiteSpace: fullWidth ? 'normal' : 'nowrap' }}>{children}</span>
      {iconRight ? <Icon name={iconRight} size={20} /> : null}
    </button>
  );
}

  Object.assign(__ex, { Button });
})();

/* core/Panel */
(function () {
  const { Icon, Spinner, Button } = __ex;


function Panel({ title, icon, action, children, padding = 16, style }) {
  return (
    <section style={Object.assign({ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: padding, display: 'flex', flexDirection: 'column', gap: 14 }, style)}>
      {title ? (
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, minHeight: 32 }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, font: 'var(--type-h3)', color: 'var(--text-1)' }}>{icon ? <Icon name={icon} size={20} color="var(--text-2)" /> : null}{title}</h2>
          {action || null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

  Object.assign(__ex, { Panel });
})();

/* forms/TextField */
(function () {
  const { Icon, Spinner, Button, Panel } = __ex;



function TextField({ label, value, onChange, placeholder, hint, error, type = 'text', mono, required, disabled, autoFocus, maxLength, icon, inputMode, style }) {
  const [show, setShow] = React.useState(false);
  const [f, setF] = React.useState(false);
  const isPw = type === 'password';
  const id = React.useMemo(function () { return 'tf-' + Math.random().toString(36).slice(2, 8); }, []);
  const bd = error ? 'var(--danger-solid)' : f ? 'var(--border-focus)' : 'var(--border-strong)';
  return (
    <div style={Object.assign({ display: 'flex', flexDirection: 'column', gap: 6 }, style)}>
      {label ? <label htmlFor={id} style={{ font: 'var(--type-label)', color: 'var(--text-1)' }}>{label}{required ? <span style={{ color: 'var(--danger-fg)' }}> *</span> : null}</label> : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 'var(--touch-min)', padding: '0 12px', background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)', border: (f || error ? 2 : 1) + 'px solid ' + bd, borderRadius: 'var(--radius-md)', margin: f || error ? 0 : 1 }}>
        {icon ? <Icon name={icon} size={20} color="var(--text-2)" /> : null}
        <input id={id} value={value} onChange={function (e) { onChange && onChange(e.target.value); }} placeholder={placeholder} disabled={disabled} autoFocus={autoFocus} maxLength={maxLength} inputMode={inputMode}
          type={isPw && !show ? 'password' : isPw ? 'text' : type} onFocus={function () { setF(true); }} onBlur={function () { setF(false); }}
          aria-invalid={!!error}
          style={{ flex: 1, minWidth: 0, border: 0, outline: 0, boxShadow: 'none', background: 'transparent', color: 'var(--text-1)', font: mono ? 'var(--type-chassi)' : 'var(--type-body)', letterSpacing: mono ? 'var(--ls-mono)' : undefined, textTransform: mono ? 'uppercase' : undefined, padding: '12px 0' }} />
        {isPw ? (
          <button type="button" onClick={function () { setShow(!show); }} style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 40, padding: '0 8px', border: 0, background: 'transparent', color: 'var(--text-accent)', font: 'var(--type-label)', cursor: 'pointer' }}>
            <Icon name={show ? 'eye-off' : 'eye'} size={18} />{show ? 'Esconder' : 'Mostrar'}
          </button>
        ) : null}
      </div>
      {error ? <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', color: 'var(--danger-fg)', font: 'var(--type-body)' }}><Icon name="circle-alert" size={18} style={{ marginTop: 3 }} /><span>{error}</span></div>
        : hint ? <div style={{ color: 'var(--text-2)', font: 'var(--type-body)' }}>{hint}</div> : null}
    </div>
  );
}

  Object.assign(__ex, { TextField });
})();

/* forms/SearchField */
(function () {
  const { Icon, Spinner, Button, Panel, TextField } = __ex;



function SearchField({ value, onChange, onScan, placeholder = 'Chassi, final do chassi, cliente ou modelo', autoFocus = true }) {
  const [f, setF] = React.useState(false);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, minHeight: 'var(--touch-lg)', padding: '0 14px', background: 'var(--surface-card)', border: '2px solid ' + (f ? 'var(--border-focus)' : 'var(--border-strong)'), borderRadius: 'var(--radius-lg)', boxShadow: f ? 'var(--focus-ring)' : 'none' }}>
        <Icon name="search" size={22} color="var(--text-2)" />
        <input value={value} autoFocus={autoFocus} placeholder={placeholder} type="search" inputMode="search"
          onChange={function (e) { onChange && onChange(e.target.value); }} onFocus={function () { setF(true); }} onBlur={function () { setF(false); }}
          style={{ flex: 1, minWidth: 0, border: 0, outline: 0, boxShadow: 'none', background: 'transparent', font: 'var(--type-body-lg)', color: 'var(--text-1)', padding: '14px 0', textTransform: value ? 'uppercase' : 'none' }} />
        {value ? <button type="button" onClick={function () { onChange && onChange(''); }} style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 40, border: 0, background: 'transparent', color: 'var(--text-2)', font: 'var(--type-label)', cursor: 'pointer' }}><Icon name="x" size={18} />Limpar</button> : null}
      </div>
      {onScan ? (
        <button type="button" onClick={onScan} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, minWidth: 76, minHeight: 'var(--touch-lg)', padding: '6px 10px', background: 'var(--action-primary)', color: 'var(--text-inverse)', border: 0, borderRadius: 'var(--radius-lg)', font: 'var(--fw-bold) 13px/1.1 var(--font-sans)', cursor: 'pointer' }}>
          <Icon name="scan-barcode" size={24} />Câmera
        </button>
      ) : null}
    </div>
  );
}

  Object.assign(__ex, { SearchField });
})();

/* forms/Select */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField } = __ex;



function Select({ label, value, onChange, options = [], placeholder = 'Escolha uma opção', required, disabled, error, style }) {
  const id = React.useMemo(function () { return 'sel-' + Math.random().toString(36).slice(2, 8); }, []);
  return (
    <div style={Object.assign({ display: 'flex', flexDirection: 'column', gap: 6 }, style)}>
      {label ? <label htmlFor={id} style={{ font: 'var(--type-label)' }}>{label}{required ? <span style={{ color: 'var(--danger-fg)' }}> *</span> : null}</label> : null}
      <div style={{ position: 'relative' }}>
        <select id={id} value={value} disabled={disabled} onChange={function (e) { onChange && onChange(e.target.value); }}
          style={{ width: '100%', minHeight: 'var(--touch-min)', padding: '0 44px 0 12px', appearance: 'none', WebkitAppearance: 'none', background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)', border: '1px solid ' + (error ? 'var(--danger-solid)' : 'var(--border-strong)'), borderRadius: 'var(--radius-md)', font: 'var(--type-body)', color: value ? 'var(--text-1)' : 'var(--text-2)', cursor: 'pointer' }}>
          <option value="" disabled={!!required}>{placeholder}</option>
          {options.map(function (o) { const v = typeof o === 'string' ? o : o.value; const l = typeof o === 'string' ? o : o.label; return <option key={v} value={v}>{l}</option>; })}
        </select>
        <Icon name="chevron-down" size={20} color="var(--text-2)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      </div>
      {error ? <div style={{ color: 'var(--danger-fg)' }}>{error}</div> : null}
    </div>
  );
}

  Object.assign(__ex, { Select });
})();

/* forms/Switch */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select } = __ex;

function Switch({ checked, onChange, onLabel = 'Ativo', offLabel = 'Inativo', disabled }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} disabled={disabled} onClick={function () { onChange && onChange(!checked); }}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minHeight: 'var(--touch-min)', padding: '0 4px', border: 0, background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer', font: 'var(--type-label)', color: checked ? 'var(--ok-fg)' : 'var(--text-2)' }}>
      <span style={{ position: 'relative', width: 48, height: 28, borderRadius: 999, background: checked ? 'var(--ok-solid)' : 'var(--slate-300)', transition: 'background var(--dur) var(--ease-out)', flex: 'none' }}>
        <span style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 22, height: 22, borderRadius: '50%', background: 'var(--slate-0)', boxShadow: 'var(--shadow-1)', transition: 'left var(--dur) var(--ease-out)' }} />
      </span>
      <span style={{ minWidth: 56, textAlign: 'left' }}>{checked ? onLabel : offLabel}</span>
    </button>
  );
}

  Object.assign(__ex, { Switch });
})();

/* forms/OptionList */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch } = __ex;



function OptionList({ options = [], value, onChange, name = 'opt' }) {
  return (
    <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map(function (o) {
        const v = typeof o === 'string' ? o : o.value; const l = typeof o === 'string' ? o : o.label; const ic = typeof o === 'string' ? null : o.icon;
        const on = v === value;
        return (
          <button key={v} type="button" role="radio" aria-checked={on} name={name} onClick={function () { onChange && onChange(v); }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 'var(--touch-lg)', padding: '10px 14px', textAlign: 'left', background: on ? 'var(--surface-accent-soft)' : 'var(--surface-card)', border: (on ? 2 : 1) + 'px solid ' + (on ? 'var(--border-focus)' : 'var(--border-default)'), margin: on ? 0 : 1, borderRadius: 'var(--radius-md)', cursor: 'pointer', font: 'var(--type-body)', color: 'var(--text-1)' }}>
            <span style={{ width: 22, height: 22, flex: 'none', borderRadius: '50%', border: '2px solid ' + (on ? 'var(--border-focus)' : 'var(--border-strong)'), display: 'grid', placeItems: 'center' }}>
              {on ? <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--border-focus)' }} /> : null}
            </span>
            {ic ? <Icon name={ic} size={20} color="var(--text-2)" /> : null}
            <span style={{ flex: 1, fontWeight: on ? 700 : 400 }}>{l}</span>
          </button>
        );
      })}
    </div>
  );
}

  Object.assign(__ex, { OptionList });
})();

/* feedback/StageBadge */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList } = __ex;



const ETAPAS = [
  { id: 'previsto', label: 'Previsto', icon: 'calendar-clock', tok: 'previsto' },
  { id: 'loja', label: 'Na loja', icon: 'warehouse', tok: 'loja' },
  { id: 'preparacao', label: 'Em preparação', icon: 'wrench', tok: 'preparo' },
  { id: 'pronto', label: 'Pronto', icon: 'circle-check', tok: 'pronto' },
  { id: 'entregue', label: 'Entregue', icon: 'key-round', tok: 'entregue' }
];

function StageBadge({ etapa = 'previsto', size = 'md' }) {
  const e = ETAPAS.find(function (x) { return x.id === etapa; }) || ETAPAS[0];
  const lg = size === 'lg';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: lg ? 36 : 30, padding: lg ? '0 14px' : '0 10px', borderRadius: 'var(--radius-pill)', background: 'var(--etapa-' + e.tok + '-bg)', color: 'var(--etapa-' + e.tok + '-fg)', font: 'var(--fw-bold) ' + (lg ? 'var(--fs-body)' : 'var(--fs-label)') + '/1 var(--font-sans)', whiteSpace: 'nowrap' }}>
      <Icon name={e.icon} size={lg ? 18 : 16} strokeWidth={2.25} />{e.label}
    </span>
  );
}

  Object.assign(__ex, { ETAPAS, StageBadge });
})();

/* feedback/Tag */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge } = __ex;



const T = {
  neutral: ['var(--surface-sunken)', 'var(--text-1)', 'var(--border-default)'],
  info: ['var(--info-bg)', 'var(--info-fg)', 'var(--info-border)'],
  ok: ['var(--ok-bg)', 'var(--ok-fg)', 'var(--ok-border)'],
  warn: ['var(--warn-bg)', 'var(--warn-fg)', 'var(--warn-border)'],
  danger: ['var(--danger-bg)', 'var(--danger-fg)', 'var(--danger-border)'],
  inverse: ['var(--surface-inverse)', 'var(--text-inverse)', 'var(--surface-inverse)']
};

function Tag({ children, tone = 'neutral', icon }) {
  const t = T[tone] || T.neutral;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 30, padding: '0 10px', borderRadius: 'var(--radius-sm)', background: t[0], color: t[1], border: '1px solid ' + t[2], font: 'var(--fw-bold) var(--fs-label)/1.1 var(--font-sans)', whiteSpace: 'nowrap' }}>
      {icon ? <Icon name={icon} size={16} strokeWidth={2.25} /> : null}{children}
    </span>
  );
}

  Object.assign(__ex, { Tag });
})();

/* feedback/AlertRow */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag } = __ex;



const S = {
  critico: { fg: 'var(--danger-fg)', bg: 'var(--danger-bg)', bd: 'var(--danger-border)', icon: 'siren', label: 'Urgente' },
  alto: { fg: 'var(--danger-fg)', bg: 'var(--surface-card)', bd: 'var(--danger-border)', icon: 'triangle-alert', label: 'Atenção' },
  medio: { fg: 'var(--warn-fg)', bg: 'var(--surface-card)', bd: 'var(--warn-border)', icon: 'clock-alert', label: 'Atenção' },
  ok: { fg: 'var(--ok-fg)', bg: 'var(--ok-bg)', bd: 'var(--ok-border)', icon: 'circle-check', label: '' }
};

function AlertRow({ severity = 'medio', count, children, detail, onClick }) {
  const [h, setH] = React.useState(false);
  const s = S[severity] || S.medio;
  const El = onClick ? 'button' : 'div';
  return (
    <El type={onClick ? 'button' : undefined} onClick={onClick} onMouseEnter={function () { setH(true); }} onMouseLeave={function () { setH(false); }}
      style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', minHeight: 64, padding: '12px 14px', textAlign: 'left', background: s.bg, border: '1px solid ' + s.bd, borderRadius: 'var(--radius-lg)', cursor: onClick ? 'pointer' : 'default', color: 'var(--text-1)', font: 'var(--type-body)', boxShadow: h && onClick ? 'var(--shadow-2)' : 'none', transition: 'box-shadow var(--dur) var(--ease-out)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: s.fg, flex: 'none' }}>
        <Icon name={s.icon} size={24} strokeWidth={2.25} />
        {count != null ? <span style={{ font: 'var(--fw-bold) 32px/1 var(--font-sans)', minWidth: 22 }}>{count}</span> : null}
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontWeight: 700, textWrap: 'pretty' }}>{children}</span>
        {detail ? <span style={{ color: 'var(--text-2)' }}>{detail}</span> : null}
      </span>
      {onClick ? <Icon name="chevron-right" size={22} color="var(--text-2)" /> : null}
    </El>
  );
}

  Object.assign(__ex, { AlertRow });
})();

/* feedback/Banner */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow } = __ex;



const T = {
  offline: ['var(--surface-inverse)', 'var(--text-inverse)', 'wifi-off'],
  danger: ['var(--danger-bg)', 'var(--danger-fg)', 'circle-x'],
  warn: ['var(--warn-bg)', 'var(--warn-fg)', 'triangle-alert'],
  info: ['var(--info-bg)', 'var(--info-fg)', 'info'],
  ok: ['var(--ok-bg)', 'var(--ok-fg)', 'circle-check']
};

function Banner({ tone = 'info', title, children, icon, action }) {
  const t = T[tone] || T.info;
  return (
    <div role={tone === 'danger' || tone === 'offline' ? 'alert' : 'status'} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: t[0], color: t[1], borderRadius: 'var(--radius-md)', font: 'var(--type-body)' }}>
      <Icon name={icon || t[2]} size={22} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title ? <div style={{ fontWeight: 700 }}>{title}</div> : null}
        {children ? <div style={{ color: tone === 'offline' ? 'var(--slate-200)' : 'inherit' }}>{children}</div> : null}
      </div>
      {action || null}
    </div>
  );
}

  Object.assign(__ex, { Banner });
})();

/* feedback/Toast */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner } = __ex;



function Toast({ children, tone = 'ok', icon, onClose }) {
  const ic = icon || (tone === 'ok' ? 'circle-check' : tone === 'danger' ? 'circle-x' : 'info');
  const c = tone === 'ok' ? 'var(--verde-200)' : tone === 'danger' ? 'var(--vermelho-200)' : 'var(--azul-100)';
  return (
    <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 520, padding: '14px 16px', background: 'var(--surface-inverse)', color: 'var(--text-inverse)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-overlay)', font: 'var(--type-body)', animation: 'pv-slide-up var(--dur-slow) var(--ease-out)' }}>
      <Icon name={ic} size={22} color={c} />
      <span style={{ flex: 1, textWrap: 'pretty' }}>{children}</span>
      {onClose ? <button type="button" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 40, border: 0, background: 'transparent', color: 'var(--slate-200)', font: 'var(--type-label)', cursor: 'pointer' }}><Icon name="x" size={18} />Fechar</button> : null}
    </div>
  );
}

  Object.assign(__ex, { Toast });
})();

/* feedback/SyncStatus */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast } = __ex;



function Part({ label, at, state }) {
  const c = state === 'failed' ? 'var(--danger-fg)' : state === 'stale' ? 'var(--warn-fg)' : 'var(--text-2)';
  const ic = state === 'failed' ? 'circle-x' : state === 'stale' ? 'clock-alert' : 'circle-check';
  const txt = state === 'failed' ? label + ': falhou às ' + at : label + ' atualizada às ' + at;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: c, fontWeight: state === 'ok' ? 400 : 700 }}><Icon name={ic} size={16} />{txt}</span>;
}

function SyncStatus({ pdsAt, pdsState = 'ok', agendaAt, agendaState = 'ok', compact }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 4, font: compact ? 'var(--fw-regular) var(--fs-label)/1.3 var(--font-sans)' : 'var(--type-body)' }}>
      <Part label="Base PDS" at={pdsAt} state={pdsState} />
      <span aria-hidden="true" style={{ color: 'var(--text-disabled)' }}>·</span>
      <Part label="Agenda" at={agendaAt} state={agendaState} />
    </div>
  );
}

  Object.assign(__ex, { SyncStatus });
})();

/* feedback/EmptyState */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus } = __ex;



function EmptyState({ icon = 'search-x', title, children, action, tone = 'neutral' }) {
  const c = tone === 'ok' ? 'var(--ok-fg)' : tone === 'danger' ? 'var(--danger-fg)' : 'var(--text-2)';
  const bg = tone === 'ok' ? 'var(--ok-bg)' : tone === 'danger' ? 'var(--danger-bg)' : 'var(--surface-sunken)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, padding: '32px 20px' }}>
      <span style={{ width: 64, height: 64, borderRadius: '50%', background: bg, color: c, display: 'grid', placeItems: 'center' }}><Icon name={icon} size={30} /></span>
      {title ? <div style={{ font: 'var(--type-h3)', color: 'var(--text-1)' }}>{title}</div> : null}
      {children ? <div style={{ color: 'var(--text-2)', maxWidth: 380, textWrap: 'pretty' }}>{children}</div> : null}
      {action ? <div style={{ marginTop: 4 }}>{action}</div> : null}
    </div>
  );
}

  Object.assign(__ex, { EmptyState });
})();

/* feedback/Skeleton */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus, EmptyState } = __ex;

function Skeleton({ width = '100%', height = 16, radius = 6, style }) {
  return <span aria-hidden="true" style={Object.assign({ display: 'block', width: width, height: height, borderRadius: radius, background: 'linear-gradient(90deg, var(--slate-100) 0%, var(--slate-150) 50%, var(--slate-100) 100%)', backgroundSize: '800px 100%', animation: 'pv-shimmer 1.4s linear infinite' }, style)} />;
}

  Object.assign(__ex, { Skeleton });
})();

/* vehicle/ColorSwatch */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus, EmptyState, Skeleton } = __ex;

const MAP = { BRANCO: 'var(--carro-branco)', CINZA: 'var(--carro-cinza)', PRETO: 'var(--carro-preto)', AZUL: 'var(--carro-azul)', PRATA: 'var(--carro-prata)', VERDE: 'var(--carro-verde)' };
function ColorSwatch({ cor, size = 18, showLabel }) {
  const k = String(cor || '').trim().toUpperCase();
  const fill = MAP[k] || 'repeating-linear-gradient(45deg, var(--slate-200) 0 4px, var(--slate-0) 4px 8px)';
  const label = k ? k.charAt(0) + k.slice(1).toLowerCase() : '—';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span aria-hidden="true" style={{ width: size, height: size, flex: 'none', borderRadius: '50%', background: fill, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.18)' }} />
      {showLabel ? <span>{label}</span> : null}
    </span>
  );
}

  Object.assign(__ex, { ColorSwatch });
})();

/* vehicle/ChassiText */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus, EmptyState, Skeleton, ColorSwatch } = __ex;


function ChassiText({ chassi = '', copy, size = 'md' }) {
  const [ok, setOk] = React.useState(false);
  const c = String(chassi).toUpperCase();
  const head = c.slice(0, Math.max(0, c.length - 8)); const tail = c.slice(-8);
  const fs = size === 'lg' ? 'var(--fs-body-lg)' : 'var(--fs-body)';
  function doCopy() { try { navigator.clipboard.writeText(c); } catch (e) {} setOk(true); setTimeout(function () { setOk(false); }, 1600); }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ font: 'var(--fw-regular) ' + fs + '/1.3 var(--font-mono)', letterSpacing: 'var(--ls-mono)', color: 'var(--text-2)' }}>{head}<b style={{ color: 'var(--text-1)', fontWeight: 700 }}>{tail}</b></span>
      {copy ? <button type="button" onClick={doCopy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 40, padding: '0 10px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', background: ok ? 'var(--ok-bg)' : 'var(--surface-card)', color: ok ? 'var(--ok-fg)' : 'var(--text-accent)', font: 'var(--type-label)', cursor: 'pointer' }}><Icon name={ok ? 'check' : 'copy'} size={16} />{ok ? 'Copiado' : 'Copiar'}</button> : null}
    </span>
  );
}

  Object.assign(__ex, { ChassiText });
})();

/* vehicle/VehicleCard */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus, EmptyState, Skeleton, ColorSwatch, ChassiText } = __ex;







function Row({ icon, label, children }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <Icon name={icon} size={18} color="var(--text-2)" style={{ marginTop: 3 }} />
      <div style={{ minWidth: 0 }}><span style={{ color: 'var(--text-2)' }}>{label}: </span><span style={{ fontWeight: 700 }}>{children}</span></div>
    </div>
  );
}

function VehicleCard({ modelo, versao, cor, chassi, etapa, localizacao, comQuem, entrega, tags = [], alerta, atualizadoPor, atualizadoCargo, atualizadoEm, highlight, onClick }) {
  const [h, setH] = React.useState(false);
  const El = onClick ? 'button' : 'div';
  const corTxt = cor ? cor.charAt(0) + cor.slice(1).toLowerCase() : '';
  return (
    <El type={onClick ? 'button' : undefined} onClick={onClick} onMouseEnter={function () { setH(true); }} onMouseLeave={function () { setH(false); }}
      style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', padding: 16, textAlign: 'left', background: 'var(--surface-card)', border: '1px solid ' + (highlight ? 'var(--border-focus)' : 'var(--border-subtle)'), borderRadius: 'var(--radius-lg)', boxShadow: h && onClick ? 'var(--shadow-2)' : 'var(--shadow-1)', cursor: onClick ? 'pointer' : 'default', font: 'var(--type-body)', color: 'var(--text-1)', animation: highlight ? 'pv-pulse-update 1.2s var(--ease-out) 2' : 'none', transition: 'box-shadow var(--dur) var(--ease-out)' }}>
      {highlight ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--info-fg)', fontWeight: 700, fontSize: 'var(--fs-label)' }}><Icon name="radio" size={16} />{highlight}</div> : null}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--type-h3)' }}><ColorSwatch cor={cor} size={16} /><span>{modelo} {corTxt}</span></div>
          {versao ? <div style={{ color: 'var(--text-2)' }}>{versao}</div> : null}
          <ChassiText chassi={chassi} />
        </div>
        <StageBadge etapa={etapa} />
      </div>
      {alerta ? <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', background: 'var(--danger-bg)', color: 'var(--danger-fg)', borderRadius: 'var(--radius-md)', fontWeight: 700 }}><Icon name="triangle-alert" size={18} style={{ marginTop: 2 }} />{alerta}</div> : null}
      {tags.length ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{tags.map(function (t, i) { return <Tag key={i} tone={t.tone} icon={t.icon}>{t.label}</Tag>; })}</div> : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Row icon="map-pin" label="Onde está">{localizacao}</Row>
        {comQuem ? <Row icon="user-round" label="Com quem está">{comQuem}</Row> : null}
        {entrega ? <Row icon="calendar-check" label="Entrega">{entrega}</Row> : null}
      </div>
      {atualizadoPor ? <div style={{ paddingTop: 10, borderTop: '1px solid var(--border-subtle)', color: 'var(--text-2)', fontSize: 'var(--fs-label)' }}>Atualizado por <b style={{ color: 'var(--text-1)' }}>{atualizadoPor}</b> ({atualizadoCargo || '—'}) · {atualizadoEm}</div> : null}
    </El>
  );
}

  Object.assign(__ex, { VehicleCard });
})();

/* vehicle/StageTimeline */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus, EmptyState, Skeleton, ColorSwatch, ChassiText, VehicleCard } = __ex;




function StageTimeline({ etapa = 'previsto', datas = {} }) {
  const cur = ETAPAS.findIndex(function (e) { return e.id === etapa; });
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))' }}>
      {ETAPAS.map(function (e, i) {
        const done = i < cur, now = i === cur;
        const dot = now ? 'var(--etapa-' + e.tok + '-solid)' : done ? 'var(--slate-700)' : 'var(--surface-card)';
        return (
          <li key={e.id} aria-current={now ? 'step' : undefined} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
            {i > 0 ? <span style={{ position: 'absolute', top: 19, right: '50%', width: '100%', height: 3, background: i <= cur ? 'var(--slate-700)' : 'var(--border-default)' }} /> : null}
            <span style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', background: dot, color: now || done ? 'var(--text-inverse)' : 'var(--text-disabled)', border: now || done ? 0 : '2px solid var(--border-default)', boxShadow: now ? '0 0 0 4px var(--etapa-' + e.tok + '-bg)' : 'none' }}>
              <Icon name={done ? 'check' : e.icon} size={20} strokeWidth={2.25} />
            </span>
            <span style={{ font: (now ? 'var(--fw-bold)' : 'var(--fw-regular)') + ' var(--fs-label)/1.2 var(--font-sans)', color: now ? 'var(--text-1)' : done ? 'var(--text-1)' : 'var(--text-2)' }}>{e.label}</span>
            {datas[e.id] ? <span style={{ font: 'var(--fw-regular) 13px/1.2 var(--font-sans)', color: 'var(--text-2)' }}>{datas[e.id]}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

  Object.assign(__ex, { StageTimeline });
})();

/* vehicle/HistoryList */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus, EmptyState, Skeleton, ColorSwatch, ChassiText, VehicleCard, StageTimeline } = __ex;


const O = { usuario: ['user-round', 'Pessoa'], pds: ['file-spreadsheet', 'Planilha PDS'], agenda: ['calendar-days', 'Agenda'], sistema: ['server', 'Sistema'] };
function HistoryList({ items = [] }) {
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
      {items.map(function (it, i) {
        const o = O[it.origem] || O.usuario;
        return (
          <li key={i} style={{ display: 'grid', gridTemplateColumns: '36px minmax(0,1fr)', gap: 12, paddingBottom: i === items.length - 1 ? 0 : 16, position: 'relative' }}>
            {i < items.length - 1 ? <span style={{ position: 'absolute', left: 17, top: 36, bottom: 0, width: 2, background: 'var(--border-subtle)' }} /> : null}
            <span style={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', background: it.origem === 'usuario' ? 'var(--surface-accent-soft)' : 'var(--surface-sunken)', color: it.origem === 'usuario' ? 'var(--text-accent)' : 'var(--text-2)' }}><Icon name={o[0]} size={18} /></span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 6 }}>
              <div style={{ fontWeight: 700, textWrap: 'pretty' }}>{it.oque}</div>
              {it.motivo ? <div style={{ color: 'var(--text-1)' }}>Motivo: “{it.motivo}”</div> : null}
              <div style={{ color: 'var(--text-2)', fontSize: 'var(--fs-label)' }}>{it.quem}{it.origem === 'usuario' ? ' (' + (it.cargo || '—') + ')' : ''} · {it.quando} · {o[1]}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

  Object.assign(__ex, { HistoryList });
})();

/* vehicle/ControlFields */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus, EmptyState, Skeleton, ColorSwatch, ChassiText, VehicleCard, StageTimeline, HistoryList } = __ex;

function ControlFields({ localizacao, nome, cargo, em, columns = 2 }) {
  const items = [['Onde está', localizacao], ['Atualizado por – Nome', nome], ['Atualizado por – Cargo', cargo || '—'], ['Atualizado em', em]];
  return (
    <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(' + columns + ', minmax(0,1fr))', gap: '12px 20px' }}>
      {items.map(function (it) { return <div key={it[0]} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><dt style={{ color: 'var(--text-2)', fontSize: 'var(--fs-label)' }}>{it[0]}</dt><dd style={{ margin: 0, fontWeight: 700 }}>{it[1] || '—'}</dd></div>; })}
    </dl>
  );
}

  Object.assign(__ex, { ControlFields });
})();

/* dashboard/StageStrip */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus, EmptyState, Skeleton, ColorSwatch, ChassiText, VehicleCard, StageTimeline, HistoryList, ControlFields } = __ex;



function StageStrip({ counts = {}, onSelect, vertical }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: vertical ? '1fr' : 'repeat(5, minmax(0,1fr))', gap: 8 }}>
      {ETAPAS.map(function (e, i) {
        const label = e.id === 'entregue' ? 'Entregue (últimos 7 dias)' : e.label;
        return (
          <button key={e.id} type="button" onClick={function () { onSelect && onSelect(e.id); }}
            style={{ position: 'relative', display: 'flex', flexDirection: vertical ? 'row' : 'column', alignItems: vertical ? 'center' : 'flex-start', gap: vertical ? 14 : 10, minHeight: vertical ? 64 : 132, padding: vertical ? '10px 14px' : 16, textAlign: 'left', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderTop: vertical ? '1px solid var(--border-subtle)' : '4px solid var(--etapa-' + e.tok + '-solid)', borderLeft: vertical ? '4px solid var(--etapa-' + e.tok + '-solid)' : '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', color: 'var(--text-1)' }}>
            <span style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--etapa-' + e.tok + '-bg)', color: 'var(--etapa-' + e.tok + '-fg)' }}><Icon name={e.icon} size={20} strokeWidth={2.25} /></span>
            <span style={{ font: 'var(--fw-light) ' + (vertical ? '36px' : 'var(--fs-kpi)') + '/1 var(--font-sans)', order: vertical ? 2 : 0 }}>{counts[e.id] != null ? counts[e.id] : '–'}</span>
            <span style={{ flex: vertical ? 1 : 'none', font: 'var(--fw-bold) var(--fs-body)/1.25 var(--font-sans)' }}>{label}</span>
            {!vertical && i < 4 ? <span aria-hidden="true" style={{ position: 'absolute', right: -11, top: '50%', transform: 'translateY(-50%)', zIndex: 1, width: 14, color: 'var(--text-disabled)' }}><Icon name="chevron-right" size={14} strokeWidth={3} /></span> : null}
            {vertical ? <Icon name="chevron-right" size={20} color="var(--text-2)" style={{ order: 3 }} /> : null}
          </button>
        );
      })}
    </div>
  );
}

  Object.assign(__ex, { StageStrip });
})();

/* dashboard/BarList */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus, EmptyState, Skeleton, ColorSwatch, ChassiText, VehicleCard, StageTimeline, HistoryList, ControlFields, StageStrip } = __ex;

function BarList({ items = [], onSelect }) {
  const max = Math.max.apply(null, [1].concat(items.map(function (i) { return i.value; })));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {items.map(function (it) {
        return (
          <button key={it.label} type="button" onClick={function () { onSelect && onSelect(it); }}
            style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 40px', alignItems: 'center', columnGap: 12, rowGap: 6, minHeight: 56, padding: '6px 8px', border: 0, borderRadius: 'var(--radius-md)', background: 'transparent', textAlign: 'left', cursor: 'pointer', color: 'var(--text-1)', font: 'var(--type-body)' }}>
            <span style={{ gridColumn: '1 / 2', textWrap: 'pretty' }}>{it.label}</span>
            <span style={{ gridColumn: '2 / 3', gridRow: '1 / 3', textAlign: 'right', font: 'var(--fw-bold) var(--fs-h3)/1 var(--font-sans)' }}>{it.value}</span>
            <span style={{ gridColumn: '1 / 2', height: 10, borderRadius: 999, background: 'var(--surface-sunken)', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: (it.value / max * 100) + '%', minWidth: it.value ? 10 : 0, borderRadius: 999, background: it.color || 'var(--action-primary)' }} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

  Object.assign(__ex, { BarList });
})();

/* dashboard/WeekStat */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus, EmptyState, Skeleton, ColorSwatch, ChassiText, VehicleCard, StageTimeline, HistoryList, ControlFields, StageStrip, BarList } = __ex;


function WeekStat({ label, value, previous, unit, goodWhen = 'up', onClick }) {
  const diff = value - previous;
  const up = diff > 0, same = diff === 0;
  const good = same ? null : (goodWhen === 'up' ? up : !up);
  const c = same ? 'var(--text-2)' : good ? 'var(--ok-fg)' : 'var(--danger-fg)';
  const El = onClick ? 'button' : 'div';
  return (
    <El type={onClick ? 'button' : undefined} onClick={onClick} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 16, textAlign: 'left', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', cursor: onClick ? 'pointer' : 'default', color: 'var(--text-1)', font: 'var(--type-body)' }}>
      <span style={{ fontWeight: 700 }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}><span style={{ font: 'var(--type-kpi)' }}>{value}</span>{unit ? <span style={{ color: 'var(--text-2)' }}>{unit}</span> : null}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: c, fontWeight: 700 }}>
        <Icon name={same ? 'equal' : up ? 'arrow-up' : 'arrow-down'} size={18} strokeWidth={2.5} />
        {same ? 'Igual à semana passada' : (up ? '+' : '−') + Math.abs(Math.round(diff * 10) / 10) + ' vs. semana passada (' + previous + ')'}
      </span>
    </El>
  );
}

  Object.assign(__ex, { WeekStat });
})();

/* dashboard/DeliveryRow */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus, EmptyState, Skeleton, ColorSwatch, ChassiText, VehicleCard, StageTimeline, HistoryList, ControlFields, StageStrip, BarList, WeekStat } = __ex;



const S = {
  pronto: ['var(--ok-bg)', 'var(--ok-fg)', 'circle-check', 'Pronto'],
  preparacao: ['var(--warn-bg)', 'var(--warn-fg)', 'wrench', 'Em preparação'],
  loja: ['var(--warn-bg)', 'var(--warn-fg)', 'warehouse', 'Na loja, sem preparo'],
  naochegou: ['var(--danger-bg)', 'var(--danger-fg)', 'truck', 'Ainda não chegou'],
  entregue: ['var(--surface-inverse)', 'var(--text-inverse)', 'key-round', 'Entregue']
};
function DeliveryRow({ hora, dia, modelo, cor, cliente, situacao = 'pronto', onClick }) {
  const s = S[situacao] || S.pronto;
  return (
    <button type="button" onClick={onClick} style={{ display: 'grid', gridTemplateColumns: '64px minmax(0,1fr)', gap: 12, alignItems: 'center', width: '100%', minHeight: 64, padding: '10px 4px', textAlign: 'left', border: 0, borderBottom: '1px solid var(--border-subtle)', background: 'transparent', cursor: 'pointer', color: 'var(--text-1)', font: 'var(--type-body)' }}>
      <span style={{ display: 'flex', flexDirection: 'column' }}><b style={{ font: 'var(--fw-bold) var(--fs-h3)/1.1 var(--font-sans)' }}>{hora}</b>{dia ? <span style={{ color: 'var(--text-2)', fontSize: 'var(--fs-label)' }}>{dia}</span> : null}</span>
      <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}><ColorSwatch cor={cor} size={14} />{modelo} {cor ? cor.charAt(0) + cor.slice(1).toLowerCase() : ''}</span>
          <span style={{ color: 'var(--text-2)' }}>{cliente}</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 30, padding: '0 10px', borderRadius: 'var(--radius-sm)', background: s[0], color: s[1], font: 'var(--fw-bold) var(--fs-label)/1 var(--font-sans)', whiteSpace: 'nowrap' }}><Icon name={s[2]} size={16} strokeWidth={2.25} />{s[3]}</span>
      </span>
    </button>
  );
}

  Object.assign(__ex, { DeliveryRow });
})();

/* navigation/AppHeader */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus, EmptyState, Skeleton, ColorSwatch, ChassiText, VehicleCard, StageTimeline, HistoryList, ControlFields, StageStrip, BarList, WeekStat, DeliveryRow } = __ex;


function AppHeader({ mobile, title = 'Painel de Veículos', subtitle = 'Vitória Motors BYD · Vila Velha', back, onBack, right }) {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 8, minHeight: mobile ? 60 : 72, padding: mobile ? '0 8px 0 16px' : '0 32px', background: 'var(--surface-inverse)', color: 'var(--text-inverse)' }}>
      {back ? <button type="button" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 48, marginLeft: -8, padding: '0 8px', border: 0, background: 'transparent', color: 'inherit', font: 'var(--type-label)', cursor: 'pointer' }}><Icon name="chevron-left" size={24} />{back}</button> : null}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {back && mobile ? null : <span style={{ font: 'var(--fw-bold) ' + (mobile ? '20px' : '22px') + '/1.15 var(--font-sans)', letterSpacing: '-.005em' }}>{title}</span>}
        {!mobile && subtitle ? <span style={{ font: 'var(--fw-regular) var(--fs-label)/1.3 var(--font-sans)', color: 'var(--slate-300)' }}>{subtitle}</span> : null}
      </div>
      {right || null}
    </header>
  );
}

  Object.assign(__ex, { AppHeader });
})();

/* navigation/BottomNav */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus, EmptyState, Skeleton, ColorSwatch, ChassiText, VehicleCard, StageTimeline, HistoryList, ControlFields, StageStrip, BarList, WeekStat, DeliveryRow, AppHeader } = __ex;


const NAV_MOBILE = [
  { id: 'visao', label: 'Visão geral', icon: 'layout-dashboard' },
  { id: 'buscar', label: 'Buscar', icon: 'search' },
  { id: 'alertas', label: 'Alertas', icon: 'bell' },
  { id: 'conta', label: 'Conta', icon: 'circle-user-round' }
];
function BottomNav({ items = NAV_MOBILE, active, onChange, badges = {} }) {
  return (
    <nav style={{ position: 'sticky', bottom: 0, zIndex: 10, display: 'grid', gridTemplateColumns: 'repeat(' + items.length + ', minmax(0,1fr))', minHeight: 'var(--bottom-nav-h)', paddingBottom: 'env(safe-area-inset-bottom)', background: 'var(--surface-card)', boxShadow: 'var(--shadow-bar)' }}>
      {items.map(function (it) {
        const on = it.id === active;
        return (
          <button key={it.id} type="button" aria-current={on ? 'page' : undefined} onClick={function () { onChange && onChange(it.id); }}
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, border: 0, background: 'transparent', color: on ? 'var(--text-accent)' : 'var(--text-2)', font: (on ? 'var(--fw-bold)' : 'var(--fw-regular)') + ' 14px/1.1 var(--font-sans)', cursor: 'pointer' }}>
            {on ? <span style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 3, borderRadius: '0 0 3px 3px', background: 'var(--action-primary)' }} /> : null}
            <span style={{ position: 'relative' }}><Icon name={it.icon} size={24} strokeWidth={on ? 2.5 : 2} />
              {badges[it.id] ? <span style={{ position: 'absolute', top: -6, right: -12, minWidth: 20, height: 20, padding: '0 5px', borderRadius: 999, background: 'var(--danger-solid)', color: '#fff', font: 'var(--fw-bold) 12px/20px var(--font-sans)', textAlign: 'center' }}>{badges[it.id]}</span> : null}
            </span>
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}

  Object.assign(__ex, { NAV_MOBILE, BottomNav });
})();

/* navigation/Sidebar */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus, EmptyState, Skeleton, ColorSwatch, ChassiText, VehicleCard, StageTimeline, HistoryList, ControlFields, StageStrip, BarList, WeekStat, DeliveryRow, AppHeader, NAV_MOBILE, BottomNav } = __ex;


const NAV_DESKTOP = [
  { id: 'visao', label: 'Visão geral', icon: 'layout-dashboard' },
  { id: 'buscar', label: 'Buscar', icon: 'search' },
  { id: 'lista', label: 'Lista de carros', icon: 'list' },
  { id: 'alertas', label: 'Alertas', icon: 'bell' },
  { id: 'pendencias', label: 'Pendências', icon: 'file-warning', admin: true },
  { id: 'usuarios', label: 'Usuários', icon: 'users', admin: true }
];
function Sidebar({ items = NAV_DESKTOP, active, onChange, isAdmin, badges = {}, user, footer }) {
  const list = items.filter(function (i) { return !i.admin || isAdmin; });
  function Item(it) {
    const on = it.id === active;
    return (
      <button key={it.id} type="button" aria-current={on ? 'page' : undefined} onClick={function () { onChange && onChange(it.id); }}
        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 48, padding: '0 14px', border: 0, borderRadius: 'var(--radius-md)', background: on ? 'var(--surface-accent-soft)' : 'transparent', color: on ? 'var(--text-accent)' : 'var(--text-1)', font: (on ? 'var(--fw-bold)' : 'var(--fw-regular)') + ' var(--fs-body)/1.2 var(--font-sans)', cursor: 'pointer', textAlign: 'left' }}>
        <Icon name={it.icon} size={22} strokeWidth={on ? 2.5 : 2} />
        <span style={{ flex: 1 }}>{it.label}</span>
        {badges[it.id] ? <span style={{ minWidth: 24, height: 24, padding: '0 7px', borderRadius: 999, background: 'var(--danger-solid)', color: '#fff', font: 'var(--fw-bold) 13px/24px var(--font-sans)', textAlign: 'center' }}>{badges[it.id]}</span> : null}
      </button>
    );
  }
  const main = list.filter(function (i) { return !i.admin; }), adm = list.filter(function (i) { return i.admin; });
  return (
    <aside style={{ width: 'var(--sidebar-w)', flex: 'none', display: 'flex', flexDirection: 'column', gap: 4, padding: '20px 12px', background: 'var(--surface-card)', borderRight: '1px solid var(--border-subtle)', minHeight: '100%' }}>
      {main.map(Item)}
      {adm.length ? <div style={{ margin: '16px 14px 6px', font: 'var(--type-label)', letterSpacing: 'var(--ls-caps)', textTransform: 'uppercase', color: 'var(--text-2)' }}>Gestão</div> : null}
      {adm.map(Item)}
      <div style={{ flex: 1 }} />
      {Item({ id: 'conta', label: user ? user : 'Minha conta', icon: 'circle-user-round' })}
      {footer || null}
    </aside>
  );
}

  Object.assign(__ex, { NAV_DESKTOP, Sidebar });
})();

/* navigation/FilterChips */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus, EmptyState, Skeleton, ColorSwatch, ChassiText, VehicleCard, StageTimeline, HistoryList, ControlFields, StageStrip, BarList, WeekStat, DeliveryRow, AppHeader, NAV_MOBILE, BottomNav, NAV_DESKTOP, Sidebar } = __ex;


function FilterChips({ options = [], value, onChange }) {
  return (
    <div role="group" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
      {options.map(function (o) {
        const on = o.id === value;
        return (
          <button key={o.id} type="button" aria-pressed={on} onClick={function () { onChange && onChange(on ? null : o.id); }}
            style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 'var(--touch-min)', padding: '0 16px', borderRadius: 'var(--radius-pill)', border: '1px solid ' + (on ? 'var(--action-primary)' : 'var(--border-strong)'), background: on ? 'var(--action-primary)' : 'var(--surface-card)', color: on ? 'var(--text-inverse)' : 'var(--text-1)', font: 'var(--fw-bold) var(--fs-body)/1 var(--font-sans)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {o.icon ? <Icon name={on ? 'check' : o.icon} size={18} /> : null}{o.label}{o.count != null ? <span style={{ opacity: .8, fontWeight: 400 }}>{o.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

  Object.assign(__ex, { FilterChips });
})();

/* overlay/Dialog */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus, EmptyState, Skeleton, ColorSwatch, ChassiText, VehicleCard, StageTimeline, HistoryList, ControlFields, StageStrip, BarList, WeekStat, DeliveryRow, AppHeader, NAV_MOBILE, BottomNav, NAV_DESKTOP, Sidebar, FilterChips } = __ex;


function Dialog({ open = true, title, icon, tone = 'neutral', children, actions, onClose, mobile, inline }) {
  if (!open) return null;
  const c = tone === 'danger' ? 'var(--danger-fg)' : tone === 'ok' ? 'var(--ok-fg)' : 'var(--text-accent)';
  const bg = tone === 'danger' ? 'var(--danger-bg)' : tone === 'ok' ? 'var(--ok-bg)' : 'var(--surface-accent-soft)';
  const box = (
    <div role="dialog" aria-modal="true" style={{ width: '100%', maxWidth: mobile ? 'none' : 480, maxHeight: '90vh', overflow: 'auto', background: 'var(--surface-card)', borderRadius: mobile ? 'var(--radius-xl) var(--radius-xl) 0 0' : 'var(--radius-xl)', boxShadow: 'var(--shadow-overlay)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, animation: 'pv-slide-up var(--dur-slow) var(--ease-out)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {icon ? <span style={{ width: 44, height: 44, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', background: bg, color: c }}><Icon name={icon} size={22} /></span> : null}
        <h2 style={{ flex: 1, margin: 0, paddingTop: icon ? 8 : 0, font: 'var(--type-h3)', textWrap: 'pretty' }}>{title}</h2>
        {onClose ? <button type="button" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 40, border: 0, background: 'transparent', color: 'var(--text-2)', font: 'var(--type-label)', cursor: 'pointer' }}><Icon name="x" size={18} />Fechar</button> : null}
      </div>
      {children ? <div style={{ color: 'var(--text-1)', display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div> : null}
      {actions ? <div style={{ display: 'flex', flexDirection: mobile ? 'column-reverse' : 'row', justifyContent: 'flex-end', gap: 8 }}>{actions}</div> : null}
    </div>
  );
  if (inline) return box;
  return <div onClick={function (e) { if (e.target === e.currentTarget && onClose) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: mobile ? 'flex-end' : 'center', justifyContent: 'center', padding: mobile ? 0 : 24, background: 'var(--surface-overlay)' }}>{box}</div>;
}

  Object.assign(__ex, { Dialog });
})();

/* overlay/ActionBar */
(function () {
  const { Icon, Spinner, Button, Panel, TextField, SearchField, Select, Switch, OptionList, ETAPAS, StageBadge, Tag, AlertRow, Banner, Toast, SyncStatus, EmptyState, Skeleton, ColorSwatch, ChassiText, VehicleCard, StageTimeline, HistoryList, ControlFields, StageStrip, BarList, WeekStat, DeliveryRow, AppHeader, NAV_MOBILE, BottomNav, NAV_DESKTOP, Sidebar, FilterChips, Dialog } = __ex;

function ActionBar({ children, hint, sticky = true }) {
  return (
    <div style={{ position: sticky ? 'sticky' : 'relative', bottom: 0, zIndex: 9, display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', background: 'var(--surface-card)', boxShadow: 'var(--shadow-bar)' }}>
      {hint ? <div style={{ color: 'var(--text-2)', fontSize: 'var(--fs-label)', textAlign: 'center' }}>{hint}</div> : null}
      {children}
    </div>
  );
}

  Object.assign(__ex, { ActionBar });
})();
})(window.PainelDeVeCulosVMBYDDesignSystem_23295c);
