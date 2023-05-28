'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const os = require("os");
const fs_1 = require("fs");
const node_fetch_1 = require("node-fetch");
const baseUrl = 'https://raw.githubusercontent.com/ruvn-1fgas/cpp-project-creator/master';
const customTemplatesFolder = (() => {
    let e = vscode.extensions.getExtension('ruvn-1fgas.cpp-project-creator');
    if (!e) {
        return '';
    }
    let dir = `${e.extensionPath}\\..\\custom_templates`;
    if (os.type() !== 'Windows_NT') {
        dir = `${e.extensionPath}/../custom_templates`;
    }
    if (!fs_1.existsSync(dir)) {
        try {
            fs_1.mkdirSync(dir);
            fs_1.writeFileSync(`${dir}/files.json`, `{
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
        }
        catch (err) {
            console.error(err);
        }
    }
    return dir;
})();
function activate(context) {
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
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
const createProject = (local) => __awaiter(void 0, void 0, void 0, function* () {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('C++ Project Creator: Please open a folder first.');
        return;
    }
    let templates = [];
    try {
        let data;
        if (local) {
            const res = fs_1.readFileSync(`${__dirname}/templates/project/files.json`);
            data = JSON.parse(res.toString());
        }
        else {
            const res = yield node_fetch_1.default(`${baseUrl}/templates/project/files.json`);
            data = yield res.json();
        }
        for (let tname in data.templates) {
            templates.push(tname);
        }
        const selected = yield vscode.window.showQuickPick(templates);
        yield selectFolderAndDownload(data, selected, local);
        vscode.workspace.getConfiguration('files').update('associations', { "*.tpp": "cpp" }, vscode.ConfigurationTarget.Workspace);
        vscode.workspace.getConfiguration('terminal.integrated.shell').update('windows', "cmd.exe", vscode.ConfigurationTarget.Workspace);
    }
    catch (error) {
        if (local) {
            vscode.window.showErrorMessage('C++ Project Creator: Could not load templates local.');
            vscode.window.showErrorMessage(`${error}`);
        }
        else {
            createProject(true);
        }
    }
});
const selectFolderAndDownload = (files, templateName, local, custom) => __awaiter(void 0, void 0, void 0, function* () {
    if (!templateName || !vscode.workspace.workspaceFolders) {
        return;
    }
    if (vscode.workspace.workspaceFolders.length > 1) {
        try {
            const chosen = yield vscode.window.showWorkspaceFolderPick();
            if (!chosen) {
                return;
            }
            let folder = chosen.uri;
            yield downloadTemplate(files, templateName, folder.fsPath, local);
        }
        catch (err) {
            vscode.window.showErrorMessage(`C++ Project Creator error: ${err}`);
        }
    }
    else {
        downloadTemplate(files, templateName, vscode.workspace.workspaceFolders[0].uri.fsPath, local, custom);
    }
});
const downloadTemplate = (files, templateName, folder, local, custom) => __awaiter(void 0, void 0, void 0, function* () {
    if (files.directories) {
        files.directories.forEach((dir) => {
            if (!fs_1.existsSync(`${folder}/${dir}`)) {
                fs_1.mkdirSync(`${folder}/${dir}`);
            }
        });
    }
    let directories = files.templates[templateName].directories;
    if (directories) {
        directories.forEach((dir) => {
            if (!fs_1.existsSync(`${folder}/${dir}`)) {
                fs_1.mkdirSync(`${folder}/${dir}`);
            }
        });
    }
    let blankFiles = files.templates[templateName].blankFiles;
    if (blankFiles) {
        blankFiles.forEach((file) => {
            if (!fs_1.existsSync(`${folder}/${file}`)) {
                fs_1.writeFileSync(`${folder}/${file}`, '');
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
                        data = fs_1.readFileSync(`${customTemplatesFolder}/${file}`).toString();
                    }
                    else {
                        data = fs_1.readFileSync(`${__dirname}/templates/project/${file}`).toString();
                    }
                }
                else {
                    const res = yield node_fetch_1.default(`${baseUrl}/templates/project/${file}`);
                    data = yield res.text();
                }
                fs_1.writeFileSync(`${folder}/${f[file]}`, data);
            }
            catch (error) {
                if (local) {
                    vscode.window.showErrorMessage(`C++ Project Creator: Could not load '${file}' locally.\nError: ${error}`);
                }
                else {
                    vscode.window.showWarningMessage(`C++ Project Creator: Could not download '${file}' from GitHub, using local files.\nError: ${error}`);
                }
            }
        }
    }
    let openFiles = files.templates[templateName].openFiles;
    if (openFiles) {
        for (let file of openFiles) {
            if (fs_1.existsSync(`${folder}/${file}`)) {
                vscode.workspace.openTextDocument(`${folder}/${file}`)
                    .then(doc => vscode.window.showTextDocument(doc, { preview: false }));
            }
        }
    }
    if (!fs_1.existsSync(`${folder}/.vscode`)) {
        fs_1.mkdirSync(`${folder}/.vscode`);
    }
    fs_1.writeFileSync(`${folder}/.vscode/.dontdelete`, '');
});
//# sourceMappingURL=extension.js.map