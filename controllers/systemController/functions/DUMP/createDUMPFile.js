import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export function createDUMPFile(data){
    try{
        fs.mkdirSync(path.resolve(__dirname, '..', '..', '..', '..', 'dumps'))
    } catch (e) {}

    let name = `dump-${String(new Date().getDate()).padStart(2, "0") + "-" + String(new Date().getMonth() + 1).padStart(2, "0") + "-" + new Date().getFullYear()}.txt`;
    let filePath = path.resolve(__dirname, '..', '..', '..', '..', 'dumps', name);
    fs.writeFileSync(filePath, JSON.stringify(data))
    return {name, path: filePath};
}
//
// createDUMPFile('Привет мир!!!');
