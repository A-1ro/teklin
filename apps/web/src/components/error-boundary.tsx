import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-4">
          <div className="w-full max-w-md text-center">
            <p className="text-5xl font-bold text-ink">Oops</p>
            <p className="mt-4 text-base text-ink-2">
              予期しないエラーが発生しました。
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = "/dashboard";
              }}
              className="mt-8 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal/90 active:bg-teal"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
