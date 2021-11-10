# Symmetric Shadowcasting

This is the source behind albertford.com/shadowcasting. 

## Scripts

- `test` is copied from a different project where I use an alternate webpack configuration to run integration/unit tests. This project doesn't have tests.
- `build` transpiles and bundles the typescript. The resulting javascript and accompaning static files end up in `./dist`.
- `minify-*` minifies files after they have been built.

## Dependencies

This project has no runtime dependencies. I would appreciate a third party syntax highlighter, but I haven't found any powerful enough to meet the needs of this project (linked function names, highlighted functions in dot position).

## Dev dependencies

- `@typescript-eslint/eslint-plugin` - a plugin for eslint giving it rules for linting typescript.
- `@typescript-eslint/parser` - the base parser used by eslint to understand typescript. It doesn't contain any linting rules on its own.
- `clean-css-cli` - a cli tool for minifying css.
- `clean-webpack-plugin` - deletes old builds so that `./dist` does not get polluted.
- `copy-webpack-plugin` - copies static files from `./static` to `./dist`. This isn't super idiomatic webpack. Normally, each type of file should get handled by its own plugin. This way is simpler and removes layers of indirection, and fits better with my hand-crafted html/css.
- `eslint` - enforces consistent code style.
- `html-minifier` - a cli tool for minifying html.
- `html-webpack-plugin` - (unused) plugin for building html files. Use this instead of `copy-webpack-plugin` if you need to do something fancy.
- `ts-loader` - a loader used by webpack to compile the typescript.
- `typescript` - typescript compiler. Local instead of global to keep track of the compiler's version.
- `uglify-js` - a cli tool for minifying js.
- `webpack` - javasript's Yggdrasil.
- `webpack-cli` - the cli for webpack.
- `webpack-dev-server` - a local server used to view the webpage locally during development.
