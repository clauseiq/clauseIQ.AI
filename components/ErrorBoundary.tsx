import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  // Fix: Explicitly declare the 'state' property as a class field.
  // This is typically redundant as 'state' is inherited from React.Component,
  // but addresses a specific TypeScript error where it might not be inferred correctly.
  public state: State = { hasError: false };

  // Fix: Explicitly declare the 'props' property as a readonly class field.
  // This is technically redundant as 'props' is inherited from React.Component,
  // but addresses a specific TypeScript error where it might not be inferred correctly.
  public readonly props: Props;

  constructor(props: Props) {
    super(props);
    // The original `this.state = { hasError: false };` initialization was here (line 16).
    // It has been moved to the class field declaration above to ensure the 'state' property
    // is explicitly declared and initialized at the class level, addressing the type error.
    // 'props' are implicitly handled by super(props) and React.Component.
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    // Fix: Access state and props directly after explicit declaration (lines 30, 57, 60, 69).
    // This leverages the class field declarations to resolve the reported errors.
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center p-6 font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-10 max-w-md w-full text-center shadow-xl">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Something went wrong</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              We encountered an unexpected error. Our team has been notified. Please try refreshing the page.
            </p>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Application
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
              >
                <Home className="h-4 w-4 mr-2" />
                Return Home
              </button>
            </div>
            {this.state.error && (
               <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-left">
                  <p className="text-xs font-mono text-slate-400 break-all bg-slate-50 dark:bg-slate-950 p-3 rounded-lg">
                    {this.state.error.toString()}
                  </p>
               </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}