import { App, Editor, TFile, View, WorkspaceLeaf } from "obsidian";
import { TCompilerStep } from "src/compiler/SyncerPageCompiler";

interface PrivateView extends View {
	_children: PrivateView[];
	lastViewport: unknown;
	editor: Editor;
}

interface BaseView extends PrivateView {
	linkText: string;
}

interface TableView extends PrivateView {
	exportTable: () => { toMarkdown: () => string };
}

/**
 * TODO: JSDOC
 */
export class BasesCompiler {
	app: App;

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * TODO: JSDOC
	 */
	compile: TCompilerStep = (_file) => async (text) => {
		const baseRegex = /!\[\[(.+?)\]\]/g;
		const matches = text.matchAll(baseRegex);

		let file, leaf;
		let newText = text;

		for (const match of matches) {
			// Hacky: Open the file to render the table
			if (!leaf) {
				file = this.app.vault.getAbstractFileByPath(_file.getPath());

				if (!(file instanceof TFile)) {
					throw new Error("Could not open file");
				}

				leaf = this.app.workspace.getLeaf(true) as WorkspaceLeaf;
				await leaf.openFile(file);
			}

			const view = leaf.view as PrivateView;

			const textBeforeMatch = text.substring(0, match.index);
			const lineNumber = (textBeforeMatch.match(/\n/g) || []).length + 1;

			// Scroll to the table to render it
			view.editor.scrollIntoView(
				{
					from: { ch: 0, line: lineNumber },
					to: { ch: 0, line: lineNumber },
				},
				true,
			);

			const baseView = this.findBaseView(view._children || [], match[1]);

			if (!baseView) {
				throw new Error(`Base not found in current view: ${match[0]}`);
			}

			// Wait for the table to finish rendering
			await this.waitForCondition(
				() =>
					baseView?._children?.[0]?._children?.length >= 5 &&
					!!baseView?._children?.[0]?._children?.[4]?.lastViewport,
			);

			// Hacky: drill into the component structure and export the table to MD
			let markdownTable = (
				baseView._children[0]._children[4] as TableView
			)
				.exportTable()
				.toMarkdown();

			markdownTable = markdownTable
				.replace(/\|(\s)+false(\s)+\|/g, "|$1     $2|")
				.replace(/\|(\s)+true(\s)+\|/g, "|$1  ✅ $2|");

			newText = newText.replace(match[0], markdownTable);
		}

		leaf?.detach();

		return newText;
	};

	// Recursively inspect the _children array for "bases" views
	findBaseView = (
		children: (PrivateView | BaseView)[],
		linkText: string,
	): BaseView | null => {
		for (const child of children) {
			// Check if this child is a "base" view
			if (
				child &&
				typeof child === "object" &&
				"plugin" in child &&
				child.plugin &&
				typeof child.plugin === "object" &&
				"id" in child.plugin &&
				child.plugin.id === "bases" &&
				(child as BaseView).linkText === linkText
			) {
				return child as unknown as BaseView;
			}

			// Recursively check children, if they exist
			if (
				child &&
				typeof child === "object" &&
				"_children" in child &&
				child._children &&
				Array.isArray(child._children)
			) {
				const found = this.findBaseView(child._children, linkText);

				if (found) return found;
			}
		}

		return null;
	};

	waitForCondition = async (condition: () => boolean): Promise<void> => {
		const startTime = Date.now();
		const maxWaitTime = 1000;

		while (Date.now() - startTime < maxWaitTime) {
			if (condition()) {
				return;
			}

			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		throw new Error("Timeout waiting for condition");
	};
}
