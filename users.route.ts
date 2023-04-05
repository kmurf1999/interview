import { Router } from 'express';
import { UserController } from '@controllers/users.controller';
import { CreateUserDto, UpdateUserDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import fs from 'fs';

type Node = {
  key: string; // character
  children: Map<string, Node>; // c -> Node
  fileName?: string;
};

// recurse down the existing tree and insert a node node for fileName
function buildTree(root: Node, str: string, fileName: string) {
  if (str === '') {
    root.fileName = fileName;
    return;
  }
  // see if the first character in fileName exists in the root's children
  const rest = str.substring(1);
  const firstChar = str[0];
  if (!(firstChar in root.children)) {
    const newNode = { key: firstChar, children: new Map() };
    root.children[firstChar] = newNode;
  }
  buildTree(root.children[firstChar], rest, fileName);
}

const root: Node = {
  key: '',
  children: new Map(),
};

fs.readdirSync('../../svgs').forEach(fileName => {
  // just the filename
  buildTree(root, fileName, fileName);
});

function traverse(node: Node, results: string[]) {
  if (node.fileName) {
    results.push(node.fileName);
  }
  for (const child of node.children.values()) {
    traverse(child, results);
  }
}

// return an array of filenames that match query
function queryTree(query: string): string[] {
  let node = root;
  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    if (!(char in node.children)) {
      break;
    } else {
      node = node.children[char];
    }
  }

  const results: string[] = [];
  traverse(node, results);

  return results;
}

export class UserRoute implements Routes {
  public path = '/users';
  public router = Router();
  public user = new UserController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, this.user.getUsers);
    this.router.get(`${this.path}/:id(\\d+)`, this.user.getUserById);
    this.router.post(`${this.path}`, ValidationMiddleware(CreateUserDto), this.user.createUser);
    this.router.put(`${this.path}/:id(\\d+)`, ValidationMiddleware(UpdateUserDto), this.user.updateUser);
    this.router.delete(`${this.path}/:id(\\d+)`, this.user.deleteUser);
  }
}
