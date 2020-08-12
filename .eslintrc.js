module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 11
    },
    "rules": {
        "no-var": "error",
        "semi": ["error", "always"],
        "quotes": ["error", "double"],
        "indent": ["error", 4],
        "linebreak-style": ["error", "unix"],
        "brace-style": [2, "1tbs", {"allowSingleLine": true}],
        "comma-spacing": [1, {"before": false, "after": true}]
    }
};
