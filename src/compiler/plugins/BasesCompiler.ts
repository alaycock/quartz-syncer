import { App, TFile } from "obsidian";
import { TCompilerStep } from "src/compiler/SyncerPageCompiler";

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

		if (matches) {
			for (const match of matches) {
				// Get the file reference
				const file = this.app.vault.getAbstractFileByPath(
					_file.getPath(),
				);

				if (file instanceof TFile) {
					// Hacky: Open the file to create the view
					const leaf = this.app.workspace.getLeaf(true);
					await leaf.openFile(file);
					await leaf.loadIfDeferred();
					const view = leaf.view;

					// Find the bases plugin in the view's children
					const viewWithChildren = view as unknown as {
						_children?: unknown[];
					};

					// TODO: Fix types
					const baseView = this.findBaseView(
						viewWithChildren._children || [],
					) as any;

					// Hacky: Wait for the view to be ready, `_loaded` isn't trustworthy
					const sleep = new Promise<void>((resolve) => {
						setTimeout(() => resolve(), 100);
					});
					await sleep;

					if (baseView && baseView.linkText === match[1]) {
						// Hacky: drill the private props to export markdown
						const markdownTable = baseView._children[0]._children[4]
							.exportTable()
							.toMarkdown();

						text = text.replace(match[0], markdownTable);
					}

					leaf.detach();
				}
			}
		}

		return text;
	};

	// Recursively inspect the _children array for "bases" views
	findBaseView = (children: unknown[]): unknown => {
		for (const child of children) {
			// Check if this child is a "base" view
			if (
				child &&
				typeof child === "object" &&
				"plugin" in child &&
				child.plugin &&
				typeof child.plugin === "object" &&
				"id" in child.plugin &&
				child.plugin.id === "bases"
			) {
				return child;
			}

			// Recursively check children, if they exist
			if (
				child &&
				typeof child === "object" &&
				"_children" in child &&
				child._children &&
				Array.isArray(child._children)
			) {
				const found = this.findBaseView(child._children);

				if (found) return found;
			}
		}

		return null;
	};
}
