import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Error Boundary component to catch JavaScript errors anywhere in the child component tree
 * and display a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Optional: send error to a logging service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle size={48} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Une erreur est survenue</h2>
            <p className="text-gray-600 mb-6">
              Nous sommes désolés, une erreur inattendue s'est produite. Veuillez réessayer ou contacter le support si le problème persiste.
            </p>
            <div className="text-left bg-gray-50 p-4 rounded-md mb-6 overflow-auto max-h-[200px] text-xs font-mono">
              <p className="text-red-600">{this.state.error && this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <details className="mt-2">
                  <summary className="text-gray-700 cursor-pointer">Détails techniques</summary>
                  <pre className="mt-2 text-gray-600 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors"
              >
                <RefreshCw size={16} />
                Réessayer
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
