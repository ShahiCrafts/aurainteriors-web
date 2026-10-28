import { Component } from "react";

// FE-56 / FE-17 — shared error boundary.
// The fallback is deliberately static: it NEVER renders the caught error's
// message or stack (in any build), only an honest message with recovery
// affordances. The error is logged via console.error only.
// `resetKey`: when it changes, the error state is cleared so navigation to
// a new route re-renders the children instead of staying on the fallback.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, prevResetKey: props.resetKey };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.prevResetKey) {
      return { hasError: false, prevResetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-gray-500">
            This part of the page could not be displayed. Reloading usually
            fixes it.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              Reload
            </button>
            <a
              href="/"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
            >
              Go to Home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
