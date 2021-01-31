import { ExtensionContext, languages, commands, Disposable, workspace, window, Position, Range } from 'vscode';
import { CodelensProvider } from './CodelensProvider';
import { StopWatch } from "stopwatch-node";

interface Timer {
    [taskName: string]: StopWatch
}

const convertMilliSecsToMinutes = (ms: number) :number => {
    // return Math.floor(ms / 1000);
    return Math.floor(ms / 1000 / 60);
}

let disposables: Disposable[] = [];

export function activate(context: ExtensionContext) {
    const codelensProvider = new CodelensProvider();

    languages.registerCodeLensProvider("*", codelensProvider);

    commands.registerCommand("sakutto-do.enable", () => {
        workspace.getConfiguration("sakutto-do").update("enable", true, true);
    });

    commands.registerCommand("sakutto-do.disable", () => {
        workspace.getConfiguration("sakutto-do").update("enable", false, true);
    });

    commands.registerCommand("sakutto-do.action", async (taskName: string, timers: Timer, range: Range, spentInfoRange: Range) => {
        const lineLen = range.end.character;
        const sw = timers[taskName];
        if (sw.isRunning()) {
            sw.stop();
            console.log('stop!')
        } else {
            sw.start()
            console.log('start!')
        }

        if (!sw.isRunning()) {
            const spentTime = convertMilliSecsToMinutes(sw.getTotalTime());
            const spentTimeStr = `| S:${spentTime}h`
            const editor = window.activeTextEditor;
            if (editor) {
                editor.edit(editBuilder => {
                    if (spentInfoRange) {
                        editBuilder.replace(spentInfoRange, spentTimeStr)
                    } else {
                        editBuilder.insert(new Position(range.start.line, lineLen+1), spentTimeStr)
                    }
                })
            }
        }
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
    if (disposables) {
        disposables.forEach(item => item.dispose());
    }
    disposables = [];
}
