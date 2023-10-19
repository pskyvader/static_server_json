const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const baseFolderPath = "C:\\Users\\pskyv\\Documents\\pico_curtains\\";
const excludedExtensions = [".gitignore", ".conf", ".md", ".micropico"]; // Add more extensions as needed

function isExcludedFile(file) {
	const fileName = path.basename(file);
	const extension = path.extname(file).toLowerCase();

	const excludedFiles = [".gitignore", "LICENSE", ".micropico"]; // Add more files as needed
	const excludedFolders = [".git", ".vscode","components/esp/__pycache__","components/updater/__pycache__"]; // Add more folders as needed

	return (
		excludedFiles.includes(fileName) ||
		excludedFolders.includes(fileName) ||
		excludedExtensions.includes(extension)
	);
}

function getFilesRecursive(folderPath, baseURL) {
	let files = [];
	const entries = fs.readdirSync(folderPath, { withFileTypes: true });

	entries.forEach((entry) => {
		const fullPath = path.join(folderPath, entry.name);

		if (entry.isFile()) {
			if (!isExcludedFile(fullPath)) {
				const relativePath = path
					.relative(baseFolderPath, fullPath)
					.replace(/\\/g, "/"); // Replace backslashes with forward slashes
				// const fileURL = new URL(relativePath, baseURL).href;
				files.push(relativePath);
			}
		} else if (entry.isDirectory()) {
			if (!isExcludedFile(fullPath)) {
				const subfolderFiles = getFilesRecursive(fullPath, baseURL);
				files = files.concat(subfolderFiles);
			}
		}
	});

	return files;
}

app.get("/", (req, res) => {
	const baseURL = req.protocol + "://" + req.get("host");
	const files = getFilesRecursive(baseFolderPath, baseURL);
	res.json(files);
});

app.get("/*", (req, res) => {
	const filePath = path.join(baseFolderPath, req.params[0]);

	if (fs.existsSync(filePath)) {
		res.download(filePath, (err) => {
			if (err) {
				console.error(err);
				res.status(500).json({
					error: "Internal Server Error",
					path: filePath,
				});
			}
		});
	} else {
		res.status(404).json({ error: "File Not Found", path: filePath });
	}
});

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});
