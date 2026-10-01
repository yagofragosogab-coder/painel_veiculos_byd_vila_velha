/* Shared helpers for the Painel UI kit. */
const DSNS = window.PainelDeVeCulosVMBYDDesignSystem_23295c;
const ds = window.dataService;

function useQuery(fn, deps) {
  const [state, setState] = React.useState({ loading: true, data: null, error: null });
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => ds.subscribe(() => setTick((t) => t + 1)), []);
  React.useEffect(() => {
    let alive = true;
    setState((s) => ({ loading: !s.data, data: s.data, error: null }));
    fn().then((data) => alive && setState({ loading: false, data, error: null }), (error) => alive && setState({ loading: false, data: null, error }));
    return () => { alive = false; };
  }, deps.concat([tick, window.__pvRetry || 0]));
  return state;
}

const corTxt = (c) => (c ? c.charAt(0) + c.slice(1).toLowerCase() : '');
const nomeCarro = (v) => v.modelo + ' ' + corTxt(v.cor);
const primeiroNome = (n) => String(n || '').split(' ')[0];
const entregaTxt = (v) => v.schedule && v.schedule.data_hora_entrega ? ds.DIAS[v.schedule.data_hora_entrega.getDay()] + ' ' + ds.fmtDia(v.schedule.data_hora_entrega) + ' ' + ds.fmtHora(v.schedule.data_hora_entrega) + ' · ' + v.schedule.cliente : null;

function PageTitle({ children, sub, right, mobile }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: mobile ? 16 : 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1 style={{ margin: 0, font: mobile ? 'var(--type-h2)' : 'var(--type-h1)' }}>{children}</h1>
        {sub ? <div style={{ color: 'var(--text-2)' }}>{sub}</div> : null}
      </div>
      {right || null}
    </div>
  );
}

function LoadError({ mobile }) {
  const { EmptyState, Button } = DSNS;
  return <EmptyState icon="cloud-off" tone="danger" title="Não conseguimos carregar agora" action={<Button icon="refresh-cw" onClick={() => { ds.sim.erroAoCarregar = false; window.__pvRetry = (window.__pvRetry || 0) + 1; window.dispatchEvent(new Event('pv-retry')); }}>Tentar de novo</Button>}>Pode ser a internet ou o sistema. Seus dados estão salvos.</EmptyState>;
}

function CardsSkeleton({ n = 3 }) {
  const { Skeleton } = DSNS;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{Array.from({ length: n }).map((_, i) => <div key={i} style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}><Skeleton width="50%" height={22} /><Skeleton width="70%" /><Skeleton width="40%" /></div>)}</div>;
}

Object.assign(window, { DSNS, ds, useQuery, corTxt, nomeCarro, primeiroNome, entregaTxt, PageTitle, LoadError, CardsSkeleton });
