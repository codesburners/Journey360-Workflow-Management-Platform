import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        // Log to error reporting service in production
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
                    <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center">
                        {/* Icon */}
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-slate-900 mb-3">
                            Something went wrong
                        </h1>

                        {/* Description */}
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            An unexpected error occurred. Don't worry — your data is safe.
                            Try refreshing the page or go back to the home screen.
                        </p>

                        {/* Error details (collapsed) */}
                        {this.state.error && (
                            <details className="mb-8 text-left bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <summary className="text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-800 transition-colors">
                                    View error details
                                </summary>
                                <pre className="mt-3 text-xs text-red-600 overflow-auto max-h-32 whitespace-pre-wrap font-mono">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all active:scale-95"
                            >
                                <Home className="w-4 h-4" />
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
