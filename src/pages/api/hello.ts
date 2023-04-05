// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type Data = {
  icons: string[];
};

type Node = {
  key: string; // character
  children: Map<string, Node>; // c -> Node
  fileName?: string;
};

// recurse down the existing tree and insert a node node for fileName
function buildTree(root: Node, str: string, fileName: string) {
  if (str === "") {
    root.fileName = fileName;
    return;
  }
  // get first char, and rest of string
  const rest = str.slice(1);
  const firstChar = str[0];

  if (!root.children.has(firstChar)) {
    const newNode = { key: firstChar, children: new Map() };
    root.children.set(firstChar, newNode);
  }
  buildTree(root.children.get(firstChar)!, rest, fileName);
}

function traverse(node: Node, results: string[]) {
  if (node.fileName) {
    results.push(node.fileName);
  }
  node.children.forEach((child) => {
    traverse(child, results);
  });
}

// return an array of filenames that match query
function queryTree(query: string): string[] {
  let node = root;
  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    if (!node.children.has(char)) {
      return [];
    } else {
      node = node.children.get(char)!;
    }
  }
  const results: string[] = [];
  traverse(node, results);

  return results;
}

const root: Node = {
  key: "",
  children: new Map(),
};

fs.readdirSync(path.resolve("./public", "svgs")).forEach((fileName) => {
  // just the filename, remove .svg
  const name = fileName.split(".")[0];
  buildTree(root, name, name);
});

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { q } = req.query;
  const results = queryTree(q as string);
  res.status(200).json({ icons: results });
}
