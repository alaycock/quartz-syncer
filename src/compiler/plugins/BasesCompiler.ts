import { App, TFile, View } from "obsidian";
import { TCompilerStep } from "src/compiler/SyncerPageCompiler";

interface PrivateView extends View {
	_children: PrivateView[];
}

interface BaseView extends PrivateView {
	linkText: string;
}

interface HackyBaseView extends PrivateView {
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
					const view = leaf.view as PrivateView;

					const baseView = this.findBaseView(view._children || []);

					if (!baseView) {
						throw new Error(`Base cannot be found: ${match[0]}`);
					}

					await this.waitForChildren(baseView);

					if (baseView && baseView.linkText === match[1]) {
						// Hacky: drill the private props to export markdown
						const markdownTable = (
							baseView._children[0]._children[4] as HackyBaseView
						)
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
	findBaseView = (children: PrivateView[]): BaseView | null => {
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
				const found = this.findBaseView(child._children);

				if (found) return found;
			}
		}

		return null;
	};

	waitForChildren = async (baseView: BaseView): Promise<void> => {
		const startTime = Date.now();
		const maxWaitTime = 300; // 300ms timeout

		while (Date.now() - startTime < maxWaitTime) {
			if (baseView?._children?.[0]?._children?.length >= 4) {
				return;
			}

			await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay between checks
		}

		throw new Error("Timeout waiting for base view children to be ready");
	};
}
