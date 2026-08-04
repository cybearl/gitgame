import isPropValid from "@emotion/is-prop-valid"

/**
 * Decides whether a styled-components prop reaches the rendered element, dropping the
 * non-standard ones on plain tags, while leaving composite targets to filter their own.
 * @param prop The name of the prop about to be forwarded.
 * @param target The tag name or component the styled component renders.
 * @returns Whether the prop should be forwarded.
 */
export function shouldForwardStyledProp(prop: string, target: unknown): boolean {
    return typeof target === "string" ? isPropValid(prop) : true
}
