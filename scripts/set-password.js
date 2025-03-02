import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import prompt from "password-prompt";

const __dirname = import.meta.dirname

prompt("password: ", { method: "hide" }).then((pw) => {
  const salt = bcrypt.genSaltSync();
  pw = bcrypt.hashSync(pw, salt);
  fs.writeFileSync(path.resolve(__dirname, "../.pw"), pw);
});
