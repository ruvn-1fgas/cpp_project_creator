# CPP Project Creator
  CPP Project Creator is a Visual Studio Code extension that allows you to easily create C++ projects with a build file and correct project structure. It simplifies the process of setting up a new C++ project by automating the creation of the necessary files and directories.

## Building and Installation

1. Clone the repository: `git clone https://github.com/ruvn-1fgas/cpp_project_creator.git`
2. Install dependencies: `npm install`
3. Run the build package task: `vsce package`
4. Install the extension: `code --install-extension cpp-project-creator-0.9.0.vsix` or use Ctrl+Shift+P and select `Extensions: Install from VSIX...`

## Usage

1. Open the folder where you want to create the project.
2. Press Ctrl+Shift+P and select `Create C++ Project`.
3. Choose g++ option.

## Features

- Creates a `src` directory with a `main.cpp` file inside.
- Creates a `build.cmd` file that builds the project.
- Creates a correct tasks and launch options in `.vscode` directory.

## Requirements

- Windows
- Visual Studio Code
- g++ compiler

## Troubleshooting

If you encounter any issues while using this extension, please follow these steps to report them:

1. Search the [existing issues](https://github.com/ruvn-1fgas/cpp_project_creator/issues) to see if someone else has already reported the same issue.
2. If you can't find a solution, create a new issue by clicking on the "New Issue" button in the [issue panel](https://github.com/ruvn-1fgas/cpp_project_creator/issues).
3. Provide a clear and concise title and description of the issue, including any error messages or steps to reproduce the issue.
4. Add any relevant labels or assignees to the issue.
5. Submit the issue and wait for a response from the project maintainers.

If you have any issues with GDB, make sure that you have completed the following steps:

1. Win+R -> intl.cpl
2. Administrative tab
3. Change system locale
4. Enable Beta: Use Unicode UTF-8 for worldwide language support
5. Restart PC