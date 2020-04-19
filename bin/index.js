#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer = require("inquirer");
const chalk = require("chalk");
const path = require("path");
const os = require("os");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const { log } = console;
const { stringify, parse } = JSON;
const npc_path = path.join(os.homedir(), 'neopro.config.json');
const padding = (i) => log('\n'.repeat(i ? i : 1));
const npc_default = {
    'Svelte basic': 'npx degit sveltejs/template {{ name }}',
    'Svelte with Tailwindcss': 'npx degit J-theta/svelte-tailwindcss {{ name }}'
};
async function init() {
    let config;
    try {
        config = await getConfigs();
    }
    catch (e) {
        await updateConfig(npc_default);
        config = npc_default;
    }
    ui(config);
}
async function ui(configs) {
    const aws = (await inquirer.prompt([
        {
            type: 'list',
            name: 'init',
            message: 'What you want to do?',
            choices: [
                'New project',
                'Add a template',
                'Delete template',
                new inquirer.Separator('---------------------------'),
                'Show configuration file',
                'Cancel'
            ]
        }
    ])).init;
    if (aws === 'New project')
        await newProject(configs);
    else if (aws === 'Show configuration file')
        showNpc();
    else if (aws === 'Add a template')
        await addTemplate();
    else if (aws === 'Delete template')
        await deleteTemplate(configs);
}
async function packageJson(appname) {
    let f_path, f;
    f_path = path.join(process.cwd() + '/' + appname, 'package.json');
    f = await fs_1.promises.readFile(f_path);
    const p = parse(f);
    p.name = appname.toLowerCase().replace(/\s+/g, '-');
    await fs_1.promises.writeFile(f_path, stringify(p, null, 4));
}
async function main() {
    await init();
}
async function newTemplate(name, github) {
    const config = await getConfigs();
    config[name] = `npx degit ${github} {{ name }}`;
    await updateConfig(config);
}
function showNpc() {
    if (process.platform === 'win32') {
        child_process_1.spawn('explorer', [npc_path]);
    }
    else if (process.platform === 'linux') {
        child_process_1.spawn('xdg-open', [npc_path]);
    }
    else if (process.platform === 'darwin') {
        child_process_1.spawn('open', [npc_path]);
    }
}
async function newProject(configs) {
    const choices = await inquirer.prompt([
        {
            type: 'list',
            name: 'templates',
            message: 'What template do you want to use?',
            choices: Object.keys(configs)
        },
        {
            type: 'input',
            message: 'What is the name of your app?',
            name: 'appname',
            default: () => 'my-app'
        }
    ]);
    const template = choices.templates;
    const appname = choices.appname;
    const cmd = configs[template].replace(/{{\sname\s}}/gi, `"${appname}"`);
    const loader = ['/ Creating  your app', '| Creating  your app', '\\ Creating  your app', '- Creating  your app'];
    var i = 4;
    var ui = new inquirer.ui.BottomBar({ bottomBar: loader[i % 4] });
    var interval = setInterval(() => ui.updateBottomBar(loader[i++ % 4]), 300);
    child_process_1.exec(cmd, async (err, stout, sterr) => {
        if (err)
            throw err;
        clearInterval(interval);
        padding();
        log(chalk.greenBright('Done!'));
        padding();
        log(`cd ${chalk.blueBright(appname)}`);
        log(`code .`);
        padding();
        if (cmd.includes('npx degit')) {
            try {
                await packageJson(appname);
            }
            catch (e) { }
        }
        process.exit();
    });
}
async function addTemplate() {
    var choices = await inquirer.prompt([
        {
            name: 'name',
            type: 'input',
            message: "What's the name of your template?"
        },
        {
            name: 'github',
            type: 'input',
            message: "What's the github URL of your template?"
        }
    ]);
    const { name, github } = choices;
    padding();
    if (name.trim() !== '' && github.trim() !== '') {
        await newTemplate(name, github);
        log(chalk `Your template was created {greenBright successfully!}`);
        process.exit();
    }
    else {
        log(chalk `{red You have to choose a valid name and URL.}`);
        process.exit();
    }
}
async function deleteTemplate(configs) {
    var anwers = (await inquirer.prompt([
        {
            type: 'checkbox',
            message: 'What templates do you want to delete?',
            name: 'templates',
            choices: Object.keys(configs)
        }
    ])).templates;
    padding();
    anwers.forEach(ans => {
        delete configs[ans];
        log(chalk `Sucessfully deleted {red ${ans}} template.`);
    });
    padding();
    updateConfig(configs);
}
async function getConfigs() {
    const config = await fs_1.promises.readFile(npc_path);
    //@ts-ignore
    return parse(config);
}
async function updateConfig(config) {
    await fs_1.promises.writeFile(npc_path, stringify(config, null, 2));
}
main();
