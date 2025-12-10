import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    name?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ${this.props.name || 'component'}:`, error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-900 m-2">
                    <h3 className="font-bold">Something went wrong.</h3>
                    <p className="text-sm opacity-80 mb-2">
                        {this.props.name ? `Error in ${this.props.name}` : 'An unexpected error occurred.'}
                    </p>
                    <button
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm font-medium transition-colors"
                        onClick={() => this.setState({ hasError: false })}
                    >
                        Try Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
