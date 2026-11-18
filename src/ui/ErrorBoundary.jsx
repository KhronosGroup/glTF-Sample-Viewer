import { Component } from "react";

/**
 * Catches errors thrown while rendering its subtree and shows a fallback instead
 * of letting the error unmount the whole React tree. Note that error boundaries
 * only catch errors from rendering, lifecycle methods, and constructors — not
 * from event handlers, async callbacks, or store logic.
 */
export class ErrorBoundary extends Component {
    state = { error: undefined };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        // Keep the diagnostic in the console so failures remain traceable.
        console.error("[ErrorBoundary]", error, info?.componentStack);
    }

    reset = () => this.setState({ error: undefined });

    render() {
        const { error } = this.state;
        if (error === undefined) {
            return this.props.children;
        }
        if (this.props.fallback !== undefined) {
            return this.props.fallback(error, this.reset);
        }
        return (
            <div className="flex flex-col gap-2 p-4">
                <p className="font-medium">Something went wrong.</p>
                <p className="text-ink-dim break-words text-sm">
                    {String(error?.message ?? error)}
                </p>
                <button
                    type="button"
                    onClick={this.reset}
                    className="bg-accent hover:bg-accent-hover self-start rounded px-3 py-1.5 text-sm font-medium text-ink-dim"
                >
                    Try again
                </button>
            </div>
        );
    }
}
