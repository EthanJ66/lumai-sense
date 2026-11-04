import { Component, ErrorInfo, ReactNode } from 'react';
import { Panel } from './Layout';
import { theme } from '../styles/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Panel title="System Error">
          <div style={{ padding: '20px', color: theme.colors.danger }}>
            <h2>Something went wrong.</h2>
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </details>
          </div>
        </Panel>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
