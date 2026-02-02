import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <p className="text-sm text-gray-500">페이지를 불러오는 중 오류가 발생했습니다.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="rounded-lg bg-[#03C75A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#02b351]"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
