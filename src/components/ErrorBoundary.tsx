import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error | null };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // you can forward errors to a logging service here
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20 }}>
          <h2>Ha ocurrido un error en el componente.</h2>
          <pre style={{ whiteSpace: "pre-wrap", color: "red" }}>
            {String(this.state.error)}
          </pre>
        </div>
      );
    }
    // Return children as a React node; avoid referencing the JSX namespace which may be
    // missing if TypeScript react types are not installed in the environment.
    return this.props.children as React.ReactNode;
  }
}
