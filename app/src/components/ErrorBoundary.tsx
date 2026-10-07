import { Component, type ErrorInfo, type ReactNode } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  error?: Error;
}

/**
 * Keeps one failure from emptying the window: React takes the whole tree down when a render throws.
 * Shows what failed and a way back, so that the screen is never just black.
 */
class Boundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    const { t, children } = this.props;
    if (!error) return children;
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex max-w-lg flex-col gap-3 rounded-panel bg-surface p-6">
          <h1 className="text-base font-semibold">{t('crash.title')}</h1>
          <p className="text-muted">{t('crash.body')}</p>
          <code className="rounded-inner bg-bg p-3 font-mono break-all">{error.message}</code>
          <button type="button" onClick={() => window.location.reload()} className="h-control self-start rounded-control bg-primary px-3 text-primary-fg hover:bg-primary-hover">
            {t('crash.reload')}
          </button>
        </div>
      </div>
    );
  }
}

export const ErrorBoundary = withTranslation()(Boundary);
