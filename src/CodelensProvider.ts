import * as vscode from 'vscode';
import { StopWatch } from "stopwatch-node";

interface Timer {
    [taskName: string]: StopWatch
}

/**
 * CodelensProvider
 */
export class CodelensProvider implements vscode.CodeLensProvider {

    private codeLenses: vscode.CodeLens[] = [];
    private regex: RegExp;
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;
    public timers: Timer = {};

    constructor() {
        this.regex = /^\[[x\s]??\] .* [0-9.]+[hm] (\| S:[0-9.]+[hm])??$/gm;

        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    private convertMilliSecsToMinutes(ms: number) {
        // return Math.floor(ms / 1000);
        return Math.floor(ms / 1000 / 60);
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        if (vscode.workspace.getConfiguration("sakutto-do").get("enable", true)) {
            this.codeLenses = [];
            const regex = new RegExp(this.regex);
            const text = document.getText();
            let matches;
            while ((matches = regex.exec(text)) !== null) {
                const line = document.lineAt(document.positionAt(matches.index).line);
                const indexOf = line.text.indexOf(matches[0]);
                const position = new vscode.Position(line.lineNumber, indexOf);
                const range = document.getWordRangeAtPosition(position, new RegExp(this.regex));

                const filterRegex = new RegExp(/^\[[x\s]??\] (.*) [0-9.]+[hm]/)
                const filterRegexMatches = filterRegex.exec(line.text);
                let taskName = '';
                if (filterRegexMatches !== null) {
                    taskName = filterRegexMatches[1];
                }

                let spentInfoRange = null;
                const spentInfoRegex = new RegExp(/\| S:[0-9.]+[hm]/);
                const spentInfoRegexMatches = spentInfoRegex.exec(line.text);
                if (spentInfoRegexMatches !== null && range != null) {
                    const spentInfoStartIndex = line.text.indexOf(spentInfoRegexMatches[0])
                    const spentInfoStartPos = new vscode.Position(range.start.line,spentInfoStartIndex);
                    const spentInfoEndPos = new vscode.Position(range.start.line,line.text.length);
                    spentInfoRange = new vscode.Range(spentInfoStartPos, spentInfoEndPos);
                }

                if (!Object.keys(this.timers).includes(taskName)) {
                    const sw = new StopWatch(taskName);
                    const timer = {
                        [taskName]: sw
                    };
                    Object.assign(this.timers, timer);
                }
                const totalTimeMinutes: number = this.convertMilliSecsToMinutes(this.timers[taskName].getTotalTime());
                console.log(`time of ${taskName} is ${totalTimeMinutes}`);
                // const codelensTitle: string = this.timers[taskName].isRunning() ? 'Stop' : 'Start';
                const codelensTitle = 'Start / Stop Timer'
                const command = {
                    command: "sakutto-do.action",
                    // title: 'Start/Stop Timer',
                    title: codelensTitle,
                    arguments: [taskName, this.timers, range, spentInfoRange]
                }
                if (range) {
                    this.codeLenses.push(new vscode.CodeLens(range, command));
                }
            }
            return this.codeLenses;
        }
        return [];
    }

    public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
        console.log('Resolver Fire...')
        if (vscode.workspace.getConfiguration("sakutto-do").get("enable", true)) {
            codeLens.command = {
                title: "Codelens provided by sample ",
                tooltip: "Tooltip provided by sample extension",
                command: "",
                arguments: ["hogehoge", true]
            };
            return codeLens;
        }
        return null;
    }
}
