/**
 * 全局错误边界组件
 * 捕获React组件树中的错误
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('React Error Boundary捕获错误:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="error-boundary">
                    <div className="error-icon">💥</div>
                    <h2 className="error-title">哎呀，出错了</h2>
                    <p className="error-message">
                        {this.state.error?.message || '未知错误'}
                    </p>

                    {import.meta.env.DEV && this.state.errorInfo && (
                        <details className="error-details">
                            <summary>错误详情（开发模式）</summary>
                            <pre className="error-stack">
                                {this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}

                    <div className="error-actions">
                        <button
                            className="error-btn error-btn-primary"
                            onClick={this.handleReset}
                        >
                            重试
                        </button>
                        <button
                            className="error-btn error-btn-secondary"
                            onClick={() => window.location.reload()}
                        >
                            刷新页面
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
