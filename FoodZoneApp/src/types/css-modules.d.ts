// Allow importing CSS modules on the web target (used by scaffold web components).
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
