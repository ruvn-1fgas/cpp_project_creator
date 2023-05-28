'use strict';

import * as vscode from 'vscode';
import * as os from 'os';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import fetch from 'node-fetch';

const baseUrl = 'https://raw.githubusercontent.com/ruvn-1fgas/cpp-project-creator/master';

const customTemplatesFolder = (() => {
    let e = vscode.extensions.getExtension('ruvn-1fgas.cpp-project-creator');
    if (!e) { return ''; }

    let dir = `${e.extensionPath}\\..\\custom_templates`;
    if (os.type() !== 'Windows_NT') {
        dir = `${e.extensionPath}/../custom_templates`;
    }

    if (!existsSync(dir)) {
        try {
            mkdirSync(dir);
            writeFileSync(`${dir}/files.json`, `{
    "templates": {
        "Example Custom Template": {
            "directories": [
                "ExampleDirectory"
            ],
            "blankFiles": [
                "HelloWorld.txt"
            ],
            "openFiles": [
                "HelloWorld.txt"
            ]
        }
    }
}`);
        } catch (err) {
            console.error(err);
        }
    }

    return dir;
})();

interface EasyProjectsJSON {
    version: string;
    directories?: string[];
    templates: {
        [templateName: string]: {
            directories?: [string];
            blankFiles?: [string];
            files?: { [from: string]: string };
            openFiles?: [string];
        };
    };
}


export function activate(context: vscode.ExtensionContext) {
    let createProjectCommand = vscode.commands.registerCommand('cpp-project-creator.createProject', createProject);

    let buildButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
    buildButton.command = 'workbench.action.tasks.build';
    buildButton.text = '⚙ Build';
    buildButton.tooltip = 'Build Project [Ctrl+F7]';
    buildButton.show();

    let buildAndRunButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
    buildAndRunButton.command = 'workbench.action.tasks.test';
    buildAndRunButton.text = '▶ Build & Run';
    buildAndRunButton.tooltip = 'Build & Run Project [F7]';
    buildAndRunButton.show();

    context.subscriptions.push(buildButton);
    context.subscriptions.push(buildAndRunButton);
    context.subscriptions.push(createProjectCommand);
}

export function deactivate() {
}

const createProject = async (local?: boolean) => {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('C++ Project Creator: Please open a folder first.');
        return;
    }
    let templates = [];

    try {
        let data;
        if (local) {
            const res = readFileSync(`${__dirname}/templates/project/files.json`);
            data = JSON.parse(res.toString());
        } else {
            const res = await fetch(`${baseUrl}/templates/project/files.json`);
            data = await res.json();
        }

        for (let tname in data.templates) { templates.push(tname); }

        const selected = await vscode.window.showQuickPick(templates);
        await selectFolderAndDownload(data, selected, local);
        vscode.workspace.getConfiguration('files').update('associations', { "*.tpp": "cpp" }, vscode.ConfigurationTarget.Workspace);
        vscode.workspace.getConfiguration('terminal.integrated.shell').update('windows', "cmd.exe", vscode.ConfigurationTarget.Workspace);
    } catch (error) {
        if (local) {
            vscode.window.showErrorMessage('C++ Project Creator: Could not load templates local.');
            vscode.window.showErrorMessage(`${error}`);

        } else {
            createProject(true);
        }
    }
};

const selectFolderAndDownload = async (files: EasyProjectsJSON, templateName: string | undefined, local?: boolean, custom?: boolean) => {
    if (!templateName || !vscode.workspace.workspaceFolders) { return; }

    if (vscode.workspace.workspaceFolders.length > 1) {
        try {
            const chosen = await vscode.window.showWorkspaceFolderPick();
            if (!chosen) { return; }
            let folder = chosen.uri;
            await downloadTemplate(files, templateName, folder.fsPath, local);
        } catch (err) {
            vscode.window.showErrorMessage(`C++ Project Creator error: ${err}`);
        }

    } else {
        downloadTemplate(files, templateName, vscode.workspace.workspaceFolders[0].uri.fsPath, local, custom);
    }
};

const downloadTemplate = async (files: EasyProjectsJSON, templateName: string, folder: string, local?: boolean, custom?: boolean) => {
    if (files.directories) {
        files.directories.forEach((dir: string) => {
            if (!existsSync(`${folder}/${dir}`)) {
                mkdirSync(`${folder}/${dir}`);
            }
        });
    }

    let directories = files.templates[templateName].directories;
    if (directories) {
        directories.forEach((dir: string) => {
            if (!existsSync(`${folder}/${dir}`)) {
                mkdirSync(`${folder}/${dir}`);
            }
        });
    }

    let blankFiles = files.templates[templateName].blankFiles;
    if (blankFiles) {
        blankFiles.forEach((file: string) => {
            if (!existsSync(`${folder}/${file}`)) {
                writeFileSync(`${folder}/${file}`, '');
            }
        });
    }

    let f = files.templates[templateName].files;
    if (f) {
        for (let file in f) {
            try {
                let data;
                if (local) {
                    if (custom) {
                        data = readFileSync(`${customTemplatesFolder}/${file}`).toString();
                    } else {
                        data = readFileSync(`${__dirname}/templates/project/${file}`).toString();
                    }
                } else {
                    const res = await fetch(`${baseUrl}/templates/project/${file}`);
                    data = await res.text();
                }

                writeFileSync(`${folder}/${f[file]}`, data);
            } catch (error) {
                if (local) {
                    vscode.window.showErrorMessage(`C++ Project Creator: Could not load '${file}' locally.\nError: ${error}`);
                } else {
                    vscode.window.showWarningMessage(`C++ Project Creator: Could not download '${file}' from GitHub, using local files.\nError: ${error}`);
                }
            }
        }
    }

    let openFiles = files.templates[templateName].openFiles;
    if (openFiles) {
        for (let file of openFiles) {
            if (existsSync(`${folder}/${file}`)) {
                vscode.workspace.openTextDocument(`${folder}/${file}`)
                    .then(doc => vscode.window.showTextDocument(doc, { preview: false }));
            }
        }
    }

    if (!existsSync(`${folder}/.vscode`)) {
        mkdirSync(`${folder}/.vscode`);
    }
    writeFileSync(`${folder}/.vscode/.dontdelete`, '');
};
