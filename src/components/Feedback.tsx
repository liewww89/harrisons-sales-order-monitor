import { WarningCircleIcon } from '@phosphor-icons/react/dist/icons/WarningCircle'

export function ErrorNotice({ title, message, retry, retryLabel = 'Retry' }: { title: string; message: string; retry: () => void; retryLabel?: string }) {
  return <div className="error-notice" role="alert">
    <WarningCircleIcon size={20} aria-hidden="true" />
    <div><h3>{title}</h3><p>{message}</p></div>
    <button className="button secondary" onClick={retry}>{retryLabel}</button>
  </div>
}

export function LoadingRows({ searching }: { searching: boolean }) {
  return <div className="loading-orders" role="status">
    <p>{searching ? 'Searching orders…' : 'Loading orders…'}</p>
    <div className="loading-grid" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <div className="loading-row" key={i}><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /></div>)}</div>
  </div>
}
