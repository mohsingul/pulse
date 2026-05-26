import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[App] Render error:', error, info.componentStack);
  }

  private handleReload = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background text-foreground text-center gap-4">
        <p className="text-4xl">💗</p>
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          The app hit an error while loading. This often fixes itself after a refresh,
          especially after an update.
        </p>
        {this.state.message && (
          <p className="text-xs text-muted-foreground/80 font-mono break-all max-w-sm">
            {this.state.message}
          </p>
        )}
        <button
          type="button"
          onClick={this.handleReload}
          className="mt-2 px-6 py-3 rounded-full text-white font-semibold bg-gradient-to-r from-[#FB3094] via-[#A83FFF] to-[#2571FF]"
        >
          Reload app
        </button>
      </div>
    );
  }
}
