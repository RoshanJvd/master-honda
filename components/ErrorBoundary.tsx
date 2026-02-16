
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger } from '../services/logger.ts';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("Global Error Boundary caught an error", { error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 text-center border border-red-100">
            <div className="w-20 h-20 bg-red-50 text-honda-red rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
              <AlertTriangle size={40} />
            </div>
            <h1 className="text-3xl font-outfit font-bold text-honda-dark mb-4">System Interruption</h1>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Master Honda encountered a critical runtime error. All operations have been paused to protect data integrity.
            </p>
            <div className="bg-gray-50 p-4 rounded-2xl mb-8 text-left">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Error Diagnostic</p>
              <p className="text-xs font-mono text-red-600 break-words">{this.state.error?.message || "Unknown Exception"}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-honda-red text-white rounded-2xl font-bold shadow-lg shadow-honda-red/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
              >
                <RefreshCw size={18} /> Restart Terminal
              </button>
              <button 
                onClick={this.handleReset}
                className="w-full py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Home size={18} /> Force Reset to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Fix: Access children via this.props
    return this.props.children;
  }
}

export default ErrorBoundary;
