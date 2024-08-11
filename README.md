<img src="https://gettiq.com/static_mail/logo_with_text.png" alt="tiq" width="160" />

# tiq permissioner

With [tiq](https://www.gettiq.com/) you can collect augmented feedback and bug reports from testers and stakeholders directly on your web app. Transform feedback into issues with one-click and deliver web apps faster.

The tiq permissioner is a small but powerful TypeScript library for building complex permission systems in your applications. The idea is to define permissions for ressources and potential checks for them in one place and then use them throughout your application.
It is designed to be framework-agnostic but provide framework-specific abstractions to make the integration as easy as possible.
This repository contains the source code for the `@tiq/permisioner` library as well as the framework-specific abstractions of it (e.g. `@tiq/permissioner-react`).

## Installation

To install the vanilla permissioner library:

```bash
pnpm install @tiq/permissioner
```

To install the React permissioner:

```bash
pnpm install @tiq/permissioner-react
```

## Documentation

### tiq permissioner

The vanilla permissioner allows you to use the permissioner in any JavaScript or TypeScript project. It lets you define permissions and potential checks for them in one place and then use them throughout your application.

For the documentation of the permissioner, please refer to the [README](https://www.npmjs.com/package/@tiq/permissioner) of the `@tiq/permissioner` package.

### tiq permissioner React

The React permissioner provides a React hook to use the permissioner in your React application. It is designed to be as easy to use as possible and provides a simple API to interact with the permissioner.

For the documentation of the permissioner, please refer to the [README](https://www.npmjs.com/package/@tiq/permissioner-react) of the `@tiq/permissioner-react` package.
