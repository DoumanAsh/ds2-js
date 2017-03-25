module.exports = {
    "extends": ["eslint:recommended", "plugin:inferno/recommended"],
    "rules": {
        "semi": ["error", "always"],
        "no-console": [0],
        "valid-jsdoc": ["error"],
        "complexity": ["error", 10],
        "consistent-return": "error",
        "default-case": "error",
        "eqeqeq": "error",
        "no-use-before-define": "error",
        "max-depth": ["error", 5],
        "no-duplicate-imports": "error"
    },
    "env": {
        "browser": true,
        "es6": true
    },
    "parserOptions": {
        "ecmaVersion": 8,
        "sourceType": "module",
        "ecmaFeatures": {
            "modules": true,
            "jsx": true
        }
    }
}
