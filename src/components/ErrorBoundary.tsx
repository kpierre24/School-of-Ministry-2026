import React, { ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Label shown in the fallback UI, e.g. "Attendance Tab" */
  label?: string;
  /** Optional callback when the user clicks "Try again" */
  onReset?: () => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary] Caught in "${this.props.label ?? 'component'}":`, error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const label = this.props.label ?? 'this section';

    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center min-h-[280px] gap-4 p-8 text-center rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 m-4 animate-fadeIn"
      >
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-base font-black text-rose-900 dark:text-rose-200">
            Something went wrong in {label}
          </h3>
          <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">
            An unexpected error occurred. The rest of the portal is still running.
          </p>
          {this.state.error?.message && (
            <p className="text-[11px] font-mono text-rose-600 dark:text-rose-500 bg-rose-100 dark:bg-rose-950/60 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 mt-2 break-all">
              {this.state.error.message}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={this.handleReset}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/20 active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }
}
