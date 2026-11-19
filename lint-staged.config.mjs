export default {
  '*.{ts,tsx,js,mjs}': ['oxlint --fix', 'oxfmt --write'],
  '*.{json,css,md,yaml,yml}': ['oxfmt --write']
}
