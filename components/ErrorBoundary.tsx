import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-900/20 border border-red-700 rounded-lg m-4 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Something went wrong.</h2>
          <p className="text-gray-300 mb-4">The application encountered an unexpected error.</p>
          <details className="text-left bg-black/30 p-4 rounded overflow-auto max-h-60 text-xs font-mono text-red-300">
            <summary className="cursor-pointer mb-2 font-bold">Error Details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
